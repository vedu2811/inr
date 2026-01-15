import React from "react";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  ComposedChart,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";

const ChartCard = ({
  title,
  value,
  subValue,
  data,
  dataKey,
  color,
  multiLines,
  composedData,
  unitPrefix = "",
  unitSuffix = "",
  className = "h-80",
  referenceLineValue = null,
  showZeroLine = false,
  dualYAxis = false,
  onAnalyze,
  onTimeRangeChange,
  currentTimeRange = "5Y",
}) => {
  // Scaling Logic
  let yMin = "auto",
    yMax = "auto";
  let leftYMin = "auto",
    leftYMax = "auto";
  let rightYMin = "auto",
    rightYMax = "auto";

  if (data && data.length > 0) {
    if (composedData) {
      yMin = "auto";
      yMax = "auto";
    } else if (dualYAxis && multiLines) {
      const leftValues = [],
        rightValues = [];
      data.forEach((d) => {
        multiLines.forEach((line) => {
          const val = parseFloat(d[line.key]);
          if (!isNaN(val)) {
            if (line.yAxisId === "left") leftValues.push(val);
            else if (line.yAxisId === "right") rightValues.push(val);
          }
        });
      });
      if (leftValues.length) {
        const min = Math.min(...leftValues),
          max = Math.max(...leftValues);
        const padding = (max - min) * 0.1;
        leftYMin = min - padding;
        leftYMax = max + padding;
      }
      if (rightValues.length) {
        const min = Math.min(...rightValues),
          max = Math.max(...rightValues);
        const padding = (max - min) * 0.1;
        rightYMin = min - padding;
        rightYMax = max + padding;
      }
    } else {
      const keysToCheck = multiLines ? multiLines.map((l) => l.key) : [dataKey];
      const allValues = [];
      data.forEach((d) => {
        keysToCheck.forEach((key) => {
          const val = parseFloat(d[key]);
          if (!isNaN(val)) allValues.push(val);
        });
      });
      if (allValues.length > 0) {
        const min = Math.min(...allValues),
          max = Math.max(...allValues);
        const padding = (max - min) * 0.1;
        yMin = min - padding;
        yMax = max + padding;
      }
    }
  }

  const sharedDomain = [yMin, yMax];
  const leftDomain = [leftYMin, leftYMax];
  const rightDomain = [rightYMin, rightYMax];

  const formatYAxis = (tick) => {
    if (Math.abs(tick) >= 1000000000)
      return (tick / 1000000000).toFixed(1) + "B";
    if (Math.abs(tick) >= 1000000) return (tick / 1000000).toFixed(1) + "M";
    if (Math.abs(tick) >= 1000) return (tick / 1000).toFixed(0) + "k";
    return tick.toFixed(1);
  };

  const formatXAxis = (tickItem) => {
    if (currentTimeRange === "3M" || currentTimeRange === "6M") {
      const date = new Date(tickItem);
      return isNaN(date.getTime())
        ? tickItem
        : date.toLocaleDateString("en-US", { day: "numeric", month: "short" });
    }
    return tickItem;
  };

  const timeRanges = ["3M", "6M", "1Y", "5Y"];

  return (
    <div
      className={`relative bg-[#0f172a] border border-slate-800 rounded-2xl p-6 shadow-xl flex flex-col transition-all hover:border-slate-600/50 group ${className}`}
    >
      {/* Header */}
      <div className="flex flex-wrap justify-between items-center mb-6 gap-4 z-10 w-full">
        {/* Title */}
        <div className="min-w-0">
          {" "}
          {/* min-w-0 prevents title from forcing wrap unnecessarily */}
          <h3 className="text-slate-400 text-[10px] uppercase tracking-widest font-bold mb-1 flex items-center gap-2">
            <span
              className={`w-1.5 h-1.5 rounded-full ${
                value && value.includes("-") ? "bg-red-500" : "bg-emerald-500"
              }`}
            ></span>
            {title}
          </h3>
          <div className="flex items-baseline gap-2">
            <div className="text-2xl font-bold text-white tracking-tight font-sans truncate">
              {value || "—"}
            </div>
            <span className="text-xs font-semibold text-slate-500 bg-slate-900 px-2 py-0.5 rounded-md border border-slate-800 whitespace-nowrap">
              {subValue}
            </span>
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-3 bg-slate-900/80 p-1 rounded-xl border border-slate-800/80 ml-auto">
          {/* Time Pills */}
          {onTimeRangeChange && (
            <div className="flex items-center gap-0.5">
              {timeRanges.map((range) => (
                <button
                  key={range}
                  onClick={() => onTimeRangeChange(range)}
                  className={`px-2.5 py-1 text-[10px] font-bold rounded-lg transition-all duration-200 ${
                    currentTimeRange === range
                      ? "bg-slate-700 text-white shadow-sm"
                      : "text-slate-500 hover:text-slate-300 hover:bg-slate-800"
                  }`}
                >
                  {range}
                </button>
              ))}
            </div>
          )}

          <div className="w-px h-4 bg-slate-700 mx-1"></div>

          {/* Analyze Button */}
          {onAnalyze && (
            <button
              onClick={onAnalyze}
              className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-cyan-950/50 text-cyan-400 hover:bg-cyan-500 hover:text-white border border-cyan-900/50 hover:border-cyan-400 transition-all duration-300 text-[10px] font-bold uppercase tracking-wider"
            >
              Analyze <span className="text-xs">✨</span>
            </button>
          )}
        </div>
      </div>

      {/* Chart */}
      <div className="flex flex-1 min-h-0 w-full relative z-0">
        {data && data.length === 0 ? (
          <div className="flex items-center justify-center w-full h-full text-slate-500 text-xs italic">
            No recent data. Try a longer timeframe.
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            {composedData ? (
              <ComposedChart
                data={data}
                margin={{ top: 5, right: 0, left: 0, bottom: 0 }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="#1e293b"
                  vertical={false}
                />
                <XAxis
                  dataKey="name"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: "#64748b", fontSize: 10 }}
                  tickFormatter={formatXAxis}
                  minTickGap={20}
                  interval="preserveStartEnd"
                />
                <YAxis
                  domain={["auto", "auto"]}
                  tickFormatter={formatYAxis}
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: "#64748b", fontSize: 10 }}
                  width={50}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#020617",
                    borderColor: "#334155",
                    fontSize: "12px",
                    borderRadius: "8px",
                    color: "#fff",
                  }}
                  labelFormatter={(label) => label}
                />
                <Bar
                  dataKey="equity"
                  fill="#3b82f6"
                  barSize={6}
                  radius={[2, 2, 0, 0]}
                  opacity={0.8}
                />
                <Bar
                  dataKey="debt"
                  fill="#10b981"
                  barSize={6}
                  radius={[2, 2, 0, 0]}
                  opacity={0.8}
                />
                <Line
                  type="monotone"
                  dataKey="equityAvg"
                  stroke="#60a5fa"
                  strokeWidth={2}
                  dot={false}
                  connectNulls
                />
                <Line
                  type="monotone"
                  dataKey="debtAvg"
                  stroke="#34d399"
                  strokeWidth={2}
                  dot={false}
                  connectNulls
                />
              </ComposedChart>
            ) : (
              <LineChart
                data={data}
                margin={{ top: 5, right: 5, left: 0, bottom: 0 }}
              >
                {!multiLines && (
                  <defs>
                    <linearGradient
                      id={`gradient-${dataKey}`}
                      x1="0"
                      y1="0"
                      x2="0"
                      y2="1"
                    >
                      <stop offset="5%" stopColor={color} stopOpacity={0.3} />
                      <stop offset="95%" stopColor={color} stopOpacity={0} />
                    </linearGradient>
                  </defs>
                )}
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="#1e293b"
                  vertical={false}
                />
                <XAxis
                  dataKey="name"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: "#64748b", fontSize: 10 }}
                  tickFormatter={formatXAxis}
                  minTickGap={25}
                  interval="preserveStartEnd"
                />
                <YAxis
                  domain={sharedDomain}
                  tickFormatter={formatYAxis}
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: "#64748b", fontSize: 10, fontWeight: 500 }}
                  width={50}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#020617",
                    borderColor: "#334155",
                    fontSize: "12px",
                    borderRadius: "8px",
                    color: "#fff",
                  }}
                  formatter={(val) =>
                    `${unitPrefix}${parseFloat(val).toFixed(2)}${unitSuffix}`
                  }
                  labelFormatter={(label) => label}
                  labelStyle={{ color: "#94a3b8", marginBottom: "0.5rem" }}
                />
                {referenceLineValue && (
                  <ReferenceLine
                    y={referenceLineValue}
                    stroke="#64748b"
                    strokeDasharray="3 3"
                  />
                )}

                {multiLines ? (
                  multiLines.map((line) => (
                    <Line
                      key={line.key}
                      type="monotone"
                      dataKey={line.key}
                      stroke={line.color}
                      strokeWidth={2}
                      dot={false}
                      activeDot={{
                        r: 4,
                        fill: "#fff",
                        stroke: line.color,
                        strokeWidth: 2,
                      }}
                      connectNulls
                    />
                  ))
                ) : (
                  <Line
                    type="monotone"
                    dataKey={dataKey}
                    stroke={color}
                    strokeWidth={2}
                    dot={false}
                    activeDot={{
                      r: 4,
                      fill: "#fff",
                      stroke: color,
                      strokeWidth: 2,
                    }}
                    fill={`url(#gradient-${dataKey})`}
                    connectNulls
                  />
                )}
              </LineChart>
            )}
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
};

export default ChartCard;
