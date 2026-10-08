import { useState, useEffect } from 'react'
import { Header } from './components/layout/Header'
import { Sidebar } from './components/layout/Sidebar'
import { LoginPage } from './components/auth/LoginPage'
import { POSView } from './components/pos/POSView'
import { StatCards } from './components/dashboard/StatCards'
import { RevenueChart } from './components/dashboard/RevenueChart'
import { BestSellers } from './components/dashboard/BestSellers'
import { RecentOrders } from './components/dashboard/RecentOrders'
import { ShiftOverview } from './components/dashboard/ShiftOverview'
import { ProductsCatalogView } from './components/dashboard/ProductsCatalogView'
import { ShiftAuditView } from './components/dashboard/ShiftAuditView'
import { UserManagementView } from './components/dashboard/UserManagementView'
import { ReceiptSettingsView } from './components/dashboard/ReceiptSettingsView'
import { MonthlyReportView } from './components/dashboard/MonthlyReportView'
import { InventoryView } from './components/inventory/InventoryView'
import { StartShiftModal } from './components/pos/StartShiftModal'
import { CloseShiftModal } from './components/pos/CloseShiftModal'
import { ShiftHandoverModal } from './components/pos/ShiftHandoverModal'
import type { Product, Order, Shift, User, ShiftExpense, DailySalesMetric, ReceiptConfig } from './types'
import { DEFAULT_RECEIPT_CONFIG, loadReceiptConfig } from './utils/receiptConfig'
import { type TabType, TAB_TO_PATH, getTabFromPath } from './utils/navigation'
import { apiFetch } from './utils/api'
import { OverheadExpenseModal } from './components/dashboard/OverheadExpenseModal'
import {
  mockProducts
} from './data/mockData'

// Shift awal berstatus closed untuk mencegah kedipan tombol merah 'Akhiri Shift'
const initialEmptyShift: Shift = {
  id: '',
  cashier_id: '',
  cashier_name: 'Belum Ada Shift',
  start_time: '',
  initial_cash: 0,
  total_cash_sales: 0,
  total_qris_sales: 0,
  total_expenses: 0,
  total_incomes: 0,
  status: 'closed',
  notes: ''
}

// Generate 7 hari terakhir dengan nilai awal 0 untuk mencegah kedipan mock data palsu
const getInitialEmptyWeeklySales = (): DailySalesMetric[] => {
  const dayNames = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab']
  const days: DailySalesMetric[] = []
  for (let i = 6; i >= 0; i--) {
    const d = new Date()
    d.setDate(d.getDate() - i)
    const dateStr = d.toISOString().split('T')[0]
    days.push({
      date: dateStr,
      day_name: dayNames[d.getDay()],
      revenue: 0,
      transactions: 0,
      cash_amount: 0,
      qris_amount: 0
    })
  }
  return days
}

export function App() {
  // Authentication & Lockscreen state
  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    try {
      const saved = localStorage.getItem('sute_session_user')
      return saved ? JSON.parse(saved) : null
    } catch {
      return null
    }
  })
  const [isLocked, setIsLocked] = useState<boolean>(() => {
    try {
      return localStorage.getItem('sute_is_locked') === 'true'
    } catch {
      return false
    }
  })

  // Synchronize activeTab with URL pathname so refresh stays on current page
  const [activeTab, setActiveTab] = useState<TabType>(() => {
    let savedRole: string | undefined
    try {
      const saved = localStorage.getItem('sute_session_user')
      if (saved) {
        const u = JSON.parse(saved)
        savedRole = u.role
      }
    } catch {}
    return getTabFromPath(window.location.pathname, savedRole)
  })

  const handleSelectTab = (tab: TabType) => {
    setActiveTab(tab)
    const targetPath = TAB_TO_PATH[tab] || '/'
    if (window.location.pathname !== targetPath) {
      window.history.pushState(null, '', targetPath)
    }
  }

  // Handle browser Back / Forward buttons
  useEffect(() => {
    const handlePopState = () => {
      const tab = getTabFromPath(window.location.pathname, currentUser?.role)
      setActiveTab(tab)
    }
    window.addEventListener('popstate', handlePopState)
    return () => window.removeEventListener('popstate', handlePopState)
  }, [currentUser?.role])

  // Sync initial URL pathname with active tab
  useEffect(() => {
    if (!currentUser || isLocked) return
    const currentTab = getTabFromPath(window.location.pathname, currentUser.role)
    const expectedPath = TAB_TO_PATH[currentTab]
    if (window.location.pathname !== expectedPath) {
      window.history.replaceState(null, '', expectedPath)
    }
  }, [currentUser, isLocked])
  
  // Custom Receipt Configuration
  const [receiptConfig, setReceiptConfig] = useState<ReceiptConfig>(DEFAULT_RECEIPT_CONFIG)
  
  // Live state from backend (Inisialisasi bersih tanpa data dummy palsu)
  const [products, setProducts] = useState<Product[]>(mockProducts)
  const [orders, setOrders] = useState<Order[]>([])
  const [currentShift, setCurrentShift] = useState<Shift>(initialEmptyShift)
  const [weeklySales, setWeeklySales] = useState<DailySalesMetric[]>(getInitialEmptyWeeklySales)
  const [bestSellers, setBestSellers] = useState<Product[]>([])

  // Sidebar Layout State
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState<boolean>(() => {
    try {
      return localStorage.getItem('sute_sidebar_collapsed') === 'true'
    } catch {
      return false
    }
  })
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState<boolean>(false)

  const handleToggleSidebar = () => {
    setIsSidebarCollapsed(prev => {
      const next = !prev
      try {
        localStorage.setItem('sute_sidebar_collapsed', String(next))
      } catch {}
      return next
    })
  }

  // Shift Modals
  const [isStartShiftModalOpen, setIsStartShiftModalOpen] = useState<boolean>(false)
  const [isCloseShiftModalOpen, setIsCloseShiftModalOpen] = useState<boolean>(false)
  const [isHandoverModalOpen, setIsHandoverModalOpen] = useState<boolean>(false)
  const [isHandoverTransition, setIsHandoverTransition] = useState<boolean>(false)
  const [isGlobalOverheadModalOpen, setIsGlobalOverheadModalOpen] = useState<boolean>(false)

  // High-level metrics (Awal 0 sebelum data live D1 tiba)
  const [revenueToday, setRevenueToday] = useState<number>(0)
  const [transactionsToday, setTransactionsToday] = useState<number>(0)
  const [cashAmount, setCashAmount] = useState<number>(0)
  const [qrisAmount, setQrisAmount] = useState<number>(0)
  const [estimatedProfit, setEstimatedProfit] = useState<number>(0)

  // Handle Login / Unlock
  const handleLoginSuccess = async (user: User) => {
    try {
      localStorage.removeItem('sute_is_locked')
    } catch {
      // ignore
    }
    setCurrentUser(user)
    setIsLocked(false)

    const targetTab = getTabFromPath(window.location.pathname, user.role)
    setActiveTab(targetTab)
    const expectedPath = TAB_TO_PATH[targetTab]
    if (window.location.pathname !== expectedPath) {
      window.history.replaceState(null, '', expectedPath)
    }

    if (user.role === 'cashier') {
      // Ambil data shift aktif terkini langsung dari server
      let activeShift: Shift | null = currentShift
      try {
        const res = await apiFetch('/api/shifts/current')
        if (res.ok) {
          const json: any = await res.json()
          if (json.success) {
            activeShift = json.data
            if (json.data) {
              setCurrentShift(json.data)
            } else {
              setCurrentShift(prev => ({ ...prev, status: 'closed' }))
            }
          }
        }
      } catch {
        // Gunakan state lokal jika offline
      }

      // Evaluasi status shift:
      if (!activeShift || activeShift.status !== 'open') {
        // 1. Belum ada shift berjalan: wajib input saldo awal (Buka Shift Baru)
        setIsStartShiftModalOpen(true)
      } else if (activeShift.cashier_id && activeShift.cashier_id !== user.id) {
        // 2. Ada shift berjalan milik kasir lain (misal Rian login saat shift Budi masih berjalan):
        // Munculkan dialog pergantian shift (Handover Modal)
        setIsHandoverModalOpen(true)
      } else {
        // 3. Kasir yang sama (misal Budi login kembali setelah ke toilet / layar terkunci):
        // Langsung masuk ke kasir tanpa perlu input modal awal lagi!
      }
    }
  }

  // Handover action: Tutup shift kasir lama lalu buka shift baru kasir saat ini
  const handleHandoverCloseAndStartNew = () => {
    setIsHandoverModalOpen(false)
    setIsHandoverTransition(true)
    setIsCloseShiftModalOpen(true)
  }

  // Handover action: Lanjutkan shift berjalan (hanya gantian sementara)
  const handleHandoverContinueShift = () => {
    setIsHandoverModalOpen(false)
  }

  // Handover action: Batal & kunci kembali layar
  const handleHandoverCancel = () => {
    setIsHandoverModalOpen(false)
    handleLockScreen()
  }

  const handleShiftStarted = (newShift: Shift) => {
    setCurrentShift(newShift)
    setIsStartShiftModalOpen(false)
    void fetchD1Data()
  }

  const handleShiftClosed = (closedShift: Shift) => {
    setCurrentShift(closedShift)
    setIsCloseShiftModalOpen(false)
    void fetchD1Data()

    if (isHandoverTransition) {
      // Alur serah terima: setelah shift kasir lama ditutup, langsung buka modal shift baru untuk kasir baru
      setIsHandoverTransition(false)
      setIsStartShiftModalOpen(true)
    } else {
      // Tutup shift reguler: sistem otomatis mengarahkan ke Layar PIN
      try {
        localStorage.removeItem('sute_session_user')
        localStorage.setItem('sute_is_locked', 'true')
      } catch {
        // ignore
      }
      setCurrentUser(null)
      setIsLocked(true)
    }
  }

  // Guard: Determine effective tab based on role
  const isCashier = currentUser?.role === 'cashier'
  const effectiveTab = (isCashier && (activeTab === 'dashboard' || activeTab === 'products' || activeTab === 'users')) ? 'pos' : activeTab

  // Realtime order creation hook
  const handleOrderCompleted = (newOrder: Order) => {
    setOrders(prev => [newOrder, ...prev])
    setTransactionsToday(prev => prev + 1)
    setRevenueToday(prev => prev + newOrder.total_amount)
    if (newOrder.payment_method === 'cash') {
      setCashAmount(prev => prev + newOrder.total_amount)
      setCurrentShift(prev => ({
        ...prev,
        total_cash_sales: (prev.total_cash_sales || 0) + newOrder.total_amount
      }))
    } else {
      setQrisAmount(prev => prev + newOrder.total_amount)
      setCurrentShift(prev => ({
        ...prev,
        total_qris_sales: (prev.total_qris_sales || 0) + newOrder.total_amount
      }))
    }
    // Sinkronisasi data D1 (weekly sales, best sellers, stats) secara live
    void fetchD1Data()
  }

  // Handle cancelled order
  const handleOrderCancelled = (orderId: string) => {
    setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: 'cancelled' } : o))
    void fetchD1Data()
  }

  // Handle new petty cash expense or cash-in recorded
  const handleExpenseAdded = (expense: ShiftExpense) => {
    const isIncome = expense.type === 'income' || expense.description.startsWith('[Kas Masuk]')
    setCurrentShift(prev => ({
      ...prev,
      total_expenses: isIncome ? (prev.total_expenses || 0) : ((prev.total_expenses || 0) + expense.amount),
      total_incomes: isIncome ? ((prev.total_incomes || 0) + expense.amount) : (prev.total_incomes || 0),
      expenses: [expense, ...(prev.expenses || [])]
    }))
  }

  // Manual Lock Screen
  const handleLockScreen = () => {
    try {
      localStorage.setItem('sute_is_locked', 'true')
    } catch {
      // ignore
    }
    setIsLocked(true)
  }

  // Auto-lock timer: 15 minutes of inactivity
  useEffect(() => {
    if (!currentUser || isLocked) return

    let timeoutId: number
    const resetTimer = () => {
      window.clearTimeout(timeoutId)
      // 15 minutes = 15 * 60 * 1000 = 900,000 ms
      timeoutId = window.setTimeout(() => {
        try {
          localStorage.setItem('sute_is_locked', 'true')
        } catch {
          // ignore
        }
        setIsLocked(true)
      }, 15 * 60 * 1000)
    }

    const events = ['mousedown', 'mousemove', 'keydown', 'touchstart', 'scroll']
    events.forEach(evt => window.addEventListener(evt, resetTimer))
    resetTimer()

    return () => {
      window.clearTimeout(timeoutId)
      events.forEach(evt => window.removeEventListener(evt, resetTimer))
    }
  }, [currentUser, isLocked])

  // Fetch from D1 API
  const fetchD1Data = async () => {
    try {
      // 1. Fetch current active shift from D1
      try {
        const shiftRes = await apiFetch('/api/shifts/current')
        if (shiftRes.ok) {
          const shiftJson: any = await shiftRes.json()
          if (shiftJson.success) {
            if (shiftJson.data) {
              setCurrentShift(shiftJson.data)
            } else {
              setCurrentShift(prev => ({ ...prev, status: 'closed' }))
            }
          }
        }
      } catch {
        // use local fallback
      }

      // 2. Fetch dashboard stats
      const statsRes = await apiFetch('/api/dashboard/stats')
      if (statsRes.ok) {
        const statsJson: any = await statsRes.json()
        if (statsJson.success && statsJson.data) {
          if (statsJson.data.revenueToday !== undefined) {
            setRevenueToday(statsJson.data.revenueToday)
            setTransactionsToday(statsJson.data.transactionsToday)
            setCashAmount(statsJson.data.cashAmount)
            setQrisAmount(statsJson.data.qrisAmount)
            setEstimatedProfit(statsJson.data.estimatedProfit)
          }
          if (statsJson.data.currentShift) {
            setCurrentShift(statsJson.data.currentShift)
          }
          if (Array.isArray(statsJson.data.weeklySales) && statsJson.data.weeklySales.length > 0) {
            setWeeklySales(statsJson.data.weeklySales)
          }
          if (Array.isArray(statsJson.data.bestSellers)) {
            setBestSellers(statsJson.data.bestSellers)
          }
        }
      }

      // 2. Fetch products
      const prodRes = await apiFetch('/api/products')
      if (prodRes.ok) {
        const prodJson: any = await prodRes.json()
        if (prodJson.success && prodJson.data?.length > 0) {
          setProducts(prodJson.data)
        }
      }

      // 3. Fetch orders
      const ordersRes = await apiFetch('/api/orders')
      if (ordersRes.ok) {
        const ordersJson: any = await ordersRes.json()
        if (ordersJson.success && ordersJson.data?.length > 0) {
          setOrders(ordersJson.data)
        }
      }

      // 4. Fetch receipt configuration
      try {
        const cfg = await loadReceiptConfig()
        if (cfg) {
          setReceiptConfig(cfg)
        }
      } catch {}
    } catch {
      // Fallback seamlessly to mock data
    }
  }

  useEffect(() => {
    void fetchD1Data()

    // Sync otomatis saat kasir/owner kembali ke tab atau layar aktif
    const handleSync = () => {
      if (document.visibilityState === 'visible') {
        void fetchD1Data()
        loadReceiptConfig().then(cfg => {
          if (cfg) setReceiptConfig(cfg)
        })
      }
    }

    window.addEventListener('focus', handleSync)
    document.addEventListener('visibilitychange', handleSync)

    // Realtime polling otomatis setiap 8 detik agar dashboard & kasir selalu live tanpa manual refresh
    const pollInterval = window.setInterval(() => {
      if (document.visibilityState === 'visible') {
        void fetchD1Data()
      }
    }, 8000)

    return () => {
      window.removeEventListener('focus', handleSync)
      document.removeEventListener('visibilitychange', handleSync)
      window.clearInterval(pollInterval)
    }
  }, [])

  // Auto-refresh data saat user berpindah menu navigasi
  useEffect(() => {
    if (currentUser && !isLocked) {
      void fetchD1Data()
    }
  }, [effectiveTab])

  // If not logged in or screen is locked, display PIN Lockscreen / Login Page
  if (!currentUser || isLocked) {
    return <LoginPage onLoginSuccess={handleLoginSuccess} />
  }

  return (
    <div className="min-h-screen bg-[#FBF9F5] dark:bg-stone-950 text-stone-900 dark:text-stone-100 flex font-sans selection:bg-amber-700 dark:selection:bg-[#E2DFD2] selection:text-white dark:selection:text-stone-950 overflow-hidden">
      
      {/* Sidebar Navigation */}
      <Sidebar
        activeTab={effectiveTab}
        setActiveTab={handleSelectTab}
        currentUser={currentUser}
        onLogout={handleLockScreen}
        isCollapsed={isSidebarCollapsed}
        setIsCollapsed={setIsSidebarCollapsed}
        isMobileOpen={isMobileSidebarOpen}
        setIsMobileOpen={setIsMobileSidebarOpen}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
        
        {/* Top Header Bar */}
        <Header
          activeTab={effectiveTab}
          currentUser={currentUser}
          onLogout={handleLockScreen}
          onToggleSidebar={handleToggleSidebar}
          onOpenMobileSidebar={() => setIsMobileSidebarOpen(true)}
          isSidebarCollapsed={isSidebarCollapsed}
          onOrdersSynced={fetchD1Data}
          onOpenOverheadExpense={() => setIsGlobalOverheadModalOpen(true)}
        />

        {/* Content Body */}
        <div className="flex-1 min-h-0 overflow-y-auto">
          {effectiveTab === 'pos' ? (
            <POSView
              products={products}
              currentUser={currentUser}
              currentShift={currentShift}
              receiptConfig={receiptConfig}
              onOrderCompleted={handleOrderCompleted}
              onEndShift={() => setIsCloseShiftModalOpen(true)}
              onExpenseAdded={handleExpenseAdded}
            />
          ) : (
            /* Owner Dashboard & Other Views */
            <main className="max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 pt-6 pb-12 space-y-6">

              {/* Tab 1: Dashboard Utama (Khusus Owner) */}
              {effectiveTab === 'dashboard' && currentUser.role === 'owner' && (
                <div className="space-y-6">
                  {/* KPI Stat Cards */}
                  <StatCards
                    revenueToday={revenueToday}
                    transactionsToday={transactionsToday}
                    cashAmount={cashAmount}
                    qrisAmount={qrisAmount}
                    estimatedProfit={estimatedProfit}
                    initialCash={currentShift.initial_cash}
                  />

                  {/* Middle Grid: Revenue Trend & Shift / Best Sellers */}
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                    
                    {/* Left Column (8 cols): Revenue Trend & Recent Orders */}
                    <div className="lg:col-span-8 space-y-6">
                      <RevenueChart data={weeklySales} />
                      <RecentOrders
                        orders={orders}
                        receiptConfig={receiptConfig}
                        onOrderCancelled={handleOrderCancelled}
                        isDashboardWidget={true}
                        onViewAll={() => setActiveTab('orders')}
                      />
                    </div>

                    {/* Right Column (4 cols): Shift Status & Best Sellers */}
                    <div className="lg:col-span-4 space-y-6">
                      <ShiftOverview
                        shift={currentShift}
                        onEndShift={() => setIsCloseShiftModalOpen(true)}
                      />
                      <BestSellers products={bestSellers.length > 0 ? bestSellers : products} />
                    </div>

                  </div>
                </div>
              )}

              {/* Tab: Rekapan & Laporan Keuangan Bulanan (Khusus Owner) */}
              {effectiveTab === 'monthly' && currentUser.role === 'owner' && (
                <MonthlyReportView currentUser={currentUser} />
              )}

              {/* Tab 2: Riwayat Transaksi Lengkap */}
              {effectiveTab === 'orders' && (
                <div className="space-y-4">
                  <RecentOrders
                    orders={orders}
                    receiptConfig={receiptConfig}
                    onOrderCancelled={handleOrderCancelled}
                  />
                </div>
              )}

              {/* Tab 3: Shift Kasir & Rekonsiliasi Kas */}
              {effectiveTab === 'shift' && (
                <ShiftAuditView
                  currentShift={currentShift}
                  onEndShift={() => setIsCloseShiftModalOpen(true)}
                  onShiftUpdated={setCurrentShift}
                />
              )}

              {/* Tab: Kelola Bahan Baku & Stok Inventory (Owner & Kasir) */}
              {effectiveTab === 'inventory' && (
                <InventoryView currentUser={currentUser} />
              )}

              {/* Tab 4: Katalog Menu & Ketersediaan (Khusus Owner) */}
              {effectiveTab === 'products' && currentUser.role === 'owner' && (
                <ProductsCatalogView products={products} onProductsChange={setProducts} />
              )}

              {/* Tab 5: Kelola Petugas & Keamanan PIN (Khusus Owner) */}
              {effectiveTab === 'users' && currentUser.role === 'owner' && (
                <UserManagementView currentUser={currentUser} />
              )}

              {/* Tab 6: Kustomisasi Format Struk (Khusus Owner) */}
              {effectiveTab === 'receipt' && currentUser.role === 'owner' && (
                <ReceiptSettingsView
                  currentUser={currentUser}
                  config={receiptConfig}
                  onConfigChange={setReceiptConfig}
                />
              )}

            </main>
          )}

        </div>

      </div>

      {/* Modal Pergantian Kasir (Jika kasir baru login saat shift kasir lama masih berjalan) */}
      {isHandoverModalOpen && currentUser && currentShift && (
        <ShiftHandoverModal
          isOpen={isHandoverModalOpen}
          activeShift={currentShift}
          incomingUser={currentUser}
          onCloseShiftAndStartNew={handleHandoverCloseAndStartNew}
          onContinueShift={handleHandoverContinueShift}
          onCancel={handleHandoverCancel}
        />
      )}

      {/* Modal Mulai Shift Baru (Wajib jika kasir masuk dan shift belum open) */}
      {isStartShiftModalOpen && currentUser && (
        <StartShiftModal
          currentUser={currentUser}
          onShiftStarted={handleShiftStarted}
        />
      )}

      {/* Modal Akhiri Shift Kasir & Cetak Rekap */}
      {isCloseShiftModalOpen && currentShift && (
        <CloseShiftModal
          shift={currentShift}
          isOpen={isCloseShiftModalOpen}
          onClose={() => {
            setIsCloseShiftModalOpen(false)
            if (isHandoverTransition) {
              setIsHandoverTransition(false)
            }
          }}
          onShiftClosed={handleShiftClosed}
          isHandover={isHandoverTransition}
        />
      )}

      {/* Modal Global Catat Beban Overhead (Owner) */}
      <OverheadExpenseModal
        isOpen={isGlobalOverheadModalOpen}
        onClose={() => setIsGlobalOverheadModalOpen(false)}
        onSuccess={() => fetchD1Data()}
      />

    </div>
  )
}

export default App
