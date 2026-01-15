import React, { useEffect, useState } from "react";
import ChartCard from "./components/ChartCard";
import AnalysisModal from "./components/AnalysisModal";
import { fetchRiskData } from "./services/dataService";
import axios from "axios";
import companyLogo from "./assets/logo.png";

// 🔴 Leave empty for Vercel
const API_URL = "";

const formatHistory = (historyArr) => {
  if (!historyArr || historyArr.length === 0) return [];
  return historyArr.map((item) => ({
    name: item.date,
    value: item.value,
    frequency: item.frequency,
  }));
};

const analyzeSpecificGraph = async (apiKey, prompt) => {
  try {
    const response = await axios.post(`${API_URL}/api/analyze`, {
      apiKey,
      prompt,
    });
    return response.data.analysis;
  } catch (error) {
    console.error("Analysis Error:", error);
    return "Analysis failed. Please check your API key.";
  }
};

const App = () => {
  const [data, setData] = useState(null);
  const [charts, setCharts] = useState(null);
  const [loading, setLoading] = useState(true);
  const [apiKey, setApiKey] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [analysisResult, setAnalysisResult] = useState("");
  const [analysisContext, setAnalysisContext] = useState(null);
  const [timeRange, setTimeRange] = useState("5Y");
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const load = async () => {
      try {
        const liveData = await fetchRiskData(timeRange);
        if (liveData) {
          setData(liveData);

          const realInr = liveData.currencies?.inr?.history || [];
          const realCny = liveData.currencies?.cny?.history || [];
          const realDxy = liveData.currencies?.dxy?.history || [];

          const rawData = realInr.map((item, i) => ({
            date: item.date,
            inr: item.value,
            cny: realCny[i]?.value,
            dxy: realDxy[i]?.value,
            frequency: item.frequency,
          }));

          const cleanData = rawData.filter((d) => d.inr);
          let currenciesBasket = [];

          if (cleanData.length > 0) {
            const baseInr = cleanData[0].inr || 1;
            const baseCny = cleanData[0].cny || 1;
            const baseDxy = cleanData[0].dxy || 1;

            currenciesBasket = cleanData.map((item) => ({
              name: item.date,
              inr: item.inr ? ((item.inr - baseInr) / baseInr) * 100 : 0,
              cny: item.cny ? ((item.cny - baseCny) / baseCny) * 100 : 0,
              dxy: item.dxy ? ((item.dxy - baseDxy) / baseDxy) * 100 : 0,
              frequency: item.frequency,
            }));
          }

          setCharts({
            oil: formatHistory(liveData.oil?.history),
            cpi: formatHistory(liveData.cpi?.history),
            tradeDeficit: formatHistory(liveData.tradeDeficit?.history),
            fxBasket: currenciesBasket,
            reer: formatHistory(liveData.reer?.history),
            forex: formatHistory(liveData.forex?.history),
          });
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [timeRange]);

  const handleTimeRangeChange = (newRange) => setTimeRange(newRange);

  // 🔴 UPDATED ANALYZE FUNCTION 🔴
  const handleChartAnalyze = async (type) => {
    if (!apiKey) {
      alert("Please enter your Groq API Key first.");
      return;
    }
    setAnalysisContext(type);
    setIsModalOpen(true);
    setAnalysisResult("");

    // Helper to get latest date string
    const getLatestDate = (historyArr) => {
      if (!historyArr || historyArr.length === 0) return "Unknown Date";
      return historyArr[historyArr.length - 1].date; // Returns the actual last date in the array
    };

    let prompt = "";
    const today = new Date().toLocaleDateString();

    if (type === "OIL") {
      const date = getLatestDate(data?.oil?.history);
      prompt = `
        Context: The company has significant energy needs for manufacturing (FMCG, Paper) and logistics.
        Data: Brent Crude Oil is trading at $${data.oil.price} as of ${date}.
        Task: Analyze the impact on input costs and INR stability. Should the treasury increase hedging for oil imports?
        `;
    } else if (type === "CPI") {
      const date = getLatestDate(data?.cpi?.history);
      prompt = `
        Context: The company sells FMCG products where consumer demand is sensitive to inflation.
        Data: India CPI Inflation is at ${data.cpi.price}% as of ${date}.
        Task: Analyze the impact on consumer purchasing power and the RBI's interest rate stance. How does this affect the cost of working capital?
        `;
    } else if (type === "TRADE") {
      const date = getLatestDate(data?.tradeDeficit?.history);
      prompt = `
        Context: A widening trade deficit puts pressure on the INR.
        Data: India's Trade Deficit is $${data.tradeDeficit.price} Billion as of ${date}.
        Task: Analyze if this deficit level signals immediate depreciation pressure on the INR. Should the treasury expedite export realization (IT Services/Agri) or delay import payments?
        `;
    } else if (type === "FX") {
      // Specific Currency prompt
      const date = getLatestDate(data?.currencies?.inr?.history);
      prompt = `
        Context: The company exports IT services/Agri (Long USD/EUR) and imports raw materials (Short USD/CNY).
        Data (As of ${date}):
        - INR: ${data?.currencies?.inr?.price}
        - CNY: ${data?.currencies?.cny?.price}
        - DXY: ${data?.currencies?.dxy?.price}
        
        Task:
        1. Analyze the specific impact of DXY strength/weakness on INR.
        2. Analyze the CNY correlation (competitor currency in exports).
        3. Explain how these currencies are interacting right now.
        4. Provide a trading strategy for the treasury given these correlations.
        `;
    } else if (type === "REER") {
      const date = getLatestDate(data?.reer?.history);
      prompt = `
        Context: The company is a net exporter in IT and Agri.
        Data: India REER (40-Basket) is at ${data.reer.price} as of ${date}. (Fair value is approx 100).
        Task: Is the INR overvalued or undervalued relative to trade partners? Does an overvalued REER hurt the competitiveness of the company's Agri/IT exports? Recommend a hedging ratio.
        `;
    } else if (type === "FOREX") {
      const date = getLatestDate(data?.forex?.history);
      prompt = `
        Context: The treasury actively trades and holds positions in USD, EUR, GBP, and JPY.
        Data: India Forex Reserves are $${data.forex.price} Billion as of ${date}.
        Task: 
        1. Do NOT discuss India's macro risk. 
        2. Focus specifically on the risks to the corporate treasury trading desk.
        3. Does this reserve level give the RBI enough firepower to intervene and squash volatility? 
        4. How should the treasury position its USD, EUR, GBP, and JPY trades in light of RBI's intervention capacity?
        `;
    }

    const result = await analyzeSpecificGraph(apiKey, prompt);
    setAnalysisResult(result);
  };

  if (loading)
    return (
      <div className="h-screen bg-[#020617] text-cyan-500 flex flex-col items-center justify-center font-mono space-y-4">
        <div className="w-12 h-12 border-4 border-cyan-500/30 border-t-cyan-400 rounded-full animate-spin"></div>
        <p className="animate-pulse text-sm tracking-widest uppercase">
          Loading Market Data...
        </p>
      </div>
    );

  return (
    <div className="min-h-screen bg-[#020617] text-slate-200 font-sans p-6 md:p-8 relative overflow-x-hidden">
      <div className="fixed top-0 left-0 w-full h-[600px] bg-gradient-to-b from-blue-950/20 to-transparent pointer-events-none" />

      {/* HEADER */}
      <header className="relative z-10 mb-10 bg-gradient-to-r from-slate-900/80 to-slate-900/40 backdrop-blur-2xl border border-slate-700/50 rounded-3xl p-6 shadow-lg shadow-cyan-900/5 flex flex-col xl:flex-row justify-between items-start xl:items-center gap-8">
        {/* Logo */}
        <div className="flex items-center gap-6">
          <img
            src={companyLogo}
            alt="Logo"
            className="h-12 w-auto object-contain drop-shadow-md"
          />
          <div>
            <h1 className="text-3xl font-bold text-white tracking-tight drop-shadow-sm">
              Treasury Navigator
            </h1>
            <p className="text-slate-400 text-xs font-bold tracking-widest uppercase mt-1.5">
              Real-time macro economic risk assessment powered by AI
            </p>
          </div>
        </div>

        {/* Controls */}
        <div className="flex flex-col items-end gap-4 w-full xl:w-auto">
          <div className="flex items-center justify-between gap-6 px-5 py-2.5 bg-slate-950/60 rounded-xl border border-slate-800/80 shadow-inner w-full xl:w-auto">
            <div className="flex items-center gap-2.5">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
              </span>
              <span className="text-emerald-400 text-[11px] font-black tracking-wider uppercase">
                Live
              </span>
            </div>
            <div className="text-[11px] font-mono font-medium text-slate-300">
              {currentTime.toLocaleDateString(undefined, {
                month: "short",
                day: "numeric",
                year: "numeric",
              })}
              <span className="mx-3 text-slate-600">|</span>
              {currentTime.toLocaleTimeString(undefined, { hour12: false })}
            </div>
          </div>

          <div className="relative group w-full xl:w-80">
            <div className="flex items-center bg-slate-950/80 rounded-xl border border-slate-800/80 focus-within:border-cyan-500/50 focus-within:ring-2 focus-within:ring-cyan-500/10 transition-all shadow-sm overflow-hidden h-11">
              <div className="pl-4 text-slate-500">
                <svg
                  className="w-4 h-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z"
                  />
                </svg>
              </div>
              <input
                type="password"
                placeholder="Enter Groq API Key..."
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                className="bg-transparent text-xs text-slate-200 w-full px-3 focus:outline-none placeholder-slate-500 font-medium h-full"
              />
              <a
                href="https://console.groq.com/keys"
                target="_blank"
                rel="noopener noreferrer"
                className="mr-1.5 px-3 py-1.5 text-[10px] font-bold text-cyan-400 bg-cyan-950/40 hover:bg-cyan-900/60 border border-cyan-800/50 rounded-lg transition-all whitespace-nowrap hover:shadow-sm hover:shadow-cyan-900/20"
              >
                Get Key ↗
              </a>
            </div>
          </div>
        </div>
      </header>

      <AnalysisModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        analysis={analysisResult}
        charts={charts}
        data={data}
        context={analysisContext}
      />

      {/* GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {/* 1. Brent Crude */}
        <div className="col-span-1 md:col-span-2 xl:col-span-2">
          <ChartCard
            title="Brent Crude Oil"
            value={`$${data?.oil?.price?.toFixed(2)}`}
            subValue={timeRange}
            data={charts?.oil}
            dataKey="value"
            color="#ef4444"
            onAnalyze={() => handleChartAnalyze("OIL")}
            onTimeRangeChange={handleTimeRangeChange}
            currentTimeRange={timeRange}
            unitPrefix="$"
            className="h-[400px]"
          />
        </div>

        {/* 2. REER */}
        <div className="col-span-1">
          <ChartCard
            title="India REER (40-Basket)"
            value={data?.reer?.price?.toFixed(2)}
            subValue="Monthly"
            data={charts?.reer}
            dataKey="value"
            color="#10b981"
            referenceLineValue={100}
            onAnalyze={() => handleChartAnalyze("REER")}
            onTimeRangeChange={handleTimeRangeChange}
            currentTimeRange={timeRange}
            className="h-[400px]"
          />
        </div>

        {/* 3. CPI */}
        <div className="col-span-1">
          <ChartCard
            title="India CPI Inflation"
            value={`${data?.cpi?.price?.toFixed(2)}%`}
            subValue="Monthly"
            data={charts?.cpi}
            dataKey="value"
            color="#facc15"
            unitSuffix="%"
            onAnalyze={() => handleChartAnalyze("CPI")}
            onTimeRangeChange={handleTimeRangeChange}
            currentTimeRange={timeRange}
            className="h-[380px]"
          />
        </div>

        {/* 4. Currency */}
        <div className="col-span-1 md:col-span-2 xl:col-span-2">
          <ChartCard
            title="Currency Matrix (Relative %)"
            value="Exchange Rates"
            subValue={timeRange}
            data={charts?.fxBasket}
            multiLines={[
              { key: "inr", color: "#06b6d4", name: "INR (Base)" },
              { key: "cny", color: "#f43f5e", name: "CNY" },
              { key: "dxy", color: "#facc15", name: "DXY" },
            ]}
            unitSuffix="%"
            onAnalyze={() => handleChartAnalyze("FX")}
            onTimeRangeChange={handleTimeRangeChange}
            currentTimeRange={timeRange}
            className="h-[380px]"
          />
        </div>

        {/* 5. Forex */}
        <div className="col-span-1 md:col-span-2 xl:col-span-2">
          <ChartCard
            title="Forex Reserves"
            value={`$${data?.forex?.price?.toFixed(2)}B`}
            subValue="Weekly"
            data={charts?.forex}
            dataKey="value"
            color="#3b82f6"
            unitPrefix="$"
            unitSuffix="B"
            onAnalyze={() => handleChartAnalyze("FOREX")}
            onTimeRangeChange={handleTimeRangeChange}
            currentTimeRange={timeRange}
            className="h-[350px]"
          />
        </div>

        {/* 6. Trade */}
        <div className="col-span-1">
          <ChartCard
            title="Trade Deficit"
            value={`$${data?.tradeDeficit?.price?.toFixed(2)}B`}
            subValue="Monthly"
            data={charts?.tradeDeficit}
            dataKey="value"
            color="#f43f5e"
            unitPrefix="$"
            unitSuffix="B"
            onAnalyze={() => handleChartAnalyze("TRADE")}
            onTimeRangeChange={handleTimeRangeChange}
            currentTimeRange={timeRange}
            className="h-[350px]"
          />
        </div>
      </div>
    </div>
  );
};

export default App;
