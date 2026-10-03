import { useState, useMemo, useEffect } from 'react'
import type { Product, Order, User, Shift } from '../../types'
import {
  Search,
  Plus,
  Minus,
  Trash2,
  QrCode,
  Banknote,
  Receipt,
  Printer,
  CheckCircle2,
  X,
  ArrowLeft,
  Delete,
  Coffee,
  CupSoda,
  Utensils,
  UtensilsCrossed,
  Cookie,
  Sparkles,
  FileText,
  RotateCcw,
  PowerOff
} from 'lucide-react'
import { calculateShiftDuration } from '../../utils/shiftHelpers'

export interface CartItem {
  product: Product
  quantity: number
  notes: string
}

interface POSViewProps {
  products: Product[]
  currentUser: User
  currentShift: Shift
  onOrderCompleted?: (order: Order) => void
  onEndShift?: () => void
}

export const POSView = ({
  products,
  currentUser,
  currentShift,
  onOrderCompleted,
  onEndShift
}: POSViewProps) => {
  // Search & Category Filter (Default to first category: Perkopian)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>('cat_kopi')

  // Cart State
  const [cart, setCart] = useState<CartItem[]>([])
  const [orderType, setOrderType] = useState<'dine_in' | 'takeaway'>('dine_in')
  const [tableNumber, setTableNumber] = useState<string>('')
  const [customerName, setCustomerName] = useState<string>('')

  // Checkout & Payment Modal
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false)
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'qris'>('cash')
  const [cashTendered, setCashTendered] = useState<number>(0)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Success Receipt State
  const [completedOrder, setCompletedOrder] = useState<Order | null>(null)
  const [showReceiptModal, setShowReceiptModal] = useState(false)

  // Note Modal for Item
  const [editingNoteIndex, setEditingNoteIndex] = useState<number | null>(null)
  const [tempNoteText, setTempNoteText] = useState('')

  // Authentic Categories list from Database
  const categories = [
    { id: 'cat_kopi', label: 'Perkopian', icon: Coffee },
    { id: 'cat_minum', label: 'Minum-Minum', icon: CupSoda },
    { id: 'cat_mie', label: 'Permie-an', icon: Utensils },
    { id: 'cat_nasi', label: 'Pernasi-an', icon: UtensilsCrossed },
    { id: 'cat_cemilan', label: 'Cemal-Cemil', icon: Cookie },
    { id: 'cat_spesial', label: 'Spesial', icon: Sparkles }
  ]

  // Category name mapping for card badge
  const categoryNameMap: Record<string, string> = {
    cat_kopi: 'Perkopian',
    cat_minum: 'Minum-Minum',
    cat_mie: 'Permie-an',
    cat_nasi: 'Pernasi-an',
    cat_cemilan: 'Cemal-Cemil',
    cat_spesial: 'Spesial'
  }

  // Filter products: When searching, search all; when browsing, filter by selected category
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase())
      const matchesCategory = searchQuery.trim().length > 0 ? true : p.category_id === selectedCategory
      return matchesSearch && matchesCategory
    })
  }, [products, searchQuery, selectedCategory])

  // Cart calculations
  const totalItemsCount = useMemo(() => {
    return cart.reduce((sum, item) => sum + item.quantity, 0)
  }, [cart])

  const totalAmount = useMemo(() => {
    return cart.reduce((sum, item) => sum + item.product.price * item.quantity, 0)
  }, [cart])

  // Change amount calculation
  const changeAmount = useMemo(() => {
    if (paymentMethod === 'cash') {
      return Math.max(0, cashTendered - totalAmount)
    }
    return 0
  }, [paymentMethod, cashTendered, totalAmount])

  // Add product to cart
  const handleAddToCart = (product: Product) => {
    setCart((prev) => {
      const existingIndex = prev.findIndex((item) => item.product.id === product.id)
      if (existingIndex > -1) {
        const next = [...prev]
        next[existingIndex] = {
          ...next[existingIndex],
          quantity: next[existingIndex].quantity + 1
        }
        return next
      }
      return [...prev, { product, quantity: 1, notes: '' }]
    })
  }

  // Update quantity
  const handleUpdateQuantity = (index: number, delta: number) => {
    setCart((prev) => {
      const next = [...prev]
      const newQty = next[index].quantity + delta
      if (newQty <= 0) {
        return next.filter((_, i) => i !== index)
      }
      next[index] = { ...next[index], quantity: newQty }
      return next
    })
  }

  // Remove item
  const handleRemoveItem = (index: number) => {
    setCart((prev) => prev.filter((_, i) => i !== index))
  }

  // Reset cart
  const handleResetCart = () => {
    setCart([])
    setTableNumber('')
    setCustomerName('')
  }

  // Open note modal
  const handleOpenNoteModal = (index: number) => {
    setEditingNoteIndex(index)
    setTempNoteText(cart[index]?.notes || '')
  }

  const handleSaveNote = () => {
    if (editingNoteIndex !== null && cart[editingNoteIndex]) {
      setCart((prev) => {
        const next = [...prev]
        next[editingNoteIndex] = {
          ...next[editingNoteIndex],
          notes: tempNoteText.trim()
        }
        return next
      })
    }
    setEditingNoteIndex(null)
    setTempNoteText('')
  }

  // Quick cash preset handler
  const handleSelectCashPreset = (amount: number) => {
    setCashTendered(amount)
  }

  // On-screen touchscreen cash keypad handlers
  const handleKeypadDigit = (digit: string) => {
    setCashTendered((prev) => {
      const currentStr = prev === 0 ? '' : String(prev)
      if (currentStr.length >= 9) return prev
      return Number(currentStr + digit)
    })
  }

  const handleKeypadTripleZero = () => {
    setCashTendered((prev) => {
      if (prev === 0) return 0
      const next = prev * 1000
      return next > 999999999 ? prev : next
    })
  }

  const handleKeypadBackspace = () => {
    setCashTendered((prev) => {
      const currentStr = String(prev)
      if (currentStr.length <= 1 || prev === 0) return 0
      return Number(currentStr.slice(0, -1))
    })
  }

  const handleKeypadClear = () => {
    setCashTendered(0)
  }

  const handleAddNominal = (addon: number) => {
    setCashTendered((prev) => prev + addon)
  }

  // Open payment modal
  const handleOpenPayment = () => {
    if (cart.length === 0) return
    setPaymentMethod('qris')
    setCashTendered(totalAmount) // default to exact amount
    setIsPaymentModalOpen(true)
  }

  // Listen to physical keyboard when cash payment is open
  useEffect(() => {
    if (!isPaymentModalOpen || paymentMethod !== 'cash') return

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key >= '0' && e.key <= '9') {
        e.preventDefault()
        handleKeypadDigit(e.key)
      } else if (e.key === 'Backspace') {
        e.preventDefault()
        handleKeypadBackspace()
      } else if (e.key === 'Escape') {
        e.preventDefault()
        setIsPaymentModalOpen(false)
      } else if (e.key === 'c' || e.key === 'C') {
        e.preventDefault()
        handleKeypadClear()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isPaymentModalOpen, paymentMethod])

  // Process transaction
  const handleProcessTransaction = async () => {
    if (cart.length === 0 || isSubmitting) return
    if (paymentMethod === 'cash' && cashTendered < totalAmount) {
      alert('Uang tunai yang diterima kurang dari total belanja!')
      return
    }

    setIsSubmitting(true)

    const orderNumber = `SUTE-${new Date().toISOString().slice(2, 10).replace(/-/g, '')}-${Math.floor(1000 + Math.random() * 9000)}`
    const orderTotalCost = cart.reduce((sum, item) => sum + (item.product.cost_price || Math.round(item.product.price * 0.48)) * item.quantity, 0)

    const orderPayload = {
      order_number: orderNumber,
      shift_id: currentShift.id,
      cashier_id: currentUser.id,
      customer_name: customerName.trim() || (orderType === 'dine_in' ? 'Pelanggan Meja' : 'Bungkus'),
      order_type: orderType,
      table_number: tableNumber.trim() || undefined,
      payment_method: paymentMethod,
      total_amount: totalAmount,
      total_cost: orderTotalCost,
      cash_tendered: paymentMethod === 'cash' ? cashTendered : totalAmount,
      change_amount: paymentMethod === 'cash' ? changeAmount : 0,
      status: 'completed' as const,
      items: cart.map((item) => ({
        product_id: item.product.id,
        product_name: item.product.name,
        price: item.product.price,
        cost_price: item.product.cost_price || Math.round(item.product.price * 0.48),
        quantity: item.quantity,
        subtotal: item.product.price * item.quantity,
        notes: item.notes || null
      }))
    }

    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orderPayload)
      })

      if (res.ok) {
        const json: any = await res.json()
        const savedOrder = json.order || {
          ...orderPayload,
          id: `ord_${Date.now()}`,
          created_at: new Date().toISOString(),
          cashier_name: currentUser.name
        }
        setCompletedOrder(savedOrder)
        if (onOrderCompleted) onOrderCompleted(savedOrder)
      } else {
        // Fallback offline mock order
        const mockOrder: Order = {
          id: `ord_${Date.now()}`,
          order_number: orderNumber,
          shift_id: currentShift.id,
          cashier_name: currentUser.name,
          customer_name: orderPayload.customer_name,
          order_type: orderPayload.order_type,
          table_number: orderPayload.table_number,
          payment_method: orderPayload.payment_method,
          total_amount: orderPayload.total_amount,
          total_cost: orderTotalCost,
          cash_tendered: orderPayload.cash_tendered,
          change_amount: orderPayload.change_amount,
          status: 'completed',
          created_at: new Date().toISOString(),
          items: orderPayload.items.map((it, idx) => ({
            id: `item_${Date.now()}_${idx}`,
            order_id: `ord_${Date.now()}`,
            product_id: it.product_id,
            product_name: it.product_name,
            price: it.price,
            cost_price: it.cost_price,
            quantity: it.quantity,
            subtotal: it.subtotal,
            notes: it.notes || undefined
          }))
        }
        setCompletedOrder(mockOrder)
        if (onOrderCompleted) onOrderCompleted(mockOrder)
      }

      setIsPaymentModalOpen(false)
      setShowReceiptModal(true)
      handleResetCart()
    } catch (err) {
      console.error('Error saving order:', err)
      // Save offline mock
      const mockOrder: Order = {
        id: `ord_${Date.now()}`,
        order_number: orderNumber,
        shift_id: currentShift.id,
        cashier_name: currentUser.name,
        customer_name: orderPayload.customer_name,
        order_type: orderPayload.order_type,
        table_number: orderPayload.table_number,
        payment_method: orderPayload.payment_method,
        total_amount: orderPayload.total_amount,
        total_cost: orderTotalCost,
        cash_tendered: orderPayload.cash_tendered,
        change_amount: orderPayload.change_amount,
        status: 'completed',
        created_at: new Date().toISOString(),
        items: orderPayload.items.map((it, idx) => ({
          id: `item_${Date.now()}_${idx}`,
          order_id: `ord_${Date.now()}`,
          product_id: it.product_id,
          product_name: it.product_name,
          price: it.price,
          cost_price: it.cost_price,
          quantity: it.quantity,
          subtotal: it.subtotal,
          notes: it.notes || undefined
        }))
      }
      setCompletedOrder(mockOrder)
      if (onOrderCompleted) onOrderCompleted(mockOrder)
      setIsPaymentModalOpen(false)
      setShowReceiptModal(true)
      handleResetCart()
    } finally {
      setIsSubmitting(false)
    }
  }

  // Print thermal receipt handler
  const handlePrintReceipt = () => {
    window.print()
  }

  // Formatter
  const formatIDR = (val: number) => {
    return 'Rp ' + val.toLocaleString('id-ID')
  }

  return (
    <div className="flex flex-col md:flex-row h-[calc(100vh-4rem)] overflow-hidden bg-stone-950">
      
      {/* LEFT SECTION: Menu Catalog */}
      <div className="flex-1 flex flex-col min-w-0 border-r border-stone-800 h-full">
        
        {/* Search & Categories Bar */}
        <div className="p-4 border-b border-stone-800 bg-stone-900/60 backdrop-blur space-y-3 shrink-0">
          
          <div className="flex items-center gap-3">
            {/* Search Input */}
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                placeholder="Cari menu warkop (misal: kopi, indomie, nutrisari)..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-stone-950 border border-stone-800 rounded-xl pl-10 pr-9 py-2.5 text-xs text-stone-100 placeholder-stone-400 focus:outline-none focus:border-[#E2DFD2] transition-colors"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-200"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Quick Shift Status Tag & Akhiri Shift Button */}
            <div className="hidden sm:flex items-center gap-2">
              <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-stone-950 border border-stone-800 text-[11px] font-mono text-stone-300">
                <span className="text-[#E2DFD2] font-semibold">{currentUser.name}</span>
                <span className="text-stone-600">•</span>
                <span className="text-stone-400">
                  {calculateShiftDuration(currentShift.start_time, currentShift.end_time || null)}
                </span>
              </div>

              {onEndShift && currentShift.status === 'open' && (
                <button
                  type="button"
                  onClick={onEndShift}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-stone-950 border border-stone-800 hover:border-rose-900/60 hover:bg-rose-950/30 text-stone-300 hover:text-rose-400 text-[11px] font-mono font-semibold transition-colors cursor-pointer"
                  title="Akhiri Shift Kasir & Cetak Rekap"
                >
                  <PowerOff className="w-3.5 h-3.5 text-rose-400" />
                  <span>Akhiri Shift</span>
                </button>
              )}
            </div>
          </div>

          {/* Category Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
            {categories.map((cat) => {
              const Icon = cat.icon
              const isActive = selectedCategory === cat.id
              const count = products.filter(p => p.category_id === cat.id).length

              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-medium whitespace-nowrap transition-all cursor-pointer ${
                    isActive
                      ? 'bg-[#E2DFD2] text-stone-950 font-bold shadow-sm'
                      : 'bg-stone-950 border border-stone-800 text-stone-400 hover:text-stone-200 hover:bg-stone-850'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{cat.label}</span>
                  <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-mono ${
                    isActive ? 'bg-stone-950/15 text-stone-950 font-bold' : 'bg-stone-900 text-stone-400'
                  }`}>
                    {count}
                  </span>
                </button>
              )
            })}
          </div>

        </div>

        {/* Product Cards Grid */}
        <div className="flex-1 overflow-y-auto p-4">
          {filteredProducts.length === 0 ? (
            <div className="h-64 flex flex-col items-center justify-center text-center">
              <p className="text-sm font-medium text-stone-300">Menu tidak ditemukan</p>
              <p className="text-xs text-stone-400 mt-1">Coba kata kunci lain atau pilih tab kategori lain</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-3">
              {filteredProducts.map((product) => {
                const cartQuantity = cart.find(item => item.product.id === product.id)?.quantity || 0

                return (
                  <button
                    key={product.id}
                    type="button"
                    onClick={() => handleAddToCart(product)}
                    className={`group relative text-left p-3.5 rounded-xl border transition-all cursor-pointer flex flex-col justify-between min-h-[105px] select-none ${
                      cartQuantity > 0
                        ? 'bg-stone-900/90 border-[#E2DFD2]/70 shadow-md ring-1 ring-[#E2DFD2]/25'
                        : 'bg-stone-900/40 border-stone-800/80 hover:bg-stone-900 hover:border-stone-700'
                    }`}
                  >
                    <div>
                      {/* Category tag */}
                      <span className="text-[10px] font-mono uppercase tracking-wider text-[#E2DFD2]/80 block mb-1">
                        {categoryNameMap[product.category_id] || product.category_id}
                      </span>
                      {/* Product Name */}
                      <h4 className="text-xs font-semibold text-stone-100 leading-snug line-clamp-2">
                        {product.name}
                      </h4>
                    </div>

                    <div className="flex items-center justify-between mt-3 pt-2 border-t border-stone-800/60">
                      <span className="font-mono text-xs font-bold text-[#E2DFD2]">
                        {formatIDR(product.price)}
                      </span>

                      {cartQuantity > 0 ? (
                        <span className="px-2 py-0.5 rounded-md bg-[#E2DFD2] text-stone-950 font-mono text-[11px] font-bold">
                          {cartQuantity}x
                        </span>
                      ) : (
                        <span className="w-6 h-6 rounded-lg bg-stone-950 border border-stone-800 group-hover:border-[#E2DFD2]/50 flex items-center justify-center text-stone-400 group-hover:text-[#E2DFD2] transition-colors">
                          <Plus className="w-3.5 h-3.5" />
                        </span>
                      )}
                    </div>
                  </button>
                )
              })}
            </div>
          )}
        </div>

      </div>

      {/* RIGHT SECTION: Cart & Billing */}
      <div className="w-full md:w-[350px] lg:w-[390px] xl:w-[420px] bg-stone-900/95 border-t md:border-t-0 md:border-l border-stone-800 flex flex-col h-[400px] md:h-full shrink-0 shadow-2xl">
        
        {/* Cart Header */}
        <div className="p-4 border-b border-stone-800 bg-stone-900/80 space-y-3 shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Receipt className="w-4 h-4 text-[#E2DFD2]" />
              <h3 className="text-sm font-bold text-stone-100 tracking-tight">
                Pesanan Baru
              </h3>
            </div>
            {cart.length > 0 && (
              <button
                type="button"
                onClick={handleResetCart}
                className="text-[11px] font-mono text-stone-400 hover:text-rose-400 transition-colors flex items-center gap-1 cursor-pointer"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Reset</span>
              </button>
            )}
          </div>

          {/* Order Type Toggle (Dine-in vs Takeaway) */}
          <div className="grid grid-cols-2 gap-2 p-1 bg-stone-950 border border-stone-800 rounded-xl">
            <button
              type="button"
              onClick={() => setOrderType('dine_in')}
              className={`py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                orderType === 'dine_in'
                  ? 'bg-[#E2DFD2] text-stone-950 shadow-xs'
                  : 'text-stone-400 hover:text-stone-200'
              }`}
            >
              Makan di Tempat
            </button>
            <button
              type="button"
              onClick={() => setOrderType('takeaway')}
              className={`py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                orderType === 'takeaway'
                  ? 'bg-[#E2DFD2] text-stone-950 shadow-xs'
                  : 'text-stone-400 hover:text-stone-200'
              }`}
            >
              Bungkus (Takeaway)
            </button>
          </div>

          {/* Table / Customer Name inputs */}
          <div className="grid grid-cols-2 gap-2">
            <input
              type="text"
              placeholder={orderType === 'dine_in' ? 'Nomor Meja (cth: Meja 3)' : 'Nama Pemesan'}
              value={tableNumber}
              onChange={(e) => setTableNumber(e.target.value)}
              className="bg-stone-950 border border-stone-800 rounded-lg px-2.5 py-1.5 text-xs text-stone-100 placeholder-stone-400 focus:outline-none focus:border-[#E2DFD2]"
            />
            <input
              type="text"
              placeholder="Catatan / Nama"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              className="bg-stone-950 border border-stone-800 rounded-lg px-2.5 py-1.5 text-xs text-stone-100 placeholder-stone-400 focus:outline-none focus:border-[#E2DFD2]"
            />
          </div>
        </div>

        {/* Cart Items List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2.5">
          {cart.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-6 text-stone-400">
              <Receipt className="w-10 h-10 stroke-[1.25] text-stone-700 mb-2" />
              <p className="text-xs font-semibold text-stone-400">Keranjang masih kosong</p>
              <p className="text-[11px] text-stone-400 mt-1 max-w-[200px]">
                Ketuk menu di sebelah kiri untuk menambahkan pesanan pelanggan.
              </p>
            </div>
          ) : (
            cart.map((item, index) => (
              <div
                key={item.product.id}
                className="p-3 rounded-xl bg-stone-950 border border-stone-800/80 flex flex-col gap-2"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-stone-200 leading-tight">
                      {item.product.name}
                    </p>
                    <p className="text-[11px] font-mono text-stone-400 mt-0.5">
                      {formatIDR(item.product.price)} / porsi
                    </p>
                  </div>
                  <span className="font-mono text-xs font-bold text-stone-100">
                    {formatIDR(item.product.price * item.quantity)}
                  </span>
                </div>

                {/* Notes if any */}
                {item.notes && (
                  <div className="px-2 py-1 rounded bg-stone-900 border border-stone-800 text-[10px] text-[#E2DFD2] font-mono flex items-center justify-between">
                    <span>{item.notes}</span>
                    <button
                      type="button"
                      onClick={() => handleOpenNoteModal(index)}
                      className="text-stone-400 hover:text-stone-200 underline ml-2"
                    >
                      Ubah
                    </button>
                  </div>
                )}

                {/* Actions row: Note trigger, Qty controller, Delete */}
                <div className="flex items-center justify-between pt-1 border-t border-stone-900">
                  <button
                    type="button"
                    onClick={() => handleOpenNoteModal(index)}
                    className="text-[10px] text-stone-400 hover:text-[#E2DFD2] font-medium flex items-center gap-1 cursor-pointer transition-colors"
                  >
                    <FileText className="w-3 h-3" />
                    <span>{item.notes ? 'Edit Catatan' : '+ Catatan (pedas, manis)'}</span>
                  </button>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleRemoveItem(index)}
                      className="p-1 text-stone-600 hover:text-rose-400 transition-colors cursor-pointer mr-1"
                      title="Hapus menu"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>

                    <div className="flex items-center bg-stone-900 border border-stone-800 rounded-lg overflow-hidden">
                      <button
                        type="button"
                        onClick={() => handleUpdateQuantity(index, -1)}
                        className="w-8 h-8 flex items-center justify-center text-stone-400 hover:text-stone-100 hover:bg-stone-800 active:scale-95 transition-all cursor-pointer"
                      >
                        <Minus className="w-3.5 h-3.5" />
                      </button>
                      <span className="w-8 text-center font-mono text-xs font-bold text-stone-100 select-none">
                        {item.quantity}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleUpdateQuantity(index, 1)}
                        className="w-8 h-8 flex items-center justify-center text-stone-400 hover:text-stone-100 hover:bg-stone-800 active:scale-95 transition-all cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Cart Bottom Summary & Checkout Button */}
        <div className="p-4 border-t border-stone-800 bg-stone-900/90 space-y-3 shrink-0">
          <div className="space-y-1 text-xs">
            <div className="flex items-center justify-between text-stone-400">
              <span>Total Item</span>
              <span className="font-mono text-stone-200">{totalItemsCount} item</span>
            </div>
            <div className="flex items-center justify-between text-sm font-semibold text-stone-100 pt-1 border-t border-stone-800">
              <span>Total Tagihan</span>
              <span className="font-mono text-base font-bold text-[#E2DFD2]">
                {formatIDR(totalAmount)}
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={handleOpenPayment}
            disabled={cart.length === 0}
            className="w-full h-12 rounded-xl bg-[#E2DFD2] hover:bg-[#edebe2] disabled:bg-stone-800 disabled:text-stone-600 disabled:cursor-not-allowed text-stone-950 font-bold text-sm transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md active:scale-[0.98]"
          >
            <Banknote className="w-4 h-4" />
            <span>Proses Pembayaran ({formatIDR(totalAmount)})</span>
          </button>
        </div>

      </div>

      {/* FULLSCREEN CHECKOUT VIEW */}
      {isPaymentModalOpen && (
        <div className="fixed inset-0 z-50 bg-stone-950 flex flex-col animate-in fade-in duration-150">
          
          {/* Top Fullscreen Bar */}
          <div className="h-14 px-4 sm:px-6 border-b border-stone-800 bg-stone-900/90 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setIsPaymentModalOpen(false)}
                className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-stone-950 border border-stone-800 text-stone-300 hover:text-stone-100 hover:bg-stone-800 text-xs font-semibold transition-all cursor-pointer shadow-xs active:scale-95"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Kembali ke Kasir</span>
              </button>
              <div className="h-5 w-px bg-stone-800 hidden sm:block" />
              <div>
                <h2 className="text-sm sm:text-base font-bold text-stone-100 tracking-tight">
                  Proses Pembayaran Pesanan
                </h2>
                <div className="flex items-center gap-2 text-xs text-stone-400 font-mono">
                  <span>{orderType === 'dine_in' ? 'Makan di Tempat' : 'Bungkus (Takeaway)'}</span>
                  {tableNumber && (
                    <>
                      <span>•</span>
                      <span className="text-[#E2DFD2] font-semibold">{tableNumber}</span>
                    </>
                  )}
                  {customerName && (
                    <>
                      <span>•</span>
                      <span className="text-stone-300">{customerName}</span>
                    </>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="text-right hidden sm:block font-mono text-xs">
                <span className="text-stone-400 block text-[11px]">Total Tagihan</span>
                <span className="text-[#E2DFD2] text-lg font-bold tabular-nums">
                  {formatIDR(totalAmount)}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setIsPaymentModalOpen(false)}
                className="p-2 rounded-xl text-stone-400 hover:text-stone-100 hover:bg-stone-800 transition-colors cursor-pointer"
                title="Tutup / Kembali"
              >
                <X className="w-5 h-5 sm:w-6 sm:h-6" />
              </button>
            </div>
          </div>

          {/* Fullscreen Body (2 Large Columns) */}
          <div className="flex-1 grid grid-cols-1 md:grid-cols-12 lg:grid-cols-12 overflow-hidden">
            
            {/* LEFT COLUMN: Payment Mode (QRIS or Cash) */}
            <div className="md:col-span-7 lg:col-span-7 xl:col-span-7 px-6 py-3.5 sm:px-8 sm:py-4 flex flex-col justify-center border-b md:border-b-0 md:border-r border-stone-800 bg-stone-900/30 overflow-y-auto md:overflow-y-hidden">
              <div className="max-w-xl mx-auto w-full space-y-3 sm:space-y-3.5 my-auto">
                
                {/* Method Switcher Tabs */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-semibold text-stone-300 uppercase tracking-wider font-mono">
                      Pilih Metode Bayar
                    </span>
                    <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-stone-950 border border-stone-800 text-[#E2DFD2]">
                      {paymentMethod === 'qris' ? 'Metode Aktif: QRIS' : 'Metode Aktif: Tunai'}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-3 p-1.5 bg-stone-950 border border-stone-800 rounded-2xl">
                    <button
                      type="button"
                      onClick={() => setPaymentMethod('qris')}
                      className={`h-13 rounded-xl text-sm font-semibold flex items-center justify-center gap-2.5 transition-all cursor-pointer ${
                        paymentMethod === 'qris'
                          ? 'bg-[#E2DFD2] text-stone-950 font-bold shadow-md'
                          : 'text-stone-400 hover:text-stone-200 hover:bg-stone-900'
                      }`}
                    >
                      <QrCode className="w-5 h-5" />
                      <span>QRIS Statis</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setPaymentMethod('cash')}
                      className={`h-13 rounded-xl text-sm font-semibold flex items-center justify-center gap-2.5 transition-all cursor-pointer ${
                        paymentMethod === 'cash'
                          ? 'bg-[#E2DFD2] text-stone-950 font-bold shadow-md'
                          : 'text-stone-400 hover:text-stone-200 hover:bg-stone-900'
                      }`}
                    >
                      <Banknote className="w-5 h-5" />
                      <span>Tunai</span>
                    </button>
                  </div>
                </div>

                {/* VIEW 1: QRIS STATIS (Large, Scannable & Clear) */}
                {paymentMethod === 'qris' && (
                  <div className="flex flex-col items-center text-center space-y-4 py-2 animate-in fade-in zoom-in-95 duration-150">
                    <div className="w-72 h-72 sm:w-80 sm:h-80 bg-white p-4 rounded-3xl shadow-2xl border-2 border-stone-400/80 flex items-center justify-center">
                      <img
                        src="/images/qris-clean.png"
                        alt="QRIS Warkop Sudut Temu"
                        className="w-full h-full object-contain"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <div className="inline-block px-3.5 py-1.5 rounded-lg bg-stone-950 border border-stone-800 text-xs font-mono font-bold text-[#E2DFD2] tracking-widest shadow-inner">
                        NMID: ID1026568944999
                      </div>
                      <p className="text-xs text-stone-300 font-medium">
                        Warkop Sudut Temu • Ciawigebang, Kuningan
                      </p>
                      <p className="text-[11px] text-stone-400 max-w-sm leading-relaxed">
                        Arahkan pelanggan scan kode QR di atas menggunakan GoPay, OVO, ShopeePay, DANA, BCA Mobile, Mandiri Livin', BRImo, atau aplikasi QRIS lainnya.
                      </p>
                    </div>
                  </div>
                )}

                {/* VIEW 2: CASH (TUNAI) */}
                {paymentMethod === 'cash' && (
                  <div className="space-y-2.5 sm:space-y-3 animate-in fade-in zoom-in-95 duration-150">
                    
                    {/* Nominal Display Box (Virtual Input without OS Keyboard) */}
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <label className="text-xs font-medium text-stone-300 font-mono">
                          Nominal Uang Diterima dari Pelanggan
                        </label>
                        {cashTendered > 0 && (
                          <button
                            type="button"
                            onClick={handleKeypadClear}
                            className="text-[11px] font-mono text-stone-400 hover:text-rose-400 transition-colors cursor-pointer flex items-center gap-1"
                          >
                            <RotateCcw className="w-3 h-3" />
                            <span>Reset (0)</span>
                          </button>
                        )}
                      </div>
                      <div className="relative">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 font-mono text-base font-bold text-stone-400">
                          Rp
                        </span>
                        <input
                          type="text"
                          inputMode="none"
                          readOnly
                          value={cashTendered > 0 ? cashTendered.toLocaleString('id-ID') : '0'}
                          className="w-full bg-stone-950 border border-stone-800 rounded-2xl pl-12 pr-12 py-2.5 text-2xl sm:text-3xl font-mono font-bold text-stone-100 focus:outline-none focus:border-[#E2DFD2] transition-colors cursor-default select-none shadow-inner"
                        />
                        {cashTendered > 0 && (
                          <button
                            type="button"
                            onClick={handleKeypadBackspace}
                            className="absolute right-3.5 top-1/2 -translate-y-1/2 p-1.5 rounded-lg text-stone-400 hover:text-stone-100 hover:bg-stone-800 transition-colors cursor-pointer"
                            title="Hapus satu angka"
                          >
                            <Delete className="w-5 h-5" />
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Quick Preset Buttons */}
                    <div>
                      <span className="text-[11px] text-stone-400 block mb-1 font-mono">Pilihan Cepat Pecahan Uang</span>
                      <div className="grid grid-cols-4 gap-2">
                        {[
                          { label: 'Uang Pas', amount: totalAmount },
                          { label: '20.000', amount: 20000 },
                          { label: '50.000', amount: 50000 },
                          { label: '100.000', amount: 100000 }
                        ].map((preset) => (
                          <button
                            key={preset.label}
                            type="button"
                            onClick={() => handleSelectCashPreset(preset.amount)}
                            className={`py-2 rounded-xl border text-xs font-mono font-bold transition-all cursor-pointer active:scale-95 ${
                              cashTendered === preset.amount
                                ? 'bg-stone-800 border-[#E2DFD2] text-[#E2DFD2] shadow-sm'
                                : 'bg-stone-950 border-stone-800 hover:border-stone-700 text-stone-300'
                            }`}
                          >
                            {preset.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* On-Screen Touchscreen Numpad Grid */}
                    <div className="space-y-1">
                      <div className="flex items-center justify-between text-[11px] font-mono text-stone-400">
                        <span>Keypad Layar Sentuh</span>
                        <span className="text-stone-500 hidden sm:inline">Sentuh angka untuk mengisi</span>
                      </div>

                      <div className="grid grid-cols-4 gap-2">
                        {/* Row 1: 1, 2, 3, Backspace */}
                        <button
                          type="button"
                          onClick={() => handleKeypadDigit('1')}
                          className="h-12 sm:h-13 rounded-xl bg-stone-950 border border-stone-800 hover:bg-stone-850 hover:border-stone-700 active:scale-[0.95] text-stone-100 font-mono text-xl font-bold transition-all flex items-center justify-center cursor-pointer shadow-xs select-none"
                        >
                          1
                        </button>
                        <button
                          type="button"
                          onClick={() => handleKeypadDigit('2')}
                          className="h-12 sm:h-13 rounded-xl bg-stone-950 border border-stone-800 hover:bg-stone-850 hover:border-stone-700 active:scale-[0.95] text-stone-100 font-mono text-xl font-bold transition-all flex items-center justify-center cursor-pointer shadow-xs select-none"
                        >
                          2
                        </button>
                        <button
                          type="button"
                          onClick={() => handleKeypadDigit('3')}
                          className="h-12 sm:h-13 rounded-xl bg-stone-950 border border-stone-800 hover:bg-stone-850 hover:border-stone-700 active:scale-[0.95] text-stone-100 font-mono text-xl font-bold transition-all flex items-center justify-center cursor-pointer shadow-xs select-none"
                        >
                          3
                        </button>
                        <button
                          type="button"
                          onClick={handleKeypadBackspace}
                          className="h-12 sm:h-13 rounded-xl bg-stone-900 border border-stone-800/90 hover:bg-stone-850 hover:border-stone-700 active:scale-[0.95] text-stone-400 hover:text-stone-100 transition-all flex items-center justify-center cursor-pointer shadow-xs select-none"
                          title="Hapus satu angka"
                        >
                          <Delete className="w-5 h-5" />
                        </button>

                        {/* Row 2: 4, 5, 6, Clear (C) */}
                        <button
                          type="button"
                          onClick={() => handleKeypadDigit('4')}
                          className="h-12 sm:h-13 rounded-xl bg-stone-950 border border-stone-800 hover:bg-stone-850 hover:border-stone-700 active:scale-[0.95] text-stone-100 font-mono text-xl font-bold transition-all flex items-center justify-center cursor-pointer shadow-xs select-none"
                        >
                          4
                        </button>
                        <button
                          type="button"
                          onClick={() => handleKeypadDigit('5')}
                          className="h-12 sm:h-13 rounded-xl bg-stone-950 border border-stone-800 hover:bg-stone-850 hover:border-stone-700 active:scale-[0.95] text-stone-100 font-mono text-xl font-bold transition-all flex items-center justify-center cursor-pointer shadow-xs select-none"
                        >
                          5
                        </button>
                        <button
                          type="button"
                          onClick={() => handleKeypadDigit('6')}
                          className="h-12 sm:h-13 rounded-xl bg-stone-950 border border-stone-800 hover:bg-stone-850 hover:border-stone-700 active:scale-[0.95] text-stone-100 font-mono text-xl font-bold transition-all flex items-center justify-center cursor-pointer shadow-xs select-none"
                        >
                          6
                        </button>
                        <button
                          type="button"
                          onClick={handleKeypadClear}
                          className="h-12 sm:h-13 rounded-xl bg-stone-900 border border-stone-800/90 hover:bg-stone-850 hover:border-stone-700 active:scale-[0.95] text-stone-400 hover:text-rose-400 font-mono text-sm font-bold transition-all flex items-center justify-center cursor-pointer shadow-xs select-none"
                          title="Reset ke 0"
                        >
                          C
                        </button>

                        {/* Row 3: 7, 8, 9, +10.000 */}
                        <button
                          type="button"
                          onClick={() => handleKeypadDigit('7')}
                          className="h-12 sm:h-13 rounded-xl bg-stone-950 border border-stone-800 hover:bg-stone-850 hover:border-stone-700 active:scale-[0.95] text-stone-100 font-mono text-xl font-bold transition-all flex items-center justify-center cursor-pointer shadow-xs select-none"
                        >
                          7
                        </button>
                        <button
                          type="button"
                          onClick={() => handleKeypadDigit('8')}
                          className="h-12 sm:h-13 rounded-xl bg-stone-950 border border-stone-800 hover:bg-stone-850 hover:border-stone-700 active:scale-[0.95] text-stone-100 font-mono text-xl font-bold transition-all flex items-center justify-center cursor-pointer shadow-xs select-none"
                        >
                          8
                        </button>
                        <button
                          type="button"
                          onClick={() => handleKeypadDigit('9')}
                          className="h-12 sm:h-13 rounded-xl bg-stone-950 border border-stone-800 hover:bg-stone-850 hover:border-stone-700 active:scale-[0.95] text-stone-100 font-mono text-xl font-bold transition-all flex items-center justify-center cursor-pointer shadow-xs select-none"
                        >
                          9
                        </button>
                        <button
                          type="button"
                          onClick={() => handleAddNominal(10000)}
                          className="h-12 sm:h-13 rounded-xl bg-stone-900 border border-stone-800/90 hover:bg-stone-850 hover:border-stone-700 active:scale-[0.95] text-stone-300 font-mono text-xs font-bold transition-all flex items-center justify-center cursor-pointer shadow-xs select-none"
                          title="Tambah 10.000"
                        >
                          +10k
                        </button>

                        {/* Row 4: 0, 00, 000, +50.000 */}
                        <button
                          type="button"
                          onClick={() => handleKeypadDigit('0')}
                          className="h-12 sm:h-13 rounded-xl bg-stone-950 border border-stone-800 hover:bg-stone-850 hover:border-stone-700 active:scale-[0.95] text-stone-100 font-mono text-xl font-bold transition-all flex items-center justify-center cursor-pointer shadow-xs select-none"
                        >
                          0
                        </button>
                        <button
                          type="button"
                          onClick={() => handleKeypadDigit('00')}
                          className="h-12 sm:h-13 rounded-xl bg-stone-950 border border-stone-800 hover:bg-stone-850 hover:border-stone-700 active:scale-[0.95] text-stone-100 font-mono text-base font-bold transition-all flex items-center justify-center cursor-pointer shadow-xs select-none"
                        >
                          00
                        </button>
                        <button
                          type="button"
                          onClick={handleKeypadTripleZero}
                          className="h-12 sm:h-13 rounded-xl bg-stone-950 border border-stone-800 hover:bg-stone-850 hover:border-stone-700 active:scale-[0.95] text-[#E2DFD2] font-mono text-base font-bold transition-all flex items-center justify-center cursor-pointer shadow-xs select-none"
                          title="Tambah tiga nol (000)"
                        >
                          000
                        </button>
                        <button
                          type="button"
                          onClick={() => handleAddNominal(50000)}
                          className="h-12 sm:h-13 rounded-xl bg-stone-900 border border-stone-800/90 hover:bg-stone-850 hover:border-stone-700 active:scale-[0.95] text-stone-300 font-mono text-xs font-bold transition-all flex items-center justify-center cursor-pointer shadow-xs select-none"
                          title="Tambah 50.000"
                        >
                          +50k
                        </button>
                      </div>
                    </div>

                    {/* Kembalian Calculation Box */}
                    <div className="py-2.5 px-4 rounded-2xl bg-stone-950 border border-stone-800 flex items-center justify-between shadow-inner">
                      <div>
                        <span className="text-xs text-stone-400 block font-mono">Status Kembalian</span>
                        <span className="text-[11px] text-stone-400">
                          {cashTendered >= totalAmount ? 'Kembalikan ke pelanggan:' : 'Uang tunai kurang:'}
                        </span>
                      </div>
                      <span className={`font-mono text-xl sm:text-2xl font-bold tabular-nums ${
                        cashTendered >= totalAmount ? 'text-emerald-400' : 'text-rose-400'
                      }`}>
                        {cashTendered >= totalAmount
                          ? formatIDR(changeAmount)
                          : `Kurang ${formatIDR(totalAmount - cashTendered)}`}
                      </span>
                    </div>

                  </div>
                )}

              </div>
            </div>

            {/* RIGHT COLUMN: Order Items Breakdown & Complete Transaction Action */}
            <div className="md:col-span-5 lg:col-span-5 xl:col-span-5 p-6 sm:p-8 flex flex-col justify-between bg-stone-950 overflow-y-auto space-y-6">
              
              <div>
                <div className="flex items-center justify-between border-b border-stone-800 pb-3 mb-4">
                  <div>
                    <h3 className="text-sm font-bold text-stone-100 tracking-tight">Rincian Item Pesanan</h3>
                    <p className="text-xs text-stone-400 mt-0.5 font-mono">{totalItemsCount} menu dalam keranjang</p>
                  </div>
                  <span className="text-xs font-mono font-semibold text-stone-300">
                    {orderType === 'dine_in' ? 'Dine In' : 'Takeaway'}
                  </span>
                </div>

                {/* Items List taking ample vertical space */}
                <div className="max-h-[42vh] lg:max-h-[50vh] overflow-y-auto space-y-2.5 pr-1.5">
                  {cart.map((item) => (
                    <div
                      key={item.product.id}
                      className="p-3 rounded-xl bg-stone-900/90 border border-stone-800/80 flex items-start justify-between gap-3 text-xs"
                    >
                      <div className="flex items-start gap-3 min-w-0">
                        <span className="px-2 py-1 rounded-md bg-stone-800 text-[#E2DFD2] font-mono text-xs font-bold shrink-0">
                          {item.quantity}x
                        </span>
                        <div className="min-w-0">
                          <p className="font-semibold text-stone-100 text-sm truncate">{item.product.name}</p>
                          <p className="text-xs font-mono text-stone-400 mt-0.5">
                            {formatIDR(item.product.price)}
                          </p>
                          {item.notes && (
                            <p className="text-[11px] text-[#E2DFD2]/90 italic mt-1 font-mono">
                              Catatan: "{item.notes}"
                            </p>
                          )}
                        </div>
                      </div>
                      <span className="font-mono font-bold text-sm text-stone-100 tabular-nums shrink-0">
                        {formatIDR(item.product.price * item.quantity)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Bottom Totals & Action Buttons */}
              <div className="space-y-4 pt-4 border-t border-stone-800 bg-stone-950">
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between text-stone-400">
                    <span>Jumlah Item</span>
                    <span className="font-mono text-stone-200">{totalItemsCount} item</span>
                  </div>
                  <div className="flex justify-between text-stone-400">
                    <span>Metode Pembayaran</span>
                    <span className="font-semibold text-stone-200">
                      {paymentMethod === 'cash' ? 'Tunai' : 'QRIS Statis'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-base font-semibold text-stone-100 pt-3 border-t border-stone-800">
                    <span className="tracking-wide text-stone-300">TOTAL TAGIHAN</span>
                    <span className="font-mono text-3xl font-bold text-[#E2DFD2] tabular-nums">
                      {formatIDR(totalAmount)}
                    </span>
                  </div>
                </div>

                {/* Fullscreen CTA buttons */}
                <div className="space-y-2.5 pt-2">
                  <button
                    type="button"
                    onClick={handleProcessTransaction}
                    disabled={isSubmitting || (paymentMethod === 'cash' && cashTendered < totalAmount)}
                    className="w-full h-14 rounded-2xl bg-[#E2DFD2] hover:bg-[#edebe2] disabled:bg-stone-800 disabled:text-stone-600 disabled:cursor-not-allowed text-stone-950 text-base font-bold transition-all cursor-pointer shadow-lg active:scale-[0.98] flex items-center justify-center gap-2"
                  >
                    <CheckCircle2 className="w-5 h-5 stroke-[2.25]" />
                    <span>
                      {isSubmitting
                        ? 'Memproses Transaksi...'
                        : `Selesaikan Transaksi (${formatIDR(totalAmount)})`}
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setIsPaymentModalOpen(false)}
                    className="w-full py-3 rounded-xl bg-transparent hover:bg-stone-900 border border-stone-800 text-stone-400 hover:text-stone-200 text-xs font-semibold transition-colors cursor-pointer text-center"
                  >
                    Batal dan Kembali ke Katalog Menu
                  </button>
                </div>
              </div>

            </div>

          </div>

        </div>
      )}

      {/* MODAL 2: Note Editor Modal */}
      {editingNoteIndex !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xs p-4">
          <div className="w-full max-w-xs bg-stone-900 border border-stone-800 rounded-2xl p-5 shadow-2xl space-y-4">
            <h4 className="text-xs font-bold text-stone-100">
              Catatan Pesanan: {cart[editingNoteIndex]?.product.name}
            </h4>
            <input
              type="text"
              autoFocus
              placeholder="Cth: Less sugar, pedas sedang, es pisah..."
              value={tempNoteText}
              onChange={(e) => setTempNoteText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleSaveNote()
              }}
              className="w-full bg-stone-950 border border-stone-800 rounded-xl px-3 py-2 text-xs text-stone-100 focus:outline-none focus:border-[#E2DFD2]"
            />
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setEditingNoteIndex(null)}
                className="flex-1 py-2 rounded-lg bg-stone-950 border border-stone-800 text-stone-400 text-xs"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleSaveNote}
                className="flex-1 py-2 rounded-lg bg-[#E2DFD2] hover:bg-[#edebe2] text-stone-950 font-bold text-xs"
              >
                Simpan
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: Success & Thermal Receipt Print Modal */}
      {showReceiptModal && completedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-xs p-4">
          <div className="w-full max-w-sm bg-stone-900 border border-stone-800 rounded-2xl p-6 shadow-2xl space-y-4 max-h-[90vh] flex flex-col">
            
            <div className="flex items-center justify-between border-b border-stone-800 pb-3 shrink-0">
              <div className="flex items-center gap-2 text-emerald-400">
                <CheckCircle2 className="w-5 h-5" />
                <span className="text-sm font-bold text-stone-100">Transaksi Berhasil</span>
              </div>
              <button
                type="button"
                onClick={() => setShowReceiptModal(false)}
                className="text-stone-400 hover:text-stone-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Thermal Receipt Paper Layout */}
            <div className="flex-1 overflow-y-auto bg-stone-100 text-stone-950 p-4 rounded-xl font-mono text-[11px] shadow-inner select-all border border-stone-300">
              
              {/* Receipt Header */}
              <div className="text-center pb-3 border-b border-dashed border-stone-400">
                <p className="font-bold text-sm tracking-wider uppercase">WARKOP SUDUT TEMU</p>
                <p className="text-[10px] text-stone-700 mt-0.5 leading-tight">
                  Jln. Raya Ciawi Gebang No 2, Kuningan
                </p>
                <p className="text-[10px] text-stone-700">Telp: 0812-3456-7890</p>
              </div>

              {/* Order Meta */}
              <div className="py-2 border-b border-dashed border-stone-400 space-y-0.5 text-[10px]">
                <div className="flex justify-between">
                  <span>No: {completedOrder.order_number}</span>
                  <span>{new Date(completedOrder.created_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })} WIB</span>
                </div>
                <div className="flex justify-between">
                  <span>Kasir: {currentUser.name}</span>
                  <span>{completedOrder.order_type === 'dine_in' ? 'Di Tempat' : 'Bungkus'}</span>
                </div>
                {completedOrder.table_number && (
                  <div className="flex justify-between">
                    <span>Meja: {completedOrder.table_number}</span>
                  </div>
                )}
              </div>

              {/* Items List */}
              <div className="py-2 border-b border-dashed border-stone-400 space-y-1.5">
                {completedOrder.items?.map((it, idx) => (
                  <div key={idx} className="space-y-0.5">
                    <div className="flex justify-between font-semibold">
                      <span className="truncate pr-2">{it.product_name}</span>
                      <span>Rp {it.subtotal.toLocaleString('id-ID')}</span>
                    </div>
                    <div className="flex justify-between text-[10px] text-stone-600">
                      <span>{it.quantity}x Rp {it.price.toLocaleString('id-ID')}</span>
                      {it.notes && <span className="italic">({it.notes})</span>}
                    </div>
                  </div>
                ))}
              </div>

              {/* Totals */}
              <div className="py-2 border-b border-dashed border-stone-400 space-y-1">
                <div className="flex justify-between font-bold text-xs">
                  <span>TOTAL</span>
                  <span>Rp {completedOrder.total_amount.toLocaleString('id-ID')}</span>
                </div>
                <div className="flex justify-between text-[10px]">
                  <span>Bayar ({completedOrder.payment_method.toUpperCase()})</span>
                  <span>Rp {(completedOrder.cash_tendered ?? 0).toLocaleString('id-ID')}</span>
                </div>
                {completedOrder.payment_method === 'cash' && (
                  <div className="flex justify-between text-[10px]">
                    <span>Kembalian</span>
                    <span>Rp {(completedOrder.change_amount ?? 0).toLocaleString('id-ID')}</span>
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="pt-3 text-center text-[10px] text-stone-600 space-y-0.5">
                <p>Terima Kasih Atas Kunjungannya!</p>
                <p>Follow IG @warkopsuduttemu</p>
              </div>

            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-2 pt-1 shrink-0">
              <button
                type="button"
                onClick={handlePrintReceipt}
                className="flex-1 py-2.5 rounded-xl bg-stone-950 border border-stone-800 hover:border-[#E2DFD2] text-stone-200 text-xs font-semibold transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <Printer className="w-4 h-4 text-[#E2DFD2]" />
                <span>Cetak Struk</span>
              </button>
              <button
                type="button"
                onClick={() => setShowReceiptModal(false)}
                className="flex-1 py-2.5 rounded-xl bg-[#E2DFD2] hover:bg-[#edebe2] text-stone-950 text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer shadow-sm"
              >
                <span>Pesanan Baru</span>
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  )
}
