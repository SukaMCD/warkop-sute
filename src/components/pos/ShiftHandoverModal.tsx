import { useMemo } from 'react'
import {
  ArrowRightLeft,
  PowerOff,
  ArrowRight,
  LogOut,
  Wallet,
  Clock,
  UserCheck
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-stone-900 border border-stone-800 rounded-xl w-full max-w-md p-6 shadow-xl space-y-5">
        
        {/* Header: Crisp, Industrial POS Register Style */}
        <div className="border-l-2 border-[#E2DFD2] pl-3.5 py-0.5">
          <h2 className="text-base font-bold text-stone-100 tracking-tight">
            Konfirmasi Pergantian Shift
          </h2>
          <p className="text-xs text-stone-400 mt-1">
            Shift kasir sebelumnya belum ditutup. Pilih tindakan serah terima kasir.
          </p>
        </div>

        {/* Data Slip / Shift Manifest Summary */}
        <div className="rounded-lg border border-stone-800 bg-stone-950/70 divide-y divide-stone-800/80 text-xs">
          
          <div className="p-3 flex items-center justify-between">
            <span className="text-stone-400 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-stone-500" />
              Petugas Aktif Saat Ini
            </span>
            <span className="font-semibold text-stone-200">
              {activeShift.cashier_name || 'Kasir Sebelumnya'}
            </span>
          </div>

          <div className="p-3 flex items-center justify-between">
            <span className="text-stone-400">
              Mulai Shift
            </span>
            <span className="font-mono text-stone-300">
              {scheduleInfo.start} WIB <span className="text-stone-500 text-[11px]">({scheduleInfo.duration})</span>
            </span>
          </div>

          <div className="p-3 flex items-center justify-between bg-stone-900/40">
            <span className="text-stone-400 flex items-center gap-1.5">
              <Wallet className="w-3.5 h-3.5 text-stone-500" />
              Perkiraan Kas di Laci
            </span>
            <span className="font-mono font-bold text-stone-100 tabular-nums">
              {formatRupiah(expectedCashInDrawer)}
            </span>
          </div>

          <div className="p-3 flex items-center justify-between">
            <span className="text-stone-400 flex items-center gap-1.5">
              <UserCheck className="w-3.5 h-3.5 text-stone-500" />
              Petugas Masuk (Login)
            </span>
            <span className="font-semibold text-[#E2DFD2]">
              {incomingUser.name}
            </span>
          </div>

        </div>

        {/* Action Buttons: Direct & Tactile for POS Tablet */}
        <div className="space-y-3 pt-1">
          
          {/* Primary Action: Close Old & Start New */}
          <div>
            <button
              type="button"
              onClick={onCloseShiftAndStartNew}
              className="w-full h-12 rounded-lg bg-[#E2DFD2] hover:bg-[#eae8dd] active:scale-[0.98] text-stone-950 font-bold text-xs tracking-wide transition-all flex items-center justify-center gap-2 cursor-pointer shadow-sm"
            >
              <PowerOff className="w-4 h-4 text-stone-950 stroke-[2.2]" />
              <span>Tutup Shift Lama & Buka Shift Baru</span>
              <ArrowRight className="w-4 h-4 ml-0.5" />
            </button>
            <p className="text-[11px] text-stone-400 text-center mt-1.5">
              Hitung uang fisik di laci kasir lama, cetak rekap, lalu buka shift baru.
            </p>
          </div>

          {/* Secondary Action: Continue Shift */}
          <div>
            <button
              type="button"
              onClick={onContinueShift}
              className="w-full h-11 rounded-lg bg-stone-800 hover:bg-stone-750 active:scale-[0.98] border border-stone-700/80 text-stone-200 font-semibold text-xs tracking-wide transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <ArrowRightLeft className="w-3.5 h-3.5 text-stone-400" />
              <span>Lanjutkan Shift Ini (Kasir Sementara)</span>
            </button>
            <p className="text-[11px] text-stone-500 text-center mt-1.5">
              Pilih jika hanya menggantikan meja kasir sebentar.
            </p>
          </div>

        </div>

        {/* Footer: Cancel / Back to PIN */}
        <div className="pt-2 border-t border-stone-800 flex items-center justify-between text-xs">
          <button
            type="button"
            onClick={onCancel}
            className="text-stone-400 hover:text-stone-200 transition-colors flex items-center gap-1.5 py-1 cursor-pointer font-medium"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Batal & Kunci Layar</span>
          </button>
          <span className="text-[11px] text-stone-500 font-mono">
            Warkop Sudut Temu
          </span>
        </div>

      </div>
    </div>
  )
}
