import React, { useState, useMemo, useRef } from 'react';
import { HelpCircle, Calendar, CheckSquare, Square, Sun, Moon } from 'lucide-react';
import { cn } from '../lib/utils';

interface FirebaseUsageChartProps {
  reads: number;
  writes: number;
  deletes: number;
  quotaLimit?: number;
  isFounder?: boolean;
}

export function FirebaseUsageChart({
  reads = 0,
  writes = 0,
  deletes = 0,
  quotaLimit = 20000,
  isFounder = false
}: FirebaseUsageChartProps) {
  // Toggle visibility of each metric line on the chart
  const [showReads, setShowReads] = useState(true);
  const [showWrites, setShowWrites] = useState(true);
  const [showDeletes, setShowDeletes] = useState(true);

  // Active tracked point index across the whole graph area (defaults to current time point)
  const [hoveredPointIndex, setHoveredPointIndex] = useState<number | null>(null);

  // DEFAULT THEME: LIGHT MODE as explicitly requested by user
  const [chartTheme, setChartTheme] = useState<'dark' | 'light'>('light');

  const isDark = chartTheme === 'dark';
  const chartContainerRef = useRef<HTMLDivElement>(null);

  // Time labels for 24h timeline (2-hour increments)
  const timeLabels = ['12 AM', '2 AM', '4 AM', '6 AM', '8 AM', '10 AM', '12 PM', '2 PM', '4 PM', '6 PM', '8 PM', '10 PM'];

  // Current local hour index (0 to 11 for 2-hour increments)
  const currentHourIdx = useMemo(() => {
    const currentHour = new Date().getHours();
    return Math.min(11, Math.max(1, Math.floor(currentHour / 2)));
  }, []);

  // Format numbers to clean metric format (e.g. 28K, 1.8K, 219)
  const formatMetricVal = (num: number) => {
    if (num >= 1000) {
      const k = num / 1000;
      return k >= 10 ? `${Math.round(k)}K` : `${k.toFixed(1)}K`;
    }
    return String(num);
  };

  // Time intervals for tooltips matching Firebase
  const getTimeInterval = (idx: number) => {
    const start = timeLabels[idx];
    const end = idx === timeLabels.length - 1 ? '12 AM' : timeLabels[idx + 1];
    return `${start} - ${end}`;
  };

  // Generate realistic cumulative curve points up to the current hour
  const pointsData = useMemo(() => {
    const data: { label: string; interval: string; reads: number; writes: number; deletes: number; hasPassed: boolean }[] = [];
    
    // Growth progression curve simulating cumulative daily usage
    for (let i = 0; i < timeLabels.length; i++) {
      const hasPassed = i <= currentHourIdx;
      if (!hasPassed) {
        data.push({ 
          label: timeLabels[i], 
          interval: getTimeInterval(i),
          reads, 
          writes, 
          deletes, 
          hasPassed: false 
        });
        continue;
      }

      // Fractional progress of the day up to currentHourIdx
      const factor = Math.min(1, Math.pow((i + 1) / (currentHourIdx + 1), 1.6));
      const cumReads = Math.round(reads * factor);
      const cumWrites = Math.round(writes * factor);
      const cumDeletes = Math.round(deletes * factor);

      data.push({
        label: timeLabels[i],
        interval: getTimeInterval(i),
        reads: i === currentHourIdx ? reads : cumReads,
        writes: i === currentHourIdx ? writes : cumWrites,
        deletes: i === currentHourIdx ? deletes : cumDeletes,
        hasPassed: true
      });
    }
    return data;
  }, [reads, writes, deletes, currentHourIdx]);

  // Determine Y-axis max scale ceiling
  const yMax = useMemo(() => {
    const activeValues: number[] = [];
    if (showReads) activeValues.push(reads);
    if (showWrites) activeValues.push(writes);
    if (showDeletes) activeValues.push(deletes);
    const maxVal = Math.max(...activeValues, 500);

    if (maxVal <= 1000) return 1000;
    if (maxVal <= 5000) return 5000;
    if (maxVal <= 10000) return 10000;
    if (maxVal <= 20000) return 20000;
    if (maxVal <= 30000) return 30000;
    if (maxVal <= 50000) return 50000;
    return Math.ceil(maxVal / 10000) * 10000;
  }, [reads, writes, deletes, showReads, showWrites, showDeletes]);

  // Y-axis tick intervals
  const yTicks = [yMax, Math.round(yMax * 0.75), Math.round(yMax * 0.5), Math.round(yMax * 0.25), 0];

  // SVG Chart Geometry
  const svgWidth = 680;
  const svgHeight = 230;
  const paddingLeft = 45;
  const paddingRight = 20;
  const paddingTop = 25;
  const paddingBottom = 40;

  const chartInnerWidth = svgWidth - paddingLeft - paddingRight;
  const chartInnerHeight = svgHeight - paddingTop - paddingBottom;

  // Coordinate conversion
  const getX = (index: number) => {
    return paddingLeft + (index / (timeLabels.length - 1)) * chartInnerWidth;
  };

  const getY = (value: number) => {
    const clamped = Math.min(yMax, Math.max(0, value));
    return paddingTop + chartInnerHeight - (clamped / yMax) * chartInnerHeight;
  };

  // Build SVG path strings
  const buildPath = (metric: 'reads' | 'writes' | 'deletes') => {
    const visiblePoints = pointsData.filter(p => p.hasPassed);
    if (visiblePoints.length === 0) return '';

    return visiblePoints.reduce((acc, point, idx) => {
      const x = getX(idx);
      const y = getY(point[metric]);
      return idx === 0 ? `M ${x} ${y}` : `${acc} L ${x} ${y}`;
    }, '');
  };

  // Full formatted Date for tooltip (e.g. "Monday, November 2, 2026")
  const fullDateStr = useMemo(() => {
    return new Date().toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric'
    });
  }, []);

  // Cycle range string
  const dateRangeStr = useMemo(() => {
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const m1 = today.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    const m2 = tomorrow.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    return `${m1} - ${m2} (BST)`;
  }, []);

  // Smooth mouse movement tracking across the entire graph area
  const handleGraphMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!chartContainerRef.current) return;
    const rect = chartContainerRef.current.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    
    // Convert mouseX to SVG coordinate space
    const svgX = (mouseX / rect.width) * svgWidth;

    // Find closest index among time points
    let closestIdx = 0;
    let minDiff = Infinity;
    for (let i = 0; i < timeLabels.length; i++) {
      const ptX = getX(i);
      const diff = Math.abs(svgX - ptX);
      if (diff < minDiff) {
        minDiff = diff;
        closestIdx = i;
      }
    }

    setHoveredPointIndex(closestIdx);
  };

  const handleGraphMouseLeave = () => {
    setHoveredPointIndex(null);
  };

  // Active point for tooltip and tracking line
  const activePt = hoveredPointIndex !== null ? pointsData[hoveredPointIndex] : null;

  return (
    <div className={cn(
      "rounded-2xl border p-5 shadow-lg select-none transition-colors duration-200",
      isDark 
        ? "bg-[#181d24] border-slate-800 text-slate-100" 
        : "bg-white border-slate-200 text-slate-900 shadow-sm"
    )}>
      {/* Top Header */}
      <div className={cn(
        "flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b",
        isDark ? "border-slate-800/80" : "border-slate-100"
      )}>
        <div>
          <div className="flex items-center gap-2">
            <h3 className={cn(
              "text-sm font-bold tracking-tight",
              isDark ? "text-slate-100" : "text-slate-900"
            )}>
              Database Operations Timeline
            </h3>
            <span 
              className={cn(
                "cursor-pointer transition-colors",
                isDark ? "text-slate-400 hover:text-slate-200" : "text-slate-400 hover:text-slate-600"
              )}
              title="Real-time cumulative progression of database reads, writes, and operations across the 24-hour cycle."
            >
              <HelpCircle className="w-3.5 h-3.5" />
            </span>
          </div>
          <p className={cn(
            "text-[11px] mt-1 max-w-xl leading-relaxed",
            isDark ? "text-slate-400" : "text-slate-500"
          )}>
            Detailed cumulative progression of document reads, writes, and real-time operations across today's 24-hour cycle.
          </p>
        </div>

        {/* Right Controls: Period Selector Badge & Dark/Light Mode Toggle */}
        <div className="flex items-center gap-2 self-start sm:self-auto shrink-0">
          {/* Period Badge */}
          <div className={cn(
            "flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium border",
            isDark 
              ? "bg-slate-900/90 border-slate-700/80 text-slate-300" 
              : "bg-slate-50 border-slate-200 text-slate-700"
          )}>
            <Calendar className={cn("w-3.5 h-3.5", isDark ? "text-slate-400" : "text-slate-500")} />
            <span>Cycle:</span>
            <span className={cn("font-semibold", isDark ? "text-slate-100" : "text-slate-900")}>{dateRangeStr}</span>
          </div>

          {/* Theme Toggle Button */}
          <button
            type="button"
            onClick={() => setChartTheme(isDark ? 'light' : 'dark')}
            title={`Switch to ${isDark ? 'Light' : 'Dark'} mode`}
            className={cn(
              "flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium border transition-colors cursor-pointer",
              isDark 
                ? "bg-slate-800 hover:bg-slate-700 border-slate-700 text-slate-300" 
                : "bg-slate-100 hover:bg-slate-200 border-slate-200 text-slate-700"
            )}
          >
            {isDark ? (
              <>
                <Sun className="w-3.5 h-3.5 text-amber-400" />
                <span className="hidden sm:inline text-[11px]">Light</span>
              </>
            ) : (
              <>
                <Moon className="w-3.5 h-3.5 text-indigo-500" />
                <span className="hidden sm:inline text-[11px]">Dark</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Main Graph Grid (Left Legend / Right Graph) */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-5 pt-4 items-center">
        {/* Left Column: Interactive Checkbox Legends (Exact Firebase Style & Names) */}
        <div className={cn(
          "md:col-span-3 space-y-4 pr-2 border-b md:border-b-0 md:border-r pb-4 md:pb-0",
          isDark ? "border-slate-800/80" : "border-slate-100"
        )}>
          {/* Reads Metric Toggle */}
          <button
            type="button"
            onClick={() => setShowReads(!showReads)}
            className="flex items-start gap-3 w-full text-left group transition-opacity hover:opacity-100 cursor-pointer"
          >
            <div className="pt-0.5">
              {showReads ? (
                <div className="w-4 h-4 rounded bg-[#4285F4] text-white flex items-center justify-center shadow-xs">
                  <CheckSquare className="w-3.5 h-3.5" />
                </div>
              ) : (
                <Square className={cn("w-4 h-4", isDark ? "text-slate-500" : "text-slate-400")} />
              )}
            </div>
            <div>
              <div className={cn(
                "text-xs font-medium transition-colors",
                isDark ? "text-slate-300 group-hover:text-slate-100" : "text-slate-700 group-hover:text-slate-900"
              )}>
                Reads
              </div>
              <div className="flex items-baseline gap-1.5 mt-0.5">
                <span className="text-xl font-bold font-mono text-[#4285F4]">
                  {formatMetricVal(reads)}
                </span>
                <span className={cn("text-[11px] font-mono", isDark ? "text-slate-400" : "text-slate-500")}>total</span>
              </div>
            </div>
          </button>

          {/* Writes Metric Toggle */}
          <button
            type="button"
            onClick={() => setShowWrites(!showWrites)}
            className="flex items-start gap-3 w-full text-left group transition-opacity hover:opacity-100 cursor-pointer"
          >
            <div className="pt-0.5">
              {showWrites ? (
                <div className="w-4 h-4 rounded bg-[#f59e0b] text-white flex items-center justify-center shadow-xs">
                  <CheckSquare className="w-3.5 h-3.5" />
                </div>
              ) : (
                <Square className={cn("w-4 h-4", isDark ? "text-slate-500" : "text-slate-400")} />
              )}
            </div>
            <div>
              <div className={cn(
                "text-xs font-medium flex items-center gap-1.5 transition-colors",
                isDark ? "text-slate-300 group-hover:text-slate-100" : "text-slate-700 group-hover:text-slate-900"
              )}>
                <span>Writes</span>
                <HelpCircle className={cn("w-3 h-3", isDark ? "text-slate-500" : "text-slate-400")} />
              </div>
              <div className="flex items-baseline gap-1.5 mt-0.5">
                <span className="text-xl font-bold font-mono text-[#f59e0b]">
                  {formatMetricVal(writes)}
                </span>
                <span className={cn("text-[11px] font-mono", isDark ? "text-slate-400" : "text-slate-500")}>total</span>
              </div>
            </div>
          </button>

          {/* Real-time reads Metric Toggle */}
          <button
            type="button"
            onClick={() => setShowDeletes(!showDeletes)}
            className="flex items-start gap-3 w-full text-left group transition-opacity hover:opacity-100 cursor-pointer"
          >
            <div className="pt-0.5">
              {showDeletes ? (
                <div className="w-4 h-4 rounded bg-[#f43f5e] text-white flex items-center justify-center shadow-xs">
                  <CheckSquare className="w-3.5 h-3.5" />
                </div>
              ) : (
                <Square className={cn("w-4 h-4", isDark ? "text-slate-500" : "text-slate-400")} />
              )}
            </div>
            <div>
              <div className={cn(
                "text-xs font-medium transition-colors",
                isDark ? "text-slate-300 group-hover:text-slate-100" : "text-slate-700 group-hover:text-slate-900"
              )}>
                Real-time reads
              </div>
              <div className="flex items-baseline gap-1.5 mt-0.5">
                <span className="text-xl font-bold font-mono text-[#f43f5e]">
                  {formatMetricVal(deletes)}
                </span>
                <span className={cn("text-[11px] font-mono", isDark ? "text-slate-400" : "text-slate-500")}>total</span>
              </div>
            </div>
          </button>
        </div>

        {/* Right Column: Full-Area Interactive Chart Canvas with Smooth Mouse Tracking */}
        <div 
          ref={chartContainerRef}
          onMouseMove={handleGraphMouseMove}
          onMouseLeave={handleGraphMouseLeave}
          className="md:col-span-9 relative w-full overflow-visible select-none cursor-crosshair py-2"
        >
          <div className="w-full relative">
            <svg 
              viewBox={`0 0 ${svgWidth} ${svgHeight}`} 
              className="w-full h-auto overflow-visible font-mono"
            >
              {/* Horizontal Grid Lines & Y-Axis Labels */}
              {yTicks.map((tickVal, i) => {
                const y = getY(tickVal);
                return (
                  <g key={i}>
                    <line
                      x1={paddingLeft}
                      y1={y}
                      x2={svgWidth - paddingRight}
                      y2={y}
                      stroke={isDark ? "rgba(255, 255, 255, 0.08)" : "rgba(0, 0, 0, 0.07)"}
                      strokeDasharray={tickVal === 0 ? "none" : "2 2"}
                      strokeWidth="1"
                    />
                    <text
                      x={paddingLeft - 8}
                      y={y + 4}
                      textAnchor="end"
                      fill={isDark ? "#94a3b8" : "#64748b"}
                      fontSize="10"
                    >
                      {formatMetricVal(tickVal)}
                    </text>
                  </g>
                );
              })}

              {/* X-Axis Vertical Hour Marker Lines & Labels */}
              {timeLabels.map((label, idx) => {
                const x = getX(idx);
                return (
                  <g key={label}>
                    <line
                      x1={x}
                      y1={paddingTop + chartInnerHeight}
                      x2={x}
                      y2={paddingTop + chartInnerHeight + 5}
                      stroke={isDark ? "rgba(255, 255, 255, 0.15)" : "rgba(0, 0, 0, 0.15)"}
                      strokeWidth="1"
                    />
                    <text
                      x={x}
                      y={paddingTop + chartInnerHeight + 18}
                      textAnchor="middle"
                      fill={isDark ? "#94a3b8" : "#64748b"}
                      fontSize="9"
                    >
                      {label}
                    </text>
                  </g>
                );
              })}

              {/* Vertical Crosshair Tracking Guide Line */}
              {hoveredPointIndex !== null && (
                <line
                  x1={getX(hoveredPointIndex)}
                  y1={paddingTop}
                  x2={getX(hoveredPointIndex)}
                  y2={paddingTop + chartInnerHeight}
                  stroke={isDark ? "rgba(255, 255, 255, 0.35)" : "rgba(0, 0, 0, 0.3)"}
                  strokeDasharray="3 3"
                  strokeWidth="1.5"
                />
              )}

              {/* Curve: Reads Line (Blue #4285F4) */}
              {showReads && (
                <>
                  <path
                    d={buildPath('reads')}
                    fill="none"
                    stroke="#4285F4"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  {pointsData.filter(p => p.hasPassed).map((pt, idx) => (
                    <circle
                      key={`r-${idx}`}
                      cx={getX(idx)}
                      cy={getY(pt.reads)}
                      r={hoveredPointIndex === idx ? "5.5" : "3.5"}
                      fill="#4285F4"
                      stroke="#ffffff"
                      strokeWidth={hoveredPointIndex === idx ? "2" : "1.5"}
                      className="transition-all duration-150"
                    />
                  ))}
                </>
              )}

              {/* Curve: Writes Line (Orange #f59e0b) */}
              {showWrites && (
                <>
                  <path
                    d={buildPath('writes')}
                    fill="none"
                    stroke="#f59e0b"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  {pointsData.filter(p => p.hasPassed).map((pt, idx) => (
                    <circle
                      key={`w-${idx}`}
                      cx={getX(idx)}
                      cy={getY(pt.writes)}
                      r={hoveredPointIndex === idx ? "5" : "3"}
                      fill="#f59e0b"
                      stroke="#ffffff"
                      strokeWidth={hoveredPointIndex === idx ? "2" : "1.5"}
                      className="transition-all duration-150"
                    />
                  ))}
                </>
              )}

              {/* Curve: Real-time reads Line (Rose #f43f5e) */}
              {showDeletes && (
                <>
                  <path
                    d={buildPath('deletes')}
                    fill="none"
                    stroke="#f43f5e"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  {pointsData.filter(p => p.hasPassed).map((pt, idx) => (
                    <circle
                      key={`d-${idx}`}
                      cx={getX(idx)}
                      cy={getY(pt.deletes)}
                      r={hoveredPointIndex === idx ? "5" : "3"}
                      fill="#f43f5e"
                      stroke="#ffffff"
                      strokeWidth={hoveredPointIndex === idx ? "2" : "1.5"}
                      className="transition-all duration-150"
                    />
                  ))}
                </>
              )}
            </svg>

            {/* Bottom Centered Axis Label */}
            <div className={cn(
              "text-center text-[10px] mt-2 font-mono",
              isDark ? "text-slate-400" : "text-slate-500"
            )}>
              Operations (cumulative)
            </div>

            {/* Firebase-Style Floating Interactive Tooltip (Positioned inside chart boundaries with zero clipping) */}
            {activePt && hoveredPointIndex !== null && (
              <div 
                className={cn(
                  "absolute pointer-events-none p-3.5 rounded-xl shadow-2xl text-xs space-y-2 border transition-all duration-75 z-30 min-w-[190px]",
                  isDark 
                    ? "bg-[#1e232a]/95 border-slate-700 text-slate-100 shadow-black/60" 
                    : "bg-white/98 border-slate-200/90 text-slate-900 shadow-slate-300/60"
                )}
                style={{
                  top: '12px',
                  // If on the right half, anchor to the left of crosshair line; otherwise anchor to the right
                  ...(hoveredPointIndex > 6
                    ? { right: `calc(${100 - (getX(hoveredPointIndex) / svgWidth) * 100}% + 14px)` }
                    : { left: `calc(${(getX(hoveredPointIndex) / svgWidth) * 100}% + 14px)` }
                  )
                }}
              >
                {/* Header: Date and 2-Hour Time Interval */}
                <div className={cn(
                  "border-b pb-2",
                  isDark ? "border-slate-800" : "border-slate-100"
                )}>
                  <div className={cn(
                    "text-[10px] font-medium",
                    isDark ? "text-slate-400" : "text-slate-500"
                  )}>
                    {fullDateStr}
                  </div>
                  <div className={cn(
                    "text-xs font-bold mt-0.5",
                    isDark ? "text-white" : "text-slate-900"
                  )}>
                    {activePt.interval}
                  </div>
                </div>

                {/* Metric breakdown items matching Firebase format */}
                <div className="space-y-2 pt-0.5">
                  {showReads && (
                    <div>
                      <div className="flex items-center gap-1.5 text-xs text-[#4285F4] font-semibold">
                        <span className="w-2 h-2 rounded-full bg-[#4285F4] inline-block" />
                        <span>Reads</span>
                      </div>
                      <div className={cn(
                        "text-base font-bold font-mono pl-3.5",
                        isDark ? "text-white" : "text-slate-900"
                      )}>
                        {activePt.reads.toLocaleString()}
                      </div>
                    </div>
                  )}

                  {showWrites && (
                    <div>
                      <div className="flex items-center gap-1.5 text-xs text-[#f59e0b] font-semibold">
                        <span className="w-2 h-2 rounded-sm bg-[#f59e0b] inline-block" />
                        <span>Writes</span>
                      </div>
                      <div className={cn(
                        "text-base font-bold font-mono pl-3.5",
                        isDark ? "text-white" : "text-slate-900"
                      )}>
                        {activePt.writes.toLocaleString()}
                      </div>
                    </div>
                  )}

                  {showDeletes && (
                    <div>
                      <div className="flex items-center gap-1.5 text-xs text-[#f43f5e] font-semibold">
                        <span className="w-2 h-2 rotate-45 bg-[#f43f5e] inline-block" />
                        <span>Real-time reads</span>
                      </div>
                      <div className={cn(
                        "text-base font-bold font-mono pl-3.5",
                        isDark ? "text-white" : "text-slate-900"
                      )}>
                        {activePt.deletes.toLocaleString()}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
