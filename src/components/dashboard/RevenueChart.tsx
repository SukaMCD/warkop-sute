import { useState, useEffect } from 'react'
import type { DailySalesMetric } from '../../types'
import { formatRupiah } from '../../utils/formatters'
import { BarChart3 } from 'lucide-react'

interface RevenueChartProps {
  data: DailySalesMetric[]
}

export const RevenueChart = ({ data }: RevenueChartProps) => {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(data.length > 0 ? data.length - 1 : null)

  useEffect(() => {
    if (data.length > 0) {
      setHoveredIndex(data.length - 1)
    }
  }, [data])

  const maxRevenue = data.length > 0 ? Math.max(...data.map(d => d.revenue), 0) : 0
  const hoveredData = hoveredIndex !== null && data[hoveredIndex] ? data[hoveredIndex] : (data.length > 0 ? data[data.length - 1] : null)

  return (
    <div className="bg-white dark:bg-stone-900/80 border border-stone-200 dark:border-stone-800 rounded-2xl p-5 shadow-xs">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6 pb-3 border-b border-stone-200 dark:border-stone-800/80">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="w-8 h-8 rounded-xl bg-stone-50 dark:bg-stone-950 border border-stone-200 dark:border-stone-800 flex items-center justify-center text-amber-700 dark:text-[#E2DFD2] shadow-xs">
              <BarChart3 className="w-4 h-4 stroke-2" />
            </div>
            <h2 className="text-sm font-bold tracking-tight text-stone-900 dark:text-stone-100">
              Tren Penjualan Mingguan
            </h2>
          </div>
          <p className="text-xs text-stone-500 dark:text-stone-400">
            Perbandingan omzet harian antara pembayaran Tunai dan QRIS
          </p>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-4 text-xs font-medium">
          <div className="flex items-center gap-1.5 text-stone-600 dark:text-stone-300">
            <span className="w-2.5 h-2.5 rounded-xs bg-stone-800 dark:bg-stone-200" />
            <span>Tunai</span>
          </div>
          <div className="flex items-center gap-1.5 text-stone-600 dark:text-stone-300">
            <span className="w-2.5 h-2.5 rounded-xs bg-stone-400 dark:bg-stone-500" />
            <span>QRIS</span>
          </div>
        </div>
      </div>

      {/* Detail info box of hovered day */}
      {hoveredData && (
        <div className="mb-6 p-3.5 rounded-xl bg-stone-50 dark:bg-stone-950 border border-stone-200 dark:border-stone-800 flex flex-wrap items-center justify-between gap-3 text-xs shadow-xs">
          <div>
            <span className="text-stone-500 dark:text-stone-400">Hari & Tanggal: </span>
            <span className="font-semibold text-stone-900 dark:text-stone-100">{hoveredData.day_name}, {hoveredData.date}</span>
          </div>
          <div className="flex items-center gap-4">
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
          </div>
        </div>
      )}

      {/* Visual Chart Bars */}
      <div className="h-48 flex items-end justify-between gap-2 pt-6 pb-2 px-2 border-b border-stone-200 dark:border-stone-800">
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

      <div className="mt-3 flex items-center justify-between text-[11px] text-stone-500 dark:text-stone-400 px-2 font-mono">
        <span>Skala Max: {formatRupiah(maxRevenue)}</span>
        <span>Rata-rata Harian: {data.length > 0 ? formatRupiah(Math.round(data.reduce((acc, d) => acc + d.revenue, 0) / data.length)) : 'Rp 0'}</span>
      </div>

    </div>
  )
}
