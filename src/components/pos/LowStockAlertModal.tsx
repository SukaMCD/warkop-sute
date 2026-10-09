import { useState } from 'react'
import {
  X,
  AlertTriangle,
  AlertCircle,
  Check,
  Copy,
  ShoppingCart,
  Boxes
} from 'lucide-react'
import type { RawMaterial } from '../../types'

interface LowStockAlertModalProps {
  isOpen: boolean
  onClose: () => void
  materials: RawMaterial[]
  cashierName?: string
  onQuickBuyMaterial?: (materialName: string) => void
}

export const LowStockAlertModal = ({
  isOpen,
  onClose,
  materials,
  cashierName,
  onQuickBuyMaterial
}: LowStockAlertModalProps) => {
  const [copied, setCopied] = useState(false)

  if (!isOpen) return null

  // Categorize materials
  const outOfStock = materials.filter(m => (m.current_stock || 0) <= 0)
  const lowStock = materials.filter(
    m => (m.current_stock || 0) > 0 && (m.current_stock || 0) <= (m.min_stock_alert || 0)
  )
  const totalAlerts = outOfStock.length + lowStock.length

  const handleCopyShoppingList = async () => {
    const now = new Date()
    const timeFormatted = new Intl.DateTimeFormat('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(now)

    let text = `📋 DAFTAR BELANJA BAHAN WARKOP SUDUT TEMU\n`
    text += `Waktu: ${timeFormatted} WIB\n`
    if (cashierName) {
      text += `Kasir: ${cashierName}\n`
    }
    text += `\n`

    if (outOfStock.length > 0) {
      text += `🚨 BAHAN HABIS (STOK 0):\n`
      outOfStock.forEach((m, idx) => {
        text += `${idx + 1}. ${m.name} (Sisa 0 ${m.unit} • Batas Min ${m.min_stock_alert} ${m.unit})\n`
      })
      text += `\n`
    }

    if (lowStock.length > 0) {
      text += `⚠️ BAHAN MENIPIS:\n`
      lowStock.forEach((m, idx) => {
        text += `${idx + 1}. ${m.name} (Sisa ${m.current_stock} ${m.unit} • Batas Min ${m.min_stock_alert} ${m.unit})\n`
      })
      text += `\n`
    }

    text += `Mohon segera dibelanjakan untuk kelancaran operasional. Terima kasih.`

    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), 2500)
    } catch (err) {
      console.warn('Clipboard write failed:', err)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/80 backdrop-blur-xs animate-in fade-in duration-150">
      <div
        className="w-full max-w-lg bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl shadow-2xl flex flex-col max-h-[85vh] overflow-hidden animate-in zoom-in-95 duration-150"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-stone-200 dark:border-stone-800 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 shadow-xs border ${
              outOfStock.length > 0
                ? 'bg-rose-50 border-rose-200 text-rose-600 dark:bg-rose-950/60 dark:border-rose-900/80 dark:text-rose-400'
                : 'bg-amber-50 border-amber-200 text-amber-700 dark:bg-amber-950/60 dark:border-amber-900/80 dark:text-amber-400'
            }`}>
              {outOfStock.length > 0 ? (
                <AlertCircle className="w-5 h-5 stroke-[2.2]" />
              ) : (
                <AlertTriangle className="w-5 h-5 stroke-[2.2]" />
              )}
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-bold text-stone-900 dark:text-stone-100 flex items-center gap-2">
                <span>Peringatan Stok Bahan Baku</span>
                {totalAlerts > 0 && (
                  <span className={`text-[11px] font-mono font-bold px-2 py-0.5 rounded-full border ${
                    outOfStock.length > 0
                      ? 'bg-rose-100 text-rose-800 border-rose-300 dark:bg-rose-950 dark:text-rose-300 dark:border-rose-800'
                      : 'bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-950 dark:text-amber-300 dark:border-amber-800'
                  }`}>
                    {totalAlerts} Bahan
                  </span>
                )}
              </h3>
              <p className="text-xs text-stone-500 dark:text-stone-400">
                Bahan yang habis atau menyentuh batas minimum persediaan warkop
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Action Bar: Copy Shopping List */}
        {totalAlerts > 0 && (
          <div className="px-4 py-2.5 bg-stone-50 dark:bg-stone-950/60 border-b border-stone-200 dark:border-stone-800/80 flex items-center justify-between gap-2 text-xs">
            <span className="text-stone-500 dark:text-stone-400 text-[11px]">
              Daftar bahan yang perlu segera dibeli / restock:
            </span>
            <button
              type="button"
              onClick={handleCopyShoppingList}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold border transition-all cursor-pointer shadow-xs active:scale-95 ${
                copied
                  ? 'bg-emerald-600 text-white border-emerald-600 dark:bg-emerald-500 dark:text-stone-950'
                  : 'bg-white dark:bg-stone-850 border-stone-200 dark:border-stone-700 text-stone-700 dark:text-stone-200 hover:border-stone-400'
              }`}
              title="Salin daftar bahan menipis ke clipboard untuk dikirim ke WhatsApp"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                  <span>Daftar Tersalin!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Salin Belanjaan (WA)</span>
                </>
              )}
            </button>
          </div>
        )}

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
          {totalAlerts === 0 ? (
            <div className="py-12 text-center space-y-2">
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/60 flex items-center justify-center text-emerald-600 dark:text-emerald-400 mx-auto shadow-xs">
                <Boxes className="w-6 h-6 stroke-2" />
              </div>
              <h4 className="text-sm font-bold text-stone-900 dark:text-stone-100">
                Semua Bahan Baku Aman
              </h4>
              <p className="text-xs text-stone-500 dark:text-stone-400 max-w-xs mx-auto">
                Saat ini tidak ada bahan baku yang berstatus habis atau di bawah batas minimum alert.
              </p>
            </div>
          ) : (
            <>
              {/* 1. Out of Stock (Kritis) */}
              {outOfStock.length > 0 && (
                <div className="space-y-2.5">
                  <div className="flex items-center gap-2 text-xs font-bold text-rose-700 dark:text-rose-400 uppercase tracking-wide">
                    <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
                    <span>Bahan Habis ({outOfStock.length})</span>
                  </div>

                  <div className="space-y-2">
                    {outOfStock.map((mat) => (
                      <div
                        key={mat.id}
                        className="p-3 rounded-xl bg-rose-50/50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/60 flex items-center justify-between gap-3 shadow-xs"
                      >
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-stone-900 dark:text-stone-100 truncate">
                              {mat.name}
                            </span>
                            <span className="px-1.5 py-0.5 rounded text-[9px] font-mono font-bold bg-rose-600 text-white shrink-0">
                              HABIS
                            </span>
                          </div>
                          <p className="text-[11px] font-mono text-stone-500 dark:text-stone-400 mt-0.5">
                            Sisa: <span className="font-bold text-rose-600 dark:text-rose-400">0 {mat.unit}</span> • Batas Min: {mat.min_stock_alert} {mat.unit}
                          </p>
                        </div>

                        {onQuickBuyMaterial && (
                          <button
                            type="button"
                            onClick={() => {
                              onQuickBuyMaterial(`Beli ${mat.name}`)
                              onClose()
                            }}
                            className="px-2.5 py-1.5 rounded-lg bg-stone-900 hover:bg-stone-800 text-white dark:bg-[#E2DFD2] dark:hover:bg-[#d6d3c4] dark:text-stone-950 text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-xs active:scale-95 transition-all shrink-0"
                            title={`Catat pengeluaran beli ${mat.name} di kasir`}
                          >
                            <ShoppingCart className="w-3.5 h-3.5" />
                            <span>Beli</span>
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 2. Low Stock (Menipis) */}
              {lowStock.length > 0 && (
                <div className="space-y-2.5">
                  <div className="flex items-center gap-2 text-xs font-bold text-amber-700 dark:text-amber-400 uppercase tracking-wide">
                    <span className="w-2 h-2 rounded-full bg-amber-500" />
                    <span>Bahan Menipis ({lowStock.length})</span>
                  </div>

                  <div className="space-y-2">
                    {lowStock.map((mat) => (
                      <div
                        key={mat.id}
                        className="p-3 rounded-xl bg-amber-50/40 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/50 flex items-center justify-between gap-3 shadow-xs"
                      >
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-stone-900 dark:text-stone-100 truncate">
                              {mat.name}
                            </span>
                            <span className="px-1.5 py-0.5 rounded text-[9px] font-mono font-bold bg-amber-600 text-white shrink-0">
                              MENIPIS
                            </span>
                          </div>
                          <p className="text-[11px] font-mono text-stone-500 dark:text-stone-400 mt-0.5">
                            Sisa: <span className="font-bold text-amber-700 dark:text-amber-400">{mat.current_stock} {mat.unit}</span> • Batas Min: {mat.min_stock_alert} {mat.unit}
                          </p>
                        </div>

                        {onQuickBuyMaterial && (
                          <button
                            type="button"
                            onClick={() => {
                              onQuickBuyMaterial(`Beli ${mat.name}`)
                              onClose()
                            }}
                            className="px-2.5 py-1.5 rounded-lg bg-stone-900 hover:bg-stone-800 text-white dark:bg-[#E2DFD2] dark:hover:bg-[#d6d3c4] dark:text-stone-950 text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-xs active:scale-95 transition-all shrink-0"
                            title={`Catat pengeluaran beli ${mat.name} di kasir`}
                          >
                            <ShoppingCart className="w-3.5 h-3.5" />
                            <span>Beli</span>
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-950 flex items-center justify-between gap-2">
          <div className="text-[11px] text-stone-500 dark:text-stone-400 font-mono">
            {totalAlerts > 0 ? (
              <span>Kasir dapat langsung mencatat nota via tombol <b>Beli</b></span>
            ) : (
              <span>Pantau stok berkala saat shift berjalan</span>
            )}
          </div>

          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-stone-200 hover:bg-stone-300 dark:bg-stone-800 dark:hover:bg-stone-700 text-stone-800 dark:text-stone-200 text-xs font-semibold cursor-pointer transition-colors"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  )
}
