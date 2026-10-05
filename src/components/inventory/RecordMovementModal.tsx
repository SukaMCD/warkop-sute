import { useState } from 'react'
import {
  X,
  ArrowDownLeft,
  ArrowUpRight,
  Trash2,
  Loader2,
  Package,
  AlertCircle
} from 'lucide-react'
import type { RawMaterial, StockMovementType, StockMovement } from '../../types'
import { SearchableSelect } from '../ui/SearchableSelect'
import { NumericInput } from '../ui/NumericInput'

interface RecordMovementModalProps {
  isOpen: boolean
  onClose: () => void
  materials: RawMaterial[]
  initialMaterialId?: string
  initialType?: StockMovementType
  currentUserName: string
  onMovementSuccess: (movement: StockMovement, updatedMaterial: RawMaterial) => void
}

export const RecordMovementModal = ({
  isOpen,
  onClose,
  materials,
  initialMaterialId,
  initialType = 'in',
  currentUserName,
  onMovementSuccess
}: RecordMovementModalProps) => {
  const [selectedMaterialId, setSelectedMaterialId] = useState<string>(
    initialMaterialId || (materials.length > 0 ? materials[0].id : '')
  )
  const [type, setType] = useState<StockMovementType>(initialType)
  const [quantity, setQuantity] = useState<number | ''>('')
  const [notes, setNotes] = useState<string>('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')

  if (!isOpen) return null

  const selectedMaterial = materials.find(m => m.id === selectedMaterialId) || materials[0]

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const numQty = Number(quantity)
    if (!numQty || numQty <= 0) {
      setErrorMessage('Jumlah stok harus lebih dari 0')
      return
    }

    if (!selectedMaterialId) {
      setErrorMessage('Pilih bahan baku terlebih dahulu')
      return
    }

    setIsSubmitting(true)
    setErrorMessage('')

    try {
      const res = await fetch('/api/inventory/movement', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          material_id: selectedMaterialId,
          type,
          quantity: numQty,
          notes: notes.trim() || undefined,
          created_by_name: currentUserName
        })
      })

      const json: any = await res.json()
      if (res.ok && json.success && json.data) {
        onMovementSuccess(json.data.movement, json.data.material)
        onClose()
      } else {
        setErrorMessage(json.message || 'Gagal mencatat mutasi stok.')
      }
    } catch {
      // Offline fallback
      let newStock = selectedMaterial.current_stock
      if (type === 'in') newStock += numQty
      else if (type === 'out' || type === 'waste') newStock = Math.max(0, newStock - numQty)
      else if (type === 'adjustment') newStock = numQty

      const updatedMat: RawMaterial = {
        ...selectedMaterial,
        current_stock: newStock,
        last_restocked_at: type === 'in' ? new Date().toISOString() : selectedMaterial.last_restocked_at
      }

      const mockMovement: StockMovement = {
        id: `mov_${Date.now()}`,
        material_id: selectedMaterialId,
        material_name: selectedMaterial.name,
        type,
        quantity: numQty,
        unit: selectedMaterial.unit,
        notes: notes.trim() || undefined,
        created_by_name: currentUserName,
        created_at: new Date().toISOString()
      }

      onMovementSuccess(mockMovement, updatedMat)
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
            <Package className="w-5 h-5 stroke-2" />
          </div>
          <div>
            <h3 className="text-base font-bold text-stone-900 dark:text-stone-100">
              Catat Perubahan Stok Bahan
            </h3>
            <p className="text-xs text-stone-500 dark:text-stone-400">
              Input stok masuk belanjaan, pemakaian, atau barang rusak
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

            {/* Movement Type Buttons */}
            <div>
              <label className="block text-xs font-mono text-stone-700 dark:text-stone-400 uppercase tracking-wider mb-2 font-semibold">
                Jenis Perubahan
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 p-1.5 rounded-2xl bg-stone-100 dark:bg-stone-900/80 border border-stone-200 dark:border-stone-800">
                <button
                  type="button"
                  onClick={() => setType('in')}
                  className={`py-3 px-3 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                    type === 'in'
                      ? 'bg-emerald-100/80 border border-emerald-500 text-emerald-900 shadow-xs dark:bg-emerald-950/90 dark:border-emerald-600 dark:text-emerald-300'
                      : 'text-stone-500 hover:text-stone-800 dark:text-stone-400 dark:hover:text-stone-200'
                  }`}
                >
                  <ArrowDownLeft className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  <span className="font-bold">Masuk (+)</span>
                </button>

                <button
                  type="button"
                  onClick={() => setType('out')}
                  className={`py-3 px-3 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                    type === 'out'
                      ? 'bg-amber-100/80 border border-amber-500 text-amber-900 shadow-xs dark:bg-[#E2DFD2]/15 dark:border-[#E2DFD2]/70 dark:text-[#E2DFD2]'
                      : 'text-stone-500 hover:text-stone-800 dark:text-stone-400 dark:hover:text-stone-200'
                  }`}
                >
                  <ArrowUpRight className="w-4 h-4 text-amber-800 dark:text-[#E2DFD2]" />
                  <span className="font-bold">Pakai (-)</span>
                </button>

                <button
                  type="button"
                  onClick={() => setType('waste')}
                  className={`py-3 px-3 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                    type === 'waste'
                      ? 'bg-rose-100/80 border border-rose-500 text-rose-900 shadow-xs dark:bg-rose-950/90 dark:border-rose-600 dark:text-rose-300'
                      : 'text-stone-500 hover:text-stone-800 dark:text-stone-400 dark:hover:text-stone-200'
                  }`}
                >
                  <Trash2 className="w-4 h-4 text-rose-600 dark:text-rose-400" />
                  <span className="font-bold">Rusak / Basi</span>
                </button>
              </div>
            </div>

            {/* Material & Stock in 2 columns */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-mono text-stone-700 dark:text-stone-400 uppercase tracking-wider mb-1.5 font-semibold">
                  Pilih Bahan Baku <span className="text-rose-500 dark:text-rose-400">*</span>
                </label>
                <SearchableSelect
                  value={selectedMaterialId}
                  onChange={setSelectedMaterialId}
                  searchPlaceholder="Ketik untuk mencari bahan baku..."
                  placeholder="Pilih bahan baku..."
                  options={materials.map((m) => ({
                    value: m.id,
                    label: m.name,
                    sublabel: `${m.current_stock} ${m.unit}`,
                    badge: m.category
                  }))}
                />
              </div>

              <div>
                <label className="block text-xs font-mono text-stone-700 dark:text-stone-400 uppercase tracking-wider mb-1.5 font-semibold">
                  Jumlah ({selectedMaterial?.unit || 'satuan'}) <span className="text-rose-500 dark:text-rose-400">*</span>
                </label>
                <NumericInput
                  value={quantity}
                  onChange={(val) => setQuantity(val)}
                  allowDecimals={true}
                  min={0.1}
                  step={1}
                  placeholder="0"
                  suffix={selectedMaterial?.unit}
                  required
                />
              </div>
            </div>

            {/* Current Stock Preview Card */}
            {selectedMaterial && (
              <div className="p-4 rounded-2xl bg-white dark:bg-stone-900/60 border border-stone-200 dark:border-stone-800 flex items-center justify-between text-xs shadow-xs">
                <span className="text-stone-500 dark:text-stone-400">Stok Saat Ini di Gudang:</span>
                <span className="font-mono font-bold text-stone-900 dark:text-stone-200 text-sm">
                  {selectedMaterial.current_stock} {selectedMaterial.unit}
                </span>
              </div>
            )}

            {/* Live Estimasi Sisa Stok */}
            {selectedMaterial && quantity && typeof quantity === 'number' && quantity > 0 ? (
              <div className="p-4 rounded-2xl bg-amber-50/50 dark:bg-stone-900/40 border border-amber-200 dark:border-stone-800/80 flex items-center justify-between text-xs shadow-xs">
                <span className="text-amber-800 dark:text-stone-400 font-mono">Estimasi stok setelah perubahan:</span>
                <span className="font-bold text-amber-900 dark:text-[#E2DFD2] font-mono text-sm">
                  {type === 'in'
                    ? selectedMaterial.current_stock + quantity
                    : Math.max(0, selectedMaterial.current_stock - quantity)}{' '}
                  {selectedMaterial.unit}
                </span>
              </div>
            ) : null}

            {/* Notes / Alasan */}
            <div>
              <label className="block text-xs font-mono text-stone-700 dark:text-stone-400 uppercase tracking-wider mb-1.5 font-semibold">
                Keterangan / Catatan (Opsional)
              </label>
              <textarea
                rows={3}
                placeholder={
                  type === 'in'
                    ? 'Contoh: Belanja di pasar 5 bungkus'
                    : type === 'waste'
                    ? 'Contoh: Telur pecah saat dibuka peti'
                    : 'Contoh: Dipakai buat masak menu shift siang'
                }
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full bg-white dark:bg-stone-900/80 border border-stone-200 dark:border-stone-800 rounded-xl px-3.5 py-2.5 text-xs text-stone-900 dark:text-stone-100 placeholder-stone-400 dark:placeholder-stone-600 focus:outline-none focus:border-stone-900 dark:focus:border-[#E2DFD2] transition-colors resize-none shadow-xs"
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
              <span>Simpan Perubahan</span>
            )}
          </button>
        </footer>
      </form>
    </div>
  )
}
