import { useEffect } from 'react'
import { AlertTriangle, Info, Trash2, X } from 'lucide-react'

export interface ConfirmDialogProps {
  isOpen: boolean
  title: string
  message: string
  confirmText?: string
  cancelText?: string
  variant?: 'danger' | 'warning' | 'info'
  isLoading?: boolean
  onConfirm: () => void
  onCancel: () => void
}

export const ConfirmDialog = ({
  isOpen,
  title,
  message,
  confirmText = 'Lanjutkan',
  cancelText = 'Batal',
  variant = 'danger',
  isLoading = false,
  onConfirm,
  onCancel
}: ConfirmDialogProps) => {
  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen && !isLoading) {
        onCancel()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, isLoading, onCancel])

  if (!isOpen) return null

  const isInfoOnly = variant === 'info'

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/80 backdrop-blur-xs transition-opacity animate-in fade-in duration-150"
        onClick={() => !isLoading && onCancel()}
      />

      {/* Modal Dialog Card */}
      <div className="relative w-full max-w-md bg-stone-900 border border-stone-800 rounded-2xl shadow-2xl p-6 overflow-hidden animate-in zoom-in-95 duration-150">
        
        {/* Close Button */}
        <button
          type="button"
          onClick={onCancel}
          disabled={isLoading}
          className="absolute top-4 right-4 p-1.5 rounded-lg text-stone-400 hover:text-stone-200 hover:bg-stone-800 transition-colors disabled:opacity-40 cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Content Section */}
        <div className="flex items-start gap-4">
          
          {/* Icon Badge */}
          <div className={`p-2.5 rounded-xl border shrink-0 ${
            variant === 'danger'
              ? 'bg-rose-950/40 border-rose-900/60 text-rose-400'
              : variant === 'warning'
              ? 'bg-amber-950/40 border-amber-900/60 text-amber-400'
              : 'bg-stone-800/80 border-stone-700/60 text-stone-300'
          }`}>
            {variant === 'danger' ? (
              <Trash2 className="w-5 h-5" />
            ) : variant === 'warning' ? (
              <AlertTriangle className="w-5 h-5" />
            ) : (
              <Info className="w-5 h-5" />
            )}
          </div>

          <div className="min-w-0 flex-1 pt-0.5">
            <h3 className="text-base font-bold text-stone-100 leading-snug">
              {title}
            </h3>
            <p className="text-xs text-stone-400 mt-1.5 leading-relaxed">
              {message}
            </p>
          </div>

        </div>

        {/* Action Buttons */}
        <div className="mt-6 flex items-center justify-end gap-2.5 pt-2">
          {!isInfoOnly && (
            <button
              type="button"
              disabled={isLoading}
              onClick={onCancel}
              className="px-4 py-2 text-xs font-semibold text-stone-300 hover:text-stone-100 bg-stone-950 hover:bg-stone-800 border border-stone-800 rounded-xl transition-all cursor-pointer disabled:opacity-50"
            >
              {cancelText}
            </button>
          )}

          <button
            type="button"
            disabled={isLoading}
            onClick={onConfirm}
            className={`px-4 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer shadow-sm flex items-center gap-2 active:scale-95 disabled:opacity-50 ${
              variant === 'danger'
                ? 'bg-rose-600 hover:bg-rose-500 text-white'
                : 'bg-[#E2DFD2] hover:bg-[#edebe2] active:bg-[#d6d3c6] text-stone-950'
            }`}
          >
            {isLoading ? (
              <>
                <span className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin" />
                <span>Memproses...</span>
              </>
            ) : (
              <span>{confirmText}</span>
            )}
          </button>
        </div>

      </div>
    </div>
  )
}
