import { useState, useEffect } from 'react'
import { X, Loader2, Save, Plus } from 'lucide-react'
import type { Shift } from '../../types'
import { NumericInput } from '../ui/NumericInput'
import { SearchableSelect } from '../ui/SearchableSelect'

interface ShiftFormModalProps {
  editShift?: Shift | null
  onClose: () => void
  onSaved: () => void
}

interface CashierOption {
  id: string
  name: string
}

const toInputValue = (val?: string) => {
  if (!val) return ''
  // DB: "2026-10-03 08:00:00" → input "2026-10-03T08:00"
  return val.replace(' ', 'T').substring(0, 16)
}

const toDbTime = (val: string): string | null => {
  if (!val) return null
  // input "2026-10-03T08:00" → DB "2026-10-03 08:00:00"
  return val.replace('T', ' ') + ':00'
}

export const ShiftFormModal = ({ editShift, onClose, onSaved }: ShiftFormModalProps) => {
  const isEditing = !!editShift

  const [cashiers, setCashiers] = useState<CashierOption[]>([])
  const [cashierId, setCashierId] = useState(editShift?.cashier_id ?? '')
  const [cashierName, setCashierName] = useState(editShift?.cashier_name ?? '')
  const [startTime, setStartTime] = useState(toInputValue(editShift?.start_time))
  const [endTime, setEndTime] = useState(toInputValue(editShift?.end_time))
  const [initialCash, setInitialCash] = useState(editShift?.initial_cash ?? 100000)
  const [totalCashSales, setTotalCashSales] = useState(editShift?.total_cash_sales ?? 0)
  const [totalQrisSales, setTotalQrisSales] = useState(editShift?.total_qris_sales ?? 0)
  const [actualCashCounted, setActualCashCounted] = useState(editShift?.actual_cash_counted ?? 0)
  const [hasActualCash, setHasActualCash] = useState(
    editShift?.actual_cash_counted !== undefined && editShift?.actual_cash_counted !== null
  )
  const [status, setStatus] = useState<'open' | 'closed'>(editShift?.status ?? 'closed')
  const [notes, setNotes] = useState(editShift?.notes ?? '')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')

  useEffect(() => {
    fetch('/api/users?role=cashier')
      .then(r => (r.ok ? r.json() : null))
      .then((json: any) => {
        if (json?.success && Array.isArray(json.data) && json.data.length > 0) {
          setCashiers(json.data)
          if (!isEditing && !cashierId && json.data[0]) {
            setCashierId(json.data[0].id)
            setCashierName(json.data[0].name)
          }
        }
      })
      .catch(() => {})
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleCashierSelect = (id: string) => {
    const opt = cashiers.find(c => c.id === id)
    setCashierId(id)
    if (opt) setCashierName(opt.name)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!startTime) {
      setErrorMsg('Jam mulai wajib diisi.')
      return
    }
    setIsSubmitting(true)
    setErrorMsg('')

    const payload = {
      cashier_id: cashierId || undefined,
      cashier_name: cashierName,
      start_time: toDbTime(startTime),
      end_time: endTime ? toDbTime(endTime) : null,
      initial_cash: initialCash,
      total_cash_sales: totalCashSales,
      total_qris_sales: totalQrisSales,
      actual_cash_counted: hasActualCash ? actualCashCounted : null,
      status,
      notes: notes.trim() || null,
    }

    try {
      let res: Response
      if (isEditing && editShift) {
        res = await fetch(`/api/shifts/${editShift.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        })
      } else {
        res = await fetch('/api/shifts', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        })
      }
      const data: any = await res.json()
      if (res.ok && data.success) {
        onSaved()
      } else {
        setErrorMsg(data.message || 'Gagal menyimpan shift.')
      }
    } catch {
      setErrorMsg('Tidak dapat terhubung ke server.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className="bg-stone-900 border border-stone-800 rounded-2xl w-full max-w-lg shadow-xl max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-stone-800 shrink-0">
          <h2 className="text-sm font-bold text-stone-100 tracking-tight">
            {isEditing ? 'Edit Data Shift' : 'Tambah Shift Manual'}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-stone-400 hover:text-stone-100 hover:bg-stone-800 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4 overflow-y-auto">
          {/* Kasir */}
          <div>
            <label className="text-xs font-semibold text-stone-300 block mb-1.5">
              Petugas Kasir <span className="text-rose-400">*</span>
            </label>
            {cashiers.length > 0 ? (
              <SearchableSelect
                value={cashierId}
                onChange={handleCashierSelect}
                options={cashiers.map(c => ({
                  value: c.id,
                  label: c.name,
                  badge: 'Kasir'
                }))}
                placeholder="Pilih petugas kasir..."
                searchPlaceholder="Cari kasir..."
              />
            ) : (
              <input
                type="text"
                value={cashierName}
                onChange={e => setCashierName(e.target.value)}
                placeholder="Nama kasir..."
                className="w-full bg-stone-950 border border-stone-800 rounded-xl px-3 py-2.5 text-xs text-stone-100 placeholder-stone-600 focus:outline-none focus:border-[#E2DFD2] transition-colors"
                required
              />
            )}
          </div>

          {/* Start / End Time */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-stone-300 block mb-1.5">
                Jam Mulai <span className="text-rose-400">*</span>
              </label>
              <input
                type="datetime-local"
                value={startTime}
                onChange={e => setStartTime(e.target.value)}
                className="w-full bg-stone-950 border border-stone-800 rounded-xl px-3 py-2.5 text-xs text-stone-100 focus:outline-none focus:border-[#E2DFD2] transition-colors scheme-dark"
                required
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-stone-300 block mb-1.5">
                Jam Akhir{' '}
                <span className="text-stone-500 font-normal">(opsional)</span>
              </label>
              <input
                type="datetime-local"
                value={endTime}
                onChange={e => setEndTime(e.target.value)}
                className="w-full bg-stone-950 border border-stone-800 rounded-xl px-3 py-2.5 text-xs text-stone-100 focus:outline-none focus:border-[#E2DFD2] transition-colors scheme-dark"
              />
            </div>
          </div>

          {/* Cash fields — 3 col */}
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="text-xs font-semibold text-stone-300 block mb-1.5">Modal Awal</label>
              <NumericInput value={initialCash} onChange={setInitialCash} min={0} step={10000} prefix="Rp" />
            </div>
            <div>
              <label className="text-xs font-semibold text-stone-300 block mb-1.5">Penjualan Tunai</label>
              <NumericInput value={totalCashSales} onChange={setTotalCashSales} min={0} step={1000} prefix="Rp" />
            </div>
            <div>
              <label className="text-xs font-semibold text-stone-300 block mb-1.5">Penjualan QRIS</label>
              <NumericInput value={totalQrisSales} onChange={setTotalQrisSales} min={0} step={1000} prefix="Rp" />
            </div>
          </div>

          {/* Actual Cash Counted */}
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <label className="text-xs font-semibold text-stone-300">Uang Fisik Dihitung</label>
              <label className="flex items-center gap-1.5 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={hasActualCash}
                  onChange={e => setHasActualCash(e.target.checked)}
                  className="w-3.5 h-3.5 accent-[#E2DFD2]"
                />
                <span className="text-xs text-stone-400">Isi</span>
              </label>
            </div>
            {hasActualCash && (
              <NumericInput value={actualCashCounted} onChange={setActualCashCounted} min={0} step={1000} prefix="Rp" />
            )}
          </div>

          {/* Status */}
          <div>
            <label className="text-xs font-semibold text-stone-300 block mb-1.5">Status Shift</label>
            <SearchableSelect
              value={status}
              onChange={val => setStatus(val as 'open' | 'closed')}
              options={[
                { value: 'open', label: 'Buka (Open)', badge: 'Aktif' },
                { value: 'closed', label: 'Ditutup (Closed)', badge: 'Selesai' }
              ]}
              placeholder="Pilih status shift..."
            />
          </div>

          {/* Notes */}
          <div>
            <label className="text-xs font-semibold text-stone-300 block mb-1.5">Catatan</label>
            <textarea
              rows={2}
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="Kondisi kas, serah terima, catatan selisih..."
              className="w-full bg-stone-950 border border-stone-800 rounded-xl px-3 py-2 text-xs text-stone-100 placeholder-stone-600 focus:outline-none focus:border-[#E2DFD2] transition-colors resize-none"
            />
          </div>

          {errorMsg && (
            <div className="p-3 rounded-xl bg-rose-950/40 border border-rose-800 text-rose-300 text-xs">
              {errorMsg}
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center gap-2 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 rounded-xl border border-stone-700 text-stone-300 text-xs font-semibold hover:bg-stone-800 transition-colors cursor-pointer active:scale-[0.98]"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 py-2.5 rounded-xl bg-[#E2DFD2] hover:bg-[#d6d3c6] active:bg-[#c9c6ba] text-stone-950 font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer disabled:opacity-50 active:scale-[0.98]"
            >
              {isSubmitting ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : isEditing ? (
                <Save className="w-3.5 h-3.5 stroke-[2.5]" />
              ) : (
                <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
              )}
              {isEditing ? 'Simpan Perubahan' : 'Tambah Shift'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
