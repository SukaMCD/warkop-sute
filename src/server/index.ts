import { Hono } from 'hono'
import { cors } from 'hono/cors'

type Bindings = {
  DB: D1Database
  ASSETS?: Fetcher
}

const app = new Hono<{ Bindings: Bindings }>()

app.use('*', cors())

// Health check
app.get('/api/health', (c) => {
  return c.json({ status: 'ok', name: 'Warkop Sudut Temu POS API', timestamp: new Date().toISOString() })
})

// Authentication route
app.post('/api/auth/login', async (c) => {
  const body = await c.req.json()
  const { pin, username } = body

  if (c.env?.DB && pin) {
    const pinStr = String(pin).trim()
    try {
      const query = username
        ? c.env.DB.prepare('SELECT id, username, name, role FROM users WHERE username = ? AND pin = ?').bind(username, pinStr)
        : c.env.DB.prepare('SELECT id, username, name, role FROM users WHERE pin = ?').bind(pinStr)
      
      const user = await query.first()
      if (user) {
        return c.json({ success: true, user })
      }
    } catch (err) {
      console.error('Database login error:', err)
    }
  }

  // Fallback dev mock auth
  const pinStr = String(pin || '').trim()
  if (pinStr === '0258' || pinStr === '9999' || pinStr === '123456' || username === 'owner') {
    return c.json({
      success: true,
      user: { id: 'usr_owner', username: 'owner', name: 'Owner', role: 'owner' }
    })
  } else if (pinStr === '1234' || username === 'kasir') {
    return c.json({
      success: true,
      user: { id: 'usr_kasir1', username: 'kasir', name: 'Kasir Shift Pagi', role: 'cashier' }
    })
  } else if (pinStr === '5678' || username === 'kasir_sore') {
    return c.json({
      success: true,
      user: { id: 'usr_kasir2', username: 'kasir_sore', name: 'Kasir Shift Sore', role: 'cashier' }
    })
  } else if (pinStr === '9876' || username === 'kasir_malam') {
    return c.json({
      success: true,
      user: { id: 'usr_kasir3', username: 'kasir_malam', name: 'Kasir Shift Malam', role: 'cashier' }
    })
  }

  return c.json({ success: false, message: 'PIN tidak valid' }, 401)
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

// Create new product
app.post('/api/products', async (c) => {
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

// Update existing product
app.put('/api/products/:id', async (c) => {
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

// Delete product
app.delete('/api/products/:id', async (c) => {
  const id = c.req.param('id')
  if (c.env?.DB) {
    await c.env.DB.prepare('DELETE FROM products WHERE id = ?').bind(id).run()
    return c.json({ success: true, message: 'Deleted' })
  }
  return c.json({ success: true, message: 'Deleted' })
})

// Orders & Order Items
app.get('/api/orders', async (c) => {
  if (c.env?.DB) {
    const { results: orders } = await c.env.DB.prepare(`
      SELECT o.*, u.name as cashier_name
      FROM orders o
      JOIN users u ON o.cashier_id = u.id
      ORDER BY o.created_at DESC
      LIMIT 50
    `).all()

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

// Create New Order
app.post('/api/orders', async (c) => {
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
      // 1. Insert order
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
        customer_name || 'Pelanggan',
        order_type || 'dine_in',
        table_number || null,
        payment_method,
        total_amount,
        cash_tendered || total_amount,
        change_amount || 0,
        status,
        notes || null
      ).run()

      // 2. Insert order items
      for (let i = 0; i < items.length; i++) {
        const item = items[i]
        const itemId = `item_${Date.now()}_${i}`
        await c.env.DB.prepare(`
          INSERT INTO order_items (
            id, order_id, product_id, product_name, price, quantity, subtotal, notes
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `).bind(
          itemId,
          orderId,
          item.product_id,
          item.product_name,
          item.price,
          item.quantity,
          item.subtotal,
          item.notes || null
        ).run()
      }

      // 3. Update shift sales
      if (shift_id) {
        if (payment_method === 'cash') {
          await c.env.DB.prepare(`
            UPDATE shifts SET total_cash_sales = total_cash_sales + ? WHERE id = ?
          `).bind(total_amount, shift_id).run()
        } else {
          await c.env.DB.prepare(`
            UPDATE shifts SET total_qris_sales = total_qris_sales + ? WHERE id = ?
          `).bind(total_amount, shift_id).run()
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

// Users (for cashier dropdown in owner shift management)
app.get('/api/users', async (c) => {
  const role = c.req.query('role')
  if (c.env?.DB) {
    let query: D1PreparedStatement
    if (role) {
      query = c.env.DB.prepare('SELECT id, username, name, role FROM users WHERE role = ? ORDER BY name ASC').bind(role)
    } else {
      query = c.env.DB.prepare('SELECT id, username, name, role FROM users ORDER BY name ASC')
    }
    const { results } = await query.all()
    return c.json({ success: true, data: results })
  }
  // Fallback dev mock
  const mockUsers = [
    { id: 'usr_kasir1', username: 'kasir', name: 'Kasir Shift Pagi', role: 'cashier' },
    { id: 'usr_kasir2', username: 'kasir_sore', name: 'Kasir Shift Sore', role: 'cashier' },
    { id: 'usr_kasir3', username: 'kasir_malam', name: 'Kasir Shift Malam', role: 'cashier' }
  ]
  return c.json({ success: true, data: role ? mockUsers.filter(u => u.role === role) : mockUsers })
})

// Shifts
app.get('/api/shifts', async (c) => {
  if (c.env?.DB) {
    const { results: shifts } = await c.env.DB.prepare(`
      SELECT s.*, u.name as cashier_name
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
    const shift = await c.env.DB.prepare(`
      SELECT s.*, u.name as cashier_name
      FROM shifts s
      JOIN users u ON s.cashier_id = u.id
      WHERE s.status = 'open'
      ORDER BY s.start_time DESC
      LIMIT 1
    `).first()

    return c.json({ success: true, data: shift || null })
  }
  return c.json({ success: true, data: null })
})

// Create Shift (Manual — by Owner)
app.post('/api/shifts', async (c) => {
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

// Update Shift (Owner edit)
app.put('/api/shifts/:id', async (c) => {
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

// Delete Shift (Owner)
app.delete('/api/shifts/:id', async (c) => {
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

// Start Shift Baru
app.post('/api/shifts/start', async (c) => {
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

// Akhiri Shift (Close Shift)
app.post('/api/shifts/:id/close', async (c) => {
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

    const closedShift = await c.env.DB.prepare(`
      SELECT s.*, u.name as cashier_name
      FROM shifts s
      JOIN users u ON s.cashier_id = u.id
      WHERE s.id = ?
    `).bind(shiftId).first()

    return c.json({ success: true, data: closedShift })
  } catch (err: any) {
    return c.json({ success: false, message: err.message }, 500)
  }
})

// Dashboard Stats Overview
app.get('/api/dashboard/stats', async (c) => {
  if (c.env?.DB) {
    // 1. Order stats
    const stats: any = await c.env.DB.prepare(`
      SELECT 
        COALESCE(SUM(total_amount), 0) as total_revenue,
        COUNT(id) as total_transactions,
        COALESCE(SUM(CASE WHEN payment_method = 'cash' THEN total_amount ELSE 0 END), 0) as total_cash,
        COALESCE(SUM(CASE WHEN payment_method = 'qris' THEN total_amount ELSE 0 END), 0) as total_qris
      FROM orders
      WHERE status = 'completed'
    `).first()

    // 2. Active Shift
    const activeShift = await c.env.DB.prepare(`
      SELECT s.*, u.name as cashier_name
      FROM shifts s
      JOIN users u ON s.cashier_id = u.id
      WHERE s.status = 'open'
      LIMIT 1
    `).first()

    // 3. Top products / Best sellers
    const { results: bestSellers } = await c.env.DB.prepare(`
      SELECT 
        oi.product_id,
        oi.product_name,
        SUM(oi.quantity) as sales_count,
        SUM(oi.subtotal) as total_revenue,
        p.category_id,
        c.name as category_name,
        p.price,
        p.cost_price
      FROM order_items oi
      JOIN products p ON oi.product_id = p.id
      JOIN categories c ON p.category_id = c.id
      GROUP BY oi.product_id
      ORDER BY sales_count DESC
      LIMIT 5
    `).all()

    return c.json({
      success: true,
      data: {
        revenueToday: stats?.total_revenue || 0,
        transactionsToday: stats?.total_transactions || 0,
        cashAmount: stats?.total_cash || 0,
        qrisAmount: stats?.total_qris || 0,
        estimatedProfit: Math.round((stats?.total_revenue || 0) * 0.51),
        currentShift: activeShift,
        bestSellers: bestSellers || []
      }
    })
  }

  return c.json({ success: false, message: 'D1 database not connected' }, 500)
})

export default app
