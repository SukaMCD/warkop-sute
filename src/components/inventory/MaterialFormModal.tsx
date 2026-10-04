import { useState, useEffect } from 'react'
import {
  X,
  Plus,
  Pencil,
  Loader2,
  AlertCircle
} from 'lucide-react'
import type { RawMaterial } from '../../types'
import { formatRupiah } from '../../utils/formatters'
import { SearchableSelect } from '../ui/SearchableSelect'
import { NumericInput } from '../ui/NumericInput'

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

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-stone-900 border border-stone-800 rounded-3xl w-full max-w-lg p-5 sm:p-6 shadow-2xl relative space-y-4 max-h-[92vh] overflow-y-auto">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-stone-800">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-stone-950 border border-stone-800 flex items-center justify-center text-[#E2DFD2] shadow-xs">
              {isEditing ? <Pencil className="w-4 h-4 stroke-2" /> : <Plus className="w-4 h-4 stroke-2" />}
            </div>
            <div>
              <h3 className="text-sm font-bold text-stone-100">
                {isEditing ? 'Edit Master Bahan Baku' : 'Tambah Bahan Baku Baru'}
              </h3>
              <p className="text-[11px] text-stone-400">
                Khusus Owner: Kelola spesifikasi bahan, satuan, dan harga modal (HPP)
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

        {errorMessage && (
          <div className="p-3 rounded-xl bg-rose-950/50 border border-rose-900/60 flex items-center gap-2 text-rose-300 text-xs">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
            <span>{errorMessage}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          
          {/* Nama Bahan */}
          <div>
            <label className="block text-[11px] font-mono text-stone-400 uppercase tracking-wider mb-1 font-semibold">
              Nama Bahan Baku <span className="text-rose-400">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="Contoh: Gas LPG 3kg Melon / Biji Kopi Robusta"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-stone-950 border border-stone-800 rounded-xl px-3 py-2.5 text-xs text-stone-100 placeholder-stone-600 focus:outline-none focus:border-[#E2DFD2] transition-colors"
            />
          </div>

          {/* Kategori & Satuan */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-mono text-stone-400 uppercase tracking-wider mb-1 font-semibold">
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
              <label className="block text-[11px] font-mono text-stone-400 uppercase tracking-wider mb-1 font-semibold">
                Satuan Ukuran <span className="text-rose-400">*</span>
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  required
                  placeholder="kg / kaleng / tabung"
                  value={unit}
                  onChange={(e) => setUnit(e.target.value)}
                  className="w-full bg-stone-950 border border-stone-800 rounded-xl px-3 py-2 text-xs text-stone-100 placeholder-stone-600 focus:outline-none focus:border-[#E2DFD2] transition-colors font-mono"
                />
              </div>
              <div className="flex flex-wrap gap-1 mt-1.5">
                {COMMON_UNITS.slice(0, 6).map((u) => (
                  <button
                    key={u}
                    type="button"
                    onClick={() => setUnit(u)}
                    className={`text-[10px] font-mono px-1.5 py-0.5 rounded border cursor-pointer ${
                      unit === u
                        ? 'bg-[#E2DFD2] text-stone-950 border-[#E2DFD2] font-bold'
                        : 'bg-stone-950 border-stone-800 text-stone-400 hover:text-stone-200'
                    }`}
                  >
                    {u}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Stok Awal & Peringatan Minimum */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-mono text-stone-400 uppercase tracking-wider mb-1 font-semibold">
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
              <label className="block text-[11px] font-mono text-stone-400 uppercase tracking-wider mb-1 font-semibold">
                Batas Minimum Alert ({unit || 'satuan'})
              </label>
              <NumericInput
                value={minStockAlert}
                onChange={(val) => setMinStockAlert(val)}
                allowDecimals={true}
                min={0}
                step={1}
                placeholder="3"
                suffix={unit}
              />
              <span className="text-[10px] text-stone-500 font-mono mt-0.5 block">
                Notifikasi merah jika sisa stok &le; batas ini
              </span>
            </div>
          </div>

          {/* Harga Beli Modal (HPP) - Khusus Owner */}
          <div className="p-3.5 rounded-2xl bg-stone-900/80 border border-stone-800 space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-[11px] font-mono text-[#E2DFD2] uppercase tracking-wider font-semibold block">
                Harga Modal / Beli per {unit || 'satuan'} (Rp)
              </label>
              <span className="text-[10px] font-mono text-stone-400">Kerahasiaan Owner</span>
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
              <span className="text-[11px] font-mono text-[#E2DFD2] font-semibold block">
                {formatRupiah(costPerUnit)} / {unit}
              </span>
            ) : null}
          </div>

          {/* Supplier */}
          <div>
            <label className="block text-[11px] font-mono text-stone-400 uppercase tracking-wider mb-1 font-semibold">
              Supplier / Toko Langganan (Opsional)
            </label>
            <input
              type="text"
              placeholder="Contoh: Pangkalan Gas Barokah, Pasar Induk"
              value={supplier}
              onChange={(e) => setSupplier(e.target.value)}
              className="w-full bg-stone-950 border border-stone-800 rounded-xl px-3 py-2 text-xs text-stone-100 placeholder-stone-600 focus:outline-none focus:border-[#E2DFD2] transition-colors"
            />
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
              className="flex-1 py-2.5 rounded-xl bg-[#E2DFD2] hover:bg-[#d6d3c6] text-stone-950 text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50 shadow-sm"
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
          </div>
        </form>

      </div>
    </div>
  )
}
