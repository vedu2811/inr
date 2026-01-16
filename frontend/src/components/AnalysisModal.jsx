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
    <div className="fixed inset-0 bg-black/90 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      {/* Main Container */}
      <div className="bg-[#0b1121] border border-slate-700 w-full max-w-7xl h-[85vh] rounded-xl shadow-2xl flex flex-col overflow-hidden">
        {/* --- MODAL HEADER (Clean Style) --- */}
        <div className="px-6 py-4 border-b border-slate-800 flex justify-between items-center bg-[#0b1121]">
          <div className="flex items-center gap-3">
            <span className="w-2.5 h-2.5 bg-cyan-500 rounded-full shadow-[0_0_8px_rgba(6,182,212,0.8)]"></span>
            <h2 className="text-xl font-serif text-slate-100 tracking-wide">
              AI TREASURY REPORT:{" "}
              <span className="text-cyan-400 font-bold uppercase">
                {context}
              </span>
            </h2>
          </div>
          <button
            onClick={onClose}
            className="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white rounded text-xs font-bold transition-colors uppercase tracking-wider border border-slate-700"
          >
            ✕ Close
          </button>
        </div>

        {/* --- CONTENT BODY --- */}
        <div className="flex flex-1 overflow-hidden">
          {/* LEFT: Analysis Text */}
          <div className="w-1/2 p-8 overflow-y-auto custom-scrollbar border-r border-slate-800 bg-[#0b1121]">
            {analysis ? (
              <div className="prose prose-invert prose-sm max-w-none">
                <ReactMarkdown
                  components={{
                    // Clean, sharp typography
                    h1: ({ node, ...props }) => (
                      <h1
                        className="text-xl font-bold text-cyan-400 mb-4 pb-2 border-b border-slate-800"
                        {...props}
                      />
                    ),
                    h2: ({ node, ...props }) => (
                      <h2
                        className="text-lg font-bold text-slate-100 mt-6 mb-3 uppercase tracking-wide"
                        {...props}
                      />
                    ),
                    h3: ({ node, ...props }) => (
                      <h3
                        className="text-md font-semibold text-slate-200 mt-4 mb-2"
                        {...props}
                      />
                    ),
                    strong: ({ node, ...props }) => (
                      <span className="text-cyan-300 font-bold" {...props} />
                    ),
                    p: ({ node, ...props }) => (
                      <p
                        className="text-slate-300 leading-7 mb-4 text-[15px]"
                        {...props}
                      />
                    ),
                    li: ({ node, ...props }) => (
                      <li
                        className="text-slate-300 mb-2 pl-1 marker:text-cyan-500"
                        {...props}
                      />
                    ),
                    ul: ({ node, ...props }) => (
                      <ul
                        className="list-disc list-outside ml-4 mb-4"
                        {...props}
                      />
                    ),
                  }}
                >
                  {analysis}
                </ReactMarkdown>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-slate-500 gap-4">
                <div className="w-10 h-10 border-4 border-slate-800 border-t-cyan-500 rounded-full animate-spin"></div>
                <p className="text-sm font-mono uppercase tracking-widest animate-pulse">
                  Generating Insights...
                </p>
              </div>
            )}
          </div>

          {/* RIGHT: Reference Chart */}
          <div className="w-1/2 bg-[#050910] p-6 flex flex-col">
            {/* Header for Chart Section */}
            <div className="mb-4 pb-2 border-b border-slate-800/50 flex justify-between items-end shrink-0">
              <h3 className="text-xs uppercase text-slate-500 font-bold tracking-widest">
                Reference Chart
              </h3>
              <span className="text-[10px] text-cyan-500/80 font-mono">
                LIVE FEED
              </span>
            </div>

            {/* Chart Container - FIX: flex-1 and min-h-0 prevents cutoff */}
            <div className="flex-1 min-h-0 w-full relative">
              <div className="absolute inset-0">
                {context === "OIL" && (
                  <ChartCard
                    title="Brent Crude Oil"
                    value={`$${data?.oil?.price?.toFixed(2)}`}
                    subValue="Reference"
                    data={charts?.oil}
                    dataKey="value"
                    color="#ef4444"
                    unitPrefix="$"
                    className="h-full border border-slate-800 bg-[#0b1121]"
                  />
                )}
                {context === "REER" && (
                  <ChartCard
                    title="India REER"
                    value={data?.reer?.price?.toFixed(2)}
                    subValue="Reference"
                    data={charts?.reer}
                    dataKey="value"
                    color="#10b981"
                    referenceLineValue={100}
                    className="h-full border border-slate-800 bg-[#0b1121]"
                  />
                )}
                {context === "CPI" && (
                  <ChartCard
                    title="India CPI Inflation"
                    value={`${data?.cpi?.price?.toFixed(2)}%`}
                    subValue="Reference"
                    data={charts?.cpi}
                    dataKey="value"
                    color="#facc15"
                    unitSuffix="%"
                    className="h-full border border-slate-800 bg-[#0b1121]"
                  />
                )}
                {context === "FX" && (
                  <ChartCard
                    title="Currency Matrix"
                    value="Relative %"
                    subValue="Reference"
                    data={charts?.fxBasket}
                    className="h-full border border-slate-800 bg-[#0b1121]"
                    unitSuffix="%"
                    multiLines={[
                      { key: "inr", color: "#06b6d4" },
                      { key: "cny", color: "#f43f5e" },
                      { key: "dxy", color: "#facc15" },
                    ]}
                  />
                )}
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
                    className="h-full border border-slate-800 bg-[#0b1121]"
                  />
                )}
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
                    className="h-full border border-slate-800 bg-[#0b1121]"
                  />
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AnalysisModal;
