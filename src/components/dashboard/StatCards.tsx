import { Wallet, QrCode, ShoppingBag, Coins } from 'lucide-react'
import { formatRupiah, formatNumber } from '../../utils/formatters'

interface StatCardsProps {
  revenueToday: number
  transactionsToday: number
  cashAmount: number
  qrisAmount: number
  estimatedProfit: number
  initialCash: number
}

export const StatCards = ({
  revenueToday,
  transactionsToday,
  cashAmount,
  qrisAmount,
  initialCash
}: StatCardsProps) => {
  const averageTicket = transactionsToday > 0 ? Math.round(revenueToday / transactionsToday) : 0
  const cashPercent = revenueToday > 0 ? Math.round((cashAmount / revenueToday) * 100) : 0
  const qrisPercent = revenueToday > 0 ? 100 - cashPercent : 0
  const totalDrawerCash = initialCash + cashAmount

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      
      {/* 1. Omzet Hari Ini */}
      <div className="bg-white dark:bg-stone-900/80 border border-stone-200 dark:border-stone-800 hover:border-stone-300 dark:hover:border-stone-700/80 rounded-2xl p-4 transition-all shadow-xs">
        <div className="flex items-center justify-between text-stone-500 dark:text-stone-400 mb-2">
          <span className="text-xs font-medium tracking-wide uppercase">Omzet Hari Ini</span>
          <div className="w-8 h-8 rounded-xl bg-stone-100 dark:bg-stone-950 border border-stone-200 dark:border-stone-800 flex items-center justify-center text-amber-800 dark:text-[#E2DFD2] shadow-xs">
            <Coins className="w-4 h-4 stroke-2" />
          </div>
        </div>
        <div className="flex items-baseline gap-2">
          <span className="text-2xl font-bold font-mono tabular-nums text-stone-900 dark:text-stone-100 tracking-tight">
            {formatRupiah(revenueToday)}
          </span>
        </div>
        <div className="mt-2.5 pt-2.5 border-t border-stone-200 dark:border-stone-800/60 flex items-center justify-between text-xs">
          <span className="text-stone-500 dark:text-stone-400">Total omzet tercatat</span>
          <span className="font-mono tabular-nums text-stone-700 dark:text-stone-300 font-medium text-[11px]">
            {transactionsToday} transaksi selesai
          </span>
        </div>
      </div>

      {/* 2. Jumlah Transaksi */}
      <div className="bg-white dark:bg-stone-900/80 border border-stone-200 dark:border-stone-800 hover:border-stone-300 dark:hover:border-stone-700/80 rounded-2xl p-4 transition-all shadow-xs">
        <div className="flex items-center justify-between text-stone-500 dark:text-stone-400 mb-2">
          <span className="text-xs font-medium tracking-wide uppercase">Total Transaksi</span>
          <div className="w-8 h-8 rounded-xl bg-stone-100 dark:bg-stone-950 border border-stone-200 dark:border-stone-800 flex items-center justify-center text-stone-700 dark:text-stone-300 shadow-xs">
            <ShoppingBag className="w-4 h-4 stroke-2" />
          </div>
        </div>
        <div className="flex items-baseline gap-2">
          <span className="text-2xl font-bold font-mono tabular-nums text-stone-900 dark:text-stone-100 tracking-tight">
            {formatNumber(transactionsToday)}
          </span>
          <span className="text-xs text-stone-400 dark:text-stone-500 font-medium">pesanan</span>
        </div>
        <div className="mt-2.5 pt-2.5 border-t border-stone-200 dark:border-stone-800/60 flex items-center justify-between text-xs">
          <span className="text-stone-500 dark:text-stone-400">Rata-rata Transaksi</span>
          <span className="font-mono tabular-nums text-stone-800 dark:text-stone-200 font-medium">
            {formatRupiah(averageTicket)}
          </span>
        </div>
      </div>

      {/* 3. Distribusi Cash vs QRIS */}
      <div className="bg-white dark:bg-stone-900/80 border border-stone-200 dark:border-stone-800 hover:border-stone-300 dark:hover:border-stone-700/80 rounded-2xl p-4 transition-all shadow-xs">
        <div className="flex items-center justify-between text-stone-500 dark:text-stone-400 mb-2">
          <span className="text-xs font-medium tracking-wide uppercase">Metode Bayar</span>
          <div className="w-8 h-8 rounded-xl bg-stone-100 dark:bg-stone-950 border border-stone-200 dark:border-stone-800 flex items-center justify-center text-stone-700 dark:text-stone-300 shadow-xs">
            <QrCode className="w-4 h-4 stroke-2" />
          </div>
        </div>
        
        {/* Breakdown bar: Minimalist Monochrome (Tunai = Charcoal, QRIS = Sand/Taupe) */}
        <div className="flex items-center gap-1.5 mb-1.5 h-2 rounded-xs overflow-hidden bg-stone-100 dark:bg-stone-800/60">
          {revenueToday > 0 ? (
            <>
              {cashPercent > 0 && (
                <div 
                  className="h-full bg-stone-800 dark:bg-stone-200 transition-all duration-300" 
                  style={{ width: `${cashPercent}%` }} 
                  title={`Tunai: ${cashPercent}%`}
                />
              )}
              {qrisPercent > 0 && (
                <div 
                  className="h-full bg-stone-400 dark:bg-stone-500 transition-all duration-300" 
                  style={{ width: `${qrisPercent}%` }} 
                  title={`QRIS: ${qrisPercent}%`}
                />
              )}
            </>
          ) : (
            <div className="h-full w-full bg-stone-200/70 dark:bg-stone-800/60" title="Belum ada transaksi hari ini" />
          )}
        </div>

        <div className="mt-2.5 pt-2 border-t border-stone-200 dark:border-stone-800/60 flex items-center justify-between text-xs">
          <div className="flex items-center gap-1.5 text-stone-700 dark:text-stone-300">
            <span className="w-2.5 h-2 rounded-xs bg-stone-800 dark:bg-stone-200 shrink-0" />
            <span>Tunai ({cashPercent}%)</span>
          </div>
          <span className="font-mono tabular-nums text-stone-800 dark:text-stone-200 font-medium">
            {formatRupiah(cashAmount)}
          </span>
        </div>
        <div className="flex items-center justify-between text-xs mt-1">
          <div className="flex items-center gap-1.5 text-stone-700 dark:text-stone-300">
            <span className="w-2.5 h-2 rounded-xs bg-stone-400 dark:bg-stone-500 shrink-0" />
            <span>QRIS ({qrisPercent}%)</span>
          </div>
          <span className="font-mono tabular-nums text-stone-800 dark:text-stone-200 font-medium">
            {formatRupiah(qrisAmount)}
          </span>
        </div>
      </div>

      {/* 4. Kas di Laci Kasir */}
      <div className="bg-white dark:bg-stone-900/80 border border-stone-200 dark:border-stone-800 hover:border-stone-300 dark:hover:border-stone-700/80 rounded-2xl p-4 transition-all shadow-xs">
        <div className="flex items-center justify-between text-stone-500 dark:text-stone-400 mb-2">
          <span className="text-xs font-medium tracking-wide uppercase">Uang Kas di Laci</span>
          <div className="w-8 h-8 rounded-xl bg-stone-100 dark:bg-stone-950 border border-stone-200 dark:border-stone-800 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shadow-xs">
            <Wallet className="w-4 h-4 stroke-2" />
          </div>
        </div>
        <div className="flex items-baseline gap-2">
          <span className="text-2xl font-bold font-mono tabular-nums text-stone-900 dark:text-stone-100 tracking-tight">
            {formatRupiah(totalDrawerCash)}
          </span>
        </div>
        <div className="mt-2.5 pt-2.5 border-t border-stone-200 dark:border-stone-800/60 flex items-center justify-between text-xs">
          <span className="text-stone-500 dark:text-stone-400">Modal Awal Laci</span>
          <span className="font-mono tabular-nums text-amber-900 dark:text-[#E2DFD2] font-semibold">
            {formatRupiah(initialCash)}
          </span>
        </div>
      </div>

    </div>
  )
}
