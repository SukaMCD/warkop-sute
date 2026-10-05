/**
 * Offline Order Queue & Auto-Sync Engine for Warkop Sudut Temu POS
 * Guarantees no lost orders when internet/Wi-Fi is down.
 */

import { getToken } from './api'

export const OFFLINE_QUEUE_KEY = 'sute_offline_order_queue_v1'

export interface QueuedOrder {
  queued_at: string
  attempts: number
  last_error?: string
  payload: {
    order_number: string
    shift_id?: string
    cashier_id: string
    customer_name: string
    order_type: string
    table_number?: string
    payment_method: string
    total_amount: number
    cash_tendered?: number
    change_amount?: number
    status?: string
    notes?: string
    items: Array<{
      product_id: string
      product_name: string
      price: number
      quantity: number
      subtotal: number
      notes?: string
    }>
  }
}

type QueueListener = (count: number) => void
const listeners: Set<QueueListener> = new Set()

export function subscribeToQueue(listener: QueueListener): () => void {
  listeners.add(listener)
  // Initial fire
  try {
    listener(getPendingCount())
  } catch {}
  return () => {
    listeners.delete(listener)
  }
}

function notifyListeners(): void {
  const count = getPendingCount()
  listeners.forEach(fn => {
    try {
      fn(count)
    } catch (err) {
      console.error('Queue listener error:', err)
    }
  })
}

export function getPendingOrders(): QueuedOrder[] {
  try {
    const raw = localStorage.getItem(OFFLINE_QUEUE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

export function getPendingCount(): number {
  return getPendingOrders().length
}

export function saveOrderToQueue(orderPayload: QueuedOrder['payload']): void {
  try {
    const orders = getPendingOrders()
    // Avoid exact duplicate in queue
    const exists = orders.some(o => o.payload.order_number === orderPayload.order_number)
    if (!exists) {
      orders.push({
        queued_at: new Date().toISOString(),
        attempts: 0,
        payload: orderPayload
      })
      localStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(orders))
      notifyListeners()
    }
  } catch (err) {
    console.error('[OfflineQueue] Failed to save order to localStorage queue:', err)
  }
}

export function removeOrderFromQueue(orderNumber: string): void {
  try {
    const orders = getPendingOrders().filter(o => o.payload.order_number !== orderNumber)
    localStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(orders))
    notifyListeners()
  } catch (err) {
    console.error('[OfflineQueue] Failed to remove order from queue:', err)
  }
}

let isSyncing = false

export async function syncPendingOrders(
  customToken?: string,
  onProgress?: (synced: number, total: number) => void
): Promise<{ success: boolean; syncedCount: number; errors: any[] }> {
  if (isSyncing) {
    return { success: false, syncedCount: 0, errors: ['Sinkronisasi sedang berlangsung'] }
  }

  const queue = getPendingOrders()
  if (queue.length === 0) {
    return { success: true, syncedCount: 0, errors: [] }
  }

  isSyncing = true
  const token = customToken || getToken()
  const headers: Record<string, string> = {
    'Content-Type': 'application/json'
  }
  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }

  let syncedCount = 0
  const errors: any[] = []

  try {
    for (let i = 0; i < queue.length; i++) {
      const item = queue[i]
      try {
        const res = await fetch('/api/orders', {
          method: 'POST',
          headers,
          body: JSON.stringify(item.payload)
        })

        if (res.ok) {
          removeOrderFromQueue(item.payload.order_number)
          syncedCount++
          if (onProgress) onProgress(syncedCount, queue.length)
        } else {
          const errData: any = await res.json().catch(() => null)
          // If server reports order already exists (idempotency), it's safe to remove from queue
          if (errData?.is_duplicate || errData?.message?.includes('sudah tersimpan')) {
            removeOrderFromQueue(item.payload.order_number)
            syncedCount++
            if (onProgress) onProgress(syncedCount, queue.length)
          } else {
            errors.push({ order: item.payload.order_number, error: errData?.message || res.statusText })
          }
        }
      } catch (networkErr: any) {
        errors.push({ order: item.payload.order_number, error: networkErr?.message || 'Network error' })
        // If network error occurred, stop trying next orders to save bandwidth
        break
      }
    }
  } finally {
    isSyncing = false
    notifyListeners()
  }

  return {
    success: errors.length === 0,
    syncedCount,
    errors
  }
}
