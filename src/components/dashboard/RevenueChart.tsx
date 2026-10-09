import { useState, useEffect } from 'react'
import type { DailySalesMetric } from '../../types'
import { formatRupiah } from '../../utils/formatters'
import { BarChart3, LineChart, TrendingUp, TrendingDown } from 'lucide-react'

interface RevenueChartProps {
  data: DailySalesMetric[]
}

export const RevenueChart = ({ data }: RevenueChartProps) => {
  const [chartType, setChartType] = useState<'bar' | 'line'>('line')
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(data.length > 0 ? data.length - 1 : null)

  useEffect(() => {
    if (data.length > 0) {
      setHoveredIndex(data.length - 1)
    }
  }, [data])

  const maxRevenue = data.length > 0 ? Math.max(...data.map(d => d.revenue), 0) : 0
  const hoveredData = hoveredIndex !== null && data[hoveredIndex] ? data[hoveredIndex] : (data.length > 0 ? data[data.length - 1] : null)

  // Calculate day-over-day trend difference for hovered item
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

  // SVG Line Chart coordinates
  const svgWidth = 700
  const svgHeight = 175
  const paddingLeft = 40
  const paddingRight = 40
  const paddingTop = 25
  const paddingBottom = 30

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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6 pb-3 border-b border-stone-200 dark:border-stone-800/80">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="w-8 h-8 rounded-xl bg-stone-50 dark:bg-stone-950 border border-stone-200 dark:border-stone-800 flex items-center justify-center text-amber-700 dark:text-[#E2DFD2] shadow-xs">
              {chartType === 'line' ? (
                <LineChart className="w-4 h-4 stroke-2" />
              ) : (
                <BarChart3 className="w-4 h-4 stroke-2" />
              )}
            </div>
            <h2 className="text-sm font-bold tracking-tight text-stone-900 dark:text-stone-100">
              Tren Penjualan Mingguan
            </h2>
          </div>
          <p className="text-xs text-stone-500 dark:text-stone-400">
            {chartType === 'line'
              ? 'Pergerakan tren omzet harian (hijau naik, merah turun)'
              : 'Perbandingan omzet harian antara pembayaran Tunai dan QRIS'}
          </p>
        </div>

        {/* Switcher & Legend */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Chart Type Toggle */}
          <div className="flex items-center p-0.5 rounded-xl bg-stone-100 dark:bg-stone-950 border border-stone-200 dark:border-stone-800 shadow-xs">
            <button
              type="button"
              onClick={() => setChartType('line')}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                chartType === 'line'
                  ? 'bg-white dark:bg-stone-850 text-stone-950 dark:text-stone-100 shadow-xs'
                  : 'text-stone-500 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-200'
              }`}
              title="Tampilkan Diagram Garis (Tren Hijau/Merah)"
            >
              <LineChart className="w-3.5 h-3.5" />
              <span>Garis</span>
            </button>
            <button
              type="button"
              onClick={() => setChartType('bar')}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                chartType === 'bar'
                  ? 'bg-white dark:bg-stone-850 text-stone-950 dark:text-stone-100 shadow-xs'
                  : 'text-stone-500 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-200'
              }`}
              title="Tampilkan Diagram Batang"
            >
              <BarChart3 className="w-3.5 h-3.5" />
              <span>Batang</span>
            </button>
          </div>

          {/* Dynamic Legend */}
          {chartType === 'line' ? (
            <div className="flex items-center gap-3 text-xs font-medium">
              <div className="flex items-center gap-1.5 text-emerald-700 dark:text-emerald-400 font-medium">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                <span>Naik</span>
              </div>
              <div className="flex items-center gap-1.5 text-rose-700 dark:text-rose-400 font-medium">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
                <span>Turun</span>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-3 text-xs font-medium">
              <div className="flex items-center gap-1.5 text-stone-600 dark:text-stone-300">
                <span className="w-2.5 h-2.5 rounded-xs bg-stone-800 dark:bg-stone-200" />
                <span>Tunai</span>
              </div>
              <div className="flex items-center gap-1.5 text-stone-600 dark:text-stone-300">
                <span className="w-2.5 h-2.5 rounded-xs bg-stone-400 dark:bg-stone-500" />
                <span>QRIS</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Detail info box of hovered day */}
      {hoveredData && (
        <div className="mb-6 p-3.5 rounded-xl bg-stone-50 dark:bg-stone-950 border border-stone-200 dark:border-stone-800 flex flex-wrap items-center justify-between gap-3 text-xs shadow-xs">
          <div>
            <span className="text-stone-500 dark:text-stone-400">Hari & Tanggal: </span>
            <span className="font-semibold text-stone-900 dark:text-stone-100">{hoveredData.day_name}, {hoveredData.date}</span>
          </div>
          <div className="flex items-center gap-4 flex-wrap">
            <div>
              <span className="text-stone-500 dark:text-stone-400">Total Omzet: </span>
              <span className="font-mono tabular-nums font-bold text-amber-800 dark:text-[#E2DFD2]">
                {formatRupiah(hoveredData.revenue)}
              </span>
            </div>
            <div>
              <span className="text-stone-500 dark:text-stone-400">Transaksi: </span>
              <span className="font-mono tabular-nums font-semibold text-stone-800 dark:text-stone-200">
                {hoveredData.transactions} pesanan
              </span>
            </div>

            {/* Day-over-day Trend Indicator */}
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

      {/* Chart Visual Container */}
      <div className="h-48 relative border-b border-stone-200 dark:border-stone-800">
        
        {chartType === 'bar' ? (
          /* Visual Chart Bars */
          <div className="w-full h-full flex items-end justify-between gap-2 pt-6 pb-2 px-2">
            {data.map((item, idx) => {
              const heightPercent = maxRevenue > 0 ? Math.round((item.revenue / maxRevenue) * 100) : 0
              const cashHeightPercent = item.revenue > 0 ? Math.round((item.cash_amount / item.revenue) * 100) : 0
              const isHovered = hoveredIndex === idx
              const isZero = item.revenue === 0

              return (
                <div
                  key={item.date}
                  role="button"
                  tabIndex={0}
                  aria-label={`${item.day_name}, ${item.date}: Total ${formatRupiah(item.revenue)} (${item.transactions} pesanan)`}
                  className="flex-1 flex flex-col items-center h-full justify-end group cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-700 dark:focus-visible:ring-[#E2DFD2] rounded-md transition-all"
                  onMouseEnter={() => setHoveredIndex(idx)}
                  onFocus={() => setHoveredIndex(idx)}
                  onKeyDown={(e) => {
                    if (e.key === 'ArrowRight' && idx < data.length - 1) setHoveredIndex(idx + 1)
                    if (e.key === 'ArrowLeft' && idx > 0) setHoveredIndex(idx - 1)
                  }}
                >
                  {/* Bar Container */}
                  <div className="w-full max-w-10.5 flex flex-col justify-end h-full">
                    <div
                      className={`w-full rounded-t-md flex flex-col overflow-hidden transition-all duration-200 ${
                        isHovered ? 'ring-1.5 ring-amber-700 dark:ring-[#E2DFD2] ring-offset-2 ring-offset-stone-100 dark:ring-offset-stone-900 brightness-110 shadow-md' : 'opacity-85 group-hover:opacity-100'
                      }`}
                      style={{ height: isZero ? '3px' : `${Math.max(heightPercent, 6)}%` }}
                    >
                      {isZero ? (
                        <div className="w-full h-full bg-stone-300 dark:bg-stone-700" title="Belum ada transaksi" />
                      ) : (
                        <>
                          {/* Top segment: QRIS */}
                          <div
                            className="w-full bg-stone-400 dark:bg-stone-500 transition-all"
                            style={{ height: `${100 - cashHeightPercent}%` }}
                            title={`QRIS: ${formatRupiah(item.qris_amount)}`}
                          />
                          {/* Bottom segment: Cash */}
                          <div
                            className="w-full bg-stone-800 dark:bg-stone-200 transition-all"
                            style={{ height: `${cashHeightPercent}%` }}
                            title={`Tunai: ${formatRupiah(item.cash_amount)}`}
                          />
                        </>
                      )}
                    </div>
                  </div>

                  {/* Day Label below bar */}
                  <span
                    className={`mt-3 text-[11px] font-medium transition-colors ${
                      isHovered ? 'text-amber-800 dark:text-[#E2DFD2] font-bold' : 'text-stone-500 dark:text-stone-400'
                    }`}
                  >
                    {item.day_name.split(' ')[0]}
                  </span>
                </div>
              )
            })}
          </div>
        ) : (
          /* Visual Line Chart (Garis: Hijau Naik, Merah Turun) */
          <div className="w-full h-full">
            <svg
              viewBox={`0 0 ${svgWidth} ${svgHeight}`}
              preserveAspectRatio="none"
              className="w-full h-full overflow-visible"
            >
              <defs>
                <linearGradient id="lineGreenGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#10b981" stopOpacity="0.25" />
                  <stop offset="100%" stopColor="#10b981" stopOpacity="0.02" />
                </linearGradient>
                <linearGradient id="lineRedGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#f43f5e" stopOpacity="0.25" />
                  <stop offset="100%" stopColor="#f43f5e" stopOpacity="0.02" />
                </linearGradient>
              </defs>

              {/* Horizontal Reference Lines */}
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
                    fill={isUp ? 'url(#lineGreenGrad)' : 'url(#lineRedGrad)'}
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
                    strokeWidth="3.5"
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
                        r="11"
                        fill={dotColor}
                        fillOpacity="0.25"
                      />
                    )}
                    {/* Outer circle */}
                    <circle
                      cx={p.x}
                      cy={p.y}
                      r={isHovered ? 6 : 4.5}
                      fill={dotColor}
                      stroke="currentColor"
                      strokeWidth="2"
                      className="text-white dark:text-stone-900 transition-all duration-150"
                    />
                    {/* Inner center dot */}
                    <circle
                      cx={p.x}
                      cy={p.y}
                      r={isHovered ? 2.5 : 1.5}
                      fill="#ffffff"
                    />
                  </g>
                )
              })}

              {/* Day Labels at bottom */}
              {points.map((p) => {
                const isHovered = hoveredIndex === p.idx
                return (
                  <text
                    key={`label-${p.item.date}`}
                    x={p.x}
                    y={svgHeight - 8}
                    textAnchor="middle"
                    className={`text-[11px] font-mono select-none transition-colors ${
                      isHovered
                        ? 'fill-stone-900 dark:fill-stone-100 font-bold'
                        : 'fill-stone-500 dark:fill-stone-400 font-normal'
                    }`}
                  >
                    {p.item.day_name.split(' ')[0]}
                  </text>
                )
              })}

              {/* Invisible interactive column hitboxes for seamless touch/hover */}
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
        )}

      </div>

      <div className="mt-3 flex items-center justify-between text-[11px] text-stone-500 dark:text-stone-400 px-2 font-mono">
        <span>Skala Max: {formatRupiah(maxRevenue)}</span>
        <span>Rata-rata Harian: {data.length > 0 ? formatRupiah(Math.round(data.reduce((acc, d) => acc + d.revenue, 0) / data.length)) : 'Rp 0'}</span>
      </div>

    </div>
  )
}

