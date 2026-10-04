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
      const res = await fetch(`/api/shifts/${shiftId}/expenses`, {
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-stone-900 border border-stone-800 rounded-3xl w-full max-w-md p-5 sm:p-6 shadow-2xl relative space-y-4 max-h-[92vh] overflow-y-auto">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-stone-800">
          <div className="flex items-center gap-2.5">
            <div className={`w-9 h-9 rounded-2xl flex items-center justify-center border shadow-xs ${
              isExpense
                ? 'bg-amber-950/60 border-amber-800/80 text-amber-400'
                : 'bg-emerald-950/60 border-emerald-800/80 text-emerald-400'
            }`}>
              {isExpense ? (
                <ArrowUpRight className="w-5 h-5 stroke-[2.2]" />
              ) : (
                <ArrowDownLeft className="w-5 h-5 stroke-[2.2]" />
              )}
            </div>
            <div>
              <h3 className="text-sm font-bold text-stone-100">
                Kas Shift: {isExpense ? 'Pengeluaran (Kas Keluar)' : 'Pemasukan (Kas Masuk)'}
              </h3>
              <p className="text-[11px] text-stone-400">
                {isExpense 
                  ? 'Catat belanja darurat/operasional (misal: Gas LPG, Es Batu)' 
                  : 'Catat tambahan modal atau titipan kas masuk laci'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-xl bg-stone-950 hover:bg-stone-800 border border-stone-800 flex items-center justify-center text-stone-400 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Selection: Kas Keluar vs Kas Masuk */}
        <div className="grid grid-cols-2 p-1 rounded-2xl bg-stone-950 border border-stone-800 gap-1">
          <button
            type="button"
            onClick={() => handleTabChange('expense')}
            className={`py-2 px-3 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              isExpense
                ? 'bg-amber-950/70 border border-amber-700/60 text-amber-300 shadow-xs'
                : 'text-stone-400 hover:text-stone-200'
            }`}
          >
            <ArrowUpRight className="w-3.5 h-3.5" />
            <span>Kas Keluar (Pengeluaran)</span>
          </button>

          <button
            type="button"
            onClick={() => handleTabChange('income')}
            className={`py-2 px-3 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              !isExpense
                ? 'bg-emerald-950/70 border border-emerald-700/60 text-emerald-300 shadow-xs'
                : 'text-stone-400 hover:text-stone-200'
            }`}
          >
            <ArrowDownLeft className="w-3.5 h-3.5" />
            <span>Kas Masuk (Pemasukan)</span>
          </button>
        </div>

        {errorMessage && (
          <div className="p-3 rounded-xl bg-rose-950/50 border border-rose-900/60 flex items-center gap-2 text-rose-300 text-xs">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
            <span>{errorMessage}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          
          {/* Quick Presets */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-[11px] font-mono text-stone-400 uppercase tracking-wider font-semibold">
                {isExpense ? 'Kebutuhan Umum Pengeluaran' : 'Kategori Pemasukan'}
              </label>
              {isExpense && (
                <span className="text-[10px] text-[#E2DFD2]/90 font-mono">
                  Contoh: Gas Habis
                </span>
              )}
            </div>
            <div className="flex flex-wrap gap-1.5">
              {presets.map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => {
                    setDescription(preset)
                    // If Gas LPG selected and amount empty, default to standard Rp 22.000
                    if (preset.includes('Gas LPG') && !amount) {
                      setAmount(22000)
                    }
                  }}
                  className={`text-[11px] px-2.5 py-1 rounded-lg border transition-all cursor-pointer ${
                    description === preset
                      ? isExpense
                        ? 'bg-amber-950/80 border-amber-600 text-amber-200 font-semibold'
                        : 'bg-emerald-950/80 border-emerald-600 text-emerald-200 font-semibold'
                      : 'bg-stone-950 border-stone-800 text-stone-400 hover:text-stone-200 hover:border-stone-700'
                  }`}
                >
                  {preset}
                </button>
              ))}
            </div>
          </div>

          {/* Description Input */}
          <div>
            <label className="block text-[11px] font-mono text-stone-400 uppercase tracking-wider mb-1 font-semibold">
              Keterangan {isExpense ? 'Pengeluaran' : 'Pemasukan'} <span className="text-rose-400">*</span>
            </label>
            <input
              type="text"
              required
              placeholder={isExpense ? "Contoh: Beli Gas LPG 3kg tabung melon" : "Contoh: Tambahan modal uang receh dari Owner"}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full bg-stone-950 border border-stone-800 rounded-xl px-3 py-2.5 text-xs text-stone-100 placeholder-stone-500 focus:outline-none focus:border-[#E2DFD2] transition-colors"
            />
          </div>

          {/* Amount Input & Quick Nominal Chips */}
          <div>
            <label className="block text-[11px] font-mono text-stone-400 uppercase tracking-wider mb-1 font-semibold">
              Nominal Uang (Rp) <span className="text-rose-400">*</span>
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
                  className={`text-[10px] font-mono px-2 py-0.5 rounded-md border transition-all cursor-pointer ${
                    amount === q
                      ? 'bg-[#E2DFD2] text-stone-950 border-[#E2DFD2] font-bold'
                      : 'bg-stone-950 border-stone-800 text-stone-400 hover:text-stone-200'
                  }`}
                >
                  +{formatRupiah(q)}
                </button>
              ))}
            </div>

            {amount && typeof amount === 'number' && amount > 0 ? (
              <div className={`mt-2 p-2.5 rounded-xl border text-xs flex items-center justify-between ${
                isExpense
                  ? 'bg-amber-950/30 border-amber-900/60 text-amber-300'
                  : 'bg-emerald-950/30 border-emerald-900/60 text-emerald-300'
              }`}>
                <span>{isExpense ? 'Saldo laci berkurang:' : 'Saldo laci bertambah:'}</span>
                <span className="font-mono font-bold text-sm">
                  {isExpense ? '-' : '+'}{formatRupiah(amount)}
                </span>
              </div>
            ) : null}
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2 pt-2 border-t border-stone-800">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 rounded-xl bg-stone-950 border border-stone-800 hover:bg-stone-800 text-stone-300 text-xs font-semibold transition-colors cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className={`flex-1 py-2.5 rounded-xl text-stone-950 text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50 shadow-sm ${
                isExpense
                  ? 'bg-[#E2DFD2] hover:bg-[#edebe2] active:bg-[#d6d3c6]'
                  : 'bg-emerald-500 hover:bg-emerald-400'
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
          </div>
        </form>

        {/* Existing Shift History Accordion */}
        {shiftExpenses.length > 0 && (
          <div className="pt-2 border-t border-stone-800">
            <button
              type="button"
              onClick={() => setShowHistory(!showHistory)}
              className="w-full flex items-center justify-between text-[11px] font-mono text-stone-400 hover:text-stone-200 cursor-pointer py-1"
            >
              <div className="flex items-center gap-1.5">
                <History className="w-3.5 h-3.5" />
                <span>Riwayat Kas Shift Ini ({shiftExpenses.length} catatan)</span>
              </div>
              <span className="text-[10px] text-stone-500">
                {showHistory ? 'Sembunyikan ▲' : 'Lihat ▼'}
              </span>
            </button>

            {showHistory && (
              <div className="mt-2 space-y-1.5 max-h-36 overflow-y-auto pr-1">
                {shiftExpenses.map((exp) => {
                  const isInc = exp.type === 'income' || exp.description.startsWith('[Kas Masuk]')
                  const cleanDesc = exp.description.replace(/^\[(Kas Masuk|Kas Keluar)\]\s*/, '')
                  return (
                    <div
                      key={exp.id}
                      className="p-2 rounded-xl bg-stone-950 border border-stone-800 flex items-center justify-between text-xs"
                    >
                      <div className="flex items-center gap-2">
                        <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded border uppercase font-bold ${
                          isInc
                            ? 'bg-emerald-950/60 border-emerald-800 text-emerald-400'
                            : 'bg-amber-950/60 border-amber-800 text-amber-400'
                        }`}>
                          {isInc ? 'Masuk' : 'Keluar'}
                        </span>
                        <span className="text-stone-200 text-[11px] truncate max-w-42.5 sm:max-w-52.5">
                          {cleanDesc}
                        </span>
                      </div>
                      <span className={`font-mono font-bold text-xs tabular-nums ${
                        isInc ? 'text-emerald-400' : 'text-amber-400'
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
  )
}
