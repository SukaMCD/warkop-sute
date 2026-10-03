import { useState, useEffect, useCallback } from 'react'
import type { User } from '../../types'
import { Delete, ArrowRight, ShieldAlert, Loader2, RotateCcw } from 'lucide-react'

interface LoginPageProps {
  onLoginSuccess: (user: User) => void
}

export const LoginPage = ({ onLoginSuccess }: LoginPageProps) => {
  const [pin, setPin] = useState<string>('')
  const [errorMessage, setErrorMessage] = useState<string>('')
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false)

  // Submit PIN login (Cashier 4-digit or Owner 4-digit)
  const verifyPinLogin = useCallback(async (pinToVerify: string) => {
    if (pinToVerify.length !== 4 || isSubmitting) return

    setIsSubmitting(true)
    setErrorMessage('')

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pin: pinToVerify })
      })
      const data: any = await res.json()
      if (res.ok && data.success && data.user) {
        localStorage.setItem('sute_session_user', JSON.stringify(data.user))
        onLoginSuccess(data.user)
      } else {
        setErrorMessage(data.message || 'PIN tidak valid. Silakan coba lagi.')
        setPin('')
      }
    } catch {
      // Offline / dev fallback
      if (pinToVerify === '1234') {
        const mockUser: User = { id: 'usr_kasir1', username: 'kasir', name: 'Kasir Shift Pagi', role: 'cashier' }
        localStorage.setItem('sute_session_user', JSON.stringify(mockUser))
        onLoginSuccess(mockUser)
      } else if (pinToVerify === '5678') {
        const mockUser: User = { id: 'usr_kasir2', username: 'kasir_sore', name: 'Kasir Shift Sore', role: 'cashier' }
        localStorage.setItem('sute_session_user', JSON.stringify(mockUser))
        onLoginSuccess(mockUser)
      } else if (pinToVerify === '9876') {
        const mockUser: User = { id: 'usr_kasir3', username: 'kasir_malam', name: 'Kasir Shift Malam', role: 'cashier' }
        localStorage.setItem('sute_session_user', JSON.stringify(mockUser))
        onLoginSuccess(mockUser)
      } else if (pinToVerify === '0258' || pinToVerify === '9999' || pinToVerify === '123456') {
        const mockUser: User = { id: 'usr_owner', username: 'owner', name: 'Owner', role: 'owner' }
        localStorage.setItem('sute_session_user', JSON.stringify(mockUser))
        onLoginSuccess(mockUser)
      } else {
        setErrorMessage('PIN salah. Masukkan 4-digit PIN terdaftar.')
        setPin('')
      }
    } finally {
      setIsSubmitting(false)
    }
  }, [isSubmitting, onLoginSuccess])

  // Numpad key press handler
  const handleNumberClick = useCallback((num: string) => {
    if (pin.length < 4 && !isSubmitting) {
      const nextPin = pin + num
      setPin(nextPin)
      setErrorMessage('')
      // Auto-submit immediately when all 4 digits are entered
      if (nextPin.length === 4) {
        verifyPinLogin(nextPin)
      }
    }
  }, [pin, isSubmitting, verifyPinLogin])

  const handleDelete = useCallback(() => {
    if (!isSubmitting) {
      setPin(prev => prev.slice(0, -1))
      setErrorMessage('')
    }
  }, [isSubmitting])

  const handleClear = useCallback(() => {
    if (!isSubmitting) {
      setPin('')
      setErrorMessage('')
    }
  }, [isSubmitting])

  // Support physical keyboard input (0-9, Backspace, Escape, Enter)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isSubmitting) return

      if (e.key >= '0' && e.key <= '9') {
        e.preventDefault()
        handleNumberClick(e.key)
      } else if (e.key === 'Backspace') {
        e.preventDefault()
        handleDelete()
      } else if (e.key === 'Escape') {
        e.preventDefault()
        handleClear()
      } else if (e.key === 'Enter') {
        e.preventDefault()
        if (pin.length === 4) {
          verifyPinLogin(pin)
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [handleNumberClick, handleDelete, handleClear, verifyPinLogin, pin, isSubmitting])

  return (
    <div className="min-h-screen bg-stone-950 flex flex-col items-center justify-center p-4 selection:bg-[#E2DFD2] selection:text-stone-950">
      
      <div className="w-full max-w-sm bg-stone-900/95 border border-stone-800 rounded-2xl p-6 sm:p-8 shadow-2xl backdrop-blur">
        
        {/* Brand Header */}
        <div className="flex flex-col items-center text-center mb-6">
          <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-stone-800 shadow-md mb-3 bg-stone-950 flex items-center justify-center">
            <img
              src="/logo.png"
              alt="Warkop Sudut Temu"
              className="w-full h-full object-cover"
            />
          </div>
          <h1 className="text-lg font-bold text-stone-100 tracking-tight">
            Warkop Sudut Temu
          </h1>
          <p className="text-xs text-stone-400 mt-0.5">
            Sistem Kasir & Operasional Warkop
          </p>
        </div>

        {/* Error Notification */}
        {errorMessage && (
          <div className="mb-5 p-3 rounded-lg bg-rose-950/40 border border-rose-900/60 text-rose-300 text-xs flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 shrink-0 text-rose-400" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* PIN Entry Display */}
        <div className="text-center mb-5">
          <span className="text-xs font-medium text-stone-300 block mb-3">
            Masukkan 4-Digit PIN
          </span>

          {/* 4 Visual PIN Slot Dots */}
          <div className="flex justify-center items-center gap-4 py-1">
            {[0, 1, 2, 3].map((idx) => {
              const isFilled = pin.length > idx
              return (
                <div
                  key={idx}
                  className={`w-4 h-4 rounded-full border transition-all duration-200 ${
                    isFilled
                      ? 'bg-[#E2DFD2] border-[#E2DFD2] scale-110 shadow-sm'
                      : 'bg-stone-950 border-stone-700'
                  }`}
                />
              )
            })}
          </div>
          <span className="text-[11px] text-stone-400 mt-2 block">
            Masuk otomatis setelah 4 angka terisi
          </span>
        </div>

        {/* Touchscreen Tablet Numpad Grid */}
        <div className="grid grid-cols-3 gap-2.5 my-4">
          {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((digit) => (
            <button
              key={digit}
              type="button"
              onClick={() => handleNumberClick(digit)}
              disabled={isSubmitting}
              className="h-14 rounded-xl bg-stone-950 border border-stone-800 hover:bg-stone-800/80 active:scale-[0.95] text-stone-100 font-mono text-xl font-bold transition-all flex items-center justify-center cursor-pointer shadow-xs"
            >
              {digit}
            </button>
          ))}

          {/* Clear All Button */}
          <button
            type="button"
            onClick={handleClear}
            disabled={isSubmitting || pin.length === 0}
            className="h-14 rounded-xl bg-stone-950/60 border border-stone-800/80 hover:bg-stone-800/60 active:scale-[0.95] text-stone-400 text-xs font-mono uppercase tracking-wider transition-all flex items-center justify-center cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
            title="Reset PIN"
          >
            <RotateCcw className="w-4 h-4" />
          </button>

          {/* Zero */}
          <button
            type="button"
            onClick={() => handleNumberClick('0')}
            disabled={isSubmitting}
            className="h-14 rounded-xl bg-stone-950 border border-stone-800 hover:bg-stone-800/80 active:scale-[0.95] text-stone-100 font-mono text-xl font-bold transition-all flex items-center justify-center cursor-pointer shadow-xs"
          >
            0
          </button>

          {/* Backspace Button */}
          <button
            type="button"
            onClick={handleDelete}
            disabled={isSubmitting || pin.length === 0}
            className="h-14 rounded-xl bg-stone-950/60 border border-stone-800/80 hover:bg-stone-800/60 active:scale-[0.95] text-stone-400 transition-all flex items-center justify-center cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
            title="Hapus satu angka"
          >
            <Delete className="w-5 h-5" />
          </button>
        </div>

        {/* Submit Button / Status */}
        <button
          type="button"
          onClick={() => verifyPinLogin(pin)}
          disabled={pin.length !== 4 || isSubmitting}
          className="w-full h-12 rounded-xl bg-[#E2DFD2] hover:bg-[#edebe2] disabled:bg-stone-800/60 disabled:text-stone-600 disabled:border-stone-800 text-stone-950 font-bold text-xs tracking-wide transition-all flex items-center justify-center gap-2 cursor-pointer disabled:cursor-not-allowed shadow-sm active:scale-[0.98] mt-2 border border-[#E2DFD2]/40"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Memeriksa PIN...</span>
            </>
          ) : (
            <>
              <span>Masuk Sistem</span>
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>

        {/* Discreet PIN Hint */}
        <div className="mt-5 pt-3 border-t border-stone-800/80 text-center text-[11px] text-stone-400 font-mono flex flex-wrap items-center justify-center gap-x-2.5 gap-y-1">
          <span>Kasir Pagi: <strong className="text-[#E2DFD2] font-semibold">1234</strong></span>
          <span className="text-stone-600">•</span>
          <span>Kasir Sore: <strong className="text-[#E2DFD2] font-semibold">5678</strong></span>
          <span className="text-stone-600">•</span>
          <span>Owner: <strong className="text-[#E2DFD2] font-semibold">0258</strong></span>
        </div>

      </div>

      <div className="mt-6 text-center text-xs text-stone-400">
        Jln. Raya Ciawi Gebang No 2, Kuningan - Jawa Barat
      </div>

    </div>
  )
}

