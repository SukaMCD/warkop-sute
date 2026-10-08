import React, { useState } from 'react'
import {
  ArrowLeft,
  X,
  Building2,
  Zap,
  Droplets,
  Wifi,
  Users,
  Wrench,
  Package,
  Calendar,
  CreditCard,
  Wallet,
  Landmark,
  Check,
  AlertCircle,
  TrendingDown
} from 'lucide-react'
import type { OverheadCategory, OverheadExpense } from '../../types'
import { formatRupiah } from '../../utils/formatters'
import { apiFetch } from '../../utils/api'

interface OverheadExpenseModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: (newExpense: OverheadExpense) => void
}

const CATEGORIES: { id: OverheadCategory; label: string; icon: React.ElementType; desc: string }[] = [
  { id: 'rent', label: 'Sewa Ruko / Tempat', icon: Building2, desc: 'Sewa tempat bulanan / tahunan' },
  { id: 'electricity', label: 'Listrik PLN', icon: Zap, desc: 'Token listrik & tagihan bulanan' },
  { id: 'water', label: 'Air PDAM & Galon', icon: Droplets, desc: 'Tagihan air PAM & isi ulang galon' },
  { id: 'internet', label: 'WiFi & Internet', icon: Wifi, desc: 'Paket fixed broadband bulanan' },
  { id: 'salary', label: 'Gaji / Upah Tim', icon: Users, desc: 'Gaji barista, kasir & kru warkop' },
  { id: 'maintenance', label: 'Servis & Perbaikan', icon: Wrench, desc: 'Servis mesin espresso & alat' },
  { id: 'other', label: 'Operasional Lainnya', icon: Package, desc: 'Kebersihan, sampah & perlengkapan' }
]

const PAYMENT_SOURCES: { id: 'owner_funds' | 'cash_drawer' | 'bank_transfer'; label: string; desc: string; icon: React.ElementType }[] = [
  { id: 'owner_funds', label: 'Dana Pribadi Owner', desc: 'Dibayar langsung dari rekening pribadi', icon: Wallet },
  { id: 'cash_drawer', label: 'Laci Kas Toko', desc: 'Diambil dari uang kas fisik di laci', icon: CreditCard },
  { id: 'bank_transfer', label: 'Transfer Bank Toko', desc: 'Transfer rekening operasional warkop', icon: Landmark }
]

const QUICK_AMOUNTS = [50000, 100000, 250000, 500000, 1000000, 2500000, 5000000]

export const OverheadExpenseModal: React.FC<OverheadExpenseModalProps> = ({
  isOpen,
  onClose,
  onSuccess
}) => {
  const todayStr = new Date().toISOString().slice(0, 10)

  const [category, setCategory] = useState<OverheadCategory>('electricity')
  const [amount, setAmount] = useState<string>('')
  const [description, setDescription] = useState<string>('')
  const [paidDate, setPaidDate] = useState<string>(todayStr)
  const [paymentSource, setPaymentSource] = useState<'owner_funds' | 'cash_drawer' | 'bank_transfer'>('owner_funds')
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)

  if (!isOpen) return null

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/[^0-9]/g, '')
    setAmount(val)
  }

  const handleSelectQuickAmount = (val: number) => {
    setAmount(String(val))
  }

  const handleKeypadPress = (val: string) => {
    if (val === 'C') {
      setAmount('')
      return
    }
    if (val === 'DEL') {
      setAmount(prev => prev.slice(0, -1))
      return
    }
    if (val === '00' || val === '000') {
      if (!amount || amount === '0') return
      setAmount(prev => prev + val)
      return
    }
    setAmount(prev => {
      if (prev === '0') return val
      return prev + val
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const numAmount = Number(amount)

    if (!numAmount || numAmount <= 0) {
      setError('Masukkan nominal pengeluaran yang valid.')
      return
    }

    if (!paidDate) {
      setError('Pilih tanggal pembayaran.')
      return
    }

    setIsSubmitting(true)
    setError(null)

    try {
      const res = await apiFetch('/api/expenses/overhead', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          category,
          amount: numAmount,
          description: description.trim() || activeCategoryMeta.label,
          paid_date: paidDate,
          payment_source: paymentSource
        })
      })

      const data: any = await res.json()
      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Gagal menyimpan catatan beban operasional.')
      }

      onSuccess(data.data)
      setAmount('')
      setDescription('')
      setCategory('electricity')
      setPaymentSource('owner_funds')
      setPaidDate(todayStr)
      onClose()
    } catch (err: any) {
      setError(err.message || 'Terjadi kesalahan sistem saat menyimpan.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const activeCategoryMeta = CATEGORIES.find(c => c.id === category) || CATEGORIES[0]
  const activeSourceMeta = PAYMENT_SOURCES.find(s => s.id === paymentSource) || PAYMENT_SOURCES[0]
  const numericAmount = Number(amount) || 0

  return (
    <div className="fixed inset-0 z-50 bg-[#FBF9F5] dark:bg-stone-950 flex flex-col text-stone-900 dark:text-stone-100 animate-in fade-in duration-150 overflow-hidden">
      
      {/* Top Application Bar */}
      <header className="h-16 px-6 lg:px-8 border-b border-stone-200 dark:border-stone-850 bg-white dark:bg-stone-900 flex items-center justify-between shrink-0 shadow-xs">
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="p-2 -ml-2 rounded-xl text-stone-500 hover:text-stone-900 dark:text-stone-400 dark:hover:text-stone-100 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors cursor-pointer flex items-center gap-2 text-xs font-semibold"
            title="Kembali ke Dashboard"
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="hidden sm:inline">Kembali</span>
          </button>

          <div className="h-5 w-px bg-stone-200 dark:border-stone-800 hidden sm:block" />

          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-100 dark:bg-amber-950/60 border border-amber-300 dark:border-amber-800/80 flex items-center justify-center text-amber-800 dark:text-amber-400 shadow-xs">
              <Building2 className="w-4 h-4 stroke-[2.2]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-sm sm:text-base font-bold text-stone-900 dark:text-stone-100 tracking-tight">
                  Catat Beban Operasional / Overhead Toko
                </h1>
                <span className="hidden md:inline-block px-2 py-0.5 rounded-md text-[10px] font-mono uppercase tracking-wider font-bold bg-amber-100 text-amber-900 dark:bg-stone-800 dark:text-[#E2DFD2] border border-amber-200 dark:border-stone-700">
                  Owner Desk
                </span>
              </div>
              <p className="text-[11px] text-stone-500 dark:text-stone-400 hidden sm:block">
                Pencatatan pengeluaran sewa, utilitas, gaji, dan servis mesin tanpa bergantung pada shift kasir
              </p>
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={onClose}
          disabled={isSubmitting}
          className="p-2 rounded-xl text-stone-400 hover:text-stone-700 hover:bg-stone-100 dark:text-stone-400 dark:hover:text-stone-100 dark:hover:bg-stone-800 transition-colors cursor-pointer"
          title="Tutup Layar (Esc)"
        >
          <X className="w-5 h-5" />
        </button>
      </header>

      {/* Main Fullscreen Form (2 Columns: Left Data, Right Keypad & Execution) */}
      <form onSubmit={handleSubmit} className="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-12 overflow-hidden">
        
        {/* Left Column (7 cols): Data Selection (Categories, Dates, Source, Notes) */}
        <div className="lg:col-span-7 xl:col-span-7 overflow-y-auto p-6 lg:p-8 space-y-6 border-b lg:border-b-0 lg:border-r border-stone-200 dark:border-stone-850">
          
          {error && (
            <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 flex items-start gap-3 text-xs text-rose-700 dark:text-rose-300">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Section 1: Kategori Beban */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xs font-bold font-mono uppercase tracking-wider text-stone-500 dark:text-stone-400">
                  1. Kategori Pengeluaran
                </h3>
                <p className="text-xs text-stone-900 dark:text-stone-100 font-semibold mt-0.5">
                  Pilih jenis pos beban operasional
                </p>
              </div>
              <span className="text-xs font-mono font-medium text-amber-800 dark:text-[#E2DFD2] px-2.5 py-1 rounded-lg bg-amber-50 dark:bg-stone-900 border border-amber-200 dark:border-stone-800">
                {activeCategoryMeta.label}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-2.5">
              {CATEGORIES.map(cat => {
                const Icon = cat.icon
                const isSelected = category === cat.id
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setCategory(cat.id)}
                    className={`p-3.5 rounded-2xl border text-left flex items-start gap-3 transition-all cursor-pointer ${
                      isSelected
                        ? 'border-amber-700 bg-amber-50/80 text-amber-950 dark:border-[#E2DFD2] dark:bg-stone-850 dark:text-[#E2DFD2] shadow-xs'
                        : 'border-stone-200 dark:border-stone-850 bg-white dark:bg-stone-900 hover:border-stone-300 dark:hover:border-stone-700 text-stone-700 dark:text-stone-300'
                    }`}
                  >
                    <div className={`p-2 rounded-xl shrink-0 transition-colors ${
                      isSelected 
                        ? 'bg-amber-700 text-white dark:bg-[#E2DFD2] dark:text-stone-950' 
                        : 'bg-stone-100 dark:bg-stone-800 text-stone-500 dark:text-stone-400'
                    }`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-1">
                        <span className="text-xs font-bold leading-tight">{cat.label}</span>
                        {isSelected && <Check className="w-3.5 h-3.5 text-amber-800 dark:text-[#E2DFD2] shrink-0 stroke-[2.5]" />}
                      </div>
                      <p className="text-[11px] text-stone-500 dark:text-stone-400 mt-0.5 line-clamp-1">{cat.desc}</p>
                    </div>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Section 2: Sumber Pembayaran */}
          <div className="space-y-3 pt-2">
            <div>
              <h3 className="text-xs font-bold font-mono uppercase tracking-wider text-stone-500 dark:text-stone-400">
                2. Sumber Dana Pembayaran
              </h3>
              <p className="text-xs text-stone-900 dark:text-stone-100 font-semibold mt-0.5">
                Alokasi kas yang digunakan untuk membayar beban ini
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              {PAYMENT_SOURCES.map(src => {
                const Icon = src.icon
                const isSelected = paymentSource === src.id
                return (
                  <button
                    key={src.id}
                    type="button"
                    onClick={() => setPaymentSource(src.id)}
                    className={`p-3.5 rounded-2xl border text-left flex flex-col justify-between gap-2 transition-all cursor-pointer ${
                      isSelected
                        ? 'border-amber-700 bg-amber-50/80 text-amber-950 dark:border-[#E2DFD2] dark:bg-stone-850 dark:text-[#E2DFD2] shadow-xs'
                        : 'border-stone-200 dark:border-stone-850 bg-white dark:bg-stone-900 hover:border-stone-300 dark:hover:border-stone-700 text-stone-700 dark:text-stone-300'
                    }`}
                  >
                    <div className="flex items-center justify-between w-full">
                      <div className={`p-2 rounded-xl shrink-0 ${
                        isSelected 
                          ? 'bg-amber-700 text-white dark:bg-[#E2DFD2] dark:text-stone-950' 
                          : 'bg-stone-100 dark:bg-stone-800 text-stone-500 dark:text-stone-400'
                      }`}>
                        <Icon className="w-4 h-4" />
                      </div>
                      {isSelected && <Check className="w-3.5 h-3.5 text-amber-800 dark:text-[#E2DFD2] stroke-[2.5]" />}
                    </div>
                    <div>
                      <span className="text-xs font-bold block">{src.label}</span>
                      <p className="text-[10px] text-stone-500 dark:text-stone-400 mt-0.5 line-clamp-1">{src.desc}</p>
                    </div>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Section 3: Tanggal Pembayaran & Catatan */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            <div className="space-y-1.5">
              <label className="text-xs font-bold font-mono uppercase tracking-wider text-stone-500 dark:text-stone-400 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5" />
                <span>Tanggal Bayar</span>
              </label>
              <input
                type="date"
                value={paidDate}
                onChange={e => setPaidDate(e.target.value)}
                required
                className="w-full px-3.5 py-3 rounded-xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100 font-mono text-xs focus:outline-hidden focus:ring-2 focus:ring-amber-700 dark:focus:ring-stone-600 shadow-xs"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold font-mono uppercase tracking-wider text-stone-500 dark:text-stone-400">
                Catatan / Deskripsi Tambahan
              </label>
              <input
                type="text"
                value={description}
                onChange={e => setDescription(e.target.value)}
                placeholder="Misal: Token listrik PLN meteran utama warkop"
                className="w-full px-3.5 py-3 rounded-xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100 text-xs focus:outline-hidden focus:ring-2 focus:ring-amber-700 dark:focus:ring-stone-600 shadow-xs placeholder:text-stone-400"
              />
            </div>
          </div>

        </div>

        {/* Right Column (5 cols): Amount Input, Tactile Keypad, Summary & Submit */}
        <div className="lg:col-span-5 xl:col-span-5 bg-stone-100/70 dark:bg-stone-900/40 p-6 lg:p-8 flex flex-col justify-between overflow-y-auto space-y-6">
          
          <div className="space-y-5">
            {/* Display Nominal Besar */}
            <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl p-5 shadow-xs space-y-2">
              <div className="flex items-center justify-between text-xs text-stone-500 dark:text-stone-400 font-mono uppercase tracking-wider">
                <span>Nominal Pengeluaran</span>
                <span className="text-[11px] text-rose-600 dark:text-rose-400 font-bold flex items-center gap-1">
                  <TrendingDown className="w-3.5 h-3.5" />
                  Pengurang Laba
                </span>
              </div>

              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 font-mono text-lg font-bold text-stone-400 dark:text-stone-500">
                  Rp
                </span>
                <input
                  type="text"
                  inputMode="numeric"
                  value={amount ? Number(amount).toLocaleString('id-ID') : ''}
                  onChange={handleAmountChange}
                  placeholder="0"
                  required
                  className="w-full pl-12 pr-4 py-3 rounded-xl border border-stone-200 dark:border-stone-800 bg-stone-50/50 dark:bg-stone-950/60 text-stone-900 dark:text-stone-100 font-mono text-2xl sm:text-3xl font-bold focus:outline-hidden focus:ring-2 focus:ring-amber-700 dark:focus:ring-stone-600 transition-all placeholder:text-stone-300 dark:placeholder:text-stone-700"
                />
              </div>

              {/* Quick Preset Buttons */}
              <div className="flex flex-wrap gap-1.5 pt-1">
                {QUICK_AMOUNTS.map(val => (
                  <button
                    key={val}
                    type="button"
                    onClick={() => handleSelectQuickAmount(val)}
                    className="px-2.5 py-1 rounded-lg border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-850 text-[11px] font-mono text-stone-700 dark:text-stone-300 hover:text-stone-950 dark:hover:text-stone-100 hover:border-stone-300 dark:hover:border-stone-700 transition-colors cursor-pointer shadow-xs"
                  >
                    +{formatRupiah(val)}
                  </button>
                ))}
              </div>
            </div>

            {/* Tactile Keypad (Touch Screen & Mouse Friendly) */}
            <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl p-4 shadow-xs space-y-2">
              <div className="text-[11px] font-mono uppercase tracking-wider text-stone-400 dark:text-stone-500 font-semibold px-1">
                Keypad Cepat
              </div>
              <div className="grid grid-cols-3 gap-2">
                {['1', '2', '3', '4', '5', '6', '7', '8', '9', 'C', '0', '000'].map((k) => (
                  <button
                    key={k}
                    type="button"
                    onClick={() => handleKeypadPress(k)}
                    className={`h-12 rounded-xl border text-sm font-mono font-bold transition-all cursor-pointer active:scale-95 flex items-center justify-center ${
                      k === 'C'
                        ? 'bg-rose-50 border-rose-200 text-rose-700 dark:bg-rose-950/40 dark:border-rose-900/60 dark:text-rose-400 hover:bg-rose-100'
                        : k === '000'
                        ? 'bg-stone-100 dark:bg-stone-800 border-stone-200 dark:border-stone-700 text-stone-800 dark:text-stone-200 hover:bg-stone-200/80'
                        : 'bg-stone-50 dark:bg-stone-950/60 border-stone-200 dark:border-stone-800 text-stone-900 dark:text-stone-100 hover:bg-stone-100 dark:hover:bg-stone-850'
                    }`}
                  >
                    {k}
                  </button>
                ))}
              </div>
            </div>

            {/* Ringkasan Beban & Dampak Pembukuan */}
            <div className="p-4 rounded-2xl bg-amber-500/10 dark:bg-amber-950/20 border border-amber-300 dark:border-amber-900/50 space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-stone-600 dark:text-stone-400">Kategori:</span>
                <span className="font-semibold text-stone-900 dark:text-stone-100">{activeCategoryMeta.label}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-stone-600 dark:text-stone-400">Sumber Dana:</span>
                <span className="font-mono text-stone-900 dark:text-stone-200">{activeSourceMeta.label}</span>
              </div>
              <div className="pt-2 border-t border-amber-200/60 dark:border-amber-900/40 flex items-center justify-between font-bold">
                <span className="text-stone-700 dark:text-stone-300">Pengurangan Laba Bersih:</span>
                <span className="font-mono text-rose-600 dark:text-rose-400 text-sm tabular-nums">
                  {numericAmount > 0 ? `-${formatRupiah(numericAmount)}` : 'Rp 0'}
                </span>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="pt-4 border-t border-stone-200 dark:border-stone-800 flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="w-1/3 py-3.5 rounded-2xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 text-stone-700 dark:text-stone-300 hover:text-stone-900 dark:hover:text-stone-100 text-xs font-bold transition-all cursor-pointer text-center"
            >
              Batal
            </button>

            <button
              type="submit"
              disabled={isSubmitting || numericAmount <= 0}
              className="w-2/3 py-3.5 rounded-2xl bg-stone-900 text-white dark:bg-[#E2DFD2] dark:text-stone-950 text-xs font-bold hover:bg-stone-850 dark:hover:bg-[#d6d3c4] transition-all cursor-pointer disabled:opacity-40 shadow-md flex items-center justify-center gap-2 active:scale-95"
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                  <span>Menyimpan...</span>
                </>
              ) : (
                <span>Simpan Beban Operasional</span>
              )}
            </button>
          </div>

        </div>

      </form>

    </div>
  )
}
