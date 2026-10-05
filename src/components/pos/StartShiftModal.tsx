import { useState, useEffect } from 'react'
import { PlayCircle, Clock, ShieldCheck, Loader2 } from 'lucide-react'
import type { User, Shift } from '../../types'
import { NumericInput } from '../ui/NumericInput'
import { SearchableSelect } from '../ui/SearchableSelect'
import { apiFetch } from '../../utils/api'

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
    apiFetch('/api/users?role=cashier')
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
      const res = await apiFetch('/api/shifts/start', {
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
        cashier_id: cashierId,
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
    <div className="fixed inset-0 z-50 bg-[#FBF9F5] dark:bg-stone-950 flex flex-col text-stone-900 dark:text-stone-100 animate-in fade-in duration-150">
      
      {/* Header Bar */}
      <header className="px-6 py-4 border-b border-stone-200 dark:border-stone-800 bg-white/80 dark:bg-stone-900/60 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-stone-50 dark:bg-stone-900 border border-stone-200 dark:border-stone-800 flex items-center justify-center text-amber-700 dark:text-[#E2DFD2] shadow-xs shrink-0">
            <PlayCircle className="w-5 h-5 stroke-2" />
          </div>
          <div>
            <h2 className="text-base font-bold text-stone-900 dark:text-stone-100">
              Mulai Shift Kasir Baru
            </h2>
            <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5">
              Masukkan saldo modal awal fisik di laci kasir
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs font-mono text-stone-600 dark:text-stone-400 bg-stone-100 dark:bg-stone-900 border border-stone-200 dark:border-stone-800 px-3 py-1.5 rounded-lg">
            Terminal Kasir
          </span>
        </div>
      </header>

      {/* Fullscreen Form */}
      <form onSubmit={handleSubmit} className="flex-1 flex flex-col min-h-0">
        <div className="flex-1 overflow-y-auto px-6 sm:px-12 py-8">
          <div className="max-w-3xl mx-auto space-y-6">
            
            {/* Info Petugas & Waktu */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-5 rounded-2xl bg-white dark:bg-stone-900/60 border border-stone-200 dark:border-stone-800 shadow-xs">
              <div>
                <span className="text-xs text-stone-500 uppercase tracking-wider font-mono block mb-1.5">
                  Petugas Kasir
                </span>
                {cashiers.length > 0 ? (
                  <SearchableSelect
                    value={cashierId}
                    onChange={id => {
                      setCashierId(id)
                      const found = cashiers.find(c => c.id === id)
                      if (found) setCashierName(found.name)
                    }}
                    options={cashiers.map(c => ({
                      value: c.id,
                      label: c.name,
                      badge: 'Kasir'
                    }))}
                    placeholder="Pilih petugas kasir..."
                    searchPlaceholder="Cari nama kasir..."
                  />
                ) : (
                  <span className="text-sm font-bold text-stone-900 dark:text-stone-200 mt-1 block truncate">
                    {currentUser.name}
                  </span>
                )}
              </div>
              <div>
                <span className="text-xs text-stone-500 uppercase tracking-wider font-mono flex items-center gap-1.5 mb-1.5">
                  <Clock className="w-4 h-4 text-stone-400" />
                  <span>Jam Mulai Shift</span>
                </span>
                <span className="text-base font-mono font-bold text-amber-800 dark:text-[#E2DFD2] block mt-1">
                  {currentTime} WIB
                </span>
              </div>
            </div>

            {errorMsg && (
              <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-300 text-xs">
                {errorMsg}
              </div>
            )}

            <div>
              <label className="text-stone-800 dark:text-stone-200 text-xs font-semibold block mb-1.5 font-mono uppercase tracking-wider">
                Saldo Awal Laci / Modal Kas (Rp) <span className="text-rose-500">*</span>
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
              <p className="text-xs text-stone-500 dark:text-stone-400 mt-2 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-amber-700 dark:text-[#E2DFD2] shrink-0" />
                <span>Hitung uang fisik di laci kasir secara teliti sebelum mulai transaksi.</span>
              </p>
            </div>

            <div>
              <label className="text-stone-800 dark:text-stone-200 text-xs font-semibold block mb-1.5 font-mono uppercase tracking-wider">
                Catatan Pembukaan (Opsional)
              </label>
              <textarea
                rows={4}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Contoh: Pecahan 50rb (1 lbr), 20rb (2 lbr), 10rb (1 lbr)..."
                className="w-full bg-white dark:bg-stone-900/80 border border-stone-200 dark:border-stone-800 rounded-xl px-4 py-3 text-xs text-stone-900 dark:text-stone-100 placeholder-stone-400 dark:placeholder-stone-600 focus:outline-none focus:border-amber-700 dark:focus:border-[#E2DFD2] transition-colors resize-none shadow-xs"
              />
            </div>

          </div>
        </div>

        {/* Sticky Bottom Fullscreen Footer Bar */}
        <footer className="border-t border-stone-200 dark:border-stone-800 bg-white/90 dark:bg-stone-900/90 backdrop-blur px-6 sm:px-12 py-4 flex items-center justify-end shrink-0">
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full sm:w-auto px-10 py-3.5 rounded-xl bg-amber-700 hover:bg-amber-800 active:bg-amber-900 text-white dark:bg-[#E2DFD2] dark:hover:bg-[#d6d3c6] dark:active:bg-[#c9c6ba] dark:text-stone-950 font-bold text-sm transition-all cursor-pointer flex items-center justify-center gap-2 shadow-xs disabled:opacity-50"
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
        </footer>
      </form>
    </div>
  )
}
