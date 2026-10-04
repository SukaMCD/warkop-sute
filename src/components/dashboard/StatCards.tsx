import { Wallet, QrCode, ShoppingBag, Coins, ArrowUpRight } from 'lucide-react'
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
  const qrisPercent = 100 - cashPercent
  const totalDrawerCash = initialCash + cashAmount

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      
      {/* 1. Omzet Hari Ini */}
      <div className="bg-stone-900/80 border border-stone-800 hover:border-stone-700/80 rounded-2xl p-4 transition-all shadow-sm">
        <div className="flex items-center justify-between text-stone-400 mb-2">
          <span className="text-xs font-medium tracking-wide uppercase">Omzet Hari Ini</span>
          <div className="w-8 h-8 rounded-xl bg-stone-950 border border-stone-800 flex items-center justify-center text-[#E2DFD2] shadow-xs">
            <Coins className="w-4 h-4 stroke-2" />
          </div>
        </div>
        <div className="flex items-baseline gap-2">
          <span className="text-2xl font-bold font-mono tabular-nums text-stone-100 tracking-tight">
            {formatRupiah(revenueToday)}
          </span>
        </div>
        <div className="mt-2.5 pt-2.5 border-t border-stone-800/60 flex items-center justify-between text-xs">
          <span className="text-stone-400">Total omzet hari ini</span>
          <span className="flex items-center gap-0.5 text-emerald-400 font-mono text-[11px] font-medium">
            <ArrowUpRight className="w-3 h-3" />
            +11.2%
          </span>
        </div>
      </div>

      {/* 2. Jumlah Transaksi */}
      <div className="bg-stone-900/80 border border-stone-800 hover:border-stone-700/80 rounded-2xl p-4 transition-all shadow-sm">
        <div className="flex items-center justify-between text-stone-400 mb-2">
          <span className="text-xs font-medium tracking-wide uppercase">Total Transaksi</span>
          <div className="w-8 h-8 rounded-xl bg-stone-950 border border-stone-800 flex items-center justify-center text-stone-300 shadow-xs">
            <ShoppingBag className="w-4 h-4 stroke-2" />
          </div>
        </div>
        <div className="flex items-baseline gap-2">
          <span className="text-2xl font-bold font-mono tabular-nums text-stone-100 tracking-tight">
            {formatNumber(transactionsToday)}
          </span>
          <span className="text-xs text-stone-400 font-medium">pesanan</span>
        </div>
        <div className="mt-2.5 pt-2.5 border-t border-stone-800/60 flex items-center justify-between text-xs">
          <span className="text-stone-400">Rata-rata Transaksi</span>
          <span className="font-mono tabular-nums text-stone-200 font-medium">
            {formatRupiah(averageTicket)}
          </span>
        </div>
      </div>

      {/* 3. Distribusi Cash vs QRIS */}
      <div className="bg-stone-900/80 border border-stone-800 hover:border-stone-700/80 rounded-2xl p-4 transition-all shadow-sm">
        <div className="flex items-center justify-between text-stone-400 mb-2">
          <span className="text-xs font-medium tracking-wide uppercase">Metode Bayar</span>
          <div className="w-8 h-8 rounded-xl bg-stone-950 border border-stone-800 flex items-center justify-center text-[#E2DFD2] shadow-xs">
            <QrCode className="w-4 h-4 stroke-2" />
          </div>
        </div>
        
        {/* Breakdown bar using #E2DFD2 and cyan */}
        <div className="flex items-center gap-1.5 mb-1.5">
          <div className="h-2 rounded-full bg-[#E2DFD2] transition-all" style={{ width: `${cashPercent}%` }} />
          <div className="h-2 rounded-full bg-cyan-600 transition-all" style={{ width: `${qrisPercent}%` }} />
        </div>

        <div className="mt-2.5 pt-2 border-t border-stone-800/60 flex items-center justify-between text-xs">
          <div className="flex items-center gap-1.5 text-stone-300">
            <span className="w-2 h-2 rounded-full bg-[#E2DFD2]" />
            <span>Tunai ({cashPercent}%)</span>
          </div>
          <span className="font-mono tabular-nums text-stone-200 font-medium">
            {formatRupiah(cashAmount)}
          </span>
        </div>
        <div className="flex items-center justify-between text-xs mt-1">
          <div className="flex items-center gap-1.5 text-stone-300">
            <span className="w-2 h-2 rounded-full bg-cyan-600" />
            <span>QRIS ({qrisPercent}%)</span>
          </div>
          <span className="font-mono tabular-nums text-stone-200 font-medium">
            {formatRupiah(qrisAmount)}
          </span>
        </div>
      </div>

      {/* 4. Kas di Laci Kasir */}
      <div className="bg-stone-900/80 border border-stone-800 hover:border-stone-700/80 rounded-2xl p-4 transition-all shadow-sm">
        <div className="flex items-center justify-between text-stone-400 mb-2">
          <span className="text-xs font-medium tracking-wide uppercase">Uang Kas di Laci</span>
          <div className="w-8 h-8 rounded-xl bg-stone-950 border border-stone-800 flex items-center justify-center text-emerald-400 shadow-xs">
            <Wallet className="w-4 h-4 stroke-2" />
          </div>
        </div>
        <div className="flex items-baseline gap-2">
          <span className="text-2xl font-bold font-mono tabular-nums text-stone-100 tracking-tight">
            {formatRupiah(totalDrawerCash)}
          </span>
        </div>
        <div className="mt-2.5 pt-2.5 border-t border-stone-800/60 flex items-center justify-between text-xs">
          <span className="text-stone-400">Modal Awal Laci</span>
          <span className="font-mono tabular-nums text-[#E2DFD2] font-semibold">
            {formatRupiah(initialCash)}
          </span>
        </div>
      </div>

    </div>
  )
}
