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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-stone-900 border border-stone-800 rounded-3xl w-full max-w-md p-5 sm:p-6 shadow-2xl relative space-y-4">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-stone-800">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-stone-950 border border-stone-800 flex items-center justify-center text-[#E2DFD2] shadow-xs">
              <Package className="w-4 h-4 stroke-2" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-stone-100">
                Catat Perubahan Stok Bahan
              </h3>
              <p className="text-[11px] text-stone-400">
                Input stok masuk belanjaan, pemakaian, atau barang rusak
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
          
          {/* Movement Type Buttons */}
          <div>
            <label className="block text-[11px] font-mono text-stone-400 uppercase tracking-wider mb-1.5 font-semibold">
              Jenis Perubahan
            </label>
            <div className="grid grid-cols-3 gap-1.5 p-1 rounded-2xl bg-stone-950 border border-stone-800">
              <button
                type="button"
                onClick={() => setType('in')}
                className={`py-2 px-2 rounded-xl text-[11px] font-semibold flex items-center justify-center gap-1 transition-all cursor-pointer ${
                  type === 'in'
                    ? 'bg-emerald-950/80 border border-emerald-700/70 text-emerald-300 shadow-xs'
                    : 'text-stone-400 hover:text-stone-200'
                }`}
              >
                <ArrowDownLeft className="w-3.5 h-3.5 text-emerald-400" />
                <span>Masuk (+)</span>
              </button>

              <button
                type="button"
                onClick={() => setType('out')}
                className={`py-2 px-2 rounded-xl text-[11px] font-semibold flex items-center justify-center gap-1 transition-all cursor-pointer ${
                  type === 'out'
                    ? 'bg-[#E2DFD2]/10 border border-[#E2DFD2]/60 text-[#E2DFD2] shadow-xs'
                    : 'text-stone-400 hover:text-stone-200'
                }`}
              >
                <ArrowUpRight className="w-3.5 h-3.5 text-[#E2DFD2]" />
                <span>Pakai (-)</span>
              </button>

              <button
                type="button"
                onClick={() => setType('waste')}
                className={`py-2 px-2 rounded-xl text-[11px] font-semibold flex items-center justify-center gap-1 transition-all cursor-pointer ${
                  type === 'waste'
                    ? 'bg-rose-950/80 border border-rose-700/70 text-rose-300 shadow-xs'
                    : 'text-stone-400 hover:text-stone-200'
                }`}
              >
                <Trash2 className="w-3.5 h-3.5 text-rose-400" />
                <span>Rusak / Basi</span>
              </button>
            </div>
          </div>

          {/* Material Searchable Select */}
          <div>
            <label className="block text-[11px] font-mono text-stone-400 uppercase tracking-wider mb-1 font-semibold">
              Pilih Bahan Baku <span className="text-rose-400">*</span>
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

          {/* Current Stock Preview Card */}
          {selectedMaterial && (
            <div className="p-3 rounded-2xl bg-stone-950 border border-stone-800 flex items-center justify-between text-xs">
              <span className="text-stone-400">Stok Saat Ini di Gudang:</span>
              <span className="font-mono font-bold text-stone-200">
                {selectedMaterial.current_stock} {selectedMaterial.unit}
              </span>
            </div>
          )}

          {/* Quantity Input with thousand dots & decimal support */}
          <div>
            <label className="block text-[11px] font-mono text-stone-400 uppercase tracking-wider mb-1 font-semibold">
              Jumlah ({selectedMaterial?.unit || 'satuan'}) <span className="text-rose-400">*</span>
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

            {/* Live Estimasi Sisa Stok */}
            {selectedMaterial && quantity && typeof quantity === 'number' && quantity > 0 ? (
              <div className="mt-2 text-[11px] font-mono text-stone-400 flex justify-between">
                <span>Estimasi stok setelah perubahan:</span>
                <span className="font-bold text-[#E2DFD2]">
                  {type === 'in'
                    ? selectedMaterial.current_stock + quantity
                    : Math.max(0, selectedMaterial.current_stock - quantity)}{' '}
                  {selectedMaterial.unit}
                </span>
              </div>
            ) : null}
          </div>

          {/* Notes / Alasan */}
          <div>
            <label className="block text-[11px] font-mono text-stone-400 uppercase tracking-wider mb-1 font-semibold">
              Keterangan / Catatan (Opsional)
            </label>
            <input
              type="text"
              placeholder={
                type === 'in'
                  ? 'Contoh: Belanja di pasar 5 bungkus'
                  : type === 'waste'
                  ? 'Contoh: Telur pecah saat dibuka peti'
                  : 'Contoh: Dipakai buat masak menu shift siang'
              }
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
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
                <span>Simpan Perubahan</span>
              )}
            </button>
          </div>
        </form>

      </div>
    </div>
  )
}
