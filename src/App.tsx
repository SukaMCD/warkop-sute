import { useState, useEffect } from 'react'
import { Header } from './components/layout/Header'
import { LoginPage } from './components/auth/LoginPage'
import { POSView } from './components/pos/POSView'
import { StatCards } from './components/dashboard/StatCards'
import { RevenueChart } from './components/dashboard/RevenueChart'
import { BestSellers } from './components/dashboard/BestSellers'
import { RecentOrders } from './components/dashboard/RecentOrders'
import { ShiftOverview } from './components/dashboard/ShiftOverview'
import { ProductsCatalogView } from './components/dashboard/ProductsCatalogView'
import { ShiftAuditView } from './components/dashboard/ShiftAuditView'
import { StartShiftModal } from './components/pos/StartShiftModal'
import { CloseShiftModal } from './components/pos/CloseShiftModal'
import type { Product, Order, Shift, User } from './types'
import {
  mockProducts,
  mockWeeklySales,
  mockCurrentShift,
  mockRecentOrders
} from './data/mockData'
import { RefreshCw } from 'lucide-react'

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
  const [isLocked, setIsLocked] = useState<boolean>(false)

  const [activeTab, setActiveTab] = useState<'pos' | 'dashboard' | 'orders' | 'shift' | 'products'>(() => {
    try {
      const saved = localStorage.getItem('sute_session_user')
      if (saved) {
        const u = JSON.parse(saved)
        return u.role === 'cashier' ? 'pos' : 'dashboard'
      }
    } catch {
      // fallback
    }
    return 'dashboard'
  })
  
  // Live state from backend
  const [products, setProducts] = useState<Product[]>(mockProducts)
  const [orders, setOrders] = useState<Order[]>(mockRecentOrders)
  const [currentShift, setCurrentShift] = useState<Shift>(mockCurrentShift)
  const [isLoading, setIsLoading] = useState<boolean>(false)

  // Shift Modals
  const [isStartShiftModalOpen, setIsStartShiftModalOpen] = useState<boolean>(false)
  const [isCloseShiftModalOpen, setIsCloseShiftModalOpen] = useState<boolean>(false)

  // High-level metrics
  const [revenueToday, setRevenueToday] = useState<number>(mockWeeklySales[mockWeeklySales.length - 1].revenue)
  const [transactionsToday, setTransactionsToday] = useState<number>(mockWeeklySales[mockWeeklySales.length - 1].transactions)
  const [cashAmount, setCashAmount] = useState<number>(mockWeeklySales[mockWeeklySales.length - 1].cash_amount)
  const [qrisAmount, setQrisAmount] = useState<number>(mockWeeklySales[mockWeeklySales.length - 1].qris_amount)
  const [estimatedProfit, setEstimatedProfit] = useState<number>(Math.round(revenueToday * 0.51))

  // Handle Login / Unlock
  const handleLoginSuccess = (user: User) => {
    setCurrentUser(user)
    setIsLocked(false)
    if (user.role === 'cashier') {
      setActiveTab('pos')
      // Mulai Shift Baru: jika tidak ada shift yang open, wajib munculkan modal input saldo awal
      if (!currentShift || currentShift.status !== 'open') {
        setIsStartShiftModalOpen(true)
      }
    } else {
      setActiveTab('dashboard')
    }
  }

  const handleShiftStarted = (newShift: Shift) => {
    setCurrentShift(newShift)
    setIsStartShiftModalOpen(false)
  }

  const handleShiftClosed = (closedShift: Shift) => {
    setCurrentShift(closedShift)
    setIsCloseShiftModalOpen(false)
    // Sesuai spesifikasi: setelah ditutup, sistem otomatis mengarahkan ke Layar PIN
    localStorage.removeItem('sute_session_user')
    setCurrentUser(null)
    setIsLocked(true)
  }

  // Guard: Determine effective tab based on role
  const isCashier = currentUser?.role === 'cashier'
  const effectiveTab = (isCashier && (activeTab === 'dashboard' || activeTab === 'products')) ? 'pos' : activeTab

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
  }

  // Manual Lock Screen
  const handleLockScreen = () => {
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
    setIsLoading(true)
    try {
      // 1. Fetch dashboard stats
      const statsRes = await fetch('/api/dashboard/stats')
      if (statsRes.ok) {
        const statsJson: any = await statsRes.json()
        if (statsJson.success && statsJson.data) {
          if (statsJson.data.revenueToday > 0) {
            setRevenueToday(statsJson.data.revenueToday)
            setTransactionsToday(statsJson.data.transactionsToday)
            setCashAmount(statsJson.data.cashAmount)
            setQrisAmount(statsJson.data.qrisAmount)
            setEstimatedProfit(statsJson.data.estimatedProfit)
          }
          if (statsJson.data.currentShift) {
            setCurrentShift(statsJson.data.currentShift)
          } else {
            setCurrentShift(prev => ({ ...prev, status: 'closed' }))
          }
        }
      }

      // 2. Fetch products
      const prodRes = await fetch('/api/products')
      if (prodRes.ok) {
        const prodJson: any = await prodRes.json()
        if (prodJson.success && prodJson.data?.length > 0) {
          setProducts(prodJson.data)
        }
      }

      // 3. Fetch orders
      const ordersRes = await fetch('/api/orders')
      if (ordersRes.ok) {
        const ordersJson: any = await ordersRes.json()
        if (ordersJson.success && ordersJson.data?.length > 0) {
          setOrders(ordersJson.data)
        }
      }
    } catch {
      // Fallback seamlessly to mock data
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    void Promise.resolve().then(() => {
      fetchD1Data()
    })
  }, [])

  // If not logged in or screen is locked, display PIN Lockscreen / Login Page
  if (!currentUser || isLocked) {
    return <LoginPage onLoginSuccess={handleLoginSuccess} />
  }

  return (
    <div className="min-h-screen bg-stone-950 text-stone-100 flex flex-col font-sans selection:bg-[#E2DFD2] selection:text-stone-950">
      
      {/* Top Navigation with User Identity & Role Actions */}
      <Header
        activeTab={effectiveTab}
        setActiveTab={setActiveTab}
        currentUser={currentUser}
        onLogout={handleLockScreen}
      />

      {/* POS View (Full Height Tablet Interface) */}
      {effectiveTab === 'pos' ? (
        <POSView
          products={products}
          currentUser={currentUser}
          currentShift={currentShift}
          onOrderCompleted={handleOrderCompleted}
          onEndShift={() => setIsCloseShiftModalOpen(true)}
        />
      ) : (
        /* Owner Dashboard & Other Views */
        <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 pt-6 pb-12 space-y-6">
          
          {/* Welcome & Overview Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-stone-900">
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold tracking-tight text-stone-100">
                  {currentUser.role === 'owner' ? 'Ringkasan Operasional Warkop' : 'Riwayat & Operasional Kasir'}
                </h1>
                <span className="text-[11px] font-mono uppercase px-2 py-0.5 rounded border border-emerald-900/60 bg-emerald-950/40 text-emerald-400 font-semibold">
                  Warkop Buka
                </span>
              </div>
              <p className="text-xs text-stone-400 mt-0.5">
                {currentUser.role === 'owner' 
                  ? `Selamat datang kembali, ${currentUser.name}. Pantau performa harian dan audit laci kasir real-time.`
                  : `Petugas Kasir: ${currentUser.name}. Kelola pesanan dan pantau shift kasir.`}
              </p>
            </div>

            <div className="flex items-center gap-2 text-xs">
              <button
                type="button"
                onClick={fetchD1Data}
                disabled={isLoading}
                className="px-3 py-1.5 rounded-lg bg-stone-900 border border-stone-800 hover:bg-stone-800 text-stone-300 hover:text-white flex items-center gap-2 transition-colors cursor-pointer"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
                <span>Perbarui Data</span>
              </button>
            </div>
          </div>

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
                  <RevenueChart data={mockWeeklySales} />
                  <RecentOrders orders={orders} />
                </div>

                {/* Right Column (4 cols): Shift Status & Best Sellers */}
                <div className="lg:col-span-4 space-y-6">
                  <ShiftOverview
                    shift={currentShift}
                    onEndShift={() => setIsCloseShiftModalOpen(true)}
                  />
                  <BestSellers products={products} />
                </div>

              </div>
            </div>
          )}

          {/* Tab 2: Riwayat Transaksi Lengkap */}
          {effectiveTab === 'orders' && (
            <div className="space-y-4">
              <RecentOrders orders={orders} />
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

          {/* Tab 4: Katalog Menu & Ketersediaan (Khusus Owner) */}
          {effectiveTab === 'products' && currentUser.role === 'owner' && (
            <ProductsCatalogView products={products} onProductsChange={setProducts} />
          )}

        </main>
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
          onClose={() => setIsCloseShiftModalOpen(false)}
          onShiftClosed={handleShiftClosed}
        />
      )}

    </div>
  )
}

export default App
