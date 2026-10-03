export type Role = 'owner' | 'cashier'

export interface User {
  id: string
  username: string
  name: string
  role: Role
}

export type OrderType = 'dine_in' | 'takeaway'
export type PaymentMethod = 'cash' | 'qris'
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
