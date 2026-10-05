import { useState, useEffect } from 'react'
import type { Shift } from '../../types'
import { formatRupiah } from '../../utils/formatters'
import { formatShiftSchedule, calculateShiftDuration } from '../../utils/shiftHelpers'
import { Clock, PowerOff, RefreshCw, Plus, Pencil, Trash2 } from 'lucide-react'
import { ShiftFormModal } from './ShiftFormModal'
import { ConfirmDialog } from '../ui/ConfirmDialog'

interface ShiftAuditViewProps {
  currentShift: Shift
  onEndShift?: () => void
  onShiftUpdated?: (updatedShift: Shift) => void
}

export const ShiftAuditView = ({ currentShift, onEndShift, onShiftUpdated }: ShiftAuditViewProps) => {
  const [historicalShifts, setHistoricalShifts] = useState<Shift[]>([
    {
      id: 'shift_20261003_01',
      cashier_name: 'Kasir Shift Pagi',
      start_time: '2026-10-03 08:00:00',
      end_time: '2026-10-03 15:00:00',
      initial_cash: 100000,
      total_cash_sales: 355000,
      total_qris_sales: 285000,
      actual_cash_counted: 455000,
      status: 'closed',
      notes: 'Serah terima lancar, kas fisik klop.'
    },
    {
      id: 'shift_20261002_02',
      cashier_name: 'Kasir Shift Sore',
      start_time: '2026-10-02 15:00:00',
      end_time: '2026-10-02 23:30:00',
      initial_cash: 100000,
      total_cash_sales: 520000,
      total_qris_sales: 430000,
      actual_cash_counted: 620000,
      status: 'closed',
      notes: 'Tutup shift malam, tidak ada selisih.'
    }
  ])
  const [isLoading, setIsLoading] = useState(false)
  // undefined = closed, null = add new, Shift = edit
  const [modalShift, setModalShift] = useState<Shift | null | undefined>(undefined)
  const [shiftToDeleteId, setShiftToDeleteId] = useState<string | null>(null)
  const [isDeletingShift, setIsDeletingShift] = useState(false)

  // Realtime tick for active shift duration
  const [, setTick] = useState(0)
  useEffect(() => {
    const timer = setInterval(() => setTick(t => t + 1), 30000) // update every 30s
    return () => clearInterval(timer)
  }, [])

  // Fetch all shifts from API
  const fetchShifts = async () => {
    setIsLoading(true)
    try {
      const res = await fetch('/api/shifts')
      if (res.ok) {
        const json: any = await res.json()
        if (json.success && json.data?.length > 0) {
          // Show historical shifts (exclude active shift id if present, or show all closed)
          const list = json.data.filter((s: Shift) => s.id !== currentShift.id || s.status === 'closed')
          if (list.length > 0) {
            setHistoricalShifts(list)
          }
        }
      }
    } catch {
      // Use fallback
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchShifts()
  }, [currentShift])

  const handleDeleteShift = (shiftId: string) => {
    setShiftToDeleteId(shiftId)
  }

  const handleConfirmDeleteShift = async () => {
    if (!shiftToDeleteId) return
    setIsDeletingShift(true)
    try {
      const res = await fetch(`/api/shifts/${shiftToDeleteId}`, { method: 'DELETE' })
      if (res.ok) {
        setHistoricalShifts(prev => prev.filter(s => s.id !== shiftToDeleteId))
      }
    } catch {
      // ignore
    } finally {
      setIsDeletingShift(false)
      setShiftToDeleteId(null)
    }
  }

  const expectedCashCurrent = currentShift.initial_cash + currentShift.total_cash_sales + (currentShift.total_incomes || 0) - (currentShift.total_expenses || 0)
  const activeSchedule = formatShiftSchedule(currentShift.start_time, currentShift.end_time || null)
  const activeDuration = calculateShiftDuration(currentShift.start_time, currentShift.end_time || null)

  return (
    <div className="space-y-5">
      
      {/* Active Shift Card */}
      <div className="bg-white dark:bg-stone-900/80 border border-stone-200 dark:border-stone-800 rounded-2xl p-5 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-stone-200 dark:border-stone-800 mb-4 gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-stone-100 dark:bg-stone-950 border border-stone-200 dark:border-stone-800 flex items-center justify-center text-amber-800 dark:text-[#E2DFD2] shadow-xs">
              <Clock className="w-4 h-4 stroke-2" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-bold tracking-tight text-stone-900 dark:text-stone-100">
                  Shift Berjalan: {currentShift.cashier_name}
                </h2>
                <span className={`px-2 py-0.5 rounded text-[10px] font-mono uppercase tracking-wider border font-bold ${
                  currentShift.status === 'open'
                    ? 'border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-900/60 dark:bg-emerald-950/40 dark:text-emerald-400'
                    : 'border-stone-200 bg-stone-100 text-stone-600 dark:border-stone-800 dark:bg-stone-950 dark:text-stone-400'
                }`}>
                  {currentShift.status === 'open' ? 'Buka (Open)' : 'Ditutup'}
                </span>
              </div>
              <span className="text-xs text-stone-500 dark:text-stone-400 font-mono mt-0.5 block">
                {activeSchedule.range} • Durasi: <span className="text-amber-800 dark:text-[#E2DFD2] font-semibold">{activeDuration}</span>
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              onClick={() => setModalShift(currentShift)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-stone-100 hover:bg-stone-200 dark:bg-stone-800/80 border border-stone-200 dark:border-stone-700/70 text-stone-800 dark:text-stone-200 font-semibold text-xs transition-colors cursor-pointer active:scale-95"
              title="Edit Detail Shift Berjalan"
            >
              <Pencil className="w-3.5 h-3.5" />
              <span>Edit Shift</span>
            </button>

            {currentShift.status === 'open' && onEndShift && (
              <button
                type="button"
                onClick={onEndShift}
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-500 active:bg-rose-700 text-white font-bold text-xs shadow-md shadow-rose-950/20 border border-rose-500/60 transition-all cursor-pointer active:scale-95"
              >
                <PowerOff className="w-3.5 h-3.5 stroke-[2.5]" />
                <span>Akhiri Shift Sekarang</span>
              </button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          <div className="p-3.5 rounded-xl bg-stone-50 dark:bg-stone-950 border border-stone-200 dark:border-stone-800 shadow-xs">
            <span className="text-xs text-stone-500 dark:text-stone-400 block mb-1">Modal Awal Kas</span>
            <span className="font-mono tabular-nums text-lg font-bold text-stone-900 dark:text-stone-100">
              {formatRupiah(currentShift.initial_cash)}
            </span>
          </div>

          <div className="p-3.5 rounded-xl bg-stone-50 dark:bg-stone-950 border border-stone-200 dark:border-stone-800 shadow-xs">
            <span className="text-xs text-stone-500 dark:text-stone-400 block mb-1">Total Penjualan Tunai</span>
            <span className="font-mono tabular-nums text-lg font-bold text-amber-900 dark:text-[#E2DFD2]">
              {formatRupiah(currentShift.total_cash_sales)}
            </span>
          </div>

          <div className="p-3.5 rounded-xl bg-stone-50 dark:bg-stone-950 border border-stone-200 dark:border-stone-800 shadow-xs">
            <span className="text-xs text-stone-500 dark:text-stone-400 block mb-1">Kas Masuk / Keluar</span>
            <div className="flex items-center gap-1.5 font-mono text-sm mt-0.5">
              <span className="text-emerald-600 dark:text-emerald-400 font-bold" title="Kas Masuk">
                +{formatRupiah(currentShift.total_incomes || 0)}
              </span>
              <span className="text-stone-400 dark:text-stone-600">/</span>
              <span className="text-amber-600 dark:text-amber-400 font-bold" title="Kas Keluar (Gas, Es, dll)">
                -{formatRupiah(currentShift.total_expenses || 0)}
              </span>
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-stone-50 dark:bg-stone-950 border border-stone-200 dark:border-stone-800 shadow-xs">
            <span className="text-xs text-stone-500 dark:text-stone-400 block mb-1">Wajib Ada di Laci Sekarang</span>
            <span className="font-mono tabular-nums text-lg font-bold text-emerald-600 dark:text-emerald-400">
              {formatRupiah(expectedCashCurrent)}
            </span>
          </div>
        </div>
      </div>

      {/* Historical Shifts Table */}
      <div className="bg-white dark:bg-stone-900/80 border border-stone-200 dark:border-stone-800 rounded-2xl p-5 shadow-xs">
        <div className="flex items-center justify-between mb-4 pb-3 border-b border-stone-200 dark:border-stone-800/80">
          <h3 className="text-sm font-bold tracking-tight text-stone-900 dark:text-stone-100">
            Riwayat Audit Shift Kasir
          </h3>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setModalShift(null)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-stone-900 hover:bg-stone-800 text-stone-50 dark:bg-[#E2DFD2] dark:hover:bg-[#d6d3c6] dark:text-stone-950 font-bold text-xs transition-all cursor-pointer shadow-xs active:scale-95"
            >
              <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
              <span>Tambah Shift</span>
            </button>
            <button
              type="button"
              onClick={fetchShifts}
              disabled={isLoading}
              className="p-1.5 rounded-lg text-stone-400 hover:text-stone-900 dark:hover:text-stone-100 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors cursor-pointer"
              title="Refresh Riwayat Shift"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-stone-200 dark:border-stone-800 text-stone-500 dark:text-stone-400 font-mono text-[11px] uppercase tracking-wider bg-stone-50/60 dark:bg-stone-950/40">
                <th className="py-3 px-3 font-semibold rounded-l-lg">Petugas</th>
                <th className="py-3 px-3 font-semibold">Jam Shift</th>
                <th className="py-3 px-3 font-semibold text-right">Modal Awal</th>
                <th className="py-3 px-3 font-semibold text-right">Penjualan Tunai</th>
                <th className="py-3 px-3 font-semibold text-right">Kas +/-</th>
                <th className="py-3 px-3 font-semibold text-right">Penjualan QRIS</th>
                <th className="py-3 px-3 font-semibold text-right">Uang Fisik Dihitung</th>
                <th className="py-3 px-3 font-semibold text-center">Selisih Kas</th>
                <th className="py-3 px-3 font-semibold text-center">Status</th>
                <th className="py-3 px-3 font-semibold text-center rounded-r-lg">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-200 dark:divide-stone-800/60">
              {historicalShifts.map((s) => {
                const netAdjustment = (s.total_incomes || 0) - (s.total_expenses || 0)
                const expected = s.initial_cash + s.total_cash_sales + (s.total_incomes || 0) - (s.total_expenses || 0)
                const diff = (s.actual_cash_counted || 0) - expected
                const schedule = formatShiftSchedule(s.start_time, s.end_time)

                return (
                  <tr key={s.id} className="hover:bg-stone-50 dark:hover:bg-stone-800/30 transition-colors">
                    <td className="py-3 px-3 font-medium text-stone-900 dark:text-stone-100">{s.cashier_name}</td>
                    
                    {/* Jam Shift dengan kalkulasi durasi dinamis */}
                    <td className="py-3 px-3 font-mono">
                      <div className="text-stone-800 dark:text-stone-200 font-semibold">{schedule.range}</div>
                      <div className="text-[10px] text-stone-500 dark:text-stone-400 font-sans mt-0.5">
                        Durasi: <span className="text-amber-800 dark:text-[#E2DFD2] font-mono font-bold">{schedule.duration}</span>
                      </div>
                    </td>

                    <td className="py-3 px-3 text-right font-mono tabular-nums text-stone-600 dark:text-stone-300">
                      {formatRupiah(s.initial_cash)}
                    </td>
                    <td className="py-3 px-3 text-right font-mono tabular-nums text-amber-900 dark:text-[#E2DFD2] font-semibold">
                      {formatRupiah(s.total_cash_sales)}
                    </td>
                    <td className="py-3 px-3 text-right font-mono tabular-nums">
                      {netAdjustment === 0 ? (
                        <span className="text-stone-400 dark:text-stone-500">Rp 0</span>
                      ) : (
                        <div className="flex flex-col items-end text-[10px]">
                          {(s.total_incomes || 0) > 0 && (
                            <span className="text-emerald-600 dark:text-emerald-400 font-semibold">+{formatRupiah(s.total_incomes || 0)}</span>
                          )}
                          {(s.total_expenses || 0) > 0 && (
                            <span className="text-amber-600 dark:text-amber-400 font-semibold">-{formatRupiah(s.total_expenses || 0)}</span>
                          )}
                        </div>
                      )}
                    </td>
                    <td className="py-3 px-3 text-right font-mono tabular-nums text-cyan-700 dark:text-cyan-300">
                      {formatRupiah(s.total_qris_sales)}
                    </td>
                    <td className="py-3 px-3 text-right font-mono tabular-nums font-semibold text-stone-900 dark:text-stone-100">
                      {s.actual_cash_counted !== undefined && s.actual_cash_counted !== null
                        ? formatRupiah(s.actual_cash_counted)
                        : '-'}
                    </td>
                    <td className="py-3 px-3 text-center font-mono tabular-nums">
                      {s.actual_cash_counted === undefined || s.actual_cash_counted === null ? (
                        <span className="text-stone-400 dark:text-stone-500">-</span>
                      ) : diff === 0 ? (
                        <span className="text-[11px] text-emerald-700 dark:text-emerald-400 font-semibold uppercase">
                          Pas (Rp 0)
                        </span>
                      ) : diff > 0 ? (
                        <span className="text-[11px] text-amber-700 dark:text-amber-400 font-semibold uppercase">
                          +{formatRupiah(diff)}
                        </span>
                      ) : (
                        <span className="text-[11px] text-rose-700 dark:text-rose-400 font-semibold uppercase">
                          {formatRupiah(diff)}
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-3 text-center">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-mono uppercase border font-semibold ${
                        s.status === 'open'
                          ? 'border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-900/60 dark:bg-emerald-950/40 dark:text-emerald-400'
                          : 'border-stone-200 bg-stone-100 text-stone-600 dark:border-stone-800 dark:bg-stone-950 dark:text-stone-400'
                      }`}>
                        {s.status === 'open' ? 'Buka' : 'Ditutup'}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          type="button"
                          onClick={() => setModalShift(s)}
                          className="p-1.5 rounded-lg text-stone-400 hover:text-stone-900 dark:hover:text-stone-100 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors cursor-pointer"
                          title="Edit Shift"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteShift(s.id)}
                          className="p-1.5 rounded-lg text-stone-400 hover:text-rose-600 dark:text-stone-500 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
                          title="Hapus Shift"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Tambah / Edit Shift (Owner Only) */}
      {modalShift !== undefined && (
        <ShiftFormModal
          editShift={modalShift}
          onClose={() => setModalShift(undefined)}
          onSaved={() => {
            setModalShift(undefined)
            fetchShifts()
            if (modalShift?.id === currentShift.id && onShiftUpdated) {
              fetch('/api/shifts/current')
                .then(r => r.json())
                .then((d: any) => { if (d?.success && d?.data) onShiftUpdated(d.data) })
                .catch(() => {})
            }
          }}
        />
      )}

      {/* Dialog Konfirmasi Hapus Shift */}
      <ConfirmDialog
        isOpen={!!shiftToDeleteId}
        title="Hapus Data Shift"
        message="Yakin ingin menghapus data shift ini? Data log shift dan audit kasir yang dihapus tidak dapat dipulihkan."
        confirmText="Hapus Shift"
        cancelText="Batal"
        variant="danger"
        isLoading={isDeletingShift}
        onConfirm={handleConfirmDeleteShift}
        onCancel={() => !isDeletingShift && setShiftToDeleteId(null)}
      />

    </div>
  )
}
