import { useState, useMemo } from 'react'
import {
  X,
  PowerOff,
  Printer,
  AlertCircle,
  CheckCircle2,
  Clock,
  Loader2,
  ArrowRight
} from 'lucide-react'
import type { Shift } from '../../types'
import { formatRupiah } from '../../utils/formatters'
import { formatShiftSchedule } from '../../utils/shiftHelpers'
import { NumericInput } from '../ui/NumericInput'

interface CloseShiftModalProps {
  shift: Shift
  isOpen: boolean
  onClose: () => void
  onShiftClosed: (closedShift: Shift) => void
  isHandover?: boolean
}

export const CloseShiftModal = ({
  shift,
  isOpen,
  onClose,
  onShiftClosed,
  isHandover = false
}: CloseShiftModalProps) => {
  const totalExpenses = shift.total_expenses || 0
  const totalIncomes = shift.total_incomes || 0
  const expectedCash = shift.initial_cash + shift.total_cash_sales + totalIncomes - totalExpenses
  const [actualCash, setActualCash] = useState<number>(expectedCash)
  const [notes, setNotes] = useState<string>('')
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false)
  const [errorMsg, setErrorMsg] = useState<string>('')

  // Receipt Preview / Print Step
  const [closedData, setClosedData] = useState<Shift | null>(null)
  const [showPrintRecap, setShowPrintRecap] = useState<boolean>(false)

  // Current end time & dynamic duration
  const scheduleInfo = useMemo(() => {
    return formatShiftSchedule(shift.start_time, null)
  }, [shift.start_time])

  const diff = actualCash - expectedCash

  if (!isOpen) return null

  const handleConfirmClose = async () => {
    setIsSubmitting(true)
    setErrorMsg('')

    try {
      const res = await fetch(`/api/shifts/${shift.id}/close`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          actual_cash_counted: actualCash,
          notes: notes.trim() || undefined
        })
      })

      const json: any = await res.json()
      if (res.ok && json.success && json.data) {
        setClosedData(json.data)
        setShowPrintRecap(true)
      } else {
        setErrorMsg(json.message || 'Gagal menutup shift. Silakan coba lagi.')
      }
    } catch {
      // Fallback
      const closed: Shift = {
        ...shift,
        end_time: new Date().toISOString().replace('T', ' ').substring(0, 19),
        actual_cash_counted: actualCash,
        total_expenses: totalExpenses,
        total_incomes: totalIncomes,
        status: 'closed',
        notes: notes.trim() || undefined
      }
      setClosedData(closed)
      setShowPrintRecap(true)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handlePrint = () => {
    window.print()
  }

  const handleFinishAndRedirect = () => {
    if (closedData) {
      onShiftClosed(closedData)
    } else {
      onClose()
    }
  }

  // View: Thermal Print Recap Modal
  if (showPrintRecap && closedData) {
    const finalSchedule = formatShiftSchedule(closedData.start_time, closedData.end_time)
    const finalExpenses = closedData.total_expenses !== undefined ? closedData.total_expenses : (shift.total_expenses || 0)
    const finalIncomes = closedData.total_incomes !== undefined ? closedData.total_incomes : (shift.total_incomes || 0)
    const finalExpected = closedData.initial_cash + closedData.total_cash_sales + finalIncomes - finalExpenses
    const finalDiff = (closedData.actual_cash_counted || 0) - finalExpected
    const shiftExpenseItems = closedData.expenses || shift.expenses || []

    return (
      <div className="fixed inset-0 z-50 bg-stone-950 flex flex-col text-stone-100 animate-in fade-in duration-150">
        
        {/* Fullscreen Header */}
        <header className="px-6 py-4 border-b border-stone-800 bg-stone-900/60 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-950/60 border border-emerald-800 text-emerald-400 flex items-center justify-center shrink-0">
              <CheckCircle2 className="w-5 h-5 stroke-[2.5]" />
            </div>
            <div>
              <h2 className="text-base font-bold text-stone-100">
                Shift Berhasil Ditutup
              </h2>
              <p className="text-xs text-stone-400">
                {isHandover ? 'Cetak rekap kasir lalu lanjut ke pembukaan shift baru' : 'Cetak rekap kasir lalu kembali ke Layar PIN'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handlePrint}
              className="py-2.5 px-4 rounded-xl bg-stone-850 hover:bg-stone-800 border border-stone-700 text-stone-100 font-semibold text-xs transition-colors flex items-center gap-2 cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>Cetak Rekap</span>
            </button>

            <button
              type="button"
              onClick={handleFinishAndRedirect}
              className="py-2.5 px-5 rounded-xl bg-[#E2DFD2] hover:bg-[#d6d3c6] text-stone-950 font-bold text-xs transition-colors flex items-center gap-2 cursor-pointer shadow-sm"
            >
              <span>{isHandover ? 'Lanjut Buka Shift Baru' : 'Selesai & Ke Layar PIN'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </header>

        {/* Fullscreen Center Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-8 flex items-center justify-center">
          <div className="w-full max-w-md space-y-4">
            
            {/* Printable Thermal Receipt Container */}
            <div
              id="printable-receipt"
              className="bg-white text-stone-900 p-6 rounded-2xl font-mono text-xs space-y-3 shadow-2xl select-none"
            >
              <div className="text-center space-y-0.5 pb-2 border-b border-dashed border-stone-400">
                <h1 className="font-extrabold text-sm tracking-tight">WARKOP SUDUT TEMU</h1>
                <p className="text-[11px] text-stone-600">Kopi • Mi • Tempat Bersua</p>
                <div className="mt-1.5 inline-block px-2 py-0.5 bg-stone-100 rounded text-[10px] font-bold uppercase tracking-wider text-stone-700">
                  REKAP TUTUP SHIFT KASIR
                </div>
              </div>

              <div className="space-y-1 text-[11px] pb-2 border-b border-dashed border-stone-400">
                <div className="flex justify-between">
                  <span className="text-stone-500">Petugas Kasir:</span>
                  <span className="font-bold">{closedData.cashier_name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-stone-500">Jam Shift:</span>
                  <span className="font-semibold">{finalSchedule.range}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-stone-500">Durasi Shift:</span>
                  <span className="font-bold">{finalSchedule.duration}</span>
                </div>
              </div>

              <div className="space-y-1.5 text-[11px] pb-2 border-b border-dashed border-stone-400">
                <div className="flex justify-between">
                  <span>Modal Awal Kas</span>
                  <span>{formatRupiah(closedData.initial_cash)}</span>
                </div>
                <div className="flex justify-between font-semibold">
                  <span>Penjualan Tunai (Cash)</span>
                  <span>{formatRupiah(closedData.total_cash_sales)}</span>
                </div>
                <div className="flex justify-between text-stone-600">
                  <span>Penjualan Non-Tunai (QRIS)</span>
                  <span>{formatRupiah(closedData.total_qris_sales)}</span>
                </div>
                {finalIncomes > 0 && (
                  <div className="flex justify-between text-emerald-700 font-semibold">
                    <span>Kas Masuk (Tambahan Modal)</span>
                    <span>+{formatRupiah(finalIncomes)}</span>
                  </div>
                )}
                {finalExpenses > 0 && (
                  <div className="flex justify-between text-rose-600 font-semibold">
                    <span>Kas Keluar (Operasional/Gas)</span>
                    <span>-{formatRupiah(finalExpenses)}</span>
                  </div>
                )}
                <div className="flex justify-between font-bold pt-1 border-t border-dotted border-stone-300">
                  <span>Total Omzet Penjualan</span>
                  <span>{formatRupiah(closedData.total_cash_sales + closedData.total_qris_sales)}</span>
                </div>
              </div>

              {shiftExpenseItems.length > 0 && (
                <div className="space-y-1 text-[10px] pb-2 border-b border-dashed border-stone-400">
                  <div className="font-bold text-stone-700 uppercase tracking-wider">
                    Rincian Penyesuaian Kas Shift:
                  </div>
                  {shiftExpenseItems.map((item, idx) => {
                    const isInc = item.type === 'income' || item.description.startsWith('[Kas Masuk]')
                    const cleanDesc = item.description.replace(/^\[(Kas Masuk|Kas Keluar)\]\s*/, '')
                    return (
                      <div key={idx} className="flex justify-between text-stone-600">
                        <span className="truncate pr-2">• {cleanDesc}</span>
                        <span className="font-mono shrink-0">
                          {isInc ? '+' : '-'}{formatRupiah(item.amount)}
                        </span>
                      </div>
                    )
                  })}
                </div>
              )}

              <div className="space-y-1.5 text-[11px] pb-2 border-b border-dashed border-stone-400">
                <div className="flex justify-between">
                  <span className="text-stone-600">Wajib Ada di Laci:</span>
                  <span className="font-bold">{formatRupiah(finalExpected)}</span>
                </div>
                <div className="flex justify-between font-bold">
                  <span>Uang Fisik Dihitung:</span>
                  <span>{formatRupiah(closedData.actual_cash_counted || 0)}</span>
                </div>
                <div className="flex justify-between font-extrabold text-[12px] pt-1 border-t border-dotted border-stone-300">
                  <span>Selisih Kas:</span>
                  <span>
                    {finalDiff === 0
                      ? 'PAS (Rp 0)'
                      : finalDiff > 0
                      ? `+${formatRupiah(finalDiff)} (Lebih)`
                      : `${formatRupiah(finalDiff)} (Kurang)`}
                  </span>
                </div>
              </div>

              {closedData.notes && (
                <div className="text-[10px] text-stone-600 italic pb-1">
                  Catatan: {closedData.notes}
                </div>
              )}

              <div className="text-center pt-2 text-[10px] text-stone-500">
                Shift selesai. Terima kasih atas kerja kerasnya!
              </div>
            </div>

          </div>
        </div>

      </div>
    )
  }

  // View: Main Close Shift Confirmation Form
  return (
    <div className="fixed inset-0 z-50 bg-stone-950 flex flex-col text-stone-100 animate-in fade-in duration-150">
      
      {/* Header Bar */}
      <header className="px-6 py-4 border-b border-stone-800 bg-stone-900/60 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-rose-950/40 border border-rose-900/60 flex items-center justify-center text-rose-400 shadow-xs shrink-0">
            <PowerOff className="w-5 h-5 stroke-[2.2]" />
          </div>
          <div>
            <h2 className="text-base font-bold text-stone-100">
              Akhiri Shift Kasir
            </h2>
            <p className="text-xs text-stone-400 mt-0.5">
              Hitung uang fisik di laci kasir dan cetak rekap shift
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="p-2 rounded-xl text-stone-400 hover:text-stone-100 hover:bg-stone-800 transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>
      </header>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto px-6 sm:px-12 py-8">
        <div className="max-w-4xl mx-auto space-y-6">

        {/* Dynamic Shift Hours & Cashier Info */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 p-3.5 rounded-2xl bg-stone-950 border border-stone-800/80">
          <div>
            <span className="text-[10px] text-stone-500 uppercase tracking-wider font-mono block">
              Petugas Kasir
            </span>
            <span className="text-xs font-bold text-stone-200 mt-0.5 block truncate">
              {shift.cashier_name}
            </span>
          </div>

          <div>
            <span className="text-[10px] text-stone-500 uppercase tracking-wider font-mono flex items-center gap-1">
              <Clock className="w-3 h-3 text-stone-400" />
              <span>Jam Shift</span>
            </span>
            <span className="text-xs font-mono font-bold text-stone-200 mt-0.5 block truncate">
              {scheduleInfo.range}
            </span>
          </div>

          <div className="col-span-2 sm:col-span-1">
            <span className="text-[10px] text-stone-500 uppercase tracking-wider font-mono block">
              Durasi Shift
            </span>
            <span className="text-xs font-mono font-bold text-[#E2DFD2] mt-0.5 block">
              {scheduleInfo.duration}
            </span>
          </div>
        </div>

        {/* Sales & Cash Breakdown */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          <div className="p-3 rounded-xl bg-stone-950 border border-stone-800">
            <span className="text-[10px] text-stone-500 uppercase font-mono block">Modal Awal</span>
            <span className="text-xs font-mono font-bold text-stone-300 mt-0.5 block">
              {formatRupiah(shift.initial_cash)}
            </span>
          </div>

          <div className="p-3 rounded-xl bg-stone-950 border border-stone-800">
            <span className="text-[10px] text-stone-500 uppercase font-mono block">Penjualan Cash</span>
            <span className="text-xs font-mono font-bold text-[#E2DFD2] mt-0.5 block">
              {formatRupiah(shift.total_cash_sales)}
            </span>
          </div>

          {totalIncomes > 0 && (
            <div className="p-3 rounded-xl bg-stone-950 border border-stone-800">
              <span className="text-[10px] text-stone-500 uppercase font-mono block">Kas Masuk</span>
              <span className="text-xs font-mono font-bold text-emerald-400 mt-0.5 block">
                +{formatRupiah(totalIncomes)}
              </span>
            </div>
          )}

          {totalExpenses > 0 && (
            <div className="p-3 rounded-xl bg-stone-950 border border-stone-800">
              <span className="text-[10px] text-stone-500 uppercase font-mono block">Kas Keluar</span>
              <span className="text-xs font-mono font-bold text-amber-400 mt-0.5 block">
                -{formatRupiah(totalExpenses)}
              </span>
            </div>
          )}

          <div className="p-3 rounded-xl bg-stone-950 border border-stone-800">
            <span className="text-[10px] text-stone-500 uppercase font-mono block">Wajib di Laci</span>
            <span className="text-xs font-mono font-bold text-emerald-400 mt-0.5 block">
              {formatRupiah(expectedCash)}
            </span>
          </div>
        </div>

        {/* Mini Itemized Shift Adjustments Preview */}
        {Array.isArray(shift.expenses) && shift.expenses.length > 0 && (
          <div className="p-2.5 rounded-xl bg-stone-950 border border-stone-800 space-y-1">
            <span className="text-[10px] font-mono text-stone-400 uppercase tracking-wider block font-semibold">
              Rincian Kas Shift Ini:
            </span>
            <div className="flex flex-wrap gap-1.5">
              {shift.expenses.map((exp, i) => {
                const isInc = exp.type === 'income' || exp.description.startsWith('[Kas Masuk]')
                const cleanDesc = exp.description.replace(/^\[(Kas Masuk|Kas Keluar)\]\s*/, '')
                return (
                  <span
                    key={i}
                    className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono border ${
                      isInc
                        ? 'bg-emerald-950/40 border-emerald-900/60 text-emerald-300'
                        : 'bg-amber-950/40 border-amber-900/60 text-amber-300'
                    }`}
                  >
                    <span>{cleanDesc}</span>
                    <span className="font-bold font-mono">
                      ({isInc ? '+' : '-'}{formatRupiah(exp.amount)})
                    </span>
                  </span>
                )
              })}
            </div>
          </div>
        )}

        {errorMsg && (
          <div className="p-3 rounded-xl bg-rose-950/40 border border-rose-800 text-rose-300 text-xs">
            {errorMsg}
          </div>
        )}

        {/* Physical Cash Input */}
        <div className="space-y-3 pt-1">
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-stone-300 text-xs font-semibold">
                Hitung Uang Fisik di Laci Sekarang <span className="text-rose-400">*</span>
              </label>
              <button
                type="button"
                onClick={() => setActualCash(expectedCash)}
                className="text-[11px] font-mono text-[#E2DFD2] hover:underline cursor-pointer"
              >
                Set Sesuai Laci ({formatRupiah(expectedCash)})
              </button>
            </div>
            <NumericInput
              value={actualCash}
              onChange={setActualCash}
              min={0}
              step={1000}
              prefix="Rp"
              required
              placeholder="0"
            />
          </div>

          {/* Discrepancy Status Card */}
          <div className={`p-3 rounded-xl border flex items-center justify-between text-xs ${
            diff === 0
              ? 'bg-emerald-950/30 border-emerald-900/60 text-emerald-400'
              : diff < 0
              ? 'bg-rose-950/30 border-rose-900/60 text-rose-400'
              : 'bg-amber-950/30 border-amber-900/60 text-amber-400'
          }`}>
            <div className="flex items-center gap-2">
              {diff === 0 ? (
                <CheckCircle2 className="w-4 h-4 shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 shrink-0" />
              )}
              <span className="font-semibold">
                {diff === 0
                  ? 'Kas Klop (Fisik sesuai dengan sistem)'
                  : diff < 0
                  ? 'Selisih Kurang Fisik Laci'
                  : 'Selisih Lebih Fisik Laci'}
              </span>
            </div>
            <span className="font-mono font-bold tabular-nums">
              {diff === 0 ? 'Pas (Rp 0)' : `${diff > 0 ? '+' : ''}${formatRupiah(diff)}`}
            </span>
          </div>

          <div>
            <label className="text-stone-300 text-xs font-semibold block mb-1">
              Catatan Penutupan Shift (Opsional)
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Catatan kendala shift, serah terima laci..."
              className="w-full bg-stone-950 border border-stone-800 rounded-xl px-3 py-2 text-xs text-stone-100 placeholder-stone-600 focus:outline-none focus:border-[#E2DFD2] transition-colors resize-none"
            />
          </div>
        </div>

        </div>
      </div>

      {/* Sticky Bottom Action Bar */}
      <footer className="border-t border-stone-800 bg-stone-950/90 backdrop-blur-xs px-6 py-4 flex items-center justify-between shrink-0">
        <button
          type="button"
          onClick={onClose}
          disabled={isSubmitting}
          className="px-5 py-2.5 rounded-xl border border-stone-800 hover:bg-stone-850 text-stone-300 text-xs font-semibold transition-colors cursor-pointer"
        >
          Batal
        </button>

        <button
          type="button"
          onClick={handleConfirmClose}
          disabled={isSubmitting}
          className="px-6 py-3 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs transition-colors flex items-center gap-2 cursor-pointer shadow-sm disabled:opacity-50"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Menutup Shift...</span>
            </>
          ) : (
            <>
              <PowerOff className="w-4 h-4 stroke-[2.2]" />
              <span>Tutup Shift & Cetak Rekap</span>
            </>
          )}
        </button>
      </footer>

    </div>
  )
}
