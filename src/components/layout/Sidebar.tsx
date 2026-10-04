import { useState, useEffect } from 'react'
import {
  MonitorPlay,
  LayoutDashboard,
  ReceiptText,
  Clock,
  UtensilsCrossed,
  Users,
  Lock,
  Maximize2,
  Minimize2,
  PanelLeft,
  ChevronRight,
  Printer,
  CalendarRange,
  Package
} from 'lucide-react'
import type { User } from '../../types'
import type { TabType } from '../../utils/navigation'

interface SidebarProps {
  activeTab: TabType
  setActiveTab: (tab: TabType) => void
  currentUser?: User | null
  onLogout?: () => void
  isCollapsed: boolean
  setIsCollapsed: (val: boolean | ((prev: boolean) => boolean)) => void
  isMobileOpen: boolean
  setIsMobileOpen: (val: boolean) => void
}

export const Sidebar = ({
  activeTab,
  setActiveTab,
  currentUser,
  onLogout,
  isCollapsed,
  setIsCollapsed,
  isMobileOpen,
  setIsMobileOpen
}: SidebarProps) => {
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

  const isOwner = currentUser?.role === 'owner'

  // Navigation Items
  const navItems = [
    {
      id: 'pos' as const,
      label: 'Layar Kasir (POS)',
      shortLabel: 'Kasir',
      icon: MonitorPlay,
      section: 'operasional',
      show: true
    },
    {
      id: 'dashboard' as const,
      label: 'Ringkasan Omzet',
      shortLabel: 'Ringkasan',
      icon: LayoutDashboard,
      section: 'manajemen',
      show: isOwner
    },
    {
      id: 'monthly' as const,
      label: 'Rekapan Bulanan',
      shortLabel: 'Rekap Bulan',
      icon: CalendarRange,
      section: 'manajemen',
      show: isOwner
    },
    {
      id: 'orders' as const,
      label: isOwner ? 'Riwayat Transaksi' : 'Pesanan Shift Ini',
      shortLabel: 'Transaksi',
      icon: ReceiptText,
      section: isOwner ? 'manajemen' : 'operasional',
      show: true
    },
    {
      id: 'shift' as const,
      label: isOwner ? 'Audit Shift Kasir' : 'Info & Tutup Shift',
      shortLabel: 'Shift',
      icon: Clock,
      section: isOwner ? 'manajemen' : 'operasional',
      show: true
    },
    {
      id: 'inventory' as const,
      label: 'Stok Bahan Baku',
      shortLabel: 'Bahan Baku',
      icon: Package,
      section: isOwner ? 'manajemen' : 'operasional',
      show: true
    },
    {
      id: 'products' as const,
      label: 'Katalog Menu',
      shortLabel: 'Menu',
      icon: UtensilsCrossed,
      section: 'manajemen',
      show: isOwner
    },
    {
      id: 'users' as const,
      label: 'Kelola Petugas',
      shortLabel: 'Petugas',
      icon: Users,
      section: 'manajemen',
      show: isOwner
    },
    {
      id: 'receipt' as const,
      label: 'Kustomisasi Struk',
      shortLabel: 'Struk',
      icon: Printer,
      section: 'manajemen',
      show: isOwner
    }
  ]

  const handleNavClick = (tabId: typeof activeTab) => {
    setActiveTab(tabId)
    setIsMobileOpen(false)
  }

  const sidebarContent = (
    <div className="flex flex-col h-full bg-stone-950 border-r border-stone-800/90 text-stone-100 select-none">
      
      {/* 1. Header: Brand Logo & Collapse Toggle */}
      <div className={`flex items-center h-16 px-4 border-b border-stone-800/80 transition-all ${
        isCollapsed ? 'justify-center' : 'justify-between'
      }`}>
        <div className="flex items-center gap-3 overflow-hidden">
          <div className="w-9 h-9 rounded-xl overflow-hidden border border-stone-700/80 bg-stone-900 flex items-center justify-center shadow-xs shrink-0">
            <img
              src="/logo.png"
              alt="Warkop Sudut Temu"
              className="w-full h-full object-cover"
            />
          </div>
          {!isCollapsed && (
            <div className="truncate">
              <span className="font-bold tracking-tight text-stone-100 text-sm block leading-tight">
                Sudut Temu
              </span>
              <span className="text-[10px] font-mono text-stone-400 block tracking-wider uppercase">
                {isOwner ? 'Owner Dashboard' : 'Kasir Terminal'}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* 2. Navigation Items */}
      <div className="flex-1 overflow-y-auto py-4 px-2 space-y-4">
        
        {/* Operasional Group */}
        <div>
          {!isCollapsed && (
            <div className="px-3 pb-1.5 text-[10px] font-mono uppercase tracking-wider text-stone-400 font-semibold">
              Operasional
            </div>
          )}
          <nav className="space-y-1">
            {navItems
              .filter(item => item.show && item.section === 'operasional')
              .map((item) => {
                const Icon = item.icon
                const isActive = activeTab === item.id
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => handleNavClick(item.id)}
                    title={isCollapsed ? item.label : undefined}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer group ${
                      isActive
                        ? 'bg-[#E2DFD2] text-stone-950 font-bold shadow-xs'
                        : 'text-stone-400 hover:text-stone-100 hover:bg-stone-900/80'
                    } ${isCollapsed ? 'justify-center px-2' : ''}`}
                  >
                    <Icon className={`w-4 h-4 shrink-0 transition-transform ${
                      isActive ? 'stroke-[2.5]' : 'group-hover:scale-105'
                    }`} />
                    {!isCollapsed && (
                      <span className="truncate flex-1 text-left">{item.label}</span>
                    )}
                    {!isCollapsed && isActive && (
                      <ChevronRight className="w-3.5 h-3.5 text-stone-950 shrink-0 opacity-60" />
                    )}
                  </button>
                )
              })}
          </nav>
        </div>

        {/* Manajemen Group (Owner) */}
        {isOwner && (
          <div>
            {!isCollapsed && (
              <div className="px-3 pb-1.5 pt-2 text-[10px] font-mono uppercase tracking-wider text-stone-400 font-semibold border-t border-stone-800/60">
                Manajemen
              </div>
            )}
            <nav className="space-y-1">
              {navItems
                .filter(item => item.show && item.section === 'manajemen')
                .map((item) => {
                  const Icon = item.icon
                  const isActive = activeTab === item.id
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => handleNavClick(item.id)}
                      title={isCollapsed ? item.label : undefined}
                      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer group ${
                        isActive
                          ? 'bg-[#E2DFD2] text-stone-950 font-bold shadow-xs'
                          : 'text-stone-400 hover:text-stone-100 hover:bg-stone-900/80'
                      } ${isCollapsed ? 'justify-center px-2' : ''}`}
                    >
                      <Icon className={`w-4 h-4 shrink-0 transition-transform ${
                        isActive ? 'stroke-[2.5]' : 'group-hover:scale-105'
                      }`} />
                      {!isCollapsed && (
                        <span className="truncate flex-1 text-left">{item.label}</span>
                      )}
                      {!isCollapsed && isActive && (
                        <ChevronRight className="w-3.5 h-3.5 text-stone-950 shrink-0 opacity-60" />
                      )}
                    </button>
                  )
                })}
            </nav>
          </div>
        )}

      </div>

      {/* 3. Bottom Footer: User Identity & Action Buttons */}
      <div className="p-3 border-t border-stone-800/80 space-y-2 bg-stone-950/60 shrink-0">
        
        {/* User Card */}
        {currentUser && (
          <div className={`p-2.5 rounded-xl bg-stone-900/70 border border-stone-800 flex items-center ${
            isCollapsed ? 'justify-center py-2' : 'justify-between'
          }`}>
            <div className="min-w-0 truncate">
              {!isCollapsed ? (
                <>
                  <p className="text-xs font-semibold text-stone-100 truncate leading-tight">
                    {currentUser.name}
                  </p>
                  <span className="text-[10px] font-mono text-[#E2DFD2] uppercase tracking-wider block mt-0.5">
                    {isOwner ? 'Owner' : 'Kasir'}
                  </span>
                </>
              ) : (
                <span className="text-[11px] font-mono font-bold text-[#E2DFD2] tracking-wider block text-center">
                  {isOwner ? 'OWN' : 'KSR'}
                </span>
              )}
            </div>

            {!isCollapsed && (
              <div className="flex items-center gap-1 shrink-0">
                <button
                  type="button"
                  onClick={handleToggleFullscreen}
                  title={isFullscreen ? 'Keluar Layar Penuh' : 'Layar Penuh'}
                  className="p-1.5 rounded-lg text-stone-400 hover:text-stone-100 hover:bg-stone-800 transition-colors cursor-pointer"
                >
                  {isFullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
                </button>
                {onLogout && (
                  <button
                    type="button"
                    onClick={onLogout}
                    title="Kunci Terminal (PIN)"
                    className="p-1.5 rounded-lg text-stone-400 hover:text-rose-400 hover:bg-stone-800 transition-colors cursor-pointer"
                  >
                    <Lock className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            )}
          </div>
        )}

        {/* Collapsed actions */}
        {isCollapsed && (
          <div className="flex flex-col items-center gap-1 pt-1">
            <button
              type="button"
              onClick={handleToggleFullscreen}
              title={isFullscreen ? 'Keluar Layar Penuh' : 'Layar Penuh'}
              className="w-full py-2 flex items-center justify-center rounded-lg text-stone-400 hover:text-stone-100 hover:bg-stone-900 transition-colors"
            >
              {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>
            {onLogout && (
              <button
                type="button"
                onClick={onLogout}
                title="Kunci Terminal (PIN)"
                className="w-full py-2 flex items-center justify-center rounded-lg text-stone-400 hover:text-rose-400 hover:bg-stone-900 transition-colors"
              >
                <Lock className="w-4 h-4" />
              </button>
            )}
            <button
              type="button"
              onClick={() => setIsCollapsed(false)}
              title="Perluas Sidebar"
              className="w-full py-2 flex items-center justify-center rounded-lg text-[#E2DFD2] hover:bg-stone-900 transition-colors mt-1"
            >
              <PanelLeft className="w-4 h-4" />
            </button>
          </div>
        )}

      </div>

    </div>
  )

  return (
    <>
      {/* Desktop Sidebar */}
      <aside
        className={`hidden md:block shrink-0 transition-all duration-200 z-30 ${
          isCollapsed ? 'w-16' : 'w-60'
        }`}
      >
        <div className="sticky top-0 h-screen">
          {sidebarContent}
        </div>
      </aside>

      {/* Mobile Drawer Backdrop & Sidebar */}
      {isMobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex">
          <div
            className="fixed inset-0 bg-black/80 backdrop-blur-xs animate-in fade-in duration-150"
            onClick={() => setIsMobileOpen(false)}
          />
          <div className="relative w-64 h-full z-10 animate-in slide-in-from-left duration-200">
            {sidebarContent}
          </div>
        </div>
      )}
    </>
  )
}
