import React from "react";
import ReactMarkdown from "react-markdown";
import ChartCard from "./ChartCard";

const AnalysisModal = ({
  isOpen,
  onClose,
  analysis,
  charts,
  data,
  context,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-[#0b1121] border border-slate-700 w-full max-w-6xl h-[85vh] rounded-xl shadow-2xl flex flex-col overflow-hidden">
        {/* MODAL HEADER */}
        <div className="p-4 border-b border-slate-700 flex justify-between items-center bg-slate-900/50">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 bg-cyan-400 rounded-full animate-pulse"></span>
            <h2 className="text-xl font-serif text-white tracking-wide">
              AI TREASURY REPORT:{" "}
              <span className="text-cyan-400 font-bold">{context}</span>
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white transition-colors bg-slate-800 hover:bg-slate-700 px-3 py-1 rounded-lg text-xs font-bold"
          >
            ✕ CLOSE
          </button>
        </div>

        {/* CONTENT */}
        <div className="flex flex-1 overflow-hidden">
          {/* LEFT: Analysis */}
          <div className="w-1/2 p-8 overflow-y-auto border-r border-slate-700 bg-slate-900/30 custom-scrollbar">
            {analysis ? (
              <div className="prose prose-invert prose-sm max-w-none text-slate-300 leading-relaxed">
                <ReactMarkdown
                  components={{
                    strong: ({ node, ...props }) => (
                      <span className="text-cyan-400 font-bold" {...props} />
                    ),
                  }}
                >
                  {analysis}
                </ReactMarkdown>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-slate-500 animate-pulse">
                <div className="text-4xl mb-4">⚡</div>
                <p>AI is analyzing market structure...</p>
              </div>
            )}
          </div>

          {/* RIGHT: Reference Chart */}
          <div className="w-1/2 bg-[#0b1121] p-6 flex flex-col justify-center relative">
            <h3 className="absolute top-6 left-6 text-xs uppercase text-slate-500 font-bold border-b border-slate-800 pb-2">
              Reference Chart
            </h3>

            <div className="w-full">
              {/* 1. OIL */}
              {context === "OIL" && (
                <ChartCard
                  title="Brent Crude Oil"
                  value={`$${data?.oil?.price?.toFixed(2)}`}
                  subValue="Reference"
                  data={charts?.oil}
                  dataKey="value"
                  color="#ef4444"
                  unitPrefix="$"
                  className="h-[350px]"
                />
              )}

              {/* 2. REER (Fix for missing chart) */}
              {context === "REER" && (
                <ChartCard
                  title="India REER"
                  value={data?.reer?.price?.toFixed(2)}
                  subValue="Reference"
                  data={charts?.reer}
                  dataKey="value"
                  color="#10b981"
                  referenceLineValue={100}
                  className="h-[350px]"
                />
              )}

              {/* 3. CPI */}
              {context === "CPI" && (
                <ChartCard
                  title="India CPI Inflation"
                  value={`${data?.cpi?.price?.toFixed(2)}%`}
                  subValue="Reference"
                  data={charts?.cpi}
                  dataKey="value"
                  color="#facc15"
                  unitSuffix="%"
                  className="h-[350px]"
                />
              )}

              {/* 4. FX */}
              {context === "FX" && (
                <ChartCard
                  title="Currency Matrix"
                  value="Relative %"
                  subValue="Reference"
                  data={charts?.fxBasket}
                  className="h-[350px]"
                  unitSuffix="%"
                  multiLines={[
                    { key: "inr", color: "#06b6d4" },
                    { key: "cny", color: "#f43f5e" },
                    { key: "dxy", color: "#facc15" },
                  ]}
                />
              )}

              {/* 5. FOREX */}
              {context === "FOREX" && (
                <ChartCard
                  title="Forex Reserves"
                  value={`$${data?.forex?.price?.toFixed(2)}B`}
                  subValue="Reference"
                  data={charts?.forex}
                  dataKey="value"
                  color="#3b82f6"
                  unitPrefix="$"
                  unitSuffix="B"
                  className="h-[350px]"
                />
              )}

              {/* 6. TRADE */}
              {context === "TRADE" && (
                <ChartCard
                  title="Trade Deficit"
                  value={`$${data?.tradeDeficit?.price?.toFixed(2)}B`}
                  subValue="Reference"
                  data={charts?.tradeDeficit}
                  dataKey="value"
                  color="#f43f5e"
                  unitPrefix="$"
                  unitSuffix="B"
                  className="h-[350px]"
                />
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AnalysisModal;
