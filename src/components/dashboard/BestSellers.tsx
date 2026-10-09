import { Trophy } from 'lucide-react'
import type { Product } from '../../types'
import { formatRupiah, formatNumber } from '../../utils/formatters'

interface BestSellersProps {
  products: Product[]
}

export const BestSellers = ({ products }: BestSellersProps) => {
  // Sort by sales count descending, take top 5
  const topProducts = [...products]
    .filter(p => (p.sales_count || 0) > 0)
    .sort((a, b) => (b.sales_count || 0) - (a.sales_count || 0))
    .slice(0, 5)

  const maxSales = Math.max(...topProducts.map(p => p.sales_count || 1))

  return (
    <div className="bg-white dark:bg-stone-900/80 border border-stone-200 dark:border-stone-800 rounded-2xl p-5 shadow-xs">
      
      {/* Header */}
      <div className="flex items-center justify-between mb-5 pb-3 border-b border-stone-200 dark:border-stone-800/80">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-stone-50 dark:bg-stone-950 border border-stone-200 dark:border-stone-800 flex items-center justify-center text-amber-700 dark:text-[#E2DFD2] shadow-xs">
            <Trophy className="w-4 h-4 stroke-2" />
          </div>
          <div>
            <h2 className="text-sm font-bold tracking-tight text-stone-900 dark:text-stone-100">
              Menu Paling Laris Hari Ini
            </h2>
            <p className="text-[11px] text-stone-500 dark:text-stone-400">
              Produk terfavorit berdasarkan jumlah pesanan
            </p>
          </div>
        </div>
      </div>

      {/* List */}
      <div className="space-y-4">
        {topProducts.map((product, index) => {
          const sales = product.sales_count || 0
          const revenue = sales * product.price
          const barPercent = Math.round((sales / maxSales) * 100)

          return (
            <div key={product.id} className="group">
              <div className="flex items-center justify-between text-xs mb-1.5">
                <div className="flex items-center gap-2.5">
                  <span className="w-5 text-center font-mono text-stone-400 dark:text-stone-500 font-bold">
                    0{index + 1}
                  </span>
                  <div>
                    <span className="font-semibold text-stone-900 dark:text-stone-100 group-hover:text-amber-800 dark:group-hover:text-[#E2DFD2] transition-colors">
                      {product.name}
                    </span>
                    <span className="ml-2 text-[10px] font-mono uppercase px-1.5 py-0.5 rounded border border-stone-200 dark:border-stone-800 bg-stone-100 dark:bg-stone-950 text-stone-600 dark:text-stone-400 font-semibold">
                      {product.category_name}
                    </span>
                  </div>
                </div>

                <div className="text-right">
                  <div className="font-mono tabular-nums font-semibold text-stone-800 dark:text-stone-200">
                    {formatNumber(sales)} <span className="text-stone-500 dark:text-stone-400 font-normal">terjual</span>
                  </div>
                </div>
              </div>

              {/* Progress bar & Financials */}
              <div className="flex items-center gap-3">
                <div className="flex-1 h-1.5 bg-stone-100 dark:bg-stone-950 rounded-full overflow-hidden border border-stone-200 dark:border-stone-800/60">
                  <div
                    className="h-full bg-amber-700 dark:bg-[#E2DFD2] rounded-full transition-all duration-300 group-hover:brightness-110"
                    style={{ width: `${barPercent}%` }}
                  />
                </div>
                <div className="text-[11px] font-mono tabular-nums text-amber-800 dark:text-[#E2DFD2] font-semibold whitespace-nowrap">
                  {formatRupiah(revenue)}
                </div>
              </div>
            </div>
          )
        })}
      </div>

      <div className="mt-5 pt-3.5 border-t border-stone-200 dark:border-stone-800/70 text-right">
        <span className="text-xs text-stone-500 dark:text-stone-400">
          Kalkulasi laba kotor dihitung otomatis dari HPP menu.
        </span>
      </div>

    </div>
  )
}
