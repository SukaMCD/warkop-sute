import { useState, useEffect, useCallback } from 'react'
import type { User } from '../../types'
import { Delete, ArrowRight, ShieldAlert, Loader2, RotateCcw, Clock, MapPin, ShieldCheck, UserCheck, Smartphone } from 'lucide-react'
import { setToken } from '../../utils/api'
import { SearchableSelect } from '../ui/SearchableSelect'

interface LoginPageProps {
  onLoginSuccess: (user: User) => void
}

interface DbUser {
  id: string
  name: string
  role: string
  username: string
}

const DEFAULT_USERS: DbUser[] = [
  { id: 'usr_kasir1', username: 'kasir', name: 'Kasir Shift Pagi', role: 'cashier' },
  { id: 'usr_kasir2', username: 'kasir_sore', name: 'Kasir Shift Sore', role: 'cashier' },
  { id: 'usr_kasir3', username: 'kasir_malam', name: 'Kasir Shift Malam', role: 'cashier' },
  { id: 'usr_owner', username: 'owner', name: 'Owner', role: 'owner' }
]

export const LoginPage = ({ onLoginSuccess }: LoginPageProps) => {
  const [pin, setPin] = useState<string>('')
  const [errorMessage, setErrorMessage] = useState<string>('')
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false)
  const [usersList, setUsersList] = useState<DbUser[]>(DEFAULT_USERS)
  const [selectedUserId, setSelectedUserId] = useState<string>('')

  const selectedUser = usersList.find(u => u.id === selectedUserId) || null

  // Fetch registered users dynamically from database
  useEffect(() => {
    fetch('/api/users')
      .then(r => (r.ok ? r.json() : null))
      .then((data: any) => {
        if (data?.success && Array.isArray(data.data) && data.data.length > 0) {
          setUsersList(data.data)
        }
      })
      .catch(() => {})
  }, [])

  // Real-time POS Terminal Clock
  const [timeStr, setTimeStr] = useState<string>('')
  const [dateStr, setDateStr] = useState<string>('')

  useEffect(() => {
    const updateTime = () => {
      const now = new Date()
      setTimeStr(
        now.toLocaleTimeString('id-ID', {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hour12: false
        }) + ' WIB'
      )
      setDateStr(
        now.toLocaleDateString('id-ID', {
          weekday: 'long',
          day: 'numeric',
          month: 'long',
          year: 'numeric'
        })
      )
    }
    updateTime()
    const timer = setInterval(updateTime, 1000)
    return () => clearInterval(timer)
  }, [])

  // Submit PIN login (Cashier 6-digit or Owner 6-digit)
  const verifyPinLogin = useCallback(async (pinToVerify: string) => {
    if (!selectedUser) {
      setErrorMessage('Silakan pilih petugas terlebih dahulu pada dropdown.')
      setPin('')
      return
    }

    if (pinToVerify.length !== 6 || isSubmitting) return

    setIsSubmitting(true)
    setErrorMessage('')

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pin: pinToVerify,
          username: selectedUser.username
        })
      })
      const data: any = await res.json()
      if (res.ok && data.success && data.user) {
        if (data.token) {
          setToken(data.token)
        }
        localStorage.setItem('sute_session_user', JSON.stringify(data.user))
        localStorage.removeItem('sute_is_locked')
        onLoginSuccess(data.user)
      } else {
        setErrorMessage(data.message || `Kode PIN tidak sesuai untuk ${selectedUser.name}.`)
        setPin('')
      }
    } catch {
      setErrorMessage('Gagal menghubungi database D1. Pastikan server worker aktif.')
      setPin('')
    } finally {
      setIsSubmitting(false)
    }
  }, [isSubmitting, onLoginSuccess, selectedUser])

  // Numpad key press handler
  const handleNumberClick = useCallback((num: string) => {
    if (!selectedUserId) {
      setErrorMessage('Silakan pilih petugas terlebih dahulu pada dropdown.')
      return
    }
    if (pin.length < 6 && !isSubmitting) {
      const nextPin = pin + num
      setPin(nextPin)
      setErrorMessage('')
      if (nextPin.length === 6) {
        verifyPinLogin(nextPin)
      }
    }
  }, [pin, isSubmitting, verifyPinLogin, selectedUserId])

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
        if (pin.length === 6) {
          verifyPinLogin(pin)
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [handleNumberClick, handleDelete, handleClear, verifyPinLogin, pin, isSubmitting])

  const numpadKeys = [
    { num: '1', letters: '' },
    { num: '2', letters: 'ABC' },
    { num: '3', letters: 'DEF' },
    { num: '4', letters: 'GHI' },
    { num: '5', letters: 'JKL' },
    { num: '6', letters: 'MNO' },
    { num: '7', letters: 'PQRS' },
    { num: '8', letters: 'TUV' },
    { num: '9', letters: 'WXYZ' },
  ]

  return (
    <div className="min-h-screen lg:h-screen w-full bg-[#FBF9F5] dark:bg-stone-950 text-stone-900 dark:text-stone-100 relative selection:bg-amber-700 dark:selection:bg-[#E2DFD2] selection:text-white dark:selection:text-stone-950 overflow-y-auto lg:overflow-hidden grid grid-cols-1 lg:grid-cols-12">
      
      {/* Background Architectural Grid Pattern */}
      <div 
        className="absolute inset-0 opacity-[0.04] dark:opacity-[0.03] pointer-events-none"
        style={{
          backgroundImage: `radial-gradient(circle at 1px 1px, currentColor 1px, transparent 0)`,
          backgroundSize: '24px 24px'
        }}
      />

      {/* Left Column: Brand, Atmosphere & Live Station Status */}
      <div className="relative z-10 lg:col-span-5 xl:col-span-4 bg-white dark:bg-stone-950 border-b lg:border-b-0 lg:border-r border-stone-200 dark:border-stone-800 p-6 sm:p-10 lg:p-12 xl:p-14 flex flex-col justify-between space-y-8 lg:h-full overflow-y-auto shadow-xs">
        
        {/* Top Brand Identity */}
        <div className="space-y-6">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-stone-50 dark:bg-stone-900 border border-stone-200 dark:border-stone-800 p-1.5 shrink-0 flex items-center justify-center shadow-inner overflow-hidden">
              <img
                src="/logo.png"
                alt="Warkop Sudut Temu"
                className="w-full h-full object-cover rounded-xl"
              />
            </div>
            <div>
              <h1 className="text-xl font-bold text-stone-900 dark:text-stone-100 tracking-tight">
                Warkop Sudut Temu
              </h1>
              <p className="text-xs sm:text-sm text-stone-500 dark:text-stone-400 font-medium">
                Sudut Temu, Cerita Mengalir
              </p>
            </div>
          </div>

          {/* Live Station & Clock Box */}
          <div className="rounded-xl border border-stone-200 dark:border-stone-800/80 bg-stone-50 dark:bg-stone-900/60 p-5 sm:p-6 space-y-3 shadow-xs">
            <div className="flex items-center justify-between text-xs">
              <span className="text-xs font-mono uppercase tracking-wider text-stone-500 dark:text-stone-400">
                Terminal Kasir 01
              </span>
              <span className="text-[10px] font-mono px-2.5 py-1 rounded bg-stone-200 dark:bg-stone-800/90 text-stone-700 dark:text-stone-300 border border-stone-300 dark:border-stone-700/60 uppercase tracking-wide">
                Siap Melayani
              </span>
            </div>

            <div className="pt-1">
              <div className="font-mono text-3xl sm:text-4xl font-bold tracking-tight text-stone-900 dark:text-stone-100 tabular-nums">
                {timeStr || '00:00:00 WIB'}
              </div>
              <div className="text-xs sm:text-sm text-stone-500 dark:text-stone-400 mt-1.5 flex items-center gap-2">
                <Clock className="w-4 h-4 text-stone-400 dark:text-stone-500" />
                <span>{dateStr || 'Memuat tanggal...'}</span>
              </div>
            </div>
          </div>

          {/* Pilihan Petugas Dropdown */}
          <div className="space-y-3 pt-2">
            <label htmlFor="staff-select" className="text-xs font-mono uppercase tracking-wider text-stone-500 dark:text-stone-400 block">
              Pilih Petugas / Operator
            </label>
            <SearchableSelect
              value={selectedUserId}
              onChange={(val) => {
                setSelectedUserId(val)
                setPin('')
                setErrorMessage('')
              }}
              options={usersList.map((item) => ({
                value: item.id,
                label: item.name,
                badge: item.role === 'owner' ? 'Owner' : 'Kasir',
                sublabel: `@${item.username}`
              }))}
              placeholder="-- Pilih Petugas / Operator --"
              searchPlaceholder="Cari nama atau username kasir..."
            />

            {/* Status Terpilih */}
            {selectedUser ? (
              <div className="p-3.5 rounded-xl border border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-900/80 flex items-center justify-between text-xs sm:text-sm">
                <div className="flex items-center gap-2.5 truncate">
                  <UserCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                  <span className="text-stone-700 dark:text-stone-300 truncate">
                    Petugas: <strong className="text-stone-900 dark:text-stone-100 font-bold">{selectedUser.name}</strong>
                  </span>
                </div>
                <span className="text-[11px] font-mono uppercase px-2.5 py-0.5 rounded bg-stone-200 dark:bg-stone-800 text-stone-800 dark:text-[#E2DFD2] border border-stone-300 dark:border-stone-700 font-semibold shrink-0 ml-2">
                  {selectedUser.role === 'owner' ? 'Owner' : 'Kasir'}
                </span>
              </div>
            ) : (
              <div className="p-3 rounded-xl border border-dashed border-stone-300 dark:border-stone-800 bg-stone-50 dark:bg-stone-950/40 text-stone-400 dark:text-stone-500 text-xs flex items-center">
                <span>Pilih nama petugas di atas sebelum memasukkan PIN</span>
              </div>
            )}
          </div>
        </div>

        {/* Footer Metadata & App Download */}
        <div className="pt-4 border-t border-stone-200 dark:border-stone-800/80 flex items-center justify-between gap-3 text-xs text-stone-500 dark:text-stone-400">
          <div className="flex items-center gap-2 truncate">
            <MapPin className="w-4 h-4 text-stone-400 dark:text-stone-500 shrink-0" />
            <span className="truncate">Ciawi Gebang No 2, Kuningan</span>
          </div>
          <a
            href="/warkop-pos.apk"
            download="warkop-pos.apk"
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-stone-100 hover:bg-stone-200 dark:bg-stone-900 dark:hover:bg-stone-850 border border-stone-200 dark:border-stone-800 text-stone-700 dark:text-stone-300 font-mono text-[11px] shrink-0 transition-colors no-underline shadow-2xs"
            title="Download file APK Android Warkop Sudut Temu"
          >
            <Smartphone className="w-3.5 h-3.5 text-amber-700 dark:text-[#E2DFD2]" />
            <span>Unduh APK</span>
          </a>
        </div>

      </div>

      {/* Right Column: Hardware Numpad & PIN Input Slot */}
      <div className="relative z-10 lg:col-span-7 xl:col-span-8 p-6 sm:p-10 lg:p-12 xl:p-16 flex flex-col justify-center items-center lg:h-full bg-stone-100/60 dark:bg-stone-900/30 overflow-y-auto">
        <div className="w-full max-w-md sm:max-w-lg space-y-6 sm:space-y-8 my-auto">
          
          {/* Header Title for PIN */}
          <div className="border-l-2 border-amber-700 dark:border-[#E2DFD2] pl-4 py-1 flex items-center justify-between">
            <div>
              <h2 className="text-base sm:text-lg font-bold text-stone-900 dark:text-stone-100 tracking-tight">
                {selectedUser ? `PIN: ${selectedUser.name}` : 'Autentikasi Operator'}
              </h2>
              <p className="text-xs sm:text-sm text-stone-500 dark:text-stone-400 mt-0.5">
                {selectedUser
                  ? `Masukkan 6-digit PIN milik ${selectedUser.name}`
                  : 'Pilih petugas terlebih dahulu pada dropdown'}
              </p>
            </div>
            <ShieldCheck className="w-6 h-6 text-stone-400 dark:text-stone-500" />
          </div>

          {/* Error Notification */}
          {errorMessage && (
            <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 text-rose-800 dark:text-rose-300 text-xs sm:text-sm flex items-center gap-2.5 animate-in fade-in">
              <ShieldAlert className="w-4 h-4 shrink-0 text-rose-500 dark:text-rose-400" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Hardware Monospace Inset Slot Cells (6 Slots) */}
          <div className="space-y-3">
            <div className="flex justify-center items-center gap-2.5 sm:gap-3.5 py-2">
              {[0, 1, 2, 3, 4, 5].map((idx) => {
                const isFilled = pin.length > idx
                const isActive = pin.length === idx
                return (
                  <div
                    key={idx}
                    className={`w-12 h-14 sm:w-14 sm:h-16 rounded-xl border flex items-center justify-center font-mono text-2xl font-bold transition-all duration-150 select-none ${
                      isFilled
                        ? 'bg-white dark:bg-stone-900 border-amber-600 dark:border-[#E2DFD2]/70 text-amber-800 dark:text-[#E2DFD2] shadow-xs'
                        : isActive
                        ? 'bg-stone-50 dark:bg-stone-950 border-amber-600 dark:border-[#E2DFD2] ring-1 ring-amber-600/30 dark:ring-[#E2DFD2]/30 shadow-inner'
                        : 'bg-white dark:bg-stone-950 border-stone-200 dark:border-stone-800 text-stone-400 dark:text-stone-600 shadow-inner'
                    }`}
                  >
                    {isFilled ? (
                      <span className="w-3.5 h-3.5 sm:w-4 sm:h-4 rounded-full bg-amber-700 dark:bg-[#E2DFD2] shadow-xs animate-in zoom-in-75 duration-100" />
                    ) : (
                      <span className="text-stone-300 dark:text-stone-700 text-xs font-mono">•</span>
                    )}
                  </div>
                )
              })}
            </div>
            <div className="text-center text-xs text-stone-500 dark:text-stone-400 font-mono">
              Otomatis terverifikasi saat 6 digit terisi
            </div>
          </div>

          {/* Precision POS Keypad Grid */}
          <div className="grid grid-cols-3 gap-3">
            {numpadKeys.map(({ num, letters }) => (
              <button
                key={num}
                type="button"
                onClick={() => handleNumberClick(num)}
                disabled={isSubmitting}
                className="h-14 sm:h-16 rounded-xl bg-white hover:bg-stone-100 active:bg-stone-200 dark:bg-stone-900/90 dark:hover:bg-stone-800 dark:active:bg-stone-700 active:scale-[0.97] border border-stone-200 hover:border-stone-300 dark:border-stone-800 dark:hover:border-stone-700 transition-all flex flex-col items-center justify-center cursor-pointer shadow-xs group"
              >
                <span className="font-mono text-xl sm:text-2xl font-bold text-stone-900 group-hover:text-stone-950 dark:text-stone-100 dark:group-hover:text-[#E2DFD2] leading-none">
                  {num}
                </span>
                {letters ? (
                  <span className="font-mono text-[10px] text-stone-400 group-hover:text-stone-600 dark:text-stone-500 dark:group-hover:text-stone-300 tracking-widest mt-1">
                    {letters}
                  </span>
                ) : (
                  <span className="h-2.5 mt-1" />
                )}
              </button>
            ))}

            {/* Clear All Key */}
            <button
              type="button"
              onClick={handleClear}
              disabled={isSubmitting || pin.length === 0}
              className="h-14 sm:h-16 rounded-xl bg-white/80 hover:bg-stone-100 active:bg-stone-200 dark:bg-stone-900/80 dark:hover:bg-stone-800 dark:active:bg-stone-700 active:scale-[0.97] border border-stone-200 hover:border-stone-300 dark:border-stone-800 dark:hover:border-stone-700 text-stone-500 hover:text-stone-800 dark:text-stone-400 dark:hover:text-stone-200 transition-all flex flex-col items-center justify-center cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed shadow-xs"
              title="Reset PIN"
            >
              <RotateCcw className="w-5 h-5 mb-0.5" />
              <span className="font-mono text-[9px] uppercase tracking-wider text-stone-500 dark:text-stone-400">
                Reset
              </span>
            </button>

            {/* Zero Key */}
            <button
              type="button"
              onClick={() => handleNumberClick('0')}
              disabled={isSubmitting}
              className="h-14 sm:h-16 rounded-xl bg-white hover:bg-stone-100 active:bg-stone-200 dark:bg-stone-900/90 dark:hover:bg-stone-800 dark:active:bg-stone-700 active:scale-[0.97] border border-stone-200 hover:border-stone-300 dark:border-stone-800 dark:hover:border-stone-700 transition-all flex flex-col items-center justify-center cursor-pointer shadow-xs group"
            >
              <span className="font-mono text-xl sm:text-2xl font-bold text-stone-900 group-hover:text-stone-950 dark:text-stone-100 dark:group-hover:text-[#E2DFD2] leading-none">
                0
              </span>
              <span className="font-mono text-[10px] text-stone-400 group-hover:text-stone-600 dark:text-stone-500 dark:group-hover:text-stone-300 tracking-widest mt-1">
                OPER
              </span>
            </button>

            {/* Backspace Key */}
            <button
              type="button"
              onClick={handleDelete}
              disabled={isSubmitting || pin.length === 0}
              className="h-14 sm:h-16 rounded-xl bg-white/80 hover:bg-stone-100 active:bg-stone-200 dark:bg-stone-900/80 dark:hover:bg-stone-800 dark:active:bg-stone-700 active:scale-[0.97] border border-stone-200 hover:border-stone-300 dark:border-stone-800 dark:hover:border-stone-700 text-stone-500 hover:text-stone-800 dark:text-stone-400 dark:hover:text-stone-200 transition-all flex flex-col items-center justify-center cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed shadow-xs"
              title="Hapus Satu Angka"
            >
              <Delete className="w-5 h-5 mb-0.5" />
              <span className="font-mono text-[9px] uppercase tracking-wider text-stone-500 dark:text-stone-400">
                Hapus
              </span>
            </button>
          </div>

          {/* Submit Action Button */}
          <button
            type="button"
            onClick={() => verifyPinLogin(pin)}
            disabled={pin.length !== 6 || isSubmitting}
            className="w-full h-13 sm:h-14 rounded-xl bg-amber-700 hover:bg-amber-800 dark:bg-[#E2DFD2] dark:hover:bg-[#eae8dd] disabled:bg-stone-200 dark:disabled:bg-stone-950 disabled:text-stone-400 dark:disabled:text-stone-600 disabled:border-stone-200 dark:disabled:border-stone-800 text-white dark:text-stone-950 font-bold text-xs sm:text-sm tracking-wider transition-all flex items-center justify-center gap-2.5 cursor-pointer disabled:cursor-not-allowed shadow-xs active:scale-[0.98] border border-amber-700/60 dark:border-[#E2DFD2]/60 uppercase font-mono"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-white dark:text-stone-950" />
                <span>Memeriksa Kode PIN...</span>
              </>
            ) : (
              <>
                <span>Masuk Terminal Kasir</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>

        </div>

      </div>

    </div>
  )
}
