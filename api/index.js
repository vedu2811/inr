const express = require("express");
const cors = require("cors");
const axios = require("axios");
const xlsx = require("xlsx");

const app = express();
app.use(cors());
app.use(express.json());

let CACHED_DATA = null;
let LAST_FETCH_TIME = 0;
const CACHE_DURATION = 15 * 60 * 1000;

const fetchSpreadsheet = async () => {
  try {
    const sheetUrl = process.env.GOOGLE_SHEET_URL;
    if (!sheetUrl) throw new Error("Missing Sheet URL");

    console.log("☁️ Fetching data from Google Sheets...");
    const response = await axios.get(sheetUrl, {
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

app.get("/api/dashboard-data", async (req, res) => {
  try {
    if (!CACHED_DATA || Date.now() - LAST_FETCH_TIME > CACHE_DURATION) {
      console.log("Checking for fresh data...");
      await fetchSpreadsheet();
    }
    if (!CACHED_DATA)
      return res.status(500).json({ error: "Failed to load data" });

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
    res.status(500).json({ error: "Internal server error" });
  }
});

app.post("/api/analyze", async (req, res) => {
  try {
    const { prompt, apiKey } = req.body;
    if (!apiKey) return res.status(400).json({ error: "API Key Required" });

    // 🔴 STRICT TREASURY SYSTEM PROMPT
    const systemPrompt = `
          You are the Chief FX Dealer for a large Indian conglomerate with interests in Cigarettes, FMCG, Agri, Paper, and IT.
          
          MANDATORY RULES:
          1. **CONCLUSION FIRST:** Start strictly with "Strategic Action:" followed by the recommendation. No intro fluff.
          2. **3rd PERSON ONLY:** Use "The Treasury should", "The Desk advises". Never "I".
          3. **NO BUSINESS OPERATIONS:** Do NOT discuss how oil affects FMCG margins or paper costs. Focus ONLY on the *Financial Market Risk* (USD/INR volatility, Forward Premiums).
          4. **NO HEDGE %:** Do NOT suggest "Hedge 50%". Advise on *Instruments* (e.g., "Buy 1M ATM Call Options", "Book Cash-Tom").
          5. **TRADING LENS:** Discuss correlation, volatility (VIX), and carry. Be technical.
          6. **NO RBI ADVICE:** Do not advise the RBI. Advise the company on how to react to RBI.
          
          Structure:
          1. **Strategic Action**: Clear buy/sell/wait directive.
          2. **Market Logic**: Technical & Macro reasoning connecting the data to INR flows.
          3. **Instrument Choice**: Why Forwards? Why Options? (Cost vs Certainty).
        `;

    const response = await axios.post(
      "https://api.groq.com/openai/v1/chat/completions",
      {
        model: "llama-3.3-70b-versatile",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: prompt },
        ],
        temperature: 0.5,
        max_tokens: 1000, // Reduced to prevent Vercel 10s Timeout
      },
      { headers: { Authorization: `Bearer ${apiKey}` }, timeout: 40000 }
    );
    res.json({ analysis: response.data.choices[0].message.content });
  } catch (error) {
    console.error("AI Error:", error.message);
    res.status(500).json({ error: "AI Analysis Failed" });
  }
});

app.get("/api/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

if (require.main === module) {
  const PORT = 5000;
  try {
    require("dotenv").config({ path: "../.env" });
  } catch (e) {}
  app.listen(PORT, () => {
    console.log(`🚀 Local Server running on http://localhost:${PORT}`);
  });
}

module.exports = app;
