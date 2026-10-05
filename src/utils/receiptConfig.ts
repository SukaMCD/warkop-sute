import type { ReceiptConfig } from '../types'
import { apiFetch } from './api'

export const DEFAULT_RECEIPT_CONFIG: ReceiptConfig = {
  storeName: 'WARKOP SUDUT TEMU',
  tagline: 'Kopi, Cerita, & Sudut Temu',
  address: 'Jln. Raya Ciawi Gebang No 2, Kuningan',
  phone: '0812-3456-7890',
  socialMedia: '@warkopsuduttemu',
  footerMessage: 'Terima Kasih Atas Kunjungannya!',
  footerSubmessage: 'Ditunggu cangkruk berikutnya!',
  wifiName: 'Warkop Sudut Temu',
  wifiPassword: 'kopienak2026',
  paperWidth: '58mm',
  showStoreName: true,
  showTagline: true,
  showAddress: true,
  showPhone: true,
  showSocialMedia: true,
  showCashierName: true,
  showCustomerName: true,
  showTableNumber: true,
  showOrderType: true,
  showItemNotes: true,
  showWifiInfo: true,
  showFooterMessage: true,
  customNotice: 'Barang yang sudah dibeli tidak dapat ditukar',
  showCustomNotice: false
}

const STORAGE_KEY = 'sute_receipt_config'

export const loadReceiptConfig = async (): Promise<ReceiptConfig> => {
  let cached: ReceiptConfig = DEFAULT_RECEIPT_CONFIG
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      cached = { ...DEFAULT_RECEIPT_CONFIG, ...JSON.parse(raw) }
    }
  } catch {}

  try {
    const res = await apiFetch('/api/settings/receipt')
    if (res.ok) {
      const data: any = await res.json()
      if (data && data.success && data.config) {
        const merged = { ...DEFAULT_RECEIPT_CONFIG, ...data.config }
        try {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(merged))
        } catch {}
        return merged
      }
    }
  } catch {
    // API network error or dev fallback
  }

  return cached
}

export const saveReceiptConfig = async (config: ReceiptConfig): Promise<boolean> => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(config))
  } catch {}

  try {
    const res = await apiFetch('/api/settings/receipt', {
      method: 'POST',
      body: JSON.stringify({ config })
    })
    return res.ok
  } catch {
    return true // local fallback persisted
  }
}
