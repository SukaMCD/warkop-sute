import { useState } from 'react'
import {
  X,
  ArrowUpRight,
  ArrowDownLeft,
  Loader2,
  Banknote,
  AlertCircle,
  History
} from 'lucide-react'
import { formatRupiah } from '../../utils/formatters'
import type { ShiftExpense } from '../../types'
import { NumericInput } from '../ui/NumericInput'
import { apiFetch } from '../../utils/api'

interface RecordExpenseModalProps {
  isOpen: boolean
  onClose: () => void
  shiftId: string
  cashierId?: string
  shiftExpenses?: ShiftExpense[]
  onExpenseRecorded: (expense: ShiftExpense) => void
}

const EXPENSE_PRESETS = [
  'Beli Gas LPG 3kg',
  'Beli Es Batu Kristal',
  'Beli Galon Aqua',
  'Beli Susu Kental Manis',
  'Beli Plastik & Sedotan',
  'Kebutuhan Dapur & Cuci',
  'Lain-lain'
]

const INCOME_PRESETS = [
  'Tambah Modal Kasir (Owner)',
  'Kembalian Belanja Operasional',
  'Titipan Kas Masuk',
  'Pendapatan Kas Lain',
  'Lain-lain'
]

const QUICK_AMOUNTS_EXPENSE = [10000, 15000, 22000, 25000, 50000, 100000]
const QUICK_AMOUNTS_INCOME = [20000, 50000, 100000, 200000, 500000]

export const RecordExpenseModal = ({
  isOpen,
  onClose,
  shiftId,
  cashierId,
  shiftExpenses = [],
  onExpenseRecorded
}: RecordExpenseModalProps) => {
  const [activeTab, setActiveTab] = useState<'expense' | 'income'>('expense')
  const [amount, setAmount] = useState<number | ''>('')
  const [description, setDescription] = useState<string>('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const [showHistory, setShowHistory] = useState(false)

  if (!isOpen) return null

  const isExpense = activeTab === 'expense'
  const presets = isExpense ? EXPENSE_PRESETS : INCOME_PRESETS
  const quickAmounts = isExpense ? QUICK_AMOUNTS_EXPENSE : QUICK_AMOUNTS_INCOME

  const handleTabChange = (tab: 'expense' | 'income') => {
    setActiveTab(tab)
    setDescription('')
    setErrorMessage('')
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const numAmount = Number(amount)
    if (!numAmount || numAmount <= 0) {
      setErrorMessage(`Nominal ${isExpense ? 'pengeluaran' : 'pemasukan'} harus lebih dari Rp 0`)
      return
    }
    if (!description.trim()) {
      setErrorMessage(`Keterangan ${isExpense ? 'pengeluaran' : 'pemasukan'} wajib diisi`)
      return
    }

    setIsSubmitting(true)
    setErrorMessage('')

    try {
      const res = await apiFetch(`/api/shifts/${shiftId}/expenses`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cashier_id: cashierId,
          amount: numAmount,
          description: description.trim(),
          type: activeTab
        })
      })

      const data: any = await res.json()
      if (res.ok && data.success && data.data) {
        onExpenseRecorded({
          ...data.data,
          type: activeTab
        })
        setAmount('')
        setDescription('')
        onClose()
      } else {
        setErrorMessage(data.message || `Gagal menyimpan ${isExpense ? 'pengeluaran' : 'pemasukan'} kas.`)
      }
    } catch {
      // Fallback offline
      const formattedDesc = isExpense
        ? description.trim()
        : `[Kas Masuk] ${description.trim()}`

      const mockExp: ShiftExpense = {
        id: `exp_${Date.now()}`,
        shift_id: shiftId,
        cashier_id: cashierId,
        amount: numAmount,
        description: formattedDesc,
        type: activeTab,
        created_at: new Date().toISOString()
      }
      onExpenseRecorded(mockExp)
      setAmount('')
      setDescription('')
      onClose()
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-[#FBF9F5] dark:bg-stone-950 flex flex-col text-stone-900 dark:text-stone-100 animate-in fade-in duration-150">
      
      {/* Header Bar */}
      <header className="px-6 py-4 border-b border-stone-200 dark:border-stone-800 bg-white/80 dark:bg-stone-900/60 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-2xl flex items-center justify-center border shadow-xs ${
            isExpense
              ? 'bg-amber-100 border-amber-300 text-amber-800 dark:bg-amber-950/60 dark:border-amber-800/80 dark:text-amber-400'
              : 'bg-emerald-100 border-emerald-300 text-emerald-800 dark:bg-emerald-950/60 dark:border-emerald-800/80 dark:text-emerald-400'
          }`}>
            {isExpense ? (
              <ArrowUpRight className="w-5 h-5 stroke-[2.2]" />
            ) : (
              <ArrowDownLeft className="w-5 h-5 stroke-[2.2]" />
            )}
          </div>
          <div>
            <h3 className="text-base font-bold text-stone-900 dark:text-stone-100">
              Kas Shift: {isExpense ? 'Pengeluaran (Kas Keluar)' : 'Pemasukan (Kas Masuk)'}
            </h3>
            <p className="text-xs text-stone-500 dark:text-stone-400">
              {isExpense 
                ? 'Catat belanja darurat/operasional (misal: Gas LPG, Es Batu)' 
                : 'Catat tambahan modal atau titipan kas masuk laci'}
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="p-2 rounded-xl text-stone-400 hover:text-stone-700 hover:bg-stone-100 dark:text-stone-400 dark:hover:text-stone-100 dark:hover:bg-stone-800 transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>
      </header>

      {/* Fullscreen Form */}
      <form onSubmit={handleSubmit} className="flex-1 flex flex-col min-h-0">
        <div className="flex-1 overflow-y-auto px-6 sm:px-12 py-8">
          <div className="max-w-4xl mx-auto space-y-6">

            {/* Tab Selection: Kas Keluar vs Kas Masuk */}
            <div className="grid grid-cols-1 sm:grid-cols-2 p-1.5 rounded-2xl bg-stone-100 dark:bg-stone-900/80 border border-stone-200 dark:border-stone-800 gap-2">
              <button
                type="button"
                onClick={() => handleTabChange('expense')}
                className={`py-3 px-4 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                  isExpense
                    ? 'bg-amber-500/15 border border-amber-600/50 text-amber-900 dark:bg-amber-950/90 dark:border-amber-600 dark:text-amber-300 shadow-sm'
                    : 'text-stone-500 hover:text-stone-900 dark:text-stone-400 dark:hover:text-stone-200'
                }`}
              >
                <ArrowUpRight className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                <span className="font-bold">Kas Keluar (Pengeluaran)</span>
              </button>

              <button
                type="button"
                onClick={() => handleTabChange('income')}
                className={`py-3 px-4 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                  !isExpense
                    ? 'bg-emerald-500/15 border border-emerald-600/50 text-emerald-900 dark:bg-emerald-950/90 dark:border-emerald-600 dark:text-emerald-300 shadow-sm'
                    : 'text-stone-500 hover:text-stone-900 dark:text-stone-400 dark:hover:text-stone-200'
                }`}
              >
                <ArrowDownLeft className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <span className="font-bold">Kas Masuk (Pemasukan)</span>
              </button>
            </div>

            {errorMessage && (
              <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 dark:bg-rose-950/50 dark:border-rose-900/60 flex items-center gap-2 text-rose-700 dark:text-rose-300 text-xs">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-500 dark:text-rose-400" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* Quick Presets */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-mono text-stone-500 dark:text-stone-400 uppercase tracking-wider font-semibold">
                  {isExpense ? 'Kebutuhan Umum Pengeluaran' : 'Kategori Pemasukan'}
                </label>
                {isExpense && (
                  <span className="text-[11px] text-amber-800 dark:text-[#E2DFD2]/90 font-mono">
                    Contoh: Gas Habis
                  </span>
                )}
              </div>
              <div className="flex flex-wrap gap-2">
                {presets.map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => {
                      setDescription(preset)
                      if (preset.includes('Gas LPG') && !amount) {
                        setAmount(22000)
                      }
                    }}
                    className={`text-xs px-3 py-1.5 rounded-xl border transition-all cursor-pointer ${
                      description === preset
                        ? isExpense
                          ? 'bg-amber-500/15 border-amber-600 text-amber-900 dark:bg-amber-950/80 dark:border-amber-600 dark:text-amber-200 font-semibold'
                          : 'bg-emerald-500/15 border-emerald-600 text-emerald-900 dark:bg-emerald-950/80 dark:border-emerald-600 dark:text-emerald-200 font-semibold'
                        : 'bg-white dark:bg-stone-900/60 border-stone-200 dark:border-stone-800 text-stone-700 dark:text-stone-300 hover:text-stone-950 dark:hover:text-stone-100 hover:bg-stone-100 dark:hover:bg-stone-850'
                    }`}
                  >
                    {preset}
                  </button>
                ))}
              </div>
            </div>

            {/* Description & Amount in 2 columns */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-mono text-stone-500 dark:text-stone-400 uppercase tracking-wider mb-1.5 font-semibold">
                  Keterangan {isExpense ? 'Pengeluaran' : 'Pemasukan'} <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder={isExpense ? "Contoh: Beli Gas LPG 3kg tabung melon" : "Contoh: Tambahan modal uang receh dari Owner"}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full bg-white dark:bg-stone-900/80 border border-stone-200 dark:border-stone-800 rounded-xl px-4 py-2.5 text-xs text-stone-900 dark:text-stone-100 placeholder-stone-400 dark:placeholder-stone-500 focus:outline-none focus:border-stone-700 dark:focus:border-[#E2DFD2] transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-mono text-stone-500 dark:text-stone-400 uppercase tracking-wider mb-1.5 font-semibold">
                  Nominal Uang (Rp) <span className="text-rose-500">*</span>
                </label>
                <NumericInput
                  value={amount}
                  onChange={(val) => setAmount(val)}
                  min={500}
                  step={1000}
                  prefix="Rp"
                  placeholder="22.000"
                  required
                />

                {/* Quick Nominal Buttons */}
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {quickAmounts.map((q) => (
                    <button
                      key={q}
                      type="button"
                      onClick={() => setAmount(q)}
                      className={`text-[10px] font-mono px-2 py-0.5 rounded-lg border transition-all cursor-pointer ${
                        amount === q
                          ? 'bg-stone-900 text-stone-50 border-stone-900 dark:bg-[#E2DFD2] dark:text-stone-950 dark:border-[#E2DFD2] font-bold'
                          : 'bg-stone-100 dark:bg-stone-900/80 border-stone-200 dark:border-stone-800 text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-200'
                      }`}
                    >
                      +{formatRupiah(q)}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {amount && typeof amount === 'number' && amount > 0 ? (
              <div className={`p-4 rounded-2xl border text-xs flex items-center justify-between ${
                isExpense
                  ? 'bg-amber-500/10 border-amber-300 dark:bg-amber-950/30 dark:border-amber-900/60 text-amber-900 dark:text-amber-300'
                  : 'bg-emerald-500/10 border-emerald-300 dark:bg-emerald-950/30 dark:border-emerald-900/60 text-emerald-900 dark:text-emerald-300'
              }`}>
                <span>{isExpense ? 'Saldo laci berkurang:' : 'Saldo laci bertambah:'}</span>
                <span className="font-mono font-bold text-base">
                  {isExpense ? '-' : '+'}{formatRupiah(amount)}
                </span>
              </div>
            ) : null}

            {/* Existing Shift History Accordion */}
            {shiftExpenses.length > 0 && (
              <div className="pt-4 border-t border-stone-200 dark:border-stone-800/80 space-y-3">
                <button
                  type="button"
                  onClick={() => setShowHistory(!showHistory)}
                  className="w-full flex items-center justify-between text-xs font-mono text-stone-500 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-200 cursor-pointer py-1"
                >
                  <div className="flex items-center gap-2">
                    <History className="w-4 h-4 text-stone-400" />
                    <span className="font-semibold">Riwayat Kas Shift Ini ({shiftExpenses.length} catatan)</span>
                  </div>
                  <span className="text-xs text-stone-500">
                    {showHistory ? 'Sembunyikan ▲' : 'Lihat ▼'}
                  </span>
                </button>

                {showHistory && (
                  <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                    {shiftExpenses.map((exp) => {
                      const isInc = exp.type === 'income' || exp.description.startsWith('[Kas Masuk]')
                      const cleanDesc = exp.description.replace(/^\[(Kas Masuk|Kas Keluar)\]\s*/, '')
                      return (
                        <div
                          key={exp.id}
                          className="p-3 rounded-xl bg-white dark:bg-stone-900/60 border border-stone-200 dark:border-stone-800 flex items-center justify-between text-xs shadow-xs"
                        >
                          <div className="flex items-center gap-2.5">
                            <span className={`text-[10px] font-mono px-2 py-0.5 rounded-lg border uppercase font-bold ${
                              isInc
                                ? 'bg-emerald-100 border-emerald-300 text-emerald-800 dark:bg-emerald-950/60 dark:border-emerald-800 dark:text-emerald-400'
                                : 'bg-amber-100 border-amber-300 text-amber-800 dark:bg-amber-950/60 dark:border-amber-800 dark:text-amber-400'
                            }`}>
                              {isInc ? 'Masuk' : 'Keluar'}
                            </span>
                            <span className="text-stone-800 dark:text-stone-200 text-xs font-medium">
                              {cleanDesc}
                            </span>
                          </div>
                          <span className={`font-mono font-bold text-xs tabular-nums ${
                            isInc ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400'
                          }`}>
                            {isInc ? '+' : '-'}{formatRupiah(exp.amount)}
                          </span>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            )}

          </div>
        </div>

        {/* Sticky Bottom Fullscreen Footer Bar */}
        <footer className="border-t border-stone-200 dark:border-stone-800 bg-[#FAF8F5]/90 dark:bg-stone-900/90 backdrop-blur px-6 sm:px-12 py-4 flex items-center justify-between shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-6 py-2.5 rounded-xl border border-stone-200 hover:bg-stone-100 text-stone-700 text-xs font-semibold transition-colors cursor-pointer dark:border-stone-800 dark:hover:bg-stone-800 dark:text-stone-300"
          >
            Batal
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className={`px-8 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 shadow-sm ${
              isExpense
                ? 'bg-stone-900 hover:bg-stone-800 text-stone-50 dark:bg-[#E2DFD2] dark:hover:bg-[#edebe2] dark:active:bg-[#d6d3c6] dark:text-stone-950'
                : 'bg-emerald-600 hover:bg-emerald-500 text-white'
            }`}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Menyimpan...</span>
              </>
            ) : (
              <>
                <Banknote className="w-4 h-4" />
                <span>Simpan {isExpense ? 'Kas Keluar' : 'Kas Masuk'}</span>
              </>
            )}
          </button>
        </footer>
      </form>
    </div>
  )
}
