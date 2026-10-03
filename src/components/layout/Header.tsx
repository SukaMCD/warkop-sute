import { useState, useEffect } from 'react'
import {
  MonitorPlay,
  LayoutDashboard,
  ReceiptText,
  Clock,
  UtensilsCrossed,
  Lock,
  Maximize2,
  Minimize2
} from 'lucide-react'
import type { User } from '../../types'

interface HeaderProps {
  activeTab: 'pos' | 'dashboard' | 'orders' | 'shift' | 'products'
  setActiveTab: (tab: 'pos' | 'dashboard' | 'orders' | 'shift' | 'products') => void
  currentUser?: User | null
  onLogout?: () => void
}

export const Header = ({ activeTab, setActiveTab, currentUser, onLogout }: HeaderProps) => {
  const [isFullscreen, setIsFullscreen] = useState(false)

  useEffect(() => {
    const handleFsChange = () => {
      setIsFullscreen(!!document.fullscreenElement)
    }
    document.addEventListener('fullscreenchange', handleFsChange)
    return () => document.removeEventListener('fullscreenchange', handleFsChange)
  }, [])

  const handleToggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {})
    } else {
      document.exitFullscreen().catch(() => {})
    }
  }

  const [currentDate] = useState(() => {
    return new Intl.DateTimeFormat('id-ID', {
      weekday: 'long',
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    }).format(new Date())
  })

  const [currentTime, setCurrentTime] = useState(() => {
    return new Intl.DateTimeFormat('id-ID', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false
    }).format(new Date())
  })

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(
        new Intl.DateTimeFormat('id-ID', {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hour12: false
        }).format(new Date())
      )
    }, 1000)
    return () => clearInterval(timer)
  }, [])

  const isOwner = currentUser?.role === 'owner'

  return (
    <header className="border-b border-stone-800 bg-stone-950/95 backdrop-blur sticky top-0 z-40">
      <div className="w-full px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-4">
          
          {/* Brand & Store Info */}
          <div className="flex items-center gap-3 shrink-0">
            <div className="w-10 h-10 rounded-full overflow-hidden border border-stone-700/80 bg-stone-900 flex items-center justify-center shadow-sm shrink-0">
              <img
                src="/logo.png"
                alt="Warkop Sudut Temu"
                className="w-full h-full object-cover"
              />
            </div>
            <div>
              <span className="font-bold tracking-tight text-stone-100 text-sm sm:text-base block">
                Warkop Sudut Temu
              </span>
              <p className="text-[11px] text-stone-400 hidden sm:block">
                {isOwner ? 'Monitoring & Operasional Warkop' : 'Sistem Kasir & Pesanan'}
              </p>
            </div>
          </div>

          {/* Navigation Tabs (Centered & Balanced) */}
          <nav className="flex items-center gap-1 bg-stone-900/90 border border-stone-800/90 p-1 rounded-xl shadow-inner overflow-x-auto">
            {/* Tab: Layar Kasir (Available for both Cashier and Owner) */}
            <button
              type="button"
              onClick={() => setActiveTab('pos')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer shrink-0 ${
                activeTab === 'pos'
                  ? 'bg-[#E2DFD2] text-stone-950 shadow-sm'
                  : 'text-stone-400 hover:text-stone-200 hover:bg-stone-800/60'
              }`}
            >
              <MonitorPlay className="w-3.5 h-3.5 stroke-[2.2]" />
              <span>Layar Kasir (POS)</span>
            </button>

            {/* Separator between POS and Management Tabs for Owner */}
            {isOwner && (
              <div className="h-4 w-px bg-stone-800 mx-1 shrink-0 hidden sm:block" />
            )}

            {/* Owner Management Tabs */}
            {isOwner && (
              <>
                <button
                  type="button"
                  onClick={() => setActiveTab('dashboard')}
                  className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer shrink-0 ${
                    activeTab === 'dashboard'
                      ? 'bg-[#E2DFD2] text-stone-950 shadow-sm'
                      : 'text-stone-400 hover:text-stone-200 hover:bg-stone-800/60'
                  }`}
                >
                  <LayoutDashboard className="w-3.5 h-3.5 stroke-[2]" />
                  <span>Ringkasan</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab('orders')}
                  className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer shrink-0 ${
                    activeTab === 'orders'
                      ? 'bg-[#E2DFD2] text-stone-950 shadow-sm font-bold'
                      : 'text-stone-400 hover:text-stone-200 hover:bg-stone-800/60'
                  }`}
                >
                  <ReceiptText className="w-3.5 h-3.5 stroke-[2]" />
                  <span>Riwayat Transaksi</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab('shift')}
                  className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer shrink-0 ${
                    activeTab === 'shift'
                      ? 'bg-[#E2DFD2] text-stone-950 shadow-sm font-bold'
                      : 'text-stone-400 hover:text-stone-200 hover:bg-stone-800/60'
                  }`}
                >
                  <Clock className="w-3.5 h-3.5 stroke-[2]" />
                  <span>Audit Shift</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab('products')}
                  className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer shrink-0 ${
                    activeTab === 'products'
                      ? 'bg-[#E2DFD2] text-stone-950 shadow-sm font-bold'
                      : 'text-stone-400 hover:text-stone-200 hover:bg-stone-800/60'
                  }`}
                >
                  <UtensilsCrossed className="w-3.5 h-3.5 stroke-[2]" />
                  <span>Daftar Menu</span>
                </button>
              </>
            )}

            {/* Cashier-Specific Tabs */}
            {!isOwner && (
              <>
                <button
                  type="button"
                  onClick={() => setActiveTab('orders')}
                  className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer shrink-0 ${
                    activeTab === 'orders'
                      ? 'bg-[#E2DFD2] text-stone-950 shadow-sm font-bold'
                      : 'text-stone-400 hover:text-stone-200 hover:bg-stone-800/60'
                  }`}
                >
                  <ReceiptText className="w-3.5 h-3.5 stroke-[2]" />
                  <span>Pesanan Shift Ini</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab('shift')}
                  className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer shrink-0 ${
                    activeTab === 'shift'
                      ? 'bg-[#E2DFD2] text-stone-950 shadow-sm font-bold'
                      : 'text-stone-400 hover:text-stone-200 hover:bg-stone-800/60'
                  }`}
                >
                  <Clock className="w-3.5 h-3.5 stroke-[2]" />
                  <span>Info Shift</span>
                </button>
              </>
            )}
          </nav>

          {/* Right Action: Clock, Cashier Chip & Controls */}
          <div className="flex items-center gap-3 shrink-0">
            {/* Realtime Clock & Date */}
            <div className="hidden lg:flex items-center gap-2.5 px-3 py-1.5 rounded-xl bg-stone-900/60 border border-stone-800/80 font-mono text-xs shadow-xs">
              <div className="flex items-center gap-1.5 text-stone-200 font-bold tabular-nums">
                <span>{currentTime}</span>
                <span className="text-[10px] text-stone-500 font-sans">WIB</span>
              </div>
              <span className="text-stone-700">•</span>
              <span className="text-stone-400 font-sans text-[11px]">{currentDate}</span>
            </div>

            {/* User Profile & Actions */}
            {currentUser && (
              <div className="flex items-center gap-2.5 pl-2 sm:pl-3 border-l border-stone-800">
                <div className="px-3 py-1.5 rounded-xl bg-stone-900/90 border border-stone-800 shadow-xs text-left">
                  <p className="text-xs font-semibold text-stone-200 leading-tight">
                    {currentUser.name}
                  </p>
                  <span className="text-[10px] font-mono uppercase tracking-wider text-[#E2DFD2] font-semibold block leading-tight">
                    {currentUser.role === 'owner' ? 'Pemilik' : 'Kasir'}
                  </span>
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={handleToggleFullscreen}
                    title={isFullscreen ? 'Keluar Layar Penuh' : 'Mode Layar Penuh (Fullscreen)'}
                    className="p-2 rounded-xl bg-stone-900 border border-stone-800 hover:bg-stone-850 hover:border-stone-700 text-stone-400 hover:text-stone-100 transition-all cursor-pointer shadow-xs active:scale-95"
                  >
                    {isFullscreen ? (
                      <Minimize2 className="w-4 h-4" />
                    ) : (
                      <Maximize2 className="w-4 h-4" />
                    )}
                  </button>
                  {onLogout && (
                    <button
                      type="button"
                      onClick={onLogout}
                      title="Kunci Layar / Ganti Petugas"
                      className="p-2 rounded-xl bg-stone-900 border border-stone-800 hover:bg-stone-850 hover:border-stone-700 text-stone-400 hover:text-rose-400 transition-all cursor-pointer shadow-xs active:scale-95"
                    >
                      <Lock className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>

        </div>
      </div>
    </header>
  )
}
