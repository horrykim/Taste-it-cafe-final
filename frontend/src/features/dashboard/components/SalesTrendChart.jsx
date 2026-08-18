import { useMemo, useState } from "react";
import { Card } from "../../../components/ui";
import { cn } from "../../../utils/cn";

const periods = ["daily", "weekly", "monthly"];
const periodLabels = { daily: "Daily", weekly: "Weekly", monthly: "Monthly" };
const chartWidth = 720;
const chartHeight = 260;
const chartPadding = { top: 22, right: 18, bottom: 42, left: 54 };

const formatCurrency = (value) => `₱${value.toLocaleString("en-PH")}`;

function SalesTrendChart({ sales }) {
  const [period, setPeriod] = useState("weekly");
  const points = sales[period];
  const chartPoints = useMemo(() => {
    const maxValue = Math.max(...points.map((point) => point.value), 1);
    const innerWidth = chartWidth - chartPadding.left - chartPadding.right;
    const innerHeight = chartHeight - chartPadding.top - chartPadding.bottom;
    return points.map((point, index) => ({
      ...point,
      x: chartPadding.left + (index * innerWidth) / Math.max(points.length - 1, 1),
      y: chartPadding.top + innerHeight - (point.value / maxValue) * innerHeight,
    }));
  }, [points]);
  const linePath = chartPoints.map((point, index) => `${index === 0 ? "M" : "L"} ${point.x} ${point.y}`).join(" ");
  const areaPath = `${linePath} L ${chartPoints.at(-1).x} ${chartHeight - chartPadding.bottom} L ${chartPoints[0].x} ${chartHeight - chartPadding.bottom} Z`;
  const maxValue = Math.max(...points.map((point) => point.value), 1);

  return (
    <Card className="p-5 sm:p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div><h2 className="text-base font-semibold text-slate-900">Sales overview</h2><p className="mt-1 text-sm text-slate-500">Completed sales for the selected period</p></div>
        <div className="flex rounded-xl border border-taste-border bg-slate-50 p-1" role="group" aria-label="Sales chart period">
          {periods.map((option) => <button key={option} type="button" onClick={() => setPeriod(option)} aria-pressed={period === option} className={cn("rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors", period === option ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-900")}>{periodLabels[option]}</button>)}
        </div>
      </div>
      <div className="mt-5 overflow-x-auto" aria-live="polite">
        <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} className="h-auto min-w-[580px] w-full" role="img" aria-label={`${periodLabels[period]} sales trend`}>
          <defs><linearGradient id="sales-area" x1="0" x2="0" y1="0" y2="1"><stop offset="0%" stopColor="#7CE1DB" stopOpacity="0.42" /><stop offset="100%" stopColor="#7CE1DB" stopOpacity="0.02" /></linearGradient></defs>
          {[0, 0.5, 1].map((ratio) => { const y = chartPadding.top + (chartHeight - chartPadding.top - chartPadding.bottom) * ratio; return <g key={ratio}><line x1={chartPadding.left} x2={chartWidth - chartPadding.right} y1={y} y2={y} stroke="#E5E7EB" strokeDasharray="4 5" /><text x={chartPadding.left - 10} y={y + 4} textAnchor="end" className="fill-slate-400 text-[11px]">{formatCurrency(Math.round(maxValue * (1 - ratio)))}</text></g>; })}
          <path d={areaPath} fill="url(#sales-area)" /><path d={linePath} fill="none" stroke="#63cbc5" strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" />
          {chartPoints.map((point) => <g key={point.label}><circle cx={point.x} cy={point.y} r="5" fill="white" stroke="#b85f98" strokeWidth="3" /><text x={point.x} y={chartHeight - 14} textAnchor="middle" className="fill-slate-500 text-[11px]">{point.label}</text></g>)}
        </svg>
      </div>
    </Card>
  );
}

export default SalesTrendChart;