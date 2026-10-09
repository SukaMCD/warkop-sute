import { useState, useEffect } from 'react'
import {
  X,
  Plus,
  Pencil,
  Loader2,
  AlertCircle
} from 'lucide-react'
import type { RawMaterial } from '../../types'
import { SearchableSelect } from '../ui/SearchableSelect'
import { NumericInput } from '../ui/NumericInput'
import { InfoTooltip } from '../ui/InfoTooltip'
import { formatRupiah } from '../../utils/formatters'
import { apiFetch } from '../../utils/api'

interface MaterialFormModalProps {
  isOpen: boolean
  onClose: () => void
  materialToEdit?: RawMaterial | null
  onSaveSuccess: (material: RawMaterial) => void
}

const CATEGORIES = [
  'Kopi & Minuman',
  'Bahan Makanan',
  'Gas & Operasional',
  'Kemasan',
  'Lain-lain'
]

const COMMON_UNITS = ['kg', 'gram', 'kaleng', 'tabung', 'galon', 'bungkus', 'butir', 'karung', 'box', 'pcs', 'liter', 'pak']

export const MaterialFormModal = ({
  isOpen,
  onClose,
  materialToEdit,
  onSaveSuccess
}: MaterialFormModalProps) => {
  const isEditing = !!materialToEdit

  const [name, setName] = useState('')
  const [category, setCategory] = useState('Kopi & Minuman')
  const [currentStock, setCurrentStock] = useState<number | ''>('')
  const [unit, setUnit] = useState('kg')
  const [minStockAlert, setMinStockAlert] = useState<number | ''>(3)
  const [costPerUnit, setCostPerUnit] = useState<number | ''>('')
  const [supplier, setSupplier] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')

  useEffect(() => {
    if (materialToEdit) {
      setName(materialToEdit.name)
      setCategory(materialToEdit.category)
      setCurrentStock(materialToEdit.current_stock)
      setUnit(materialToEdit.unit)
      setMinStockAlert(materialToEdit.min_stock_alert)
      setCostPerUnit(materialToEdit.cost_per_unit || '')
      setSupplier(materialToEdit.supplier || '')
    } else {
      setName('')
      setCategory('Kopi & Minuman')
      setCurrentStock('')
      setUnit('kg')
      setMinStockAlert(3)
      setCostPerUnit('')
      setSupplier('')
    }
    setErrorMessage('')
  }, [materialToEdit, isOpen])

  if (!isOpen) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) {
      setErrorMessage('Nama bahan baku wajib diisi')
      return
    }

    setIsSubmitting(true)
    setErrorMessage('')

    const payload = {
      name: name.trim(),
      category,
      current_stock: Number(currentStock) || 0,
      unit: unit.trim() || 'pcs',
      min_stock_alert: Number(minStockAlert) || 0,
      cost_per_unit: Number(costPerUnit) || 0,
      supplier: supplier.trim() || undefined
    }

    try {
      const url = isEditing ? `/api/inventory/${materialToEdit.id}` : '/api/inventory'
      const method = isEditing ? 'PUT' : 'POST'

      const res = await apiFetch(url, {
        method,
        body: JSON.stringify(payload)
      })

      const json: any = await res.json()
      if (res.ok && json.success && json.data) {
        onSaveSuccess(json.data)
        onClose()
      } else {
        setErrorMessage(json.message || 'Gagal menyimpan bahan baku.')
      }
    } catch {
      // Local fallback
      const saved: RawMaterial = {
        id: isEditing ? materialToEdit.id : `raw_${Date.now()}`,
        name: payload.name,
        category: payload.category,
        current_stock: payload.current_stock,
        unit: payload.unit,
        min_stock_alert: payload.min_stock_alert,
        cost_per_unit: payload.cost_per_unit,
        supplier: payload.supplier,
        last_restocked_at: isEditing ? materialToEdit.last_restocked_at : new Date().toISOString()
      }
      onSaveSuccess(saved)
      onClose()
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-[#FBF9F5] dark:bg-stone-950 flex flex-col text-stone-900 dark:text-stone-100 animate-in fade-in duration-150">
      
      {/* Header Bar */}
      <header className="px-6 py-4 border-b border-stone-200 dark:border-stone-800 bg-white/80 dark:bg-stone-900/60 backdrop-blur-xs flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-stone-100 dark:bg-stone-900 border border-stone-200 dark:border-stone-800 flex items-center justify-center text-amber-800 dark:text-[#E2DFD2] shadow-xs">
            {isEditing ? <Pencil className="w-5 h-5 stroke-2" /> : <Plus className="w-5 h-5 stroke-2" />}
          </div>
          <div>
            <h3 className="text-base font-bold text-stone-900 dark:text-stone-100">
              {isEditing ? 'Edit Master Bahan Baku' : 'Tambah Bahan Baku Baru'}
            </h3>
            <p className="text-xs text-stone-500 dark:text-stone-400">
              Khusus Owner: Kelola spesifikasi bahan, satuan, dan harga modal (HPP)
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="p-2 rounded-xl text-stone-400 hover:text-stone-900 dark:hover:text-stone-100 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>
      </header>

      {/* Fullscreen Form */}
      <form onSubmit={handleSubmit} className="flex-1 flex flex-col min-h-0">
        <div className="flex-1 overflow-y-auto px-6 sm:px-12 py-8">
          <div className="max-w-4xl mx-auto space-y-6">

            {errorMessage && (
              <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 flex items-center gap-2 text-rose-800 dark:bg-rose-950/50 dark:border-rose-900/60 dark:text-rose-300 text-xs">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-600 dark:text-rose-400" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* Nama Bahan */}
            <div>
              <label className="block text-xs font-mono text-stone-700 dark:text-stone-400 uppercase tracking-wider mb-1.5 font-semibold">
                Nama Bahan Baku <span className="text-rose-500 dark:text-rose-400">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="Contoh: Gas LPG 3kg Melon / Biji Kopi Robusta"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-white dark:bg-stone-900/80 border border-stone-200 dark:border-stone-800 rounded-xl px-4 py-3 text-xs text-stone-900 dark:text-stone-100 placeholder-stone-400 dark:placeholder-stone-600 focus:outline-none focus:border-stone-900 dark:focus:border-[#E2DFD2] transition-colors shadow-xs"
              />
            </div>

            {/* Kategori & Satuan */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-mono text-stone-700 dark:text-stone-400 uppercase tracking-wider mb-1.5 font-semibold">
                  Kategori
                </label>
                <SearchableSelect
                  value={category}
                  onChange={setCategory}
                  searchPlaceholder="Cari kategori..."
                  placeholder="Pilih kategori..."
                  options={CATEGORIES.map((c) => ({
                    value: c,
                    label: c
                  }))}
                />
              </div>

              <div>
                <label className="block text-xs font-mono text-stone-700 dark:text-stone-400 uppercase tracking-wider mb-1.5 font-semibold">
                  Satuan Ukuran <span className="text-rose-500 dark:text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="kg / kaleng / tabung"
                  value={unit}
                  onChange={(e) => setUnit(e.target.value)}
                  className="w-full bg-white dark:bg-stone-900/80 border border-stone-200 dark:border-stone-800 rounded-xl px-4 py-2.5 text-xs text-stone-900 dark:text-stone-100 placeholder-stone-400 dark:placeholder-stone-600 focus:outline-none focus:border-stone-900 dark:focus:border-[#E2DFD2] transition-colors font-mono shadow-xs"
                />
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {COMMON_UNITS.slice(0, 6).map((u) => (
                    <button
                      key={u}
                      type="button"
                      onClick={() => setUnit(u)}
                      className={`text-[10px] font-mono px-2 py-0.5 rounded-lg border cursor-pointer transition-all ${
                        unit === u
                          ? 'bg-stone-900 text-white border-stone-900 font-bold shadow-xs dark:bg-[#E2DFD2] dark:text-stone-950 dark:border-[#E2DFD2]'
                          : 'bg-white dark:bg-stone-900/80 border-stone-200 dark:border-stone-800 text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-800'
                      }`}
                    >
                      {u}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Stok Awal & Peringatan Minimum */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-mono text-stone-700 dark:text-stone-400 uppercase tracking-wider mb-1.5 font-semibold">
                  Stok Fisik Saat Ini ({unit || 'satuan'})
                </label>
                <NumericInput
                  value={currentStock}
                  onChange={(val) => setCurrentStock(val)}
                  allowDecimals={true}
                  min={0}
                  step={1}
                  placeholder="0"
                  suffix={unit}
                />
              </div>

              <div>
                <div className="flex items-center gap-1.5 mb-1.5">
                  <label className="block text-xs font-mono text-stone-700 dark:text-stone-400 uppercase tracking-wider font-semibold">
                    Batas Minimum Alert ({unit || 'satuan'})
                  </label>
                  <InfoTooltip
                    title="Batas Minimum Stok"
                    content="Jika stok fisik menyentuh angka ini atau lebih rendah, sistem akan menandai status 'Menipis' agar segera belanja ulang."
                    placement="top"
                    align="left"
                  />
                </div>
                <NumericInput
                  value={minStockAlert}
                  onChange={(val) => setMinStockAlert(val)}
                  allowDecimals={true}
                  min={0}
                  step={1}
                  placeholder="3"
                  suffix={unit}
                />
                <span className="text-[11px] text-stone-500 font-mono mt-1 block">
                  Notifikasi merah jika sisa stok &le; batas ini
                </span>
              </div>
            </div>

            {/* Harga Beli Modal (HPP) - Khusus Owner */}
            <div className="p-4 rounded-2xl bg-white dark:bg-stone-900/60 border border-stone-200 dark:border-stone-800 space-y-2 shadow-xs">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <label className="text-xs font-mono text-amber-800 dark:text-[#E2DFD2] uppercase tracking-wider font-semibold block">
                    Harga Modal / Beli per {unit || 'satuan'} (Rp)
                  </label>
                  <InfoTooltip
                    title="Harga Modal Bahan (HPP)"
                    content="Biaya modal bahan baku per satuan fisik saat belanja (tidak digabung dengan biaya listrik atau sewa ruko)."
                    placement="top"
                    align="left"
                  />
                </div>
                <span className="text-[10px] font-mono text-stone-500 dark:text-stone-400">Kerahasiaan Owner</span>
              </div>
              <NumericInput
                value={costPerUnit}
                onChange={(val) => setCostPerUnit(val)}
                prefix="Rp"
                min={0}
                step={500}
                placeholder="0"
                suffix={`/ ${unit || 'satuan'}`}
              />
              {costPerUnit && typeof costPerUnit === 'number' && costPerUnit > 0 ? (
                <span className="text-xs font-mono text-amber-900 dark:text-[#E2DFD2] font-semibold block">
                  {formatRupiah(costPerUnit)} / {unit}
                </span>
              ) : null}
            </div>

            {/* Supplier */}
            <div>
              <label className="block text-xs font-mono text-stone-700 dark:text-stone-400 uppercase tracking-wider mb-1.5 font-semibold">
                Supplier / Toko Langganan (Opsional)
              </label>
              <input
                type="text"
                placeholder="Contoh: Pangkalan Gas Barokah, Pasar Induk"
                value={supplier}
                onChange={(e) => setSupplier(e.target.value)}
                className="w-full bg-white dark:bg-stone-900/80 border border-stone-200 dark:border-stone-800 rounded-xl px-4 py-2.5 text-xs text-stone-900 dark:text-stone-100 placeholder-stone-400 dark:placeholder-stone-600 focus:outline-none focus:border-stone-900 dark:focus:border-[#E2DFD2] transition-colors shadow-xs"
              />
            </div>

          </div>
        </div>

        {/* Sticky Bottom Fullscreen Footer Bar */}
        <footer className="border-t border-stone-200 dark:border-stone-800 bg-white/90 dark:bg-stone-900/90 backdrop-blur-xs px-6 sm:px-12 py-4 flex items-center justify-between shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-6 py-2.5 rounded-xl border border-stone-200 dark:border-stone-800 hover:bg-stone-100 dark:hover:bg-stone-800 text-stone-700 dark:text-stone-300 text-xs font-semibold transition-colors cursor-pointer"
          >
            Batal
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-8 py-2.5 rounded-xl bg-stone-900 hover:bg-stone-800 text-stone-50 dark:bg-[#E2DFD2] dark:hover:bg-[#d6d3c6] text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 shadow-sm"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Menyimpan...</span>
              </>
            ) : (
              <span>{isEditing ? 'Simpan Perubahan' : 'Tambah Bahan Baku'}</span>
            )}
          </button>
        </footer>
      </form>
    </div>
  )
}
