import { useState, useEffect } from 'react'
import {
  Menu,
  PanelLeft,
  MonitorPlay,
  LayoutDashboard,
  ReceiptText,
  Clock,
  UtensilsCrossed,
  Users,
  Printer,
  CalendarRange,
  Package,
  Wifi,
  WifiOff,
  RefreshCw,
  Check,
  Download,
  Sparkles,
  Smartphone,
  LogOut,
  Plus,
  Maximize2,
  Minimize2
} from 'lucide-react'
import type { User } from '../../types'
import type { TabType } from '../../utils/navigation'
import { subscribeToQueue, syncPendingOrders, getPendingCount } from '../../utils/offlineQueue'
import { subscribePwaInstall, subscribePwaUpdate, promptPwaInstall, applyPwaUpdate } from '../../utils/pwa'
import { useFullscreen } from '../../utils/fullscreen'

interface HeaderProps {
  activeTab: TabType
  currentUser?: User | null
  onLogout?: () => void
  onToggleSidebar?: () => void
  onOpenMobileSidebar?: () => void
  isSidebarCollapsed?: boolean
  onOrdersSynced?: () => void
  onOpenOverheadExpense?: () => void
  onEnterFullscreen?: () => void
}

export const Header = ({
  activeTab,
  currentUser,
  onLogout,
  onToggleSidebar,
  onOpenMobileSidebar,
  isSidebarCollapsed,
  onOrdersSynced,
  onOpenOverheadExpense,
  onEnterFullscreen
}: HeaderProps) => {

  const { isFullscreen, toggleFullscreen } = useFullscreen()

  const handleFullscreenClick = async () => {
    const entered = await toggleFullscreen()
    if (entered && onEnterFullscreen) {
      onEnterFullscreen()
    }
  }

  const [isOnline, setIsOnline] = useState<boolean>(() => typeof navigator !== 'undefined' ? navigator.onLine : true)
  const [pendingSyncCount, setPendingSyncCount] = useState<number>(() => getPendingCount())
  const [isSyncing, setIsSyncing] = useState<boolean>(false)
  const [justSynced, setJustSynced] = useState<boolean>(false)
  const [canInstallPwa, setCanInstallPwa] = useState<boolean>(false)
  const [hasPwaUpdate, setHasPwaUpdate] = useState<boolean>(false)

  // Listen to PWA installability and update events
  useEffect(() => {
    const unsubInstall = subscribePwaInstall(setCanInstallPwa)
    const unsubUpdate = subscribePwaUpdate(() => setHasPwaUpdate(true))
    return () => {
      unsubInstall()
      unsubUpdate()
    }
  }, [])

  // Listen to network status and offline queue
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true)
      // Auto-trigger sync when back online
      triggerSync()
    }
    const handleOffline = () => {
      setIsOnline(false)
    }

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    const unsubscribe = subscribeToQueue((count) => {
      setPendingSyncCount(count)
    })

    // Periodic sync check every 25 seconds if online and there are pending items
    const interval = setInterval(() => {
      if (navigator.onLine && getPendingCount() > 0) {
        triggerSync()
      }
    }, 25000)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
      unsubscribe()
      clearInterval(interval)
    }
  }, [])

  const triggerSync = async () => {
    if (isSyncing || getPendingCount() === 0) return
    setIsSyncing(true)
    try {
      const res = await syncPendingOrders()
      if (res.syncedCount > 0) {
        setJustSynced(true)
        setTimeout(() => setJustSynced(false), 3000)
        if (onOrdersSynced) onOrdersSynced()
      }
    } catch (err) {
      console.error('Failed to sync offline orders:', err)
    } finally {
      setIsSyncing(false)
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

  // Title configuration based on active tab
  const tabTitles: Record<typeof activeTab, { title: string; subtitle: string; icon: typeof MonitorPlay }> = {
    pos: {
      title: 'Layar Kasir (POS)',
      subtitle: 'Input pesanan & cetak struk kilat',
      icon: MonitorPlay
    },
    dashboard: {
      title: 'Ringkasan Omzet & Performa',
      subtitle: 'Monitoring KPI harian warkop',
      icon: LayoutDashboard
    },
    monthly: {
      title: 'Rekapan & Laporan Keuangan Bulanan',
      subtitle: 'Pembukuan omzet, laba bersih & pengeluaran kas',
      icon: CalendarRange
    },
    orders: {
      title: 'Riwayat Transaksi Penjualan',
      subtitle: 'Audit, cetak ulang struk & pembatalan',
      icon: ReceiptText
    },
    shift: {
      title: 'Audit & Rekonsiliasi Shift',
      subtitle: 'Pencatatan kas fisik vs sistem',
      icon: Clock
    },
    inventory: {
      title: 'Stok & Bahan Baku',
      subtitle: 'Monitoring inventaris, stok masuk & pemakaian',
      icon: Package
    },
    products: {
      title: 'Katalog & Ketersediaan Menu',
      subtitle: 'Kelola harga modal, jual & status menu',
      icon: UtensilsCrossed
    },
    users: {
      title: 'Kelola Petugas Kasir',
      subtitle: 'Atur akun kasir & ubah PIN',
      icon: Users
    },
    receipt: {
      title: 'Kustomisasi Format Struk',
      subtitle: 'Tata letak & informasi cetak printer thermal',
      icon: Printer
    }
  }

  const currentMeta = tabTitles[activeTab] || tabTitles.pos
  const Icon = currentMeta.icon

  return (
    <header className="border-b border-stone-200 dark:border-stone-800/80 bg-[#FAF8F5]/90 dark:bg-stone-950/90 backdrop-blur sticky top-0 z-20 shrink-0 transition-colors">
      <div className="w-full px-4 sm:px-6">
        <div className="flex items-center justify-between h-14 sm:h-16 gap-3">
          
          {/* Left: Mobile Menu Toggle / Desktop Collapse Toggle & Page Title */}
          <div className="flex items-center gap-3 min-w-0">
            {/* Mobile Hamburger */}
            <button
              type="button"
              onClick={onOpenMobileSidebar}
              className="md:hidden p-2 rounded-xl bg-stone-100 dark:bg-stone-900 border border-stone-200 dark:border-stone-800 text-stone-700 dark:text-stone-300 hover:text-stone-950 dark:hover:text-white transition-colors cursor-pointer"
              title="Buka Navigasi"
            >
              <Menu className="w-4 h-4" />
            </button>

            {/* Desktop Toggle Sidebar (when collapsed or to toggle) */}
            <button
              type="button"
              onClick={onToggleSidebar}
              className="hidden md:flex p-2 rounded-xl bg-stone-100 dark:bg-stone-900 border border-stone-200 dark:border-stone-800 text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-100 hover:bg-stone-200/70 dark:hover:bg-stone-850 transition-colors cursor-pointer shadow-xs active:scale-95"
              title={isSidebarCollapsed ? 'Perluas Sidebar' : 'Kecilkan Sidebar'}
            >
              <PanelLeft className="w-4 h-4 text-stone-700 dark:text-[#E2DFD2]" />
            </button>

            {/* Current Page Title */}
            <div className="flex items-center gap-2 min-w-0 truncate">
              <div className="w-8 h-8 rounded-xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 flex items-center justify-center text-amber-900 dark:text-[#E2DFD2] shrink-0 shadow-xs">
                <Icon className="w-4 h-4 stroke-[2.2]" />
              </div>
              <div className="min-w-0 max-w-[110px] xs:max-w-[160px] sm:max-w-none truncate">
                <h1 className="text-xs sm:text-sm font-bold tracking-tight text-stone-900 dark:text-stone-100 truncate leading-tight">
                  {currentMeta.title}
                </h1>
                <p className="text-[10px] sm:text-[11px] text-stone-500 dark:text-stone-400 hidden xs:block truncate leading-tight mt-0.5">
                  {currentMeta.subtitle}
                </p>
              </div>
            </div>
          </div>

          {/* Right: Network Status, Offline Queue Badge & Realtime Clock */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            {/* Sync Queue Button / Status */}
            {pendingSyncCount > 0 ? (
              <button
                type="button"
                onClick={triggerSync}
                disabled={isSyncing || !isOnline}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800/70 text-amber-800 dark:text-amber-300 text-xs font-medium cursor-pointer shadow-xs active:scale-95 transition-all"
                title={isOnline ? "Klik untuk sinkronkan ke database sekarang" : "Koneksi offline: Menunggu internet pulih"}
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
                <span className="font-mono font-bold">{pendingSyncCount}</span>
                <span className="hidden sm:inline">{isSyncing ? 'Sinkronisasi...' : 'Tertunda'}</span>
              </button>
            ) : justSynced ? (
              <div className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800/70 text-emerald-800 dark:text-emerald-300 text-xs font-medium">
                <Check className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Tersinkron</span>
              </div>
            ) : !isOnline ? (
              <div
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 text-rose-700 dark:text-rose-400 text-xs font-medium"
                title="Koneksi terputus. Kasir tetap dapat input pesanan & cetak struk offline."
              >
                <WifiOff className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Offline</span>
              </div>
            ) : (
              <div
                className="hidden sm:flex items-center gap-1.5 px-2 py-1.5 rounded-xl bg-stone-100/70 dark:bg-stone-900/40 text-stone-500 dark:text-stone-400 text-xs font-mono"
                title="Terhubung ke Cloudflare Edge & D1"
              >
                <Wifi className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                <span className="text-[11px]">Online</span>
              </div>
            )}

            {/* PWA Update Banner */}
            {hasPwaUpdate && (
              <button
                type="button"
                onClick={applyPwaUpdate}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 border border-amber-600/40 text-amber-900 dark:text-[#E2DFD2] dark:border-[#E2DFD2]/40 text-xs font-semibold cursor-pointer shadow-xs transition-all active:scale-95 animate-pulse"
                title="Pembaruan sistem telah siap di latar belakang. Klik untuk menerapkan versi terbaru."
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-700 dark:text-[#E2DFD2]" />
                <span className="hidden sm:inline">Pembaruan Tersedia</span>
                <span className="text-[11px] underline font-mono">Muat Ulang</span>
              </button>
            )}

            {/* PWA Install Button */}
            {canInstallPwa && (
              <button
                type="button"
                onClick={promptPwaInstall}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-stone-100 hover:bg-stone-200/70 dark:bg-stone-900 dark:hover:bg-stone-850 border border-stone-200 dark:border-stone-800 text-stone-700 dark:text-stone-300 text-xs font-semibold cursor-pointer shadow-xs transition-all active:scale-95"
                title="Pasang aplikasi POS Warkop Sudut Temu ke layar utama perangkat"
              >
                <Download className="w-3.5 h-3.5 text-amber-700 dark:text-[#E2DFD2]" />
                <span className="hidden md:inline">Install POS</span>
              </button>
            )}

            {/* Catat Beban Overhead (Owner Only) */}
            {currentUser?.role === 'owner' && onOpenOverheadExpense && (
              <button
                type="button"
                onClick={onOpenOverheadExpense}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-stone-900 hover:bg-stone-850 text-white dark:bg-[#E2DFD2] dark:hover:bg-[#d6d3c4] dark:text-stone-950 text-xs font-bold transition-all cursor-pointer shadow-xs active:scale-95"
                title="Catat beban operasional toko (sewa, listrik, air, wifi, gaji, servis)"
              >
                <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
                <span className="hidden sm:inline">Catat Beban</span>
              </button>
            )}

            {/* Android APK Download Button */}
            <a
              href="/warkop-pos.apk"
              download="warkop-pos.apk"
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-stone-100 hover:bg-stone-200/70 dark:bg-stone-900 dark:hover:bg-stone-850 border border-stone-200 dark:border-stone-800 text-stone-700 dark:text-stone-300 text-xs font-semibold cursor-pointer shadow-xs transition-all active:scale-95 no-underline"
              title="Unduh paket aplikasi Android (.APK) untuk smartphone atau tablet"
            >
              <Smartphone className="w-3.5 h-3.5 text-amber-700 dark:text-[#E2DFD2]" />
              <span className="hidden lg:inline">Unduh APK</span>
            </a>

            {/* Fullscreen & Lock Landscape Button (Ideal for Tablet POS) */}
            <button
              type="button"
              onClick={handleFullscreenClick}
              className={`flex items-center gap-1.5 p-2 sm:px-2.5 sm:py-1.5 rounded-xl border text-xs font-semibold cursor-pointer shadow-xs transition-all active:scale-95 ${
                isFullscreen
                  ? 'bg-amber-100 dark:bg-amber-950/60 border-amber-300 dark:border-amber-800 text-amber-900 dark:text-amber-200'
                  : 'bg-stone-100 hover:bg-stone-200/70 dark:bg-stone-900 dark:hover:bg-stone-850 border border-stone-200 dark:border-stone-800 text-stone-700 dark:text-stone-300'
              }`}
              title={
                isFullscreen
                  ? 'Keluar Layar Penuh'
                  : 'Layar Penuh (Kunci Landscape Tablet)'
              }
            >
              {isFullscreen ? (
                <Minimize2 className="w-3.5 h-3.5 text-amber-800 dark:text-amber-300" />
              ) : (
                <Maximize2 className="w-3.5 h-3.5 text-stone-700 dark:text-[#E2DFD2]" />
              )}
              <span className="hidden sm:inline">
                {isFullscreen ? 'Normal' : 'Layar Penuh'}
              </span>
            </button>

            {/* Realtime Clock & Date */}
            <div className="flex items-center gap-1.5 sm:gap-2.5 px-2 sm:px-3 py-1.5 rounded-xl bg-white/90 dark:bg-stone-900/60 border border-stone-200 dark:border-stone-800/80 font-mono text-xs shadow-xs">
              <div className="flex items-center gap-1 text-stone-900 dark:text-stone-200 font-bold tabular-nums">
                <span>{currentTime}</span>
                <span className="text-[10px] text-stone-500 dark:text-stone-400 font-sans hidden xxs:inline">WIB</span>
              </div>
              <span className="text-stone-300 dark:text-stone-700 hidden sm:inline">•</span>
              <span className="text-stone-600 dark:text-stone-400 font-sans text-[11px] hidden sm:inline">{currentDate}</span>
            </div>

            {/* User Badge */}
            {currentUser && (
              <div className="hidden xl:flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-stone-100 dark:bg-stone-900 border border-stone-200 dark:border-stone-800 text-xs font-mono">
                <span className="font-bold text-stone-900 dark:text-[#E2DFD2] truncate max-w-28">{currentUser.name}</span>
                <span className="text-[10px] text-stone-500 uppercase font-sans">({currentUser.role})</span>
              </div>
            )}

            {/* Quick Logout Button */}
            {onLogout && (
              <button
                type="button"
                onClick={onLogout}
                className="flex items-center gap-1.5 p-2 sm:px-3 sm:py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100/90 text-rose-700 dark:bg-rose-950/50 dark:hover:bg-rose-900/70 dark:text-rose-300 border border-rose-200/90 dark:border-rose-900/70 text-xs font-mono font-bold transition-all cursor-pointer shadow-xs active:scale-95"
                title="Keluar / Kunci Terminal"
              >
                <LogOut className="w-3.5 h-3.5 stroke-[2.2]" />
                <span className="hidden sm:inline">Keluar</span>
              </button>
            )}
          </div>

        </div>
      </div>
    </header>
  )
}
