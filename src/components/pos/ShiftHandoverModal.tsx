import { useMemo } from 'react'
import {
  ArrowRightLeft,
  PowerOff,
  ArrowRight,
  LogOut,
  Wallet,
  Clock,
  UserCheck,
  X
} from 'lucide-react'
import type { Shift, User } from '../../types'
import { formatRupiah } from '../../utils/formatters'
import { formatShiftSchedule } from '../../utils/shiftHelpers'

interface ShiftHandoverModalProps {
  isOpen: boolean
  activeShift: Shift
  incomingUser: User
  onCloseShiftAndStartNew: () => void
  onContinueShift: () => void
  onCancel: () => void
}

export const ShiftHandoverModal = ({
  isOpen,
  activeShift,
  incomingUser,
  onCloseShiftAndStartNew,
  onContinueShift,
  onCancel
}: ShiftHandoverModalProps) => {
  const scheduleInfo = useMemo(() => {
    return formatShiftSchedule(activeShift.start_time, null)
  }, [activeShift.start_time])

  const expectedCashInDrawer = activeShift.initial_cash + (activeShift.total_cash_sales || 0)

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 bg-stone-950 flex flex-col text-stone-100 animate-in fade-in duration-150">
      
      {/* Header Bar */}
      <header className="px-6 py-4 border-b border-stone-800 bg-stone-900/60 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-stone-900 border border-stone-800 flex items-center justify-center text-[#E2DFD2] shadow-xs shrink-0">
            <ArrowRightLeft className="w-5 h-5 stroke-2" />
          </div>
          <div>
            <h2 className="text-base font-bold text-stone-100 tracking-tight">
              Konfirmasi Pergantian Shift
            </h2>
            <p className="text-xs text-stone-400 mt-0.5">
              Shift kasir sebelumnya belum ditutup. Pilih tindakan serah terima kasir.
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={onCancel}
          className="p-2 rounded-xl text-stone-400 hover:text-stone-100 hover:bg-stone-800 transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>
      </header>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-8 flex items-center justify-center">
        <div className="w-full max-w-lg bg-stone-900 border border-stone-800 rounded-2xl p-6 sm:p-8 shadow-xl space-y-6">
          
          {/* Data Slip / Shift Manifest Summary */}
          <div className="rounded-xl border border-stone-800 bg-stone-950 divide-y divide-stone-850 text-xs">
            
            <div className="p-3.5 flex items-center justify-between">
              <span className="text-stone-400 flex items-center gap-2">
                <Clock className="w-4 h-4 text-stone-500" />
                Petugas Aktif Saat Ini
              </span>
              <span className="font-semibold text-stone-200">
                {activeShift.cashier_name || 'Kasir Sebelumnya'}
              </span>
            </div>

            <div className="p-3.5 flex items-center justify-between">
              <span className="text-stone-400">
                Mulai Shift
              </span>
              <span className="font-mono text-stone-300">
                {scheduleInfo.start} WIB <span className="text-stone-500 text-[11px]">({scheduleInfo.duration})</span>
              </span>
            </div>

            <div className="p-3.5 flex items-center justify-between bg-stone-900/40">
              <span className="text-stone-400 flex items-center gap-2">
                <Wallet className="w-4 h-4 text-stone-500" />
                Perkiraan Kas di Laci
              </span>
              <span className="font-mono font-bold text-stone-100 tabular-nums text-sm">
                {formatRupiah(expectedCashInDrawer)}
              </span>
            </div>

            <div className="p-3.5 flex items-center justify-between">
              <span className="text-stone-400 flex items-center gap-2">
                <UserCheck className="w-4 h-4 text-stone-500" />
                Petugas Masuk (Login)
              </span>
              <span className="font-semibold text-[#E2DFD2]">
                {incomingUser.name}
              </span>
            </div>

          </div>

          {/* Action Buttons: Direct & Tactile for POS Tablet */}
          <div className="space-y-3.5 pt-1">
            
            {/* Primary Action: Close Old & Start New */}
            <div>
              <button
                type="button"
                onClick={onCloseShiftAndStartNew}
                className="w-full h-13 rounded-xl bg-[#E2DFD2] hover:bg-[#eae8dd] active:scale-[0.98] text-stone-950 font-bold text-xs tracking-wide transition-all flex items-center justify-center gap-2.5 cursor-pointer shadow-sm"
              >
                <PowerOff className="w-4 h-4 text-stone-950 stroke-[2.2]" />
                <span>Tutup Shift Lama & Buka Shift Baru</span>
                <ArrowRight className="w-4 h-4 ml-0.5" />
              </button>
              <p className="text-xs text-stone-400 text-center mt-2">
                Hitung uang fisik di laci kasir lama, cetak rekap, lalu buka shift baru.
              </p>
            </div>

            {/* Secondary Action: Continue Shift */}
            <div>
              <button
                type="button"
                onClick={onContinueShift}
                className="w-full h-12 rounded-xl bg-stone-850 hover:bg-stone-800 active:scale-[0.98] border border-stone-700/80 text-stone-200 font-semibold text-xs tracking-wide transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <ArrowRightLeft className="w-4 h-4 text-stone-400" />
                <span>Lanjutkan Shift Ini (Kasir Sementara)</span>
              </button>
              <p className="text-xs text-stone-500 text-center mt-2">
                Pilih jika hanya menggantikan meja kasir sebentar.
              </p>
            </div>

          </div>

          {/* Footer: Cancel / Back to PIN */}
          <div className="pt-3 border-t border-stone-800 flex items-center justify-between text-xs">
            <button
              type="button"
              onClick={onCancel}
              className="text-stone-400 hover:text-stone-200 transition-colors flex items-center gap-2 py-1 cursor-pointer font-medium"
            >
              <LogOut className="w-4 h-4" />
              <span>Batal & Kunci Layar</span>
            </button>
            <span className="text-[11px] text-stone-500 font-mono">
              Warkop Sudut Temu
            </span>
          </div>

        </div>
      </div>
    </div>
  )
}
