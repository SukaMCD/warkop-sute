import { useState, useEffect } from 'react'
import { Clock, UserCheck, Coins, QrCode, PowerOff } from 'lucide-react'
import type { Shift } from '../../types'
import { formatRupiah } from '../../utils/formatters'
import { calculateShiftDuration, formatShiftSchedule } from '../../utils/shiftHelpers'

interface ShiftOverviewProps {
  shift: Shift
  onEndShift?: () => void
}

export const ShiftOverview = ({ shift, onEndShift }: ShiftOverviewProps) => {
  const expectedCashInDrawer = shift.initial_cash + shift.total_cash_sales

  // Dynamic ticking for duration
  const [, setTick] = useState(0)
  useEffect(() => {
    const timer = setInterval(() => setTick(t => t + 1), 30000)
    return () => clearInterval(timer)
  }, [])

  const scheduleInfo = formatShiftSchedule(shift.start_time, shift.end_time || null)
  const duration = calculateShiftDuration(shift.start_time, shift.end_time || null)

  return (
    <div className="bg-stone-900/80 border border-stone-800 rounded-2xl p-5 shadow-sm">
      
      {/* Header */}
      <div className="flex items-center justify-between mb-4 pb-3 border-b border-stone-800/80">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-stone-950 border border-stone-800 flex items-center justify-center text-[#E2DFD2] shadow-xs">
            <Clock className="w-4 h-4 stroke-[2]" />
          </div>
          <div>
            <h2 className="text-sm font-bold tracking-tight text-stone-100">
              Shift Kasir Aktif
            </h2>
            <p className="text-[11px] text-stone-400">
              Monitoring kas & operasional shift berjalan
            </p>
          </div>
        </div>
        
        {/* Status Badge */}
        <span className={`px-2.5 py-0.5 rounded-md text-[10px] font-mono uppercase tracking-wider border font-bold whitespace-nowrap ${
          shift.status === 'open'
            ? 'border-emerald-900/60 bg-emerald-950/40 text-emerald-400'
            : 'border-stone-800 bg-stone-950 text-stone-400'
        }`}>
          {shift.status === 'open' ? 'Sedang Berjalan' : 'Ditutup'}
        </span>
      </div>

      {/* Main Shift Details */}
      <div className="space-y-3">
        
        {/* Cashier Chip */}
        <div className="flex items-center justify-between text-xs p-3 rounded-xl bg-stone-950 border border-stone-800 shadow-xs">
          <div className="flex items-center gap-2 text-stone-300">
            <UserCheck className="w-4 h-4 text-[#E2DFD2]" />
            <span className="text-stone-400">Petugas Kasir:</span>
          </div>
          <span className="font-bold text-stone-100">{shift.cashier_name}</span>
        </div>

        {/* Start Time & Duration Grid */}
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="p-3 rounded-xl bg-stone-950 border border-stone-800 flex flex-col justify-between shadow-xs">
            <span className="text-stone-400 text-[11px] block font-mono mb-1">Mulai Shift</span>
            <div>
              <span className="font-mono text-stone-100 font-bold text-sm block whitespace-nowrap">
                {scheduleInfo.start} WIB
              </span>
              <span className="text-[10px] text-stone-400 font-mono block mt-0.5">
                Durasi: <span className="text-[#E2DFD2] font-semibold">{duration}</span>
              </span>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-stone-950 border border-stone-800 flex flex-col justify-between shadow-xs">
            <span className="text-stone-400 text-[11px] block font-mono mb-1">Modal Awal Laci</span>
            <div>
              <span className="font-mono tabular-nums text-[#E2DFD2] font-bold text-sm block whitespace-nowrap">
                {formatRupiah(shift.initial_cash)}
              </span>
              <span className="text-[10px] text-stone-500 font-mono block mt-0.5 whitespace-nowrap">
                Kas awal laci
              </span>
            </div>
          </div>
        </div>

        {/* Sales Breakdown & Expected Drawer Cash */}
        <div className="p-3.5 rounded-xl border border-stone-800 bg-stone-950/80 space-y-2.5 text-xs shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-stone-400 flex items-center gap-1.5">
              <Coins className="w-3.5 h-3.5 text-stone-400" />
              <span>Penjualan Tunai:</span>
            </span>
            <span className="font-mono tabular-nums font-bold text-stone-200">
              {formatRupiah(shift.total_cash_sales)}
            </span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-stone-400 flex items-center gap-1.5">
              <QrCode className="w-3.5 h-3.5 text-stone-400" />
              <span>Penjualan QRIS:</span>
            </span>
            <span className="font-mono tabular-nums font-bold text-[#E2DFD2]">
              {formatRupiah(shift.total_qris_sales)}
            </span>
          </div>

          <div className="pt-2.5 border-t border-stone-800 flex items-center justify-between">
            <span className="text-stone-200 font-medium">Wajib Ada di Laci:</span>
            <span className="font-mono tabular-nums font-bold text-sm text-emerald-400">
              {formatRupiah(expectedCashInDrawer)}
            </span>
          </div>
        </div>

        {/* Action Button: Akhiri Shift */}
        {shift.status === 'open' && onEndShift && (
          <button
            type="button"
            onClick={onEndShift}
            className="w-full py-2.5 px-3 rounded-xl bg-rose-950/30 border border-rose-900/60 hover:bg-rose-900/50 text-rose-300 font-bold text-xs transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-xs active:scale-95"
          >
            <PowerOff className="w-3.5 h-3.5 stroke-[2.2]" />
            <span>Akhiri Shift Kasir</span>
          </button>
        )}

      </div>
    </div>
  )
}
