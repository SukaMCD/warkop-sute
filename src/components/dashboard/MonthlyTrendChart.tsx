import { useState, useEffect } from 'react'
import type { DailyBreakdownItem } from '../../types'
import { formatRupiah, formatNumber } from '../../utils/formatters'
import { LineChart, TrendingUp, TrendingDown, Coins, QrCode } from 'lucide-react'

interface MonthlyTrendChartProps {
  data: DailyBreakdownItem[]
  monthName?: string
}

export const MonthlyTrendChart = ({ data, monthName }: MonthlyTrendChartProps) => {
  // Find initial hovered index: prefer today or last day with transactions
  const initialIndex = (() => {
    if (!data || data.length === 0) return null
    for (let i = data.length - 1; i >= 0; i--) {
      if (data[i].transactions > 0) return i
    }
    return data.length - 1
  })()

  const [hoveredIndex, setHoveredIndex] = useState<number | null>(initialIndex)

  useEffect(() => {
    if (data && data.length > 0) {
      // Pick last active day when month data changes
      let lastActive = data.length - 1
      for (let i = data.length - 1; i >= 0; i--) {
        if (data[i].transactions > 0) {
          lastActive = i
          break
        }
      }
      setHoveredIndex(lastActive)
    }
  }, [data])

  if (!data || data.length === 0) {
    return null
  }

  const maxRevenue = Math.max(...data.map(d => d.revenue), 1)
  const totalRevenue = data.reduce((acc, d) => acc + d.revenue, 0)
  const activeDays = data.filter(d => d.revenue > 0).length || 1
  const avgRevenue = Math.round(totalRevenue / activeDays)

  const hoveredData = hoveredIndex !== null && data[hoveredIndex] ? data[hoveredIndex] : null

  // Day-over-day trend difference
  const hoveredTrend = (() => {
    if (hoveredIndex === null || hoveredIndex <= 0 || !data[hoveredIndex] || !data[hoveredIndex - 1]) {
      return null
    }
    const current = data[hoveredIndex].revenue
    const previous = data[hoveredIndex - 1].revenue
    const diff = current - previous
    const percent = previous > 0 ? Math.round((diff / previous) * 100) : 0
    return {
      diff,
      percent,
      direction: diff > 0 ? ('up' as const) : diff < 0 ? ('down' as const) : ('neutral' as const)
    }
  })()

  // SVG Chart Dimensions
  const svgWidth = 900
  const svgHeight = 210
  const paddingLeft = 45
  const paddingRight = 45
  const paddingTop = 25
  const paddingBottom = 32

  const plotWidth = svgWidth - paddingLeft - paddingRight
  const plotHeight = svgHeight - paddingTop - paddingBottom
  const baselineY = svgHeight - paddingBottom

  const points = data.map((item, idx) => {
    const x = data.length > 1
      ? paddingLeft + (idx / (data.length - 1)) * plotWidth
      : svgWidth / 2
    const ratio = maxRevenue > 0 ? (item.revenue / maxRevenue) : 0
    const y = baselineY - (ratio * plotHeight)
    return { x, y, item, idx }
  })

  return (
    <div className="bg-white dark:bg-stone-900/80 border border-stone-200 dark:border-stone-800 rounded-2xl p-5 shadow-xs">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5 pb-3 border-b border-stone-200 dark:border-stone-800/80">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="w-8 h-8 rounded-xl bg-stone-50 dark:bg-stone-950 border border-stone-200 dark:border-stone-800 flex items-center justify-center text-amber-700 dark:text-[#E2DFD2] shadow-xs">
              <LineChart className="w-4 h-4 stroke-2" />
            </div>
            <h3 className="text-sm font-bold tracking-tight text-stone-900 dark:text-stone-100 flex items-center gap-2">
              <span>Tren Penjualan Harian</span>
              {monthName && (
                <span className="text-xs font-mono font-medium text-stone-500 dark:text-stone-400">
                  ({monthName})
                </span>
              )}
            </h3>
          </div>
          <p className="text-xs text-stone-500 dark:text-stone-400">
            Fluktuasi omzet harian sepanjang bulan (hijau naik, merah turun)
          </p>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-3 text-xs font-medium">
          <div className="flex items-center gap-1.5 text-emerald-700 dark:text-emerald-400">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
            <span>Naik</span>
          </div>
          <div className="flex items-center gap-1.5 text-rose-700 dark:text-rose-400">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
            <span>Turun</span>
          </div>
        </div>
      </div>

      {/* Detail info box for hovered day */}
      {hoveredData && (
        <div className="mb-5 p-3.5 rounded-xl bg-stone-50 dark:bg-stone-950 border border-stone-200 dark:border-stone-800 flex flex-wrap items-center justify-between gap-3 text-xs shadow-xs">
          <div className="flex items-center gap-3">
            <div>
              <span className="text-stone-500 dark:text-stone-400">Tanggal: </span>
              <span className="font-semibold text-stone-900 dark:text-stone-100">
                {hoveredData.dayName}, {hoveredData.date}
              </span>
            </div>
            <div className="h-3 w-px bg-stone-200 dark:border-stone-800" />
            <div>
              <span className="text-stone-500 dark:text-stone-400">Transaksi: </span>
              <span className="font-mono tabular-nums font-semibold text-stone-800 dark:text-stone-200">
                {hoveredData.transactions} pesanan
              </span>
            </div>
          </div>

          <div className="flex items-center gap-4 flex-wrap">
            <div>
              <span className="text-stone-500 dark:text-stone-400">Omzet: </span>
              <span className="font-mono tabular-nums font-bold text-amber-800 dark:text-[#E2DFD2]">
                {formatRupiah(hoveredData.revenue)}
              </span>
            </div>

            <div className="flex items-center gap-2 text-[11px] font-mono text-stone-500 dark:text-stone-400">
              <span className="flex items-center gap-1">
                <Coins className="w-3 h-3 text-stone-400" />
                {formatNumber(hoveredData.cash)}
              </span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <QrCode className="w-3 h-3 text-stone-400" />
                {formatNumber(hoveredData.qris)}
              </span>
            </div>

            {/* Day-over-day trend difference */}
            {hoveredTrend && (
              <div className="flex items-center gap-1.5 font-mono">
                <span className="text-stone-500 dark:text-stone-400">Tren:</span>
                {hoveredTrend.direction === 'up' ? (
                  <span className="flex items-center gap-0.5 text-emerald-600 dark:text-emerald-400 font-bold">
                    <TrendingUp className="w-3.5 h-3.5 stroke-[2.5]" />
                    +{formatRupiah(hoveredTrend.diff)} ({hoveredTrend.percent > 0 ? `+${hoveredTrend.percent}%` : ''})
                  </span>
                ) : hoveredTrend.direction === 'down' ? (
                  <span className="flex items-center gap-0.5 text-rose-600 dark:text-rose-400 font-bold">
                    <TrendingDown className="w-3.5 h-3.5 stroke-[2.5]" />
                    -{formatRupiah(Math.abs(hoveredTrend.diff))} ({hoveredTrend.percent < 0 ? `${hoveredTrend.percent}%` : ''})
                  </span>
                ) : (
                  <span className="text-stone-500 font-medium">
                    Stabil (0%)
                  </span>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* SVG Line Chart */}
      <div className="h-52 relative border-b border-stone-200 dark:border-stone-800">
        <svg
          viewBox={`0 0 ${svgWidth} ${svgHeight}`}
          preserveAspectRatio="none"
          className="w-full h-full overflow-visible"
        >
          <defs>
            <linearGradient id="monthGreenGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#10b981" stopOpacity="0.28" />
              <stop offset="100%" stopColor="#10b981" stopOpacity="0.02" />
            </linearGradient>
            <linearGradient id="monthRedGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#f43f5e" stopOpacity="0.28" />
              <stop offset="100%" stopColor="#f43f5e" stopOpacity="0.02" />
            </linearGradient>
          </defs>

          {/* Reference Guideline: Max Revenue */}
          <line
            x1={paddingLeft}
            y1={paddingTop}
            x2={svgWidth - paddingRight}
            y2={paddingTop}
            stroke="currentColor"
            strokeWidth="1"
            strokeDasharray="3 3"
            className="text-stone-200 dark:text-stone-800/80"
          />

          {/* Reference Guideline: Mid Line */}
          <line
            x1={paddingLeft}
            y1={paddingTop + plotHeight / 2}
            x2={svgWidth - paddingRight}
            y2={paddingTop + plotHeight / 2}
            stroke="currentColor"
            strokeWidth="1"
            strokeDasharray="3 3"
            className="text-stone-200 dark:text-stone-800/80"
          />

          {/* Baseline Rp 0 */}
          <line
            x1={paddingLeft}
            y1={baselineY}
            x2={svgWidth - paddingRight}
            y2={baselineY}
            stroke="currentColor"
            strokeWidth="1"
            className="text-stone-200 dark:text-stone-800"
          />

          {/* Hover vertical crosshair */}
          {hoveredIndex !== null && points[hoveredIndex] && (
            <line
              x1={points[hoveredIndex].x}
              y1={paddingTop - 6}
              x2={points[hoveredIndex].x}
              y2={baselineY}
              stroke="currentColor"
              strokeWidth="1.5"
              strokeDasharray="3 3"
              className="text-stone-400 dark:text-stone-600 transition-all duration-100"
            />
          )}

          {/* Area Under Segments */}
          {points.slice(1).map((curr, idx) => {
            const prev = points[idx]
            const isUp = curr.item.revenue >= prev.item.revenue
            const areaPoints = `${prev.x},${baselineY} ${prev.x},${prev.y} ${curr.x},${curr.y} ${curr.x},${baselineY}`
            return (
              <polygon
                key={`area-${curr.item.date}`}
                points={areaPoints}
                fill={isUp ? 'url(#monthGreenGrad)' : 'url(#monthRedGrad)'}
                className="transition-all duration-300"
              />
            )
          })}

          {/* Line Segments (Hijau Naik, Merah Turun) */}
          {points.slice(1).map((curr, idx) => {
            const prev = points[idx]
            const isUp = curr.item.revenue >= prev.item.revenue
            const strokeColor = isUp ? '#10b981' : '#f43f5e'
            return (
              <line
                key={`segment-${curr.item.date}`}
                x1={prev.x}
                y1={prev.y}
                x2={curr.x}
                y2={curr.y}
                stroke={strokeColor}
                strokeWidth="3"
                strokeLinecap="round"
                className="transition-all duration-200"
              />
            )
          })}

          {/* Node Dots on Each Point */}
          {points.map((p) => {
            const isHovered = hoveredIndex === p.idx
            const isFirst = p.idx === 0
            const isUp = isFirst
              ? (points[1] ? points[1].item.revenue <= p.item.revenue : true)
              : p.item.revenue >= points[p.idx - 1].item.revenue
            const dotColor = isUp ? '#10b981' : '#f43f5e'

            return (
              <g
                key={`dot-${p.item.date}`}
                className="cursor-pointer transition-all"
                onClick={() => setHoveredIndex(p.idx)}
              >
                {/* Hover halo */}
                {isHovered && (
                  <circle
                    cx={p.x}
                    cy={p.y}
                    r="10"
                    fill={dotColor}
                    fillOpacity="0.25"
                  />
                )}
                {/* Outer circle */}
                <circle
                  cx={p.x}
                  cy={p.y}
                  r={isHovered ? 5.5 : 3.5}
                  fill={dotColor}
                  stroke="currentColor"
                  strokeWidth="2"
                  className="text-white dark:text-stone-900 transition-all duration-150"
                />
                {/* Inner center dot */}
                {isHovered && (
                  <circle
                    cx={p.x}
                    cy={p.y}
                    r="2"
                    fill="#ffffff"
                  />
                )}
              </g>
            )
          })}

          {/* Day Labels at bottom */}
          {points.map((p) => {
            const isHovered = hoveredIndex === p.idx
            // Show label on day 1, multiples of 5, last day, or when hovered
            const shouldShow = p.item.day === 1 || p.item.day % 5 === 0 || p.item.day === data.length || isHovered

            if (!shouldShow) return null

            return (
              <text
                key={`label-${p.item.date}`}
                x={p.x}
                y={svgHeight - 10}
                textAnchor="middle"
                className={`text-[10px] font-mono select-none transition-colors ${
                  isHovered
                    ? 'fill-stone-900 dark:fill-stone-100 font-bold'
                    : 'fill-stone-500 dark:fill-stone-400 font-normal'
                }`}
              >
                {p.item.day}
              </text>
            )
          })}

          {/* Interactive column hitboxes for smooth hover & touch */}
          {points.map((p, idx) => {
            const colWidth = plotWidth / (points.length || 1)
            const colLeft = p.x - colWidth / 2
            return (
              <rect
                key={`hit-${p.item.date}`}
                x={Math.max(0, colLeft)}
                y={0}
                width={colWidth}
                height={svgHeight}
                fill="transparent"
                className="cursor-pointer"
                onMouseEnter={() => setHoveredIndex(idx)}
                onTouchStart={() => setHoveredIndex(idx)}
                onClick={() => setHoveredIndex(idx)}
              />
            )
          })}
        </svg>
      </div>

      {/* Footer Metrics */}
      <div className="mt-3 flex items-center justify-between text-[11px] text-stone-500 dark:text-stone-400 px-1 font-mono">
        <span>Skala Max Harian: {formatRupiah(maxRevenue)}</span>
        <span>Rata-rata Harian: {formatRupiah(avgRevenue)}</span>
      </div>

    </div>
  )
}
