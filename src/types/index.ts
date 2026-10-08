export type Role = 'owner' | 'cashier'

export interface User {
  id: string
  username: string
  name: string
  role: Role
}

export type OrderType = 'dine_in' | 'takeaway'
export type PaymentMethod = 'cash' | 'qris' | 'split'
export type OrderStatus = 'completed' | 'cancelled'

export interface OrderItem {
  id: string
  order_id: string
  product_id: string
  product_name: string
  price: number
  cost_price: number
  quantity: number
  subtotal: number
  notes?: string
}

export interface Order {
  id: string
  order_number: string
  shift_id?: string
  cashier_name: string
  customer_name: string
  order_type: OrderType
  table_number?: string
  payment_method: PaymentMethod
  total_amount: number
  total_cost: number
  cash_tendered?: number
  change_amount?: number
  discount_amount?: number
  discount_reason?: string
  qris_amount?: number
  status: OrderStatus
  created_at: string
  items: OrderItem[]
}

export interface Product {
  id: string
  category_id: string
  category_name?: string
  name: string
  price: number
  cost_price: number
  is_available: boolean
  is_favorite: boolean
  sales_count?: number
  stock?: number | null
}

export interface ShiftExpense {
  id: string
  shift_id: string
  cashier_id?: string
  amount: number
  description: string
  type?: 'expense' | 'income'
  created_at: string
}

export interface Shift {
  id: string
  cashier_id?: string
  cashier_name: string
  start_time: string
  end_time?: string
  initial_cash: number
  total_cash_sales: number
  total_qris_sales: number
  total_expenses?: number
  total_incomes?: number
  expenses?: ShiftExpense[]
  actual_cash_counted?: number
  status: 'open' | 'closed'
  notes?: string
}

export interface DailySalesMetric {
  date: string
  day_name: string
  revenue: number
  transactions: number
  cash_amount: number
  qris_amount: number
}

export interface ReceiptConfig {
  storeName: string
  tagline: string
  address: string
  phone: string
  socialMedia: string
  footerMessage: string
  footerSubmessage: string
  wifiName: string
  wifiPassword: string
  paperWidth: '58mm' | '80mm'
  showStoreName: boolean
  showTagline: boolean
  showAddress: boolean
  showPhone: boolean
  showSocialMedia: boolean
  showCashierName: boolean
  showCustomerName: boolean
  showTableNumber: boolean
  showOrderType: boolean
  showItemNotes: boolean
  showWifiInfo: boolean
  showFooterMessage: boolean
  customNotice: string
  showCustomNotice: boolean
}

export interface DailyBreakdownItem {
  date: string
  day: number
  dayName: string
  transactions: number
  cash: number
  qris: number
  revenue: number
  expenses: number
  cost: number
  netProfit: number
}

export interface MonthlyTopProduct {
  id: string
  name: string
  category_name?: string
  quantity: number
  revenue: number
}

export type OverheadCategory = 'rent' | 'electricity' | 'water' | 'internet' | 'salary' | 'maintenance' | 'other'

export interface OverheadExpense {
  id: string
  category: OverheadCategory
  amount: number
  description?: string
  paid_date: string
  payment_source: 'cash_drawer' | 'owner_funds' | 'bank_transfer'
  recorded_by?: string
  created_at?: string
}

export interface MonthlyReportData {
  year: number
  month: number
  monthName: string
  totalRevenue: number
  totalTransactions: number
  totalCash: number
  totalQris: number
  totalExpenses: number
  totalCost: number
  grossProfit: number
  netProfit: number
  dailyBreakdown: DailyBreakdownItem[]
  topProducts: MonthlyTopProduct[]
  overheadExpenses?: OverheadExpense[]
  totalOverhead?: number
  totalShiftExpenses?: number
}

export interface RawMaterial {
  id: string
  name: string
  category: string
  current_stock: number
  unit: string
  min_stock_alert: number
  cost_per_unit?: number // Hidden from cashier, visible only to owner
  supplier?: string
  last_restocked_at?: string
  created_at?: string
}

export type StockMovementType = 'in' | 'out' | 'waste' | 'adjustment'

export interface StockMovement {
  id: string
  material_id: string
  material_name?: string
  type: StockMovementType
  quantity: number
  unit?: string
  notes?: string
  cost_total?: number // Visible only to owner
  created_by_name: string
  created_at: string
}

export interface ProductRecipe {
  id: string
  product_id: string
  material_id: string
  material_name?: string
  unit?: string
  quantity_required: number
}
