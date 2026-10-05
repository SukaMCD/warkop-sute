import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { secureHeaders } from 'hono/secure-headers'
import { sign, verify } from 'hono/jwt'

type Bindings = {
  DB: D1Database
  ASSETS?: Fetcher
  JWT_SECRET?: string
}

type Variables = {
  user?: {
    id: string
    username: string
    name: string
    role: string
  }
}

const app = new Hono<{ Bindings: Bindings; Variables: Variables }>()

app.use('*', secureHeaders())
app.use('*', cors())

const DEFAULT_JWT_SECRET = 'rahasia-warkop-sudut-temu-2026'

// JWT Auth Middleware
async function authMiddleware(c: any, next: any) {
  const authHeader = c.req.header('Authorization')
  const secret = c.env?.JWT_SECRET || DEFAULT_JWT_SECRET
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.substring(7)
    try {
      const payload = await verify(token, secret, 'HS256')
      c.set('user', payload)
      return await next()
    } catch {
      return c.json({ success: false, message: 'Sesi login telah kedaluwarsa atau tidak valid.' }, 401)
    }
  }

  // If DB is not available (mock local dev), pass through as mock user
  if (!c.env?.DB) {
    c.set('user', { id: 'usr_dev', role: 'owner', name: 'Dev Owner', username: 'owner' })
    return await next()
  }

  return c.json({ success: false, message: 'Autentikasi dibutuhkan. Silakan login kembali.' }, 401)
}

// Require Owner Role Middleware
async function requireOwner(c: any, next: any) {
  const user = c.get('user')
  if (!user || user.role !== 'owner') {
    return c.json({ success: false, message: 'Akses ditolak. Fitur ini hanya untuk Owner.' }, 403)
  }
  return await next()
}

// Health check
app.get('/api/health', (c) => {
  return c.json({ status: 'ok', name: 'Warkop Sudut Temu POS API', timestamp: new Date().toISOString() })
})

// SHA-256 hashing helper for PIN
async function hashPin(pin: string): Promise<string> {
  const encoder = new TextEncoder()
  const data = encoder.encode(pin)
  const hashBuffer = await crypto.subtle.digest('SHA-256', data)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
}

// Authentication route
app.post('/api/auth/login', async (c) => {
  const body = await c.req.json()
  const { pin, username } = body
  const secret = c.env?.JWT_SECRET || DEFAULT_JWT_SECRET

  if (c.env?.DB && pin) {
    const pinStr = String(pin).trim()
    const hashedPin = await hashPin(pinStr)
    try {
      const query = username
        ? c.env.DB.prepare('SELECT id, username, name, role FROM users WHERE username = ? AND (pin = ? OR pin = ?)').bind(username, hashedPin, pinStr)
        : c.env.DB.prepare('SELECT id, username, name, role FROM users WHERE pin = ? OR pin = ?').bind(hashedPin, pinStr)
      
      const user: any = await query.first()
      if (user) {
        const token = await sign(
          {
            id: user.id,
            username: user.username,
            name: user.name,
            role: user.role,
            exp: Math.floor(Date.now() / 1000) + (60 * 60 * 24 * 7) // 7 days
          },
          secret
        )
        return c.json({ success: true, user, token })
      }
      return c.json({ success: false, message: 'PIN tidak sesuai untuk petugas yang dipilih.' }, 401)
    } catch (err: any) {
      console.error('Database login error:', err)
      return c.json({ success: false, message: 'Database D1 error: ' + (err?.message || 'Terjadi kesalahan sistem') }, 500)
    }
  }

  // Fallback for dev without DB
  const fallbackUser = { id: 'usr_dev', username: username || 'kasir', name: 'Petugas Warkop', role: username === 'owner' ? 'owner' : 'cashier' }
  const token = await sign(
    {
      ...fallbackUser,
      exp: Math.floor(Date.now() / 1000) + (60 * 60 * 24 * 7)
    },
    secret
  )
  return c.json({ success: true, user: fallbackUser, token })
})

// Categories
app.get('/api/categories', async (c) => {
  if (c.env?.DB) {
    const { results } = await c.env.DB.prepare('SELECT * FROM categories ORDER BY sort_order ASC').all()
    return c.json({ success: true, data: results })
  }
  return c.json({
    success: true,
    data: [
      { id: 'cat_kopi', name: 'Kopi', slug: 'kopi', sort_order: 1 },
      { id: 'cat_nonkopi', name: 'Non Kopi', slug: 'non-kopi', sort_order: 2 },
      { id: 'cat_makanan', name: 'Makanan', slug: 'makanan', sort_order: 3 },
      { id: 'cat_cemilan', name: 'Cemilan', slug: 'cemilan', sort_order: 4 }
    ]
  })
})

// Products (All / Available)
app.get('/api/products', async (c) => {
  if (c.env?.DB) {
    const { results } = await c.env.DB.prepare(`
      SELECT p.*, c.name as category_name 
      FROM products p 
      JOIN categories c ON p.category_id = c.id 
      ORDER BY p.is_favorite DESC, p.name ASC
    `).all()
    return c.json({ success: true, data: results })
  }
  return c.json({
    success: true,
    data: []
  })
})

// Toggle product availability in D1
app.patch('/api/products/:id/toggle', async (c) => {
  const id = c.req.param('id')
  if (c.env?.DB) {
    await c.env.DB.prepare(`
      UPDATE products 
      SET is_available = CASE WHEN is_available = 1 THEN 0 ELSE 1 END 
      WHERE id = ?
    `).bind(id).run()
    
    const updated = await c.env.DB.prepare('SELECT * FROM products WHERE id = ?').bind(id).first()
    return c.json({ success: true, data: updated })
  }
  return c.json({ success: true, message: 'Updated locally' })
})

// Create new product (Owner Only)
app.post('/api/products', authMiddleware, requireOwner, async (c) => {
  const body = await c.req.json()
  const { category_id, name, price, cost_price = 0, is_available = 1, is_favorite = 0 } = body
  const id = `prod_${Date.now()}`
  if (c.env?.DB) {
    await c.env.DB.prepare(`
      INSERT INTO products (id, category_id, name, price, cost_price, is_available, is_favorite)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).bind(id, category_id, name, Number(price), Number(cost_price) || 0, is_available ? 1 : 0, is_favorite ? 1 : 0).run()

    const created = await c.env.DB.prepare(`
      SELECT p.*, c.name as category_name
      FROM products p
      JOIN categories c ON p.category_id = c.id
      WHERE p.id = ?
    `).bind(id).first()
    return c.json({ success: true, data: created })
  }
  return c.json({ success: true, data: { id, category_id, name, price, cost_price, is_available, is_favorite } })
})

// Update existing product (Owner Only)
app.put('/api/products/:id', authMiddleware, requireOwner, async (c) => {
  const id = c.req.param('id')
  const body = await c.req.json()
  const { category_id, name, price, cost_price = 0, is_available = 1, is_favorite = 0 } = body
  if (c.env?.DB) {
    await c.env.DB.prepare(`
      UPDATE products
      SET category_id = ?, name = ?, price = ?, cost_price = ?, is_available = ?, is_favorite = ?
      WHERE id = ?
    `).bind(category_id, name, Number(price), Number(cost_price) || 0, is_available ? 1 : 0, is_favorite ? 1 : 0, id).run()

    const updated = await c.env.DB.prepare(`
      SELECT p.*, c.name as category_name
      FROM products p
      JOIN categories c ON p.category_id = c.id
      WHERE p.id = ?
    `).bind(id).first()
    return c.json({ success: true, data: updated })
  }
  return c.json({ success: true, data: { id, ...body } })
})

// Delete product (Owner Only)
app.delete('/api/products/:id', authMiddleware, requireOwner, async (c) => {
  const id = c.req.param('id')
  if (c.env?.DB) {
    await c.env.DB.prepare('DELETE FROM products WHERE id = ?').bind(id).run()
    await c.env.DB.prepare('DELETE FROM product_recipes WHERE product_id = ?').bind(id).run().catch(() => null)
    return c.json({ success: true, message: 'Deleted' })
  }
  return c.json({ success: true, message: 'Deleted' })
})

// GET /api/products/:id/recipes - Get ingredients required for a product
app.get('/api/products/:id/recipes', async (c) => {
  const productId = c.req.param('id')
  if (c.env?.DB) {
    await ensureInventoryTables(c.env.DB)
    const { results } = await c.env.DB.prepare(`
      SELECT pr.*, rm.name as material_name, rm.unit
      FROM product_recipes pr
      JOIN raw_materials rm ON pr.material_id = rm.id
      WHERE pr.product_id = ?
      ORDER BY rm.name ASC
    `).bind(productId).all()
    return c.json({ success: true, data: results || [] })
  }
  return c.json({ success: true, data: [] })
})

// PUT /api/products/:id/recipes - Save recipe ingredients for a product (Owner Only)
app.put('/api/products/:id/recipes', authMiddleware, requireOwner, async (c) => {
  const productId = c.req.param('id')
  const body = await c.req.json()
  const { items = [] } = body // [{ material_id: string, quantity_required: number }]

  if (c.env?.DB) {
    await ensureInventoryTables(c.env.DB)
    // Clear old recipe items for this product
    await c.env.DB.prepare('DELETE FROM product_recipes WHERE product_id = ?').bind(productId).run()

    for (let i = 0; i < items.length; i++) {
      const it = items[i]
      if (!it.material_id || Number(it.quantity_required) <= 0) continue
      const recId = `rec_${Date.now()}_${i}`
      await c.env.DB.prepare(`
        INSERT INTO product_recipes (id, product_id, material_id, quantity_required)
        VALUES (?, ?, ?, ?)
      `).bind(recId, productId, it.material_id, Number(it.quantity_required)).run()
    }

    const { results } = await c.env.DB.prepare(`
      SELECT pr.*, rm.name as material_name, rm.unit
      FROM product_recipes pr
      JOIN raw_materials rm ON pr.material_id = rm.id
      WHERE pr.product_id = ?
      ORDER BY rm.name ASC
    `).bind(productId).all()

    return c.json({ success: true, data: results || [] })
  }

  return c.json({ success: true, data: items })
})

// Orders & Order Items
app.get('/api/orders', async (c) => {
  const paymentMethod = c.req.query('payment_method')
  const dateFilter = c.req.query('date')
  const status = c.req.query('status')

  if (c.env?.DB) {
    let sql = `
      SELECT o.*, u.name as cashier_name
      FROM orders o
      JOIN users u ON o.cashier_id = u.id
      WHERE 1=1
    `
    const params: any[] = []

    if (paymentMethod && paymentMethod !== 'all') {
      sql += ' AND o.payment_method = ?'
      params.push(paymentMethod)
    }

    if (status && status !== 'all') {
      sql += ' AND o.status = ?'
      params.push(status)
    }

    if (dateFilter === 'today') {
      sql += " AND date(o.created_at) = date('now', 'localtime')"
    } else if (dateFilter === 'yesterday') {
      sql += " AND date(o.created_at) = date('now', 'localtime', '-1 day')"
    } else if (dateFilter === '7days') {
      sql += " AND date(o.created_at) >= date('now', 'localtime', '-6 days')"
    }

    sql += ' ORDER BY o.created_at DESC LIMIT 100'

    const stmt = params.length > 0 ? c.env.DB.prepare(sql).bind(...params) : c.env.DB.prepare(sql)
    const { results: orders } = await stmt.all()

    const { results: allItems } = await c.env.DB.prepare(`
      SELECT * FROM order_items
    `).all()

    // Map items into orders
    const ordersWithItems = orders.map((ord: any) => ({
      ...ord,
      items: allItems.filter((item: any) => item.order_id === ord.id)
    }))

    return c.json({ success: true, data: ordersWithItems })
  }
  return c.json({ success: true, data: [] })
})

// Cancel / Void Order (Owner Only)
app.post('/api/orders/:id/cancel', authMiddleware, requireOwner, async (c) => {
  const orderId = c.req.param('id')
  if (c.env?.DB) {
    const order: any = await c.env.DB.prepare('SELECT * FROM orders WHERE id = ?').bind(orderId).first()
    if (!order) {
      return c.json({ success: false, message: 'Pesanan tidak ditemukan' }, 404)
    }
    if (order.status === 'cancelled') {
      return c.json({ success: false, message: 'Pesanan sudah berstatus dibatalkan' }, 400)
    }

    await c.env.DB.prepare("UPDATE orders SET status = 'cancelled' WHERE id = ?").bind(orderId).run()

    if (order.shift_id) {
      if (order.payment_method === 'cash') {
        await c.env.DB.prepare('UPDATE shifts SET total_cash_sales = MAX(0, total_cash_sales - ?) WHERE id = ?')
          .bind(order.total_amount, order.shift_id).run()
      } else if (order.payment_method === 'qris') {
        await c.env.DB.prepare('UPDATE shifts SET total_qris_sales = MAX(0, total_qris_sales - ?) WHERE id = ?')
          .bind(order.total_amount, order.shift_id).run()
      } else if (order.payment_method === 'split') {
        const cashPart = Math.min(order.total_amount, Number(order.cash_tendered) || 0)
        const qrisPart = Math.max(0, order.total_amount - cashPart)
        await c.env.DB.prepare('UPDATE shifts SET total_cash_sales = MAX(0, total_cash_sales - ?), total_qris_sales = MAX(0, total_qris_sales - ?) WHERE id = ?')
          .bind(cashPart, qrisPart, order.shift_id).run()
      }
    }

    return c.json({ success: true, message: 'Pesanan berhasil dibatalkan (void)' })
  }
  return c.json({ success: true, message: 'Pesanan dibatalkan' })
})

// Create New Order (Authenticated Cashier / Owner)
app.post('/api/orders', authMiddleware, async (c) => {
  const body = await c.req.json()
  const {
    order_number,
    shift_id,
    cashier_id,
    customer_name,
    order_type,
    table_number,
    payment_method,
    total_amount,
    cash_tendered,
    change_amount,
    status = 'completed',
    notes,
    items = []
  } = body

  const orderId = `ord_${Date.now()}`

  if (c.env?.DB) {
    try {
      // 0. Idempotency Check: if order_number already exists, return existing order (prevents duplicate on offline sync retry)
      if (order_number) {
        const existing: any = await c.env.DB.prepare('SELECT * FROM orders WHERE order_number = ?').bind(order_number).first()
        if (existing) {
          return c.json({
            success: true,
            is_duplicate: true,
            message: 'Pesanan sudah tersimpan sebelumnya (sinkronisasi aman)',
            order: existing
          })
        }
      }

      // 1. Insert order
      let finalMethod = payment_method
      let finalNotes = notes || null
      if (payment_method === 'split') {
        const cashPart = Math.min(total_amount, Number(cash_tendered) || 0)
        const qrisPart = Math.max(0, total_amount - cashPart)
        const splitTag = `[Split: Tunai Rp ${cashPart.toLocaleString('id-ID')}, QRIS Rp ${qrisPart.toLocaleString('id-ID')}]`
        finalNotes = finalNotes ? `${splitTag} ${finalNotes}` : splitTag
      }

      const cleanCustomerName = String(customer_name || 'Pelanggan').trim().slice(0, 100)
      const cleanTableNumber = table_number ? String(table_number).trim().slice(0, 50) : null
      const cleanOrderType = order_type === 'takeaway' ? 'takeaway' : 'dine_in'
      const cleanNotes = finalNotes ? String(finalNotes).trim().slice(0, 500) : null

      try {
        await c.env.DB.prepare(`
          INSERT INTO orders (
            id, order_number, shift_id, cashier_id, customer_name,
            order_type, table_number, payment_method, total_amount,
            cash_tendered, change_amount, status, notes
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).bind(
          orderId,
          order_number,
          shift_id || null,
          cashier_id,
          cleanCustomerName,
          cleanOrderType,
          cleanTableNumber,
          finalMethod,
          total_amount,
          cash_tendered || total_amount,
          change_amount || 0,
          status,
          cleanNotes
        ).run()
      } catch (insertErr: any) {
        if (insertErr?.message?.includes('CHECK') && finalMethod === 'split') {
          await c.env.DB.prepare(`
            INSERT INTO orders (
              id, order_number, shift_id, cashier_id, customer_name,
              order_type, table_number, payment_method, total_amount,
              cash_tendered, change_amount, status, notes
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          `).bind(
            orderId,
            order_number,
            shift_id || null,
            cashier_id,
            cleanCustomerName,
            cleanOrderType,
            cleanTableNumber,
            'cash',
            total_amount,
            cash_tendered || total_amount,
            change_amount || 0,
            status,
            cleanNotes
          ).run()
        } else {
          throw insertErr
        }
      }

      // 2. Insert order items
      for (let i = 0; i < items.length; i++) {
        const item = items[i]
        const itemId = `item_${Date.now()}_${i}`
        const cleanItemNotes = item.notes ? String(item.notes).trim().slice(0, 200) : null
        await c.env.DB.prepare(`
          INSERT INTO order_items (
            id, order_id, product_id, product_name, price, quantity, subtotal, notes
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `).bind(
          itemId,
          orderId,
          item.product_id,
          String(item.product_name).slice(0, 100),
          item.price,
          item.quantity,
          item.subtotal,
          cleanItemNotes
        ).run()
      }

      // 3. Update shift sales
      if (shift_id) {
        if (payment_method === 'cash') {
          await c.env.DB.prepare(`
            UPDATE shifts SET total_cash_sales = total_cash_sales + ? WHERE id = ?
          `).bind(total_amount, shift_id).run()
        } else if (payment_method === 'qris') {
          await c.env.DB.prepare(`
            UPDATE shifts SET total_qris_sales = total_qris_sales + ? WHERE id = ?
          `).bind(total_amount, shift_id).run()
        } else if (payment_method === 'split') {
          const cashPart = Math.min(total_amount, Number(cash_tendered) || 0)
          const qrisPart = Math.max(0, total_amount - cashPart)
          await c.env.DB.prepare(`
            UPDATE shifts SET total_cash_sales = total_cash_sales + ?, total_qris_sales = total_qris_sales + ? WHERE id = ?
          `).bind(cashPart, qrisPart, shift_id).run()
        }
      }

      // 4. Auto-deduct raw materials based on recipes
      try {
        await ensureInventoryTables(c.env.DB)
        for (const it of items) {
          if (!it.product_id) continue
          const { results: recipes } = await c.env.DB.prepare(`
            SELECT pr.*, rm.name as material_name, rm.unit
            FROM product_recipes pr
            JOIN raw_materials rm ON pr.material_id = rm.id
            WHERE pr.product_id = ?
          `).bind(it.product_id).all()

          if (recipes && recipes.length > 0) {
            for (const r of (recipes as any[])) {
              const qtyToDeduct = Number(r.quantity_required || 0) * Number(it.quantity || 1)
              if (qtyToDeduct > 0) {
                await c.env.DB.prepare(`
                  UPDATE raw_materials
                  SET current_stock = MAX(0, current_stock - ?)
                  WHERE id = ?
                `).bind(qtyToDeduct, r.material_id).run()

                const moveId = `move_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`
                await c.env.DB.prepare(`
                  INSERT INTO stock_movements (id, material_id, type, quantity, notes, created_by_name, created_at)
                  VALUES (?, ?, 'out', ?, ?, ?, datetime('now', 'localtime'))
                `).bind(
                  moveId,
                  r.material_id,
                  qtyToDeduct,
                  `Otomatis Order #${order_number} (${it.product_name} x${it.quantity})`,
                  customer_name ? `Kasir (Pelanggan: ${customer_name})` : 'Kasir'
                ).run()
              }
            }
          }
        }
      } catch (recipeErr) {
        console.error('Failed to auto-deduct recipe materials:', recipeErr)
      }

      return c.json({
        success: true,
        order: {
          id: orderId,
          order_number,
          shift_id,
          cashier_id,
          customer_name,
          order_type,
          table_number,
          payment_method,
          total_amount,
          cash_tendered,
          change_amount,
          status,
          created_at: new Date().toISOString(),
          items
        }
      })
    } catch (err) {
      console.error('Failed to create order in DB:', err)
      return c.json({ success: false, error: String(err) }, 500)
    }
  }

  return c.json({
    success: true,
    order: {
      id: orderId,
      order_number,
      shift_id,
      cashier_id,
      customer_name,
      order_type,
      table_number,
      payment_method,
      total_amount,
      cash_tendered,
      change_amount,
      status,
      created_at: new Date().toISOString(),
      items
    }
  })
})

// Users (for cashier dropdown and login reference)
app.get('/api/users', async (c) => {
  const role = c.req.query('role')
  if (c.env?.DB) {
    let query: D1PreparedStatement
    if (role) {
      query = c.env.DB.prepare('SELECT id, username, name, role FROM users WHERE role = ? ORDER BY name ASC').bind(role)
    } else {
      query = c.env.DB.prepare("SELECT id, username, name, role FROM users ORDER BY CASE WHEN role = 'owner' THEN 2 ELSE 1 END, name ASC")
    }
    const { results } = await query.all()
    return c.json({ success: true, data: results })
  }
  // Fallback dev mock
  const mockUsers = [
    { id: 'usr_kasir1', username: 'kasir', name: 'Kasir Shift Pagi', role: 'cashier' },
    { id: 'usr_kasir2', username: 'kasir_sore', name: 'Kasir Shift Sore', role: 'cashier' },
    { id: 'usr_owner', username: 'owner', name: 'Owner', role: 'owner' }
  ]
  return c.json({ success: true, data: role ? mockUsers.filter(u => u.role === role) : mockUsers })
})

// Create New Cashier (Owner only)
app.post('/api/users', authMiddleware, requireOwner, async (c) => {
  const body = await c.req.json()
  let { username, name, pin, role = 'cashier' } = body
  if (!name || !pin) {
    return c.json({ success: false, message: 'Nama petugas dan PIN wajib diisi' }, 400)
  }
  const pinStr = String(pin).trim()
  if (pinStr.length !== 6 || !/^\d{6}$/.test(pinStr)) {
    return c.json({ success: false, message: 'PIN harus berupa 6-digit angka numerik' }, 400)
  }
  const cleanName = String(name).trim().slice(0, 100)
  if (!username || !username.trim()) {
    username = cleanName.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '').slice(0, 30)
  }
  const id = `usr_${Date.now()}`
  const hashedPin = await hashPin(pinStr)

  if (c.env?.DB) {
    try {
      await c.env.DB.prepare(`
        INSERT INTO users (id, username, pin, name, role)
        VALUES (?, ?, ?, ?, ?)
      `).bind(id, username.trim().toLowerCase(), hashedPin, name.trim(), role).run()

      return c.json({
        success: true,
        data: { id, username: username.trim().toLowerCase(), name: name.trim(), role }
      })
    } catch (err: any) {
      return c.json({ success: false, message: err?.message?.includes('UNIQUE') ? 'Username sudah digunakan' : 'Gagal menambah petugas' }, 400)
    }
  }
  return c.json({ success: true, data: { id, username: username.trim().toLowerCase(), name: name.trim(), role } })
})

// Update Cashier PIN (Owner only)
app.put('/api/users/:id/pin', authMiddleware, requireOwner, async (c) => {
  const id = c.req.param('id')
  const body = await c.req.json()
  const { pin } = body
  const pinStr = String(pin || '').trim()
  if (pinStr.length !== 6 || !/^\d{6}$/.test(pinStr)) {
    return c.json({ success: false, message: 'PIN harus berupa 6-digit angka' }, 400)
  }
  const hashedPin = await hashPin(pinStr)

  if (c.env?.DB) {
    try {
      await c.env.DB.prepare('UPDATE users SET pin = ? WHERE id = ?').bind(hashedPin, id).run()
      return c.json({ success: true, message: 'PIN berhasil diubah' })
    } catch (err: any) {
      return c.json({ success: false, message: err.message }, 500)
    }
  }
  return c.json({ success: true, message: 'PIN berhasil diubah (lokal)' })
})

// Delete Cashier (Owner only)
app.delete('/api/users/:id', authMiddleware, requireOwner, async (c) => {
  const id = c.req.param('id')
  if (c.env?.DB) {
    const user: any = await c.env.DB.prepare('SELECT role FROM users WHERE id = ?').bind(id).first()
    if (user?.role === 'owner') {
      return c.json({ success: false, message: 'Akun Owner tidak dapat dihapus' }, 403)
    }
    await c.env.DB.prepare('DELETE FROM users WHERE id = ?').bind(id).run()
    return c.json({ success: true })
  }
  return c.json({ success: true })
})

// Shifts
app.get('/api/shifts', async (c) => {
  if (c.env?.DB) {
    const { results: shifts } = await c.env.DB.prepare(`
      SELECT s.*, u.name as cashier_name,
        COALESCE((SELECT SUM(amount) FROM shift_expenses WHERE shift_id = s.id AND description NOT LIKE '[Kas Masuk]%'), 0) as total_expenses,
        COALESCE((SELECT SUM(amount) FROM shift_expenses WHERE shift_id = s.id AND description LIKE '[Kas Masuk]%'), 0) as total_incomes
      FROM shifts s
      JOIN users u ON s.cashier_id = u.id
      ORDER BY s.start_time DESC
    `).all()
    return c.json({ success: true, data: shifts })
  }
  return c.json({ success: true, data: [] })
})

// Current Active Shift
app.get('/api/shifts/current', async (c) => {
  if (c.env?.DB) {
    const shift: any = await c.env.DB.prepare(`
      SELECT s.*, u.name as cashier_name,
        COALESCE((SELECT SUM(amount) FROM shift_expenses WHERE shift_id = s.id AND description NOT LIKE '[Kas Masuk]%'), 0) as total_expenses,
        COALESCE((SELECT SUM(amount) FROM shift_expenses WHERE shift_id = s.id AND description LIKE '[Kas Masuk]%'), 0) as total_incomes
      FROM shifts s
      JOIN users u ON s.cashier_id = u.id
      WHERE s.status = 'open'
      ORDER BY s.start_time DESC
      LIMIT 1
    `).first()

    if (shift) {
      const { results: expenses } = await c.env.DB.prepare(`
        SELECT e.*, u.name as cashier_name
        FROM shift_expenses e
        LEFT JOIN users u ON e.cashier_id = u.id
        WHERE e.shift_id = ?
        ORDER BY e.created_at DESC
      `).bind(shift.id).all()
      shift.expenses = (expenses || []).map((exp: any) => ({
        ...exp,
        type: exp.description?.startsWith('[Kas Masuk]') ? 'income' : 'expense'
      }))
    }

    return c.json({ success: true, data: shift || null })
  }
  return c.json({ success: true, data: null })
})

// Get expenses for a shift
app.get('/api/shifts/:id/expenses', async (c) => {
  const shiftId = c.req.param('id')
  if (c.env?.DB) {
    const { results } = await c.env.DB.prepare(`
      SELECT e.*, u.name as cashier_name
      FROM shift_expenses e
      LEFT JOIN users u ON e.cashier_id = u.id
      WHERE e.shift_id = ?
      ORDER BY e.created_at DESC
    `).bind(shiftId).all()
    const mapped = (results || []).map((exp: any) => ({
      ...exp,
      type: exp.description?.startsWith('[Kas Masuk]') ? 'income' : 'expense'
    }))
    return c.json({ success: true, data: mapped })
  }
  return c.json({ success: true, data: [] })
})

// Add expense / income for a shift (Petty cash & Cash In - Cashier & Owner)
app.post('/api/shifts/:id/expenses', authMiddleware, async (c) => {
  const shiftId = c.req.param('id')
  const body = await c.req.json()
  const { cashier_id, amount, description, type } = body
  const id = `exp_${Date.now()}`
  const numAmount = Math.max(0, Number(amount) || 0)
  const isIncome = type === 'income' || description?.startsWith('[Kas Masuk]')
  const cleanDesc = description ? description.replace(/^\[(Kas Keluar|Kas Masuk)\]\s*/, '') : ''
  const formattedDesc = isIncome ? `[Kas Masuk] ${cleanDesc || 'Pemasukan Kas'}` : (cleanDesc || 'Pengeluaran Kas')

  if (c.env?.DB) {
    await c.env.DB.prepare(`
      INSERT INTO shift_expenses (id, shift_id, cashier_id, amount, description, created_at)
      VALUES (?, ?, ?, ?, ?, datetime('now', 'localtime'))
    `).bind(id, shiftId, cashier_id || null, numAmount, formattedDesc).run()

    const created: any = await c.env.DB.prepare('SELECT * FROM shift_expenses WHERE id = ?').bind(id).first()
    if (created) {
      created.type = isIncome ? 'income' : 'expense'
    }
    return c.json({ success: true, data: created })
  }
  return c.json({
    success: true,
    data: {
      id,
      shift_id: shiftId,
      cashier_id,
      amount: numAmount,
      description: formattedDesc,
      type: isIncome ? 'income' : 'expense',
      created_at: new Date().toISOString()
    }
  })
})

// Create Shift (Manual — by Owner Only)
app.post('/api/shifts', authMiddleware, requireOwner, async (c) => {
  try {
    const body = await c.req.json()
    const {
      cashier_id, cashier_name, start_time, end_time,
      initial_cash, total_cash_sales, total_qris_sales,
      actual_cash_counted, status, notes
    } = body

    if (!c.env?.DB) {
      return c.json({
        success: true,
        data: {
          id: `shift_${Date.now()}`,
          cashier_name: cashier_name || 'Kasir',
          cashier_id: cashier_id || null,
          start_time: start_time || new Date().toISOString().replace('T', ' ').substring(0, 19),
          end_time: end_time || null,
          initial_cash: Number(initial_cash) || 0,
          total_cash_sales: Number(total_cash_sales) || 0,
          total_qris_sales: Number(total_qris_sales) || 0,
          actual_cash_counted: actual_cash_counted !== null && actual_cash_counted !== undefined ? Number(actual_cash_counted) : null,
          status: status || 'closed',
          notes: notes || null
        }
      })
    }

    const newId = `shift_${Date.now()}`
    await c.env.DB.prepare(`
      INSERT INTO shifts (id, cashier_id, start_time, end_time, initial_cash, total_cash_sales, total_qris_sales, actual_cash_counted, status, notes)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      newId,
      cashier_id || 'usr_kasir1',
      start_time || new Date().toISOString().replace('T', ' ').substring(0, 19),
      end_time || null,
      Number(initial_cash) || 0,
      Number(total_cash_sales) || 0,
      Number(total_qris_sales) || 0,
      actual_cash_counted !== null && actual_cash_counted !== undefined ? Number(actual_cash_counted) : null,
      status || 'closed',
      notes || null
    ).run()

    const created = await c.env.DB.prepare(`
      SELECT s.*, u.name as cashier_name
      FROM shifts s
      LEFT JOIN users u ON s.cashier_id = u.id
      WHERE s.id = ?
    `).bind(newId).first()
    return c.json({ success: true, data: created })
  } catch (err: any) {
    return c.json({ success: false, message: err.message }, 500)
  }
})

// Update Shift (Owner edit only)
app.put('/api/shifts/:id', authMiddleware, requireOwner, async (c) => {
  try {
    const shiftId = c.req.param('id')
    const body = await c.req.json()
    const {
      cashier_id, start_time, end_time,
      initial_cash, total_cash_sales, total_qris_sales,
      actual_cash_counted, status, notes
    } = body

    if (!c.env?.DB) {
      return c.json({ success: true, data: { id: shiftId, ...body } })
    }

    await c.env.DB.prepare(`
      UPDATE shifts
      SET cashier_id = COALESCE(?, cashier_id),
          start_time = COALESCE(?, start_time),
          end_time = ?,
          initial_cash = COALESCE(?, initial_cash),
          total_cash_sales = COALESCE(?, total_cash_sales),
          total_qris_sales = COALESCE(?, total_qris_sales),
          actual_cash_counted = ?,
          status = COALESCE(?, status),
          notes = ?
      WHERE id = ?
    `).bind(
      cashier_id || null,
      start_time || null,
      end_time || null,
      initial_cash !== undefined ? Number(initial_cash) : null,
      total_cash_sales !== undefined ? Number(total_cash_sales) : null,
      total_qris_sales !== undefined ? Number(total_qris_sales) : null,
      actual_cash_counted !== null && actual_cash_counted !== undefined ? Number(actual_cash_counted) : null,
      status || null,
      notes !== undefined ? notes : null,
      shiftId
    ).run()

    const updated = await c.env.DB.prepare(`
      SELECT s.*, u.name as cashier_name
      FROM shifts s
      LEFT JOIN users u ON s.cashier_id = u.id
      WHERE s.id = ?
    `).bind(shiftId).first()
    return c.json({ success: true, data: updated })
  } catch (err: any) {
    return c.json({ success: false, message: err.message }, 500)
  }
})

// Delete Shift (Owner only)
app.delete('/api/shifts/:id', authMiddleware, requireOwner, async (c) => {
  try {
    const shiftId = c.req.param('id')
    if (c.env?.DB) {
      await c.env.DB.prepare('DELETE FROM shifts WHERE id = ?').bind(shiftId).run()
    }
    return c.json({ success: true })
  } catch (err: any) {
    return c.json({ success: false, message: err.message }, 500)
  }
})

// Start Shift Baru (Cashier & Owner)
app.post('/api/shifts/start', authMiddleware, async (c) => {
  try {
    const body = await c.req.json()
    const { cashier_id, initial_cash, notes } = body
    const initialCashVal = Number(initial_cash) || 0

    if (!c.env?.DB) {
      const mockShift = {
        id: `shift_${Date.now()}`,
        cashier_id: cashier_id || 'usr_kasir1',
        cashier_name: 'Kasir Shift',
        start_time: new Date().toISOString().replace('T', ' ').substring(0, 19),
        end_time: null,
        initial_cash: initialCashVal,
        total_cash_sales: 0,
        total_qris_sales: 0,
        actual_cash_counted: null,
        status: 'open',
        notes: notes || null
      }
      return c.json({ success: true, data: mockShift })
    }

    // Pastikan shift open sebelumnya untuk kasir ditutup terlebih dahulu
    await c.env.DB.prepare(`
      UPDATE shifts 
      SET status = 'closed', end_time = datetime('now', 'localtime')
      WHERE status = 'open'
    `).run()

    const newId = `shift_${Date.now()}`
    await c.env.DB.prepare(`
      INSERT INTO shifts (id, cashier_id, start_time, initial_cash, total_cash_sales, total_qris_sales, status, notes)
      VALUES (?, ?, datetime('now', 'localtime'), ?, 0, 0, 'open', ?)
    `).bind(newId, cashier_id || 'usr_kasir1', initialCashVal, notes || null).run()

    const createdShift = await c.env.DB.prepare(`
      SELECT s.*, u.name as cashier_name
      FROM shifts s
      JOIN users u ON s.cashier_id = u.id
      WHERE s.id = ?
    `).bind(newId).first()

    return c.json({ success: true, data: createdShift })
  } catch (err: any) {
    return c.json({ success: false, message: err.message }, 500)
  }
})

// Akhiri Shift (Close Shift - Cashier & Owner)
app.post('/api/shifts/:id/close', authMiddleware, async (c) => {
  try {
    const shiftId = c.req.param('id')
    const body = await c.req.json()
    const { actual_cash_counted, notes } = body
    const actualCashVal = Number(actual_cash_counted) || 0

    if (!c.env?.DB) {
      return c.json({
        success: true,
        data: {
          id: shiftId,
          end_time: new Date().toISOString().replace('T', ' ').substring(0, 19),
          actual_cash_counted: actualCashVal,
          status: 'closed',
          notes: notes || null
        }
      })
    }

    await c.env.DB.prepare(`
      UPDATE shifts
      SET status = 'closed',
          end_time = datetime('now', 'localtime'),
          actual_cash_counted = ?,
          notes = COALESCE(?, notes)
      WHERE id = ?
    `).bind(actualCashVal, notes || null, shiftId).run()

    const closedShift: any = await c.env.DB.prepare(`
      SELECT s.*, u.name as cashier_name,
        COALESCE((SELECT SUM(amount) FROM shift_expenses WHERE shift_id = s.id AND description NOT LIKE '[Kas Masuk]%'), 0) as total_expenses,
        COALESCE((SELECT SUM(amount) FROM shift_expenses WHERE shift_id = s.id AND description LIKE '[Kas Masuk]%'), 0) as total_incomes
      FROM shifts s
      JOIN users u ON s.cashier_id = u.id
      WHERE s.id = ?
    `).bind(shiftId).first()

    if (closedShift) {
      const { results: expenses } = await c.env.DB.prepare(`
        SELECT e.*, u.name as cashier_name
        FROM shift_expenses e
        LEFT JOIN users u ON e.cashier_id = u.id
        WHERE e.shift_id = ?
        ORDER BY e.created_at DESC
      `).bind(shiftId).all()
      closedShift.expenses = (expenses || []).map((exp: any) => ({
        ...exp,
        type: exp.description?.startsWith('[Kas Masuk]') ? 'income' : 'expense'
      }))
    }

    return c.json({ success: true, data: closedShift })
  } catch (err: any) {
    return c.json({ success: false, message: err.message }, 500)
  }
})

// Dashboard Stats Overview
app.get('/api/dashboard/stats', async (c) => {
  if (c.env?.DB) {
    // 1. Order stats today
    const stats: any = await c.env.DB.prepare(`
      SELECT 
        COALESCE(SUM(total_amount), 0) as total_revenue,
        COUNT(id) as total_transactions,
        COALESCE(SUM(CASE WHEN payment_method = 'cash' THEN total_amount ELSE 0 END), 0) as total_cash,
        COALESCE(SUM(CASE WHEN payment_method = 'qris' THEN total_amount ELSE 0 END), 0) as total_qris
      FROM orders
      WHERE status = 'completed' AND date(created_at) = date('now', 'localtime')
    `).first()

    // 2. Active Shift
    const activeShift: any = await c.env.DB.prepare(`
      SELECT s.*, u.name as cashier_name,
        COALESCE((SELECT SUM(amount) FROM shift_expenses WHERE shift_id = s.id AND description NOT LIKE '[Kas Masuk]%'), 0) as total_expenses,
        COALESCE((SELECT SUM(amount) FROM shift_expenses WHERE shift_id = s.id AND description LIKE '[Kas Masuk]%'), 0) as total_incomes
      FROM shifts s
      JOIN users u ON s.cashier_id = u.id
      WHERE s.status = 'open'
      LIMIT 1
    `).first()

    if (activeShift) {
      const { results: expenses } = await c.env.DB.prepare(`
        SELECT e.*, u.name as cashier_name
        FROM shift_expenses e
        LEFT JOIN users u ON e.cashier_id = u.id
        WHERE e.shift_id = ?
        ORDER BY e.created_at DESC
      `).bind(activeShift.id).all()
      activeShift.expenses = (expenses || []).map((exp: any) => ({
        ...exp,
        type: exp.description?.startsWith('[Kas Masuk]') ? 'income' : 'expense'
      }))
    }

    // 3. Top products / Best sellers
    const { results: bestSellers } = await c.env.DB.prepare(`
      SELECT 
        oi.product_id,
        oi.product_name as name,
        SUM(oi.quantity) as sales_count,
        SUM(oi.subtotal) as total_revenue,
        p.category_id,
        c.name as category_name,
        p.price,
        p.cost_price,
        p.is_available,
        p.is_favorite
      FROM order_items oi
      JOIN products p ON oi.product_id = p.id
      JOIN categories c ON p.category_id = c.id
      JOIN orders o ON oi.order_id = o.id
      WHERE o.status = 'completed'
      GROUP BY oi.product_id
      ORDER BY sales_count DESC
      LIMIT 5
    `).all()

    // 4. Weekly Sales trend (last 7 days)
    const { results: rawWeekly } = await c.env.DB.prepare(`
      SELECT 
        date(created_at) as date,
        COUNT(id) as transactions,
        COALESCE(SUM(total_amount), 0) as revenue,
        COALESCE(SUM(CASE WHEN payment_method = 'cash' THEN total_amount ELSE 0 END), 0) as cash_amount,
        COALESCE(SUM(CASE WHEN payment_method = 'qris' THEN total_amount ELSE 0 END), 0) as qris_amount
      FROM orders
      WHERE status = 'completed'
      GROUP BY date(created_at)
      ORDER BY date ASC
      LIMIT 14
    `).all()

    const dayNames = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab']
    const last7Days: any[] = []
    for (let i = 6; i >= 0; i--) {
      const d = new Date()
      d.setDate(d.getDate() - i)
      const dateStr = d.toISOString().split('T')[0]
      const dayName = dayNames[d.getDay()]
      const found: any = rawWeekly.find((r: any) => r.date === dateStr)
      last7Days.push({
        date: dateStr,
        day_name: dayName,
        revenue: found ? Number(found.revenue) : 0,
        transactions: found ? Number(found.transactions) : 0,
        cash_amount: found ? Number(found.cash_amount) : 0,
        qris_amount: found ? Number(found.qris_amount) : 0
      })
    }

    return c.json({
      success: true,
      data: {
        revenueToday: stats?.total_revenue || 0,
        transactionsToday: stats?.total_transactions || 0,
        cashAmount: stats?.total_cash || 0,
        qrisAmount: stats?.total_qris || 0,
        estimatedProfit: Math.round((stats?.total_revenue || 0) * 0.51),
        currentShift: activeShift || null,
        bestSellers: bestSellers || [],
        weeklySales: last7Days
      }
    })
  }

  return c.json({ success: false, message: 'D1 database not connected' }, 500)
})

// Monthly Financial & Sales Report Endpoint
app.get('/api/reports/monthly', async (c) => {
  const now = new Date()
  const yearQuery = Number(c.req.query('year')) || now.getFullYear()
  const monthQuery = Number(c.req.query('month')) || (now.getMonth() + 1)
  const paddedMonth = String(monthQuery).padStart(2, '0')
  const yearStr = String(yearQuery)
  const monthYearKey = `${yearStr}-${paddedMonth}`

  const monthNamesId = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
  ]
  const monthName = `${monthNamesId[monthQuery - 1] || 'Bulan'} ${yearStr}`
  const daysInMonth = new Date(yearQuery, monthQuery, 0).getDate()
  const dayNamesId = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab']

  if (c.env?.DB) {
    try {
      // 1. Get all completed orders in this month
      const { results: orders } = await c.env.DB.prepare(`
        SELECT id, order_number, total_amount, payment_method, 
               cash_tendered, notes, created_at
        FROM orders
        WHERE status = 'completed' AND strftime('%Y-%m', created_at) = ?
        ORDER BY created_at ASC
      `).bind(monthYearKey).all()

      // Calculate accurate HPP (cost) from order_items & product cost_price
      const { results: orderCosts } = await c.env.DB.prepare(`
        SELECT oi.order_id, SUM(oi.quantity * COALESCE(p.cost_price, 0)) as cost
        FROM order_items oi
        JOIN products p ON oi.product_id = p.id
        JOIN orders o ON oi.order_id = o.id
        WHERE o.status = 'completed' AND strftime('%Y-%m', o.created_at) = ?
        GROUP BY oi.order_id
      `).bind(monthYearKey).all()

      const costMap = new Map<string, number>()
      for (const oc of ((orderCosts || []) as any[])) {
        costMap.set(oc.order_id, Number(oc.cost) || 0)
      }

      // 2. Get all shift expenses in this month
      const { results: expenses } = await c.env.DB.prepare(`
        SELECT id, amount, description, created_at
        FROM shift_expenses
        WHERE strftime('%Y-%m', created_at) = ?
        ORDER BY created_at ASC
      `).bind(monthYearKey).all()

      // 3. Top selling products in this month
      const { results: topProducts } = await c.env.DB.prepare(`
        SELECT 
          oi.product_id as id,
          oi.product_name as name,
          COALESCE(c.name, 'Menu') as category_name,
          SUM(oi.quantity) as quantity,
          SUM(oi.subtotal) as revenue
        FROM order_items oi
        JOIN orders o ON oi.order_id = o.id
        LEFT JOIN products p ON oi.product_id = p.id
        LEFT JOIN categories c ON p.category_id = c.id
        WHERE o.status = 'completed' AND strftime('%Y-%m', o.created_at) = ?
        GROUP BY oi.product_id
        ORDER BY quantity DESC
        LIMIT 10
      `).bind(monthYearKey).all()

      // Calculate totals
      let totalRevenue = 0
      let totalTransactions = (orders || []).length
      let totalCash = 0
      let totalQris = 0
      let totalCost = 0
      let totalExpenses = 0

      // Map daily breakdown
      const dailyMap: Record<number, { transactions: number; cash: number; qris: number; revenue: number; cost: number; expenses: number }> = {}
      for (let d = 1; d <= daysInMonth; d++) {
        dailyMap[d] = { transactions: 0, cash: 0, qris: 0, revenue: 0, cost: 0, expenses: 0 }
      }

      for (const ord of ((orders || []) as any[])) {
        const dObj = new Date(ord.created_at)
        const dayNum = dObj.getDate()
        const amount = Number(ord.total_amount) || 0
        const cost = costMap.get(ord.id) ?? Math.round(amount * 0.49)
        totalRevenue += amount
        totalCost += cost

        let cashPart = 0
        let qrisPart = 0
        if (ord.payment_method === 'cash') {
          cashPart = amount
        } else if (ord.payment_method === 'qris') {
          qrisPart = amount
        } else if (ord.payment_method === 'split') {
          cashPart = Math.min(amount, Number(ord.cash_tendered) || 0)
          qrisPart = Math.max(0, amount - cashPart)
        }
        totalCash += cashPart
        totalQris += qrisPart

        if (dailyMap[dayNum]) {
          dailyMap[dayNum].transactions += 1
          dailyMap[dayNum].revenue += amount
          dailyMap[dayNum].cost += cost
          dailyMap[dayNum].cash += cashPart
          dailyMap[dayNum].qris += qrisPart
        }
      }

      for (const exp of ((expenses || []) as any[])) {
        const dObj = new Date(exp.created_at)
        const dayNum = dObj.getDate()
        const expAmount = Number(exp.amount) || 0
        totalExpenses += expAmount
        if (dailyMap[dayNum]) {
          dailyMap[dayNum].expenses += expAmount
        }
      }

      const grossProfit = totalRevenue - totalCost
      const netProfit = grossProfit - totalExpenses

      const dailyBreakdown = []
      for (let d = 1; d <= daysInMonth; d++) {
        const dateStr = `${yearStr}-${paddedMonth}-${String(d).padStart(2, '0')}`
        const dateObj = new Date(yearQuery, monthQuery - 1, d)
        const dayName = dayNamesId[dateObj.getDay()]
        const dData = dailyMap[d]
        const dNet = (dData.revenue - dData.cost) - dData.expenses

        dailyBreakdown.push({
          date: dateStr,
          day: d,
          dayName,
          transactions: dData.transactions,
          cash: dData.cash,
          qris: dData.qris,
          revenue: dData.revenue,
          expenses: dData.expenses,
          cost: dData.cost,
          netProfit: dNet
        })
      }

      return c.json({
        success: true,
        data: {
          year: yearQuery,
          month: monthQuery,
          monthName,
          totalRevenue,
          totalTransactions,
          totalCash,
          totalQris,
          totalExpenses,
          totalCost,
          grossProfit,
          netProfit,
          dailyBreakdown,
          topProducts: topProducts || []
        }
      })
    } catch (err: any) {
      console.error('Error generating monthly report from D1:', err)
    }
  }

  // Fallback if D1 is not connected: Return structured mock month data
  const mockDailyBreakdown = []
  let mockRevenue = 0
  let mockCash = 0
  let mockQris = 0
  let mockExpenses = 150000
  let mockTx = 0

  for (let d = 1; d <= daysInMonth; d++) {
    const dateObj = new Date(yearQuery, monthQuery - 1, d)
    const dayName = dayNamesId[dateObj.getDay()]
    const isPast = dateObj <= now
    const dayTx = isPast ? Math.floor(15 + ((d * 7) % 25)) : 0
    const dayRev = isPast ? Math.round(dayTx * (18000 + ((d * 300) % 7000))) : 0
    const dayCash = Math.round(dayRev * 0.45)
    const dayQris = dayRev - dayCash
    const dayExp = isPast && d % 5 === 0 ? 45000 : 0
    const dayCost = Math.round(dayRev * 0.48)
    const dayProfit = (dayRev - dayCost) - dayExp

    if (isPast) {
      mockRevenue += dayRev
      mockCash += dayCash
      mockQris += dayQris
      mockExpenses += dayExp
      mockTx += dayTx
    }

    mockDailyBreakdown.push({
      date: `${yearStr}-${paddedMonth}-${String(d).padStart(2, '0')}`,
      day: d,
      dayName,
      transactions: dayTx,
      cash: dayCash,
      qris: dayQris,
      revenue: dayRev,
      expenses: dayExp,
      cost: dayCost,
      netProfit: dayProfit
    })
  }

  const mockCost = Math.round(mockRevenue * 0.48)
  const mockGross = mockRevenue - mockCost
  const mockNet = mockGross - mockExpenses

  return c.json({
    success: true,
    data: {
      year: yearQuery,
      month: monthQuery,
      monthName,
      totalRevenue: mockRevenue,
      totalTransactions: mockTx,
      totalCash: mockCash,
      totalQris: mockQris,
      totalExpenses: mockExpenses,
      totalCost: mockCost,
      grossProfit: mockGross,
      netProfit: mockNet,
      dailyBreakdown: mockDailyBreakdown,
      topProducts: [
        { id: 'p1', name: 'Kopi Susu Gula Aren Sudut Temu', category_name: 'Signature Coffee', quantity: 245, revenue: 4410000 },
        { id: 'p2', name: 'Mie Instan Goreng Dok Dok', category_name: 'Makanan Berat', quantity: 180, revenue: 2700000 },
        { id: 'p3', name: 'Roti Bakar Coklat Keju', category_name: 'Camilan', quantity: 125, revenue: 1875000 },
        { id: 'p4', name: 'Es Teh Manis Jumbo', category_name: 'Non Kopi', quantity: 310, revenue: 1860000 },
        { id: 'p5', name: 'Kopi Tubruk Robusta Dampit', category_name: 'Manual Brew', quantity: 95, revenue: 950000 }
      ]
    }
  })
})

// Settings: Receipt Configuration
app.get('/api/settings/receipt', async (c) => {
  if (c.env?.DB) {
    try {
      const row: any = await c.env.DB.prepare('SELECT value FROM store_settings WHERE key = ?').bind('receipt_config').first()
      if (row && row.value) {
        return c.json({ success: true, config: JSON.parse(row.value) })
      }
    } catch (err: any) {
      console.error('Error fetching receipt settings:', err)
    }
  }
  return c.json({ success: true, config: null })
})

app.post('/api/settings/receipt', authMiddleware, requireOwner, async (c) => {
  const body = await c.req.json()
  const { config } = body
  if (!config) {
    return c.json({ success: false, message: 'Config data is required' }, 400)
  }

  if (c.env?.DB) {
    try {
      await c.env.DB.prepare(`
        INSERT INTO store_settings (key, value, updated_at) 
        VALUES ('receipt_config', ?, CURRENT_TIMESTAMP)
        ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = CURRENT_TIMESTAMP
      `).bind(JSON.stringify(config)).run()
      return c.json({ success: true, message: 'Pengaturan struk berhasil disimpan' })
    } catch (err: any) {
      console.error('Error saving receipt settings:', err)
      return c.json({ success: false, message: 'Gagal menyimpan ke database: ' + err?.message }, 500)
    }
  }

  return c.json({ success: true, message: 'Disimpan secara lokal (D1 offline)' })
})

// ==========================================
// INVENTORY & BAHAN BAKU APIS
// ==========================================

const DEFAULT_RAW_MATERIALS = [
  { id: 'raw_kopi_robusta', name: 'Biji / Bubuk Kopi Robusta', category: 'Kopi & Minuman', current_stock: 12.5, unit: 'kg', min_stock_alert: 3, cost_per_unit: 85000, supplier: 'Pengepul Kopi Temanggung' },
  { id: 'raw_susu_skm', name: 'Susu Kental Manis (Carnation/Omela)', category: 'Kopi & Minuman', current_stock: 24, unit: 'kaleng', min_stock_alert: 6, cost_per_unit: 12500, supplier: 'Toko Sembako Berkah' },
  { id: 'raw_gas_3kg', name: 'Gas LPG 3kg Melon', category: 'Gas & Operasional', current_stock: 2, unit: 'tabung', min_stock_alert: 2, cost_per_unit: 22000, supplier: 'Pangkalan Gas Barokah' },
  { id: 'raw_es_kristal', name: 'Es Batu Kristal', category: 'Kopi & Minuman', current_stock: 4, unit: 'karung (10kg)', min_stock_alert: 2, cost_per_unit: 12000, supplier: 'Depot Es Kristal Polar' },
  { id: 'raw_air_galon', name: 'Air Galon Aqua / Le Minerale', category: 'Kopi & Minuman', current_stock: 5, unit: 'galon', min_stock_alert: 3, cost_per_unit: 19000, supplier: 'Agen Galon Subur' },
  { id: 'raw_gula_pasir', name: 'Gula Pasir Kristal Putih', category: 'Kopi & Minuman', current_stock: 15, unit: 'kg', min_stock_alert: 4, cost_per_unit: 17500, supplier: 'Grosir Beras & Gula' },
  { id: 'raw_indomie_goreng', name: 'Indomie Goreng Original', category: 'Bahan Makanan', current_stock: 65, unit: 'bungkus', min_stock_alert: 20, cost_per_unit: 2900, supplier: 'Distributor Mie Instan' },
  { id: 'raw_indomie_kuah', name: 'Indomie Kuah (Kari / Soto)', category: 'Bahan Makanan', current_stock: 40, unit: 'bungkus', min_stock_alert: 15, cost_per_unit: 2900, supplier: 'Distributor Mie Instan' },
  { id: 'raw_telur_ayam', name: 'Telur Ayam Segar', category: 'Bahan Makanan', current_stock: 75, unit: 'butir', min_stock_alert: 20, cost_per_unit: 1800, supplier: 'Agen Telur Podomoro' },
  { id: 'raw_teh_celup', name: 'Teh Celup / Tubruk (Tong Tji / Sariwangi)', category: 'Kopi & Minuman', current_stock: 8, unit: 'box', min_stock_alert: 2, cost_per_unit: 9500, supplier: 'Toko Sembako Berkah' },
  { id: 'raw_cup_takeaway', name: 'Cup Plastik & Tutup Sablon SUTE', category: 'Kemasan', current_stock: 180, unit: 'pcs', min_stock_alert: 50, cost_per_unit: 650, supplier: 'Pabrik Kemasan Plastik' },
  { id: 'raw_kantong_kresek', name: 'Kantong Kresek Bening & Sedotan', category: 'Kemasan', current_stock: 12, unit: 'pak', min_stock_alert: 3, cost_per_unit: 7000, supplier: 'Toko Plastik Makmur' }
]

// Helper: Ensure Inventory Tables Exist in SQLite D1
async function ensureInventoryTables(db: any) {
  try {
    await db.prepare(`
      CREATE TABLE IF NOT EXISTS raw_materials (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        category TEXT NOT NULL,
        current_stock REAL NOT NULL DEFAULT 0,
        unit TEXT NOT NULL,
        min_stock_alert REAL NOT NULL DEFAULT 5,
        cost_per_unit INTEGER NOT NULL DEFAULT 0,
        supplier TEXT,
        last_restocked_at DATETIME,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
    `).run()

    await db.prepare(`
      CREATE TABLE IF NOT EXISTS stock_movements (
        id TEXT PRIMARY KEY,
        material_id TEXT NOT NULL,
        type TEXT NOT NULL CHECK(type IN ('in', 'out', 'waste', 'adjustment')),
        quantity REAL NOT NULL,
        notes TEXT,
        created_by_name TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
    `).run()

    // Check if empty, seed default raw materials
    const countRow: any = await db.prepare('SELECT COUNT(id) as count FROM raw_materials').first()
    if (countRow && countRow.count === 0) {
      for (const item of DEFAULT_RAW_MATERIALS) {
        await db.prepare(`
          INSERT INTO raw_materials (id, name, category, current_stock, unit, min_stock_alert, cost_per_unit, supplier, last_restocked_at, created_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, datetime('now', 'localtime'), datetime('now', 'localtime'))
        `).bind(
          item.id,
          item.name,
          item.category,
          item.current_stock,
          item.unit,
          item.min_stock_alert,
          item.cost_per_unit,
          item.supplier
        ).run()
      }
    }

    // Ensure product_recipes table exists
    await db.prepare(`
      CREATE TABLE IF NOT EXISTS product_recipes (
        id TEXT PRIMARY KEY,
        product_id TEXT NOT NULL,
        material_id TEXT NOT NULL,
        quantity_required REAL NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(product_id, material_id)
      );
    `).run()

    const recCountRow: any = await db.prepare('SELECT COUNT(id) as count FROM product_recipes').first()
    if (recCountRow && recCountRow.count === 0) {
      const defaultRecipes = [
        { id: 'rec_1', product_id: 'prod_1', material_id: 'raw_kopi_robusta', quantity_required: 0.015 },
        { id: 'rec_2_a', product_id: 'prod_2', material_id: 'raw_kopi_robusta', quantity_required: 0.015 },
        { id: 'rec_2_b', product_id: 'prod_2', material_id: 'raw_susu_skm', quantity_required: 0.1 },
        { id: 'rec_4_a', product_id: 'prod_4', material_id: 'raw_teh_celup', quantity_required: 0.05 },
        { id: 'rec_4_b', product_id: 'prod_4', material_id: 'raw_gula_pasir', quantity_required: 0.02 },
        { id: 'rec_7_a', product_id: 'prod_7', material_id: 'raw_indomie_goreng', quantity_required: 1 },
        { id: 'rec_7_b', product_id: 'prod_7', material_id: 'raw_telur_ayam', quantity_required: 1 },
        { id: 'rec_8_a', product_id: 'prod_8', material_id: 'raw_indomie_kuah', quantity_required: 1 },
        { id: 'rec_8_b', product_id: 'prod_8', material_id: 'raw_telur_ayam', quantity_required: 1 }
      ]
      for (const rec of defaultRecipes) {
        await db.prepare(`
          INSERT OR IGNORE INTO product_recipes (id, product_id, material_id, quantity_required)
          VALUES (?, ?, ?, ?)
        `).bind(rec.id, rec.product_id, rec.material_id, rec.quantity_required).run()
      }
    }
  } catch (err: any) {
    console.error('Error ensuring inventory tables:', err)
  }
}

// GET /api/inventory - List all raw materials (mask cost for cashier)
app.get('/api/inventory', async (c) => {
  const role = c.req.header('x-user-role') || c.req.query('role') || 'cashier'
  const isOwner = role === 'owner'

  if (c.env?.DB) {
    await ensureInventoryTables(c.env.DB)
    const { results } = await c.env.DB.prepare(`
      SELECT * FROM raw_materials ORDER BY category ASC, name ASC
    `).all()

    const sanitized = (results || []).map((m: any) => {
      if (!isOwner) {
        // Strip cost info for cashier
        const { cost_per_unit, ...rest } = m
        return { ...rest, cost_per_unit: 0 }
      }
      return m
    })

    const totalAssetValuation = isOwner
      ? (results || []).reduce((acc: number, item: any) => acc + (Number(item.current_stock) * Number(item.cost_per_unit || 0)), 0)
      : 0

    return c.json({
      success: true,
      data: sanitized,
      totalAssetValuation
    })
  }

  // Local fallback
  const sanitized = DEFAULT_RAW_MATERIALS.map((m) => {
    if (!isOwner) {
      const { cost_per_unit, ...rest } = m
      return { ...rest, cost_per_unit: 0 }
    }
    return m
  })
  const totalAssetValuation = isOwner
    ? DEFAULT_RAW_MATERIALS.reduce((acc, item) => acc + (item.current_stock * item.cost_per_unit), 0)
    : 0

  return c.json({ success: true, data: sanitized, totalAssetValuation })
})

// POST /api/inventory - Add new raw material (Owner only)
app.post('/api/inventory', authMiddleware, requireOwner, async (c) => {
  const body = await c.req.json()
  const { name, category, current_stock, unit, min_stock_alert, cost_per_unit, supplier } = body
  const id = `raw_${Date.now()}`
  const initialStock = Number(current_stock) || 0
  const cost = Number(cost_per_unit) || 0
  const minAlert = Number(min_stock_alert) || 3

  if (c.env?.DB) {
    await ensureInventoryTables(c.env.DB)
    await c.env.DB.prepare(`
      INSERT INTO raw_materials (id, name, category, current_stock, unit, min_stock_alert, cost_per_unit, supplier, last_restocked_at, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, datetime('now', 'localtime'), datetime('now', 'localtime'))
    `).bind(
      id,
      name.trim(),
      category || 'Kopi & Minuman',
      initialStock,
      unit.trim() || 'pcs',
      minAlert,
      cost,
      supplier ? supplier.trim() : null
    ).run()

    const created = await c.env.DB.prepare('SELECT * FROM raw_materials WHERE id = ?').bind(id).first()
    return c.json({ success: true, data: created })
  }

  return c.json({
    success: true,
    data: { id, name, category, current_stock: initialStock, unit, min_stock_alert: minAlert, cost_per_unit: cost, supplier }
  })
})

// PUT /api/inventory/:id - Update raw material details (Owner Only)
app.put('/api/inventory/:id', authMiddleware, requireOwner, async (c) => {
  const id = c.req.param('id')
  const body = await c.req.json()
  const { name, category, current_stock, unit, min_stock_alert, cost_per_unit, supplier } = body

  if (c.env?.DB) {
    await ensureInventoryTables(c.env.DB)
    await c.env.DB.prepare(`
      UPDATE raw_materials
      SET name = COALESCE(?, name),
          category = COALESCE(?, category),
          current_stock = COALESCE(?, current_stock),
          unit = COALESCE(?, unit),
          min_stock_alert = COALESCE(?, min_stock_alert),
          cost_per_unit = COALESCE(?, cost_per_unit),
          supplier = ?
      WHERE id = ?
    `).bind(
      name ? name.trim() : null,
      category || null,
      current_stock !== undefined ? Number(current_stock) : null,
      unit ? unit.trim() : null,
      min_stock_alert !== undefined ? Number(min_stock_alert) : null,
      cost_per_unit !== undefined ? Number(cost_per_unit) : null,
      supplier !== undefined ? supplier : null,
      id
    ).run()

    const updated = await c.env.DB.prepare('SELECT * FROM raw_materials WHERE id = ?').bind(id).first()
    return c.json({ success: true, data: updated })
  }

  return c.json({ success: true, data: { id, ...body } })
})

// DELETE /api/inventory/:id - Delete raw material (Owner Only)
app.delete('/api/inventory/:id', authMiddleware, requireOwner, async (c) => {
  const id = c.req.param('id')
  if (c.env?.DB) {
    await ensureInventoryTables(c.env.DB)
    await c.env.DB.prepare('DELETE FROM raw_materials WHERE id = ?').bind(id).run()
    await c.env.DB.prepare('DELETE FROM stock_movements WHERE material_id = ?').bind(id).run()
    await c.env.DB.prepare('DELETE FROM product_recipes WHERE material_id = ?').bind(id).run().catch(() => null)
  }
  return c.json({ success: true, message: 'Bahan baku berhasil dihapus' })
})

// POST /api/inventory/movement - Record stock in/out/waste/opname (Cashier & Owner)
app.post('/api/inventory/movement', authMiddleware, async (c) => {
  const body = await c.req.json()
  const { material_id, type, quantity, notes, created_by_name } = body
  const qty = Number(quantity) || 0
  const moveId = `mov_${Date.now()}`

  if (c.env?.DB) {
    await ensureInventoryTables(c.env.DB)

    // 1. Get current stock
    const material: any = await c.env.DB.prepare('SELECT * FROM raw_materials WHERE id = ?').bind(material_id).first()
    if (!material) {
      return c.json({ success: false, message: 'Bahan baku tidak ditemukan' }, 404)
    }

    let newStock = Number(material.current_stock)
    if (type === 'in') {
      newStock += qty
    } else if (type === 'out' || type === 'waste') {
      newStock = Math.max(0, newStock - qty)
    } else if (type === 'adjustment') {
      newStock = Math.max(0, qty) // set directly to physical count
    }

    // 2. Update material
    await c.env.DB.prepare(`
      UPDATE raw_materials
      SET current_stock = ?,
          last_restocked_at = CASE WHEN ? = 'in' THEN datetime('now', 'localtime') ELSE last_restocked_at END
      WHERE id = ?
    `).bind(newStock, type, material_id).run()

    // 3. Insert movement log
    await c.env.DB.prepare(`
      INSERT INTO stock_movements (id, material_id, type, quantity, notes, created_by_name, created_at)
      VALUES (?, ?, ?, ?, ?, ?, datetime('now', 'localtime'))
    `).bind(
      moveId,
      material_id,
      type,
      qty,
      notes || null,
      created_by_name || 'Petugas'
    ).run()

    const updatedMaterial = await c.env.DB.prepare('SELECT * FROM raw_materials WHERE id = ?').bind(material_id).first()

    return c.json({
      success: true,
      data: {
        movement: { id: moveId, material_id, type, quantity: qty, notes, created_by_name, created_at: new Date().toISOString() },
        material: updatedMaterial
      }
    })
  }

  return c.json({
    success: true,
    data: {
      movement: { id: moveId, material_id, type, quantity: qty, notes, created_by_name, created_at: new Date().toISOString() },
      material: { id: material_id, current_stock: qty }
    }
  })
})

// GET /api/inventory/movements - List recent stock movements
app.get('/api/inventory/movements', async (c) => {
  if (c.env?.DB) {
    await ensureInventoryTables(c.env.DB)
    const { results } = await c.env.DB.prepare(`
      SELECT sm.*, rm.name as material_name, rm.unit
      FROM stock_movements sm
      JOIN raw_materials rm ON sm.material_id = rm.id
      ORDER BY sm.created_at DESC
      LIMIT 100
    `).all()
    return c.json({ success: true, data: results || [] })
  }
  return c.json({ success: true, data: [] })
})

// Fallback to static assets for single-page application (Cloudflare Workers Assets)
app.all('*', async (c) => {
  if (c.env?.ASSETS) {
    const res = await c.env.ASSETS.fetch(c.req.raw)
    // If route doesn't match a static file (e.g. /shift, /orders, /menu) and isn't an API route, serve index.html
    if (res.status === 404 && !c.req.path.startsWith('/api')) {
      const indexReq = new Request(new URL('/', c.req.url).toString(), c.req.raw)
      return c.env.ASSETS.fetch(indexReq)
    }
    return res
  }
  return c.notFound()
})

export default app
