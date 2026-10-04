export type TabType = 'pos' | 'dashboard' | 'monthly' | 'orders' | 'shift' | 'inventory' | 'products' | 'users' | 'receipt'

export const TAB_TO_PATH: Record<TabType, string> = {
  pos: '/pos',
  dashboard: '/dashboard',
  monthly: '/laporan-bulanan',
  orders: '/orders',
  shift: '/shift',
  inventory: '/bahan-baku',
  products: '/products',
  users: '/users',
  receipt: '/receipt'
}

export const PATH_TO_TAB: Record<string, TabType> = {
  '/pos': 'pos',
  '/': 'dashboard',
  '/dashboard': 'dashboard',
  '/laporan-bulanan': 'monthly',
  '/monthly': 'monthly',
  '/rekap-bulanan': 'monthly',
  '/orders': 'orders',
  '/transaksi': 'orders',
  '/shift': 'shift',
  '/audit-shift': 'shift',
  '/inventory': 'inventory',
  '/bahan-baku': 'inventory',
  '/stok': 'inventory',
  '/products': 'products',
  '/menu': 'products',
  '/katalog': 'products',
  '/users': 'users',
  '/petugas': 'users',
  '/receipt': 'receipt',
  '/struk': 'receipt'
}

export const getTabFromPath = (path: string, userRole?: string): TabType => {
  const cleanPath = path.toLowerCase().replace(/\/+$/, '') || '/'
  const matched = PATH_TO_TAB[cleanPath]

  if (userRole === 'cashier') {
    // Cashier role access restrictions (Kasir can access POS, Orders, Shift, and Inventory)
    if (matched === 'orders' || matched === 'shift' || matched === 'pos' || matched === 'inventory') {
      return matched
    }
    return 'pos'
  }

  // Owner defaults to matched tab or dashboard
  return matched || 'dashboard'
}
