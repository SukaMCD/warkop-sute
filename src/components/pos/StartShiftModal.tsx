import { useState, useEffect } from 'react'
import { PlayCircle, Clock, ShieldCheck, Loader2 } from 'lucide-react'
import type { User, Shift } from '../../types'
import { NumericInput } from '../ui/NumericInput'

interface StartShiftModalProps {
  currentUser: User
  onShiftStarted: (newShift: Shift) => void
}

export const StartShiftModal = ({
  currentUser,
  onShiftStarted
}: StartShiftModalProps) => {
  const [initialCash, setInitialCash] = useState<number>(100000)
  const [cashierId, setCashierId] = useState<string>(currentUser.id)
  const [cashierName, setCashierName] = useState<string>(currentUser.name)
  const [cashiers, setCashiers] = useState<{ id: string; name: string }[]>([])
  const [notes, setNotes] = useState<string>('')
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false)
  const [errorMsg, setErrorMsg] = useState<string>('')

  useEffect(() => {
    fetch('/api/users?role=cashier')
      .then(r => (r.ok ? r.json() : null))
      .then((data: any) => {
        if (data?.success && Array.isArray(data.data) && data.data.length > 0) {
          setCashiers(data.data)
          // If currentUser is in the list, keep it; otherwise default to list
          const found = data.data.find((c: any) => c.id === currentUser.id)
          if (found) {
            setCashierId(found.id)
            setCashierName(found.name)
          }
        }
      })
      .catch(() => {})
  }, [currentUser.id])

  const [currentTime] = useState(() => {
    return new Intl.DateTimeFormat('id-ID', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false
    }).format(new Date())
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setErrorMsg('')

    try {
      const res = await fetch('/api/shifts/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cashier_id: cashierId,
          initial_cash: initialCash,
          notes: notes.trim() || undefined
        })
      })

      const data: any = await res.json()
      if (res.ok && data.success && data.data) {
        onShiftStarted(data.data)
      } else {
        setErrorMsg(data.message || 'Gagal memulai shift. Silakan coba lagi.')
      }
    } catch {
      // Fallback if backend offline
      const mockShift: Shift = {
        id: `shift_${Date.now()}`,
        cashier_name: cashierName,
        start_time: new Date().toISOString().replace('T', ' ').substring(0, 19),
        initial_cash: initialCash,
        total_cash_sales: 0,
        total_qris_sales: 0,
        status: 'open',
        notes: notes.trim() || undefined
      }
      onShiftStarted(mockShift)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-stone-900 border border-stone-800 rounded-3xl w-full max-w-md p-6 shadow-2xl space-y-5">
        
        {/* Header Modal */}
        <div className="flex items-center gap-3 pb-4 border-b border-stone-800">
          <div className="w-11 h-11 rounded-2xl bg-stone-950 border border-stone-800 flex items-center justify-center text-[#E2DFD2] shadow-xs shrink-0">
            <PlayCircle className="w-6 h-6 stroke-[2]" />
          </div>
          <div>
            <h2 className="text-base font-bold text-stone-100">
              Mulai Shift Kasir Baru
            </h2>
            <p className="text-xs text-stone-400 mt-0.5">
              Masukkan saldo awal fisik di laci kasir
            </p>
          </div>
        </div>

        {/* Info Petugas & Waktu */}
        <div className="grid grid-cols-2 gap-3 p-3.5 rounded-2xl bg-stone-950 border border-stone-800/80">
          <div>
            <span className="text-[11px] text-stone-500 uppercase tracking-wider font-mono block mb-1">
              Petugas Kasir
            </span>
            {cashiers.length > 0 ? (
              <select
                value={cashierId}
                onChange={e => {
                  const id = e.target.value
                  setCashierId(id)
                  const found = cashiers.find(c => c.id === id)
                  if (found) setCashierName(found.name)
                }}
                className="w-full bg-stone-900 border border-stone-800 rounded-lg px-2 py-1 text-xs font-bold text-stone-200 focus:outline-none focus:border-[#E2DFD2] cursor-pointer"
              >
                {cashiers.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            ) : (
              <span className="text-xs font-bold text-stone-200 mt-0.5 block truncate">
                {currentUser.name}
              </span>
            )}
          </div>
          <div>
            <span className="text-[11px] text-stone-500 uppercase tracking-wider font-mono block flex items-center gap-1">
              <Clock className="w-3 h-3 text-stone-400" />
              <span>Jam Mulai</span>
            </span>
            <span className="text-xs font-mono font-bold text-[#E2DFD2] mt-0.5 block">
              {currentTime} WIB
            </span>
          </div>
        </div>

        {errorMsg && (
          <div className="p-3 rounded-xl bg-rose-950/40 border border-rose-800 text-rose-300 text-xs">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-stone-300 text-xs font-semibold block mb-1.5">
              Saldo Awal Laci / Modal Kas (Rp) <span className="text-rose-400">*</span>
            </label>
            <NumericInput
              value={initialCash}
              onChange={setInitialCash}
              min={0}
              step={10000}
              prefix="Rp"
              required
              placeholder="100.000"
            />
            <p className="text-[11px] text-stone-500 mt-1.5 flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-stone-400 shrink-0" />
              <span>Hitung uang fisik di laci kasir secara teliti sebelum mulai transaksi.</span>
            </p>
          </div>

          <div>
            <label className="text-stone-300 text-xs font-semibold block mb-1.5">
              Catatan Pembukaan (Opsional)
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Contoh: Pecahan 50rb (1 lbr), 20rb (2 lbr), 10rb (1 lbr)..."
              className="w-full bg-stone-950 border border-stone-800 rounded-xl px-3 py-2 text-xs text-stone-100 placeholder-stone-600 focus:outline-none focus:border-[#E2DFD2] transition-colors resize-none"
            />
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3 rounded-xl bg-[#E2DFD2] hover:bg-[#d6d3c6] active:bg-[#c9c6ba] text-stone-950 font-bold text-sm transition-all cursor-pointer flex items-center justify-center gap-2 shadow-sm disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Membuka Shift...</span>
                </>
              ) : (
                <>
                  <PlayCircle className="w-4 h-4 stroke-[2.5]" />
                  <span>Buka Shift & Masuk ke Kasir</span>
                </>
              )}
            </button>
          </div>
        </form>

      </div>
    </div>
  )
}
