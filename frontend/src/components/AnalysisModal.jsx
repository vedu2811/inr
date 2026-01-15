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
    <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
      {/* 🔴 UPGRADED CSS: Gradient Border & Background */}
      <div className="relative w-full max-w-6xl h-[85vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden bg-gradient-to-br from-slate-900 via-[#0b1121] to-slate-900 border border-slate-700/50">
        {/* MODAL HEADER */}
        <div className="p-5 border-b border-slate-700/50 flex justify-between items-center bg-slate-900/60 backdrop-blur-md">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-cyan-500/10 flex items-center justify-center border border-cyan-500/20">
              <span className="text-lg">🤖</span>
            </div>
            <div>
              <h2 className="text-lg font-bold text-white tracking-wide leading-none">
                AI Treasury Assessment
              </h2>
              <p className="text-[10px] text-cyan-400 font-mono mt-1 uppercase tracking-widest">
                Focus: {context}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-slate-800 hover:bg-red-500/10 hover:text-red-400 hover:border-red-500/50 border border-slate-700 text-xs font-bold text-slate-400 transition-all duration-200"
          >
            ESC / CLOSE
          </button>
        </div>

        {/* CONTENT */}
        <div className="flex flex-1 overflow-hidden">
          {/* LEFT: Analysis Text (Scrollable) */}
          <div className="w-1/2 p-8 overflow-y-auto custom-scrollbar bg-slate-900/20">
            {analysis ? (
              // 🔴 UPGRADED TYPOGRAPHY: Styling the Markdown content
              <div className="prose prose-invert prose-sm max-w-none">
                <ReactMarkdown
                  components={{
                    h1: ({ node, ...props }) => (
                      <h1
                        className="text-xl font-bold text-cyan-400 mb-4 border-b border-cyan-900/30 pb-2"
                        {...props}
                      />
                    ),
                    h2: ({ node, ...props }) => (
                      <h2
                        className="text-lg font-semibold text-white mt-6 mb-3 flex items-center gap-2"
                        {...props}
                      />
                    ),
                    h3: ({ node, ...props }) => (
                      <h3
                        className="text-md font-medium text-slate-200 mt-4 mb-2"
                        {...props}
                      />
                    ),
                    strong: ({ node, ...props }) => (
                      <span className="text-cyan-400 font-bold" {...props} />
                    ),
                    p: ({ node, ...props }) => (
                      <p
                        className="text-slate-300 leading-relaxed mb-4 text-justify"
                        {...props}
                      />
                    ),
                    li: ({ node, ...props }) => (
                      <li className="text-slate-300 mb-1 pl-1" {...props} />
                    ),
                    ul: ({ node, ...props }) => (
                      <ul
                        className="list-disc list-outside ml-4 mb-4 space-y-1 marker:text-cyan-500"
                        {...props}
                      />
                    ),
                  }}
                >
                  {analysis}
                </ReactMarkdown>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-slate-500 animate-pulse gap-3">
                <div className="w-12 h-12 border-4 border-cyan-500/20 border-t-cyan-400 rounded-full animate-spin"></div>
                <p className="text-xs font-mono tracking-widest uppercase">
                  Generating Strategy...
                </p>
              </div>
            )}
          </div>

          {/* RIGHT: Reference Chart (Fixed) */}
          <div className="w-1/2 bg-[#050b14] p-8 flex flex-col justify-center border-l border-slate-800 relative">
            <div className="absolute top-0 right-0 w-64 h-64 bg-cyan-500/5 rounded-full blur-3xl pointer-events-none"></div>

            <div className="mb-6 flex items-center justify-between border-b border-slate-800 pb-4">
              <h3 className="text-xs uppercase text-slate-400 font-bold tracking-widest">
                Live Market Context
              </h3>
              <span className="text-[10px] bg-slate-800 px-2 py-1 rounded text-slate-400">
                Real-time Data
              </span>
            </div>

            <div className="w-full scale-100">
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
                  className="h-[400px] border-slate-800 bg-slate-900/50"
                />
              )}

              {/* 2. REER */}
              {context === "REER" && (
                <ChartCard
                  title="India REER"
                  value={data?.reer?.price?.toFixed(2)}
                  subValue="Reference"
                  data={charts?.reer}
                  dataKey="value"
                  color="#10b981"
                  referenceLineValue={100}
                  className="h-[400px] border-slate-800 bg-slate-900/50"
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
                  className="h-[400px] border-slate-800 bg-slate-900/50"
                />
              )}

              {/* 4. FX */}
              {context === "FX" && (
                <ChartCard
                  title="Currency Matrix"
                  value="Relative %"
                  subValue="Reference"
                  data={charts?.fxBasket}
                  className="h-[400px] border-slate-800 bg-slate-900/50"
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
                  className="h-[400px] border-slate-800 bg-slate-900/50"
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
                  className="h-[400px] border-slate-800 bg-slate-900/50"
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
