import type { Order, Product, Shift, DailySalesMetric } from '../types'

export const mockProducts: Product[] = [
  // Perkopian
  { id: 'prod_kopi_1', category_id: 'cat_kopi', category_name: 'Perkopian', name: 'Kopi Tubruk', price: 7000, cost_price: 2500, is_available: true, is_favorite: true, sales_count: 24 },
  { id: 'prod_kopi_2', category_id: 'cat_kopi', category_name: 'Perkopian', name: 'Kopi SKM', price: 9000, cost_price: 3500, is_available: true, is_favorite: false, sales_count: 11 },
  { id: 'prod_kopi_3', category_id: 'cat_kopi', category_name: 'Perkopian', name: 'Kopi Jahe', price: 8000, cost_price: 3000, is_available: true, is_favorite: false, sales_count: 9 },
  { id: 'prod_kopi_4', category_id: 'cat_kopi', category_name: 'Perkopian', name: 'Kopi Saset', price: 8000, cost_price: 3000, is_available: true, is_favorite: false, sales_count: 14 },
  { id: 'prod_kopi_5', category_id: 'cat_kopi', category_name: 'Perkopian', name: 'Kopi Susu Sachet', price: 8000, cost_price: 3000, is_available: true, is_favorite: false, sales_count: 16 },
  { id: 'prod_kopi_6', category_id: 'cat_kopi', category_name: 'Perkopian', name: 'Es Kopi Gula Aren', price: 12000, cost_price: 5000, is_available: true, is_favorite: true, sales_count: 38 },

  // Minum-Minum
  { id: 'prod_minum_1', category_id: 'cat_minum', category_name: 'Minum-Minum', name: 'Teh Manis', price: 5000, cost_price: 1500, is_available: true, is_favorite: true, sales_count: 45 },
  { id: 'prod_minum_2', category_id: 'cat_minum', category_name: 'Minum-Minum', name: 'Teh Tarik', price: 8000, cost_price: 3000, is_available: true, is_favorite: false, sales_count: 12 },
  { id: 'prod_minum_3', category_id: 'cat_minum', category_name: 'Minum-Minum', name: 'Es Teh Jumbo', price: 7000, cost_price: 2000, is_available: true, is_favorite: true, sales_count: 52 },
  { id: 'prod_minum_4', category_id: 'cat_minum', category_name: 'Minum-Minum', name: 'Susu', price: 7000, cost_price: 3000, is_available: true, is_favorite: false, sales_count: 8 },
  { id: 'prod_minum_5', category_id: 'cat_minum', category_name: 'Minum-Minum', name: 'Milo', price: 7000, cost_price: 3000, is_available: true, is_favorite: false, sales_count: 15 },
  { id: 'prod_minum_6', category_id: 'cat_minum', category_name: 'Minum-Minum', name: 'Susu Jahe', price: 8000, cost_price: 3500, is_available: true, is_favorite: false, sales_count: 10 },
  { id: 'prod_minum_7', category_id: 'cat_minum', category_name: 'Minum-Minum', name: 'Nutrisari', price: 6000, cost_price: 2500, is_available: true, is_favorite: true, sales_count: 22 },
  { id: 'prod_minum_8', category_id: 'cat_minum', category_name: 'Minum-Minum', name: 'Good Day Freeze', price: 8000, cost_price: 3500, is_available: true, is_favorite: true, sales_count: 28 },
  { id: 'prod_minum_9', category_id: 'cat_minum', category_name: 'Minum-Minum', name: 'STMJ', price: 8000, cost_price: 4000, is_available: true, is_favorite: false, sales_count: 7 },
  { id: 'prod_minum_10', category_id: 'cat_minum', category_name: 'Minum-Minum', name: 'Energen', price: 7000, cost_price: 3000, is_available: true, is_favorite: false, sales_count: 11 },
  { id: 'prod_minum_11', category_id: 'cat_minum', category_name: 'Minum-Minum', name: 'Xtrejoss Susu', price: 10000, cost_price: 4500, is_available: true, is_favorite: true, sales_count: 31 },
  { id: 'prod_minum_12', category_id: 'cat_minum', category_name: 'Minum-Minum', name: 'Xtrejoss', price: 6500, cost_price: 2500, is_available: true, is_favorite: false, sales_count: 14 },
  { id: 'prod_minum_13', category_id: 'cat_minum', category_name: 'Minum-Minum', name: 'Kuku Bima Susu', price: 10000, cost_price: 4500, is_available: true, is_favorite: false, sales_count: 16 },
  { id: 'prod_minum_14', category_id: 'cat_minum', category_name: 'Minum-Minum', name: 'Kuku Bima', price: 6500, cost_price: 2500, is_available: true, is_favorite: false, sales_count: 13 },
  { id: 'prod_minum_15', category_id: 'cat_minum', category_name: 'Minum-Minum', name: 'Lemon Tea (Panas/Dingin)', price: 10000, cost_price: 4000, is_available: true, is_favorite: false, sales_count: 18 },
  { id: 'prod_minum_16', category_id: 'cat_minum', category_name: 'Minum-Minum', name: 'Es Lychee Tea', price: 10000, cost_price: 4000, is_available: true, is_favorite: false, sales_count: 19 },
  { id: 'prod_minum_17', category_id: 'cat_minum', category_name: 'Minum-Minum', name: 'Soda Gembira', price: 15000, cost_price: 6000, is_available: true, is_favorite: true, sales_count: 20 },

  // Permie-an
  { id: 'prod_mie_1', category_id: 'cat_mie', category_name: 'Permie-an', name: 'Indomie Polos Single', price: 9000, cost_price: 3500, is_available: true, is_favorite: false, sales_count: 15 },
  { id: 'prod_mie_2', category_id: 'cat_mie', category_name: 'Permie-an', name: 'Indomie Polos Double', price: 12000, cost_price: 6000, is_available: true, is_favorite: false, sales_count: 12 },
  { id: 'prod_mie_3', category_id: 'cat_mie', category_name: 'Permie-an', name: 'Indomie Single Telur', price: 13000, cost_price: 5500, is_available: true, is_favorite: true, sales_count: 36 },
  { id: 'prod_mie_4', category_id: 'cat_mie', category_name: 'Permie-an', name: 'Indomie Telur Double', price: 16000, cost_price: 8000, is_available: true, is_favorite: true, sales_count: 24 },
  { id: 'prod_mie_5', category_id: 'cat_mie', category_name: 'Permie-an', name: 'Intel Kor', price: 17000, cost_price: 8500, is_available: true, is_favorite: true, sales_count: 21 },
  { id: 'prod_mie_6', category_id: 'cat_mie', category_name: 'Permie-an', name: 'Intel Kornas', price: 18000, cost_price: 9500, is_available: true, is_favorite: true, sales_count: 27 },
  { id: 'prod_mie_7', category_id: 'cat_mie', category_name: 'Permie-an', name: 'Mie Tek-Tek', price: 10000, cost_price: 4500, is_available: true, is_favorite: false, sales_count: 16 },

  // Pernasi-an
  { id: 'prod_nasi_1', category_id: 'cat_nasi', category_name: 'Pernasi-an', name: 'Nasi Telur', price: 12000, cost_price: 5000, is_available: true, is_favorite: true, sales_count: 25 },
  { id: 'prod_nasi_2', category_id: 'cat_nasi', category_name: 'Pernasi-an', name: 'Nasi Telur Sosis', price: 13000, cost_price: 6000, is_available: true, is_favorite: false, sales_count: 14 },
  { id: 'prod_nasi_3', category_id: 'cat_nasi', category_name: 'Pernasi-an', name: 'Nasi Telur Kornet', price: 15000, cost_price: 7000, is_available: true, is_favorite: true, sales_count: 23 },
  { id: 'prod_nasi_4', category_id: 'cat_nasi', category_name: 'Pernasi-an', name: 'Nasi Kornet', price: 13000, cost_price: 6000, is_available: true, is_favorite: false, sales_count: 9 },
  { id: 'prod_nasi_5', category_id: 'cat_nasi', category_name: 'Pernasi-an', name: 'Nasi Orak Arik Sosis', price: 13000, cost_price: 6000, is_available: true, is_favorite: false, sales_count: 17 },
  { id: 'prod_nasi_6', category_id: 'cat_nasi', category_name: 'Pernasi-an', name: 'Nasi Orak Arik Kornet', price: 16000, cost_price: 7500, is_available: true, is_favorite: true, sales_count: 29 },
  { id: 'prod_nasi_7', category_id: 'cat_nasi', category_name: 'Pernasi-an', name: 'Nasi Orak Arik Omelet', price: 16000, cost_price: 7500, is_available: true, is_favorite: false, sales_count: 11 },
  { id: 'prod_nasi_8', category_id: 'cat_nasi', category_name: 'Pernasi-an', name: 'Nasi Omelet', price: 13000, cost_price: 6000, is_available: true, is_favorite: false, sales_count: 10 },
  { id: 'prod_nasi_9', category_id: 'cat_nasi', category_name: 'Pernasi-an', name: 'Nasi Omelet Sosis', price: 14000, cost_price: 6500, is_available: true, is_favorite: false, sales_count: 12 },
  { id: 'prod_nasi_10', category_id: 'cat_nasi', category_name: 'Pernasi-an', name: 'Nasi Omelet Kornet', price: 17000, cost_price: 8000, is_available: true, is_favorite: false, sales_count: 15 },
  { id: 'prod_nasi_11', category_id: 'cat_nasi', category_name: 'Pernasi-an', name: 'Nasi Gila', price: 15000, cost_price: 7000, is_available: true, is_favorite: true, sales_count: 26 },
  { id: 'prod_nasi_12', category_id: 'cat_nasi', category_name: 'Pernasi-an', name: 'Nasi Goreng Gila', price: 18000, cost_price: 8500, is_available: true, is_favorite: true, sales_count: 28 },
  { id: 'prod_nasi_13', category_id: 'cat_nasi', category_name: 'Pernasi-an', name: 'Nasi Goreng Sute', price: 15000, cost_price: 7000, is_available: true, is_favorite: true, sales_count: 35 },
  { id: 'prod_nasi_14', category_id: 'cat_nasi', category_name: 'Pernasi-an', name: 'Nasi Ayam Sambal Matah', price: 16000, cost_price: 8000, is_available: true, is_favorite: true, sales_count: 32 },

  // Cemal-Cemil
  { id: 'prod_cemil_1', category_id: 'cat_cemilan', category_name: 'Cemal-Cemil', name: 'Aneka Gorengan', price: 5000, cost_price: 2000, is_available: true, is_favorite: true, sales_count: 48 },
  { id: 'prod_cemil_2', category_id: 'cat_cemilan', category_name: 'Cemal-Cemil', name: 'Roti Bakar / Pisang Bakar', price: 12000, cost_price: 5000, is_available: true, is_favorite: true, sales_count: 21 },
  { id: 'prod_cemil_3', category_id: 'cat_cemilan', category_name: 'Cemal-Cemil', name: 'Kentang Goreng', price: 9000, cost_price: 4000, is_available: true, is_favorite: false, sales_count: 16 },
  { id: 'prod_cemil_4', category_id: 'cat_cemilan', category_name: 'Cemal-Cemil', name: 'Sosis Goreng', price: 9000, cost_price: 4000, is_available: true, is_favorite: false, sales_count: 14 },
  { id: 'prod_cemil_5', category_id: 'cat_cemilan', category_name: 'Cemal-Cemil', name: 'Pancong Lumer', price: 9000, cost_price: 4000, is_available: true, is_favorite: true, sales_count: 24 },
  { id: 'prod_cemil_6', category_id: 'cat_cemilan', category_name: 'Cemal-Cemil', name: 'Dimsum', price: 12000, cost_price: 5500, is_available: true, is_favorite: false, sales_count: 18 },
  { id: 'prod_cemil_7', category_id: 'cat_cemilan', category_name: 'Cemal-Cemil', name: 'Mix Platter', price: 25000, cost_price: 12000, is_available: true, is_favorite: true, sales_count: 15 },

  // Spesial
  { id: 'prod_spesial_1', category_id: 'cat_spesial', category_name: 'Spesial', name: 'Bubur Kacang Hijau', price: 9000, cost_price: 4000, is_available: true, is_favorite: true, sales_count: 22 },
  { id: 'prod_spesial_2', category_id: 'cat_spesial', category_name: 'Spesial', name: 'Bubur Ketan Hitam', price: 9000, cost_price: 4000, is_available: true, is_favorite: true, sales_count: 19 }
]

export const mockWeeklySales: DailySalesMetric[] = [
  { date: '2026-09-27', day_name: 'Min', revenue: 890000, transactions: 54, cash_amount: 510000, qris_amount: 380000 },
  { date: '2026-09-28', day_name: 'Sen', revenue: 640000, transactions: 38, cash_amount: 390000, qris_amount: 250000 },
  { date: '2026-09-29', day_name: 'Sel', revenue: 720000, transactions: 44, cash_amount: 420000, qris_amount: 300000 },
  { date: '2026-09-30', day_name: 'Rab', revenue: 685000, transactions: 41, cash_amount: 385000, qris_amount: 300000 },
  { date: '2026-10-01', day_name: 'Kam', revenue: 760000, transactions: 45, cash_amount: 440000, qris_amount: 320000 },
  { date: '2026-10-02', day_name: 'Jum', revenue: 950000, transactions: 58, cash_amount: 520000, qris_amount: 430000 },
  { date: '2026-10-03', day_name: 'Sab (Hari Ini)', revenue: 845000, transactions: 49, cash_amount: 490000, qris_amount: 355000 },
]

export const mockCurrentShift: Shift = {
  id: 'shift_pagi_01',
  cashier_id: 'usr_kasir1',
  cashier_name: 'Kasir Shift Pagi',
  start_time: '2026-10-04 08:00:00',
  initial_cash: 100000,
  total_cash_sales: 355000,
  total_qris_sales: 285000,
  status: 'open',
  notes: 'Shift pagi ramai lancar.'
}

export const mockRecentOrders: Order[] = [
  {
    id: 'ord_101',
    order_number: 'SUTE-261003-0049',
    cashier_name: 'Kasir Shift Sore',
    customer_name: 'Meja 04',
    order_type: 'dine_in',
    table_number: '04',
    payment_method: 'qris',
    total_amount: 34000,
    total_cost: 16000,
    status: 'completed',
    created_at: '21:04',
    items: [
      { id: 'item_1', order_id: 'ord_101', product_id: 'prod_kopi_6', product_name: 'Es Kopi Gula Aren', price: 12000, cost_price: 5000, quantity: 2, subtotal: 24000, notes: '1 less sugar' },
      { id: 'item_2', order_id: 'ord_101', product_id: 'prod_cemil_1', product_name: 'Aneka Gorengan', price: 5000, cost_price: 2000, quantity: 2, subtotal: 10000 }
    ]
  },
  {
    id: 'ord_102',
    order_number: 'SUTE-261003-0048',
    cashier_name: 'Kasir Shift Sore',
    customer_name: 'Mas Adit',
    order_type: 'takeaway',
    payment_method: 'cash',
    total_amount: 28000,
    total_cost: 13500,
    cash_tendered: 50000,
    change_amount: 22000,
    status: 'completed',
    created_at: '20:48',
    items: [
      { id: 'item_3', order_id: 'ord_102', product_id: 'prod_nasi_13', product_name: 'Nasi Goreng Sute', price: 15000, cost_price: 7000, quantity: 1, subtotal: 15000, notes: 'Pedas sedang' },
      { id: 'item_4', order_id: 'ord_102', product_id: 'prod_mie_3', product_name: 'Indomie Single Telur', price: 13000, cost_price: 5500, quantity: 1, subtotal: 13000 }
    ]
  },
  {
    id: 'ord_103',
    order_number: 'SUTE-261003-0047',
    cashier_name: 'Kasir Shift Sore',
    customer_name: 'Meja 01',
    order_type: 'dine_in',
    table_number: '01',
    payment_method: 'cash',
    total_amount: 19000,
    total_cost: 7500,
    cash_tendered: 20000,
    change_amount: 1000,
    status: 'completed',
    created_at: '20:31',
    items: [
      { id: 'item_5', order_id: 'ord_103', product_id: 'prod_kopi_1', product_name: 'Kopi Tubruk', price: 7000, cost_price: 2500, quantity: 1, subtotal: 7000 },
      { id: 'item_6', order_id: 'ord_103', product_id: 'prod_cemil_2', product_name: 'Roti Bakar / Pisang Bakar', price: 12000, cost_price: 5000, quantity: 1, subtotal: 12000 }
    ]
  },
  {
    id: 'ord_104',
    order_number: 'SUTE-261003-0046',
    cashier_name: 'Kasir Shift Sore',
    customer_name: 'Meja 07',
    order_type: 'dine_in',
    table_number: '07',
    payment_method: 'qris',
    total_amount: 27000,
    total_cost: 11000,
    status: 'completed',
    created_at: '20:15',
    items: [
      { id: 'item_7', order_id: 'ord_104', product_id: 'prod_minum_11', product_name: 'Xtrejoss Susu', price: 10000, cost_price: 4500, quantity: 2, subtotal: 20000 },
      { id: 'item_8', order_id: 'ord_104', product_id: 'prod_minum_3', product_name: 'Es Teh Jumbo', price: 7000, cost_price: 2000, quantity: 1, subtotal: 7000 }
    ]
  },
  {
    id: 'ord_105',
    order_number: 'SUTE-261003-0045',
    cashier_name: 'Kasir Shift Sore',
    customer_name: 'Pak RT',
    order_type: 'takeaway',
    payment_method: 'cash',
    total_amount: 14000,
    total_cost: 5000,
    cash_tendered: 20000,
    change_amount: 6000,
    status: 'completed',
    created_at: '19:52',
    items: [
      { id: 'item_9', order_id: 'ord_105', product_id: 'prod_kopi_1', product_name: 'Kopi Tubruk', price: 7000, cost_price: 2500, quantity: 2, subtotal: 14000, notes: 'Manis kental' }
    ]
  }
]
