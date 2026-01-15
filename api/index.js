const express = require("express");
const cors = require("cors");
const axios = require("axios");
const xlsx = require("xlsx");

const app = express();
app.use(cors());
app.use(express.json());

// --- CACHE SYSTEM ---
let CACHED_DATA = null;
let LAST_FETCH_TIME = 0;
const CACHE_DURATION = 15 * 60 * 1000; // 15 Minutes

// --- GOOGLE SHEET LINK ---
const GOOGLE_SHEET_URL =
  process.env.GOOGLE_SHEET_URL || "PASTE_YOUR_LINK_HERE_ONLY_IF_ENV_FAILS";

const fetchSpreadsheet = async () => {
  try {
    console.log("☁️ Fetching data from Google Sheets...");

    const response = await axios.get(GOOGLE_SHEET_URL, {
      responseType: "arraybuffer",
      headers: { "User-Agent": "Mozilla/5.0" },
      timeout: 10000,
    });

    const workbook = xlsx.read(response.data, { type: "buffer" });
    const sheetName = workbook.SheetNames[0];
    const rows = xlsx.utils.sheet_to_json(workbook.Sheets[sheetName], {
      header: 1,
    });

    const tempStore = {
      oil: [],
      currencies: { inr: [], cny: [], dxy: [] },
      cpi: [],
      tradeDeficit: [],
      reer: [],
      forexReserves: [],
    };

    const today = new Date();
    today.setHours(23, 59, 59, 999);

    const parseDate = (val) => {
      if (!val) return null;
      if (typeof val === "number")
        return new Date((val - 25569) * 86400 * 1000);
      if (typeof val === "string") {
        const parts = val.split(/[-/]/);
        if (parts.length === 3) {
          const p0 = parseInt(parts[0], 10);
          const p1 = parseInt(parts[1], 10);
          const p2 = parseInt(parts[2], 10);
          if (p0 > 1000) return new Date(p0, p1 - 1, p2);
          if (p2 > 1000) return new Date(p2, p0 - 1, p1);
        }
        const d = new Date(val);
        return isNaN(d.getTime()) ? null : d;
      }
      return null;
    };

    const getVal = (val) => {
      const cleaned = typeof val === "string" ? val.replace(/,/g, "") : val;
      const num = parseFloat(cleaned);
      return !isNaN(num) && num !== 0 ? num : null;
    };

    let lastKnown = { inr: null, cny: null, dxy: null, brent: null };

    for (let i = 5; i < rows.length; i++) {
      const row = rows[i];
      if (!row || row.length === 0) continue;

      const dateObj = parseDate(row[0]);
      if (dateObj && dateObj <= today) {
        const dateStr = dateObj.toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
          year: "numeric",
        });
        const ts = dateObj.getTime();

        const inr = getVal(row[1]);
        if (inr) lastKnown.inr = inr;
        const cny = getVal(row[2]);
        if (cny) lastKnown.cny = cny;
        const dxy = getVal(row[3]);
        if (dxy) lastKnown.dxy = dxy;
        const oil = getVal(row[4]);
        if (oil) lastKnown.brent = oil;

        if (lastKnown.inr)
          tempStore.currencies.inr.push({
            date: dateStr,
            timestamp: ts,
            value: lastKnown.inr,
            frequency: "daily",
          });
        if (lastKnown.cny)
          tempStore.currencies.cny.push({
            date: dateStr,
            timestamp: ts,
            value: lastKnown.cny,
            frequency: "daily",
          });
        if (lastKnown.dxy)
          tempStore.currencies.dxy.push({
            date: dateStr,
            timestamp: ts,
            value: lastKnown.dxy,
            frequency: "daily",
          });
        if (lastKnown.brent)
          tempStore.oil.push({
            date: dateStr,
            timestamp: ts,
            value: lastKnown.brent,
            frequency: "daily",
          });
      }

      const pushMacro = (dCol, vCol, storeArr, freq, divisor = 1) => {
        const mDate = parseDate(row[dCol]);
        const mVal = getVal(row[vCol]);
        if (mDate && mDate <= today && mVal !== null) {
          storeArr.push({
            date: mDate.toLocaleDateString("en-US", {
              month: "short",
              year: "numeric",
            }),
            timestamp: mDate.getTime(),
            value: mVal / divisor,
            frequency: freq,
          });
        }
      };

      pushMacro(8, 9, tempStore.forexReserves, "weekly", 1000000000);
      pushMacro(11, 12, tempStore.tradeDeficit, "monthly", 1000000000);
      pushMacro(20, 21, tempStore.cpi, "monthly", 1);
      pushMacro(23, 24, tempStore.reer, "monthly", 1);
    }

    const sortFn = (a, b) => a.timestamp - b.timestamp;
    Object.values(tempStore.currencies).forEach((arr) => arr.sort(sortFn));
    tempStore.oil.sort(sortFn);
    tempStore.forexReserves.sort(sortFn);
    tempStore.tradeDeficit.sort(sortFn);
    tempStore.cpi.sort(sortFn);
    tempStore.reer.sort(sortFn);

    CACHED_DATA = tempStore;
    LAST_FETCH_TIME = Date.now();
    return tempStore;
  } catch (error) {
    console.error("❌ Error fetching Sheet:", error.message);
    return null;
  }
};

const filterByTimeRange = (data, range) => {
  if (!data || data.length === 0) return [];
  const now = Date.now();
  const ranges = { "3M": 90, "6M": 180, "1Y": 365, "5Y": 1825 };
  const days = ranges[range] || 1825;
  const cutoff = now - days * 24 * 60 * 60 * 1000;
  return data.filter((item) => item.timestamp >= cutoff);
};

// --- API ROUTES ---
app.get("/api/dashboard-data", async (req, res) => {
  try {
    if (!CACHED_DATA || Date.now() - LAST_FETCH_TIME > CACHE_DURATION) {
      console.log("Cache expired, fetching new data...");
      await fetchSpreadsheet();
    }

    if (!CACHED_DATA) {
      return res.status(500).json({ error: "Failed to load data" });
    }

    const range = req.query.range || "5Y";
    const filter = (arr) => filterByTimeRange(arr, range);
    const getPrice = (arr) => arr[arr.length - 1]?.value || 0;

    const inrHist = filter(CACHED_DATA.currencies.inr);
    const cnyHist = filter(CACHED_DATA.currencies.cny);
    const dxyHist = filter(CACHED_DATA.currencies.dxy);

    res.json({
      oil: {
        history: filter(CACHED_DATA.oil),
        price: getPrice(filter(CACHED_DATA.oil)),
      },
      cpi: {
        history: filter(CACHED_DATA.cpi),
        price: getPrice(filter(CACHED_DATA.cpi)),
      },
      tradeDeficit: {
        history: filter(CACHED_DATA.tradeDeficit),
        price: getPrice(filter(CACHED_DATA.tradeDeficit)),
      },
      forex: {
        history: filter(CACHED_DATA.forexReserves),
        price: getPrice(filter(CACHED_DATA.forexReserves)),
      },
      reer: {
        history: filter(CACHED_DATA.reer),
        price: getPrice(filter(CACHED_DATA.reer)),
      },
      currencies: {
        inr: { history: inrHist, price: getPrice(inrHist) },
        cny: { history: cnyHist, price: getPrice(cnyHist) },
        dxy: { history: dxyHist, price: getPrice(dxyHist) },
      },
    });
  } catch (error) {
    console.error("Dashboard error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

app.post("/api/analyze", async (req, res) => {
  try {
    const { prompt, apiKey } = req.body;
    if (!apiKey) return res.status(400).json({ error: "API Key Required" });

    // 🔴 UPDATED SYSTEM PROMPT 🔴
    const systemPrompt = `
      You are an AI advisor to the Corporate Treasury team of a large Indian conglomerate. 
      The company has diversified interests in Cigarettes, FMCG, Agri-business, Paper, and IT services.
      
      Your Role & Restrictions:
      1. Do NOT introduce yourself as a "Senior Risk Analyst" or any other title. Jump straight to the content.
      2. Do NOT provide advice to the RBI or the Government. Your advice is strictly for the Corporate Treasury.
      3. Use the 3rd person perspective (e.g., "The Treasury should...", "Impact on INR is...").
      4. Be in the present moment. Analyze the "Latest Data" provided in the prompt as the current state.
      5. Do not use introductory filler phrases like "Here is the analysis".
      
      Structure of Response:
      1. **Action/Conclusion**: State clearly what the Treasury should do (e.g., "Hedge 50% of near-term payables" or "Wait and watch").
      2. **Basis**: Explain the reasoning, connecting the specific data points to the company's business interests (e.g., impact on raw material imports, IT service export revenues).
    `;

    const response = await axios.post(
      "https://api.groq.com/openai/v1/chat/completions",
      {
        model: "llama-3.3-70b-versatile",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: prompt },
        ],
        temperature: 0.6, // Lower temperature for more focused advice
        max_tokens: 800,
      },
      {
        headers: { Authorization: `Bearer ${apiKey}` },
        timeout: 30000,
      }
    );

    res.json({ analysis: response.data.choices[0].message.content });
  } catch (error) {
    console.error("AI Analysis error:", error.message);
    res.status(500).json({ error: "AI Analysis Failed" });
  }
});

app.get("/api/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

module.exports = app;
