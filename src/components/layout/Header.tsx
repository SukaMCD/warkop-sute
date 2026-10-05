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
  Package
} from 'lucide-react'
import type { User } from '../../types'
import type { TabType } from '../../utils/navigation'

interface HeaderProps {
  activeTab: TabType
  currentUser?: User | null
  onLogout?: () => void
  onToggleSidebar?: () => void
  onOpenMobileSidebar?: () => void
  isSidebarCollapsed?: boolean
}

export const Header = ({
  activeTab,
  onToggleSidebar,
  onOpenMobileSidebar,
  isSidebarCollapsed
}: HeaderProps) => {

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
            <div className="flex items-center gap-2.5 min-w-0 truncate">
              <div className="w-8 h-8 rounded-xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 flex items-center justify-center text-amber-900 dark:text-[#E2DFD2] shrink-0 shadow-xs">
                <Icon className="w-4 h-4 stroke-[2.2]" />
              </div>
              <div className="min-w-0 truncate">
                <h1 className="text-xs sm:text-sm font-bold tracking-tight text-stone-900 dark:text-stone-100 truncate leading-tight">
                  {currentMeta.title}
                </h1>
                <p className="text-[10px] sm:text-[11px] text-stone-500 dark:text-stone-400 hidden xs:block truncate leading-tight mt-0.5">
                  {currentMeta.subtitle}
                </p>
              </div>
            </div>
          </div>

          {/* Right: Realtime Clock, Date & Status */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            <div className="flex items-center gap-2.5 px-3 py-1.5 rounded-xl bg-white/90 dark:bg-stone-900/60 border border-stone-200 dark:border-stone-800/80 font-mono text-xs shadow-xs">
              <div className="flex items-center gap-1.5 text-stone-900 dark:text-stone-200 font-bold tabular-nums">
                <span>{currentTime}</span>
                <span className="text-[10px] text-stone-500 dark:text-stone-400 font-sans">WIB</span>
              </div>
              <span className="text-stone-300 dark:text-stone-700 hidden sm:inline">•</span>
              <span className="text-stone-600 dark:text-stone-400 font-sans text-[11px] hidden sm:inline">{currentDate}</span>
            </div>
          </div>

        </div>
      </div>
    </header>
  )
}
