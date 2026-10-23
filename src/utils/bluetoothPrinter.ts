import type { Order, ReceiptConfig } from '../types'
import { Capacitor, registerPlugin } from '@capacitor/core'

// Extended Navigator interface for Web Bluetooth
declare global {
  interface Navigator {
    bluetooth?: {
      requestDevice(options: {
        filters?: Array<{ name?: string; namePrefix?: string; services?: Array<string | number> }>
        optionalServices?: Array<string | number>
        acceptAllDevices?: boolean
      }): Promise<any>
    }
  }
}

// Native Capacitor Bluetooth Plugin Bridge
const NativePrinter = registerPlugin<any>('NativeBluetoothPrinter')

// Known GATT service UUIDs for BLE thermal printers
const PRINTER_SERVICES = [
  '000018f0-0000-1000-8000-00805f9b34fb', // Standard POS thermal printer
  '0000ffe0-0000-1000-8000-00805f9b34fb', // Standard BLE Serial / CC2540 / HC-05
  '0000e0ff-0000-1000-8000-00805f9b34fb', // Common Chinese mini thermal printers
  '0000ff00-0000-1000-8000-00805f9b34fb', // Custom thermal ESC/POS
  '49535343-fe7d-4ae5-8fa9-9fafd205e455', // ISSC transparent UART service
  'e7810a71-73ae-499d-8c15-faa9aef0c3f2',
  0x18f0,
  0xffe0,
  0xe0ff,
  0xff00
]

const STORAGE_KEY_BT_NAME = 'sute_bt_printer_name'
const STORAGE_KEY_BT_ADDR = 'sute_bt_printer_address'

let activeDevice: any = null
let activeCharacteristic: any = null
let nativeConnectedName: string = ''
let nativeConnectedAddress: string = ''
let connectionListeners: Array<(connected: boolean, deviceName: string) => void> = []

export const isNativePlatform = (): boolean => {
  try {
    return Capacitor.isNativePlatform()
  } catch {
    return false
  }
}

export const isWebBluetoothSupported = (): boolean => {
  if (isNativePlatform()) return true
  return typeof navigator !== 'undefined' && 'bluetooth' in navigator && !!navigator.bluetooth
}

export const getSavedPrinterName = (): string => {
  try {
    return localStorage.getItem(STORAGE_KEY_BT_NAME) || ''
  } catch {
    return ''
  }
}

export const getSavedPrinterAddress = (): string => {
  try {
    return localStorage.getItem(STORAGE_KEY_BT_ADDR) || ''
  } catch {
    return ''
  }
}

export const isBluetoothConnected = (): boolean => {
  if (isNativePlatform()) {
    return !!(nativeConnectedName && nativeConnectedAddress)
  }
  return !!(activeDevice && activeDevice.gatt && activeDevice.gatt.connected && activeCharacteristic)
}

export const openBluetoothPrinterModal = () => {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('open-bluetooth-printer-modal'))
  }
}

export const syncNativeBluetoothStatus = async (): Promise<boolean> => {
  if (!isNativePlatform()) return isBluetoothConnected()
  try {
    const res = await NativePrinter.isConnected()
    if (res && res.connected) {
      nativeConnectedName = res.name || getSavedPrinterName() || 'Printer Thermal'
      nativeConnectedAddress = res.address || getSavedPrinterAddress()
      notifyListeners()
      return true
    } else {
      nativeConnectedName = ''
      nativeConnectedAddress = ''
      notifyListeners()
      return false
    }
  } catch {
    return false
  }
}

export const addBluetoothListener = (callback: (connected: boolean, deviceName: string) => void) => {
  connectionListeners.push(callback)
  const currentName = isNativePlatform() ? (nativeConnectedName || getSavedPrinterName()) : (activeDevice?.name || getSavedPrinterName())
  callback(isBluetoothConnected(), currentName)
  
  // Trigger async sync in native background
  if (isNativePlatform()) {
    syncNativeBluetoothStatus()
  }

  return () => {
    connectionListeners = connectionListeners.filter(cb => cb !== callback)
  }
}

const notifyListeners = () => {
  const connected = isBluetoothConnected()
  const name = isNativePlatform() ? (nativeConnectedName || getSavedPrinterName()) : (activeDevice?.name || getSavedPrinterName())
  connectionListeners.forEach(cb => {
    try {
      cb(connected, name)
    } catch {}
  })
}

/**
 * Get list of paired Bluetooth devices (Khusus Native APK Android)
 */
export async function getNativePairedDevices(): Promise<Array<{ name: string; address: string }>> {
  if (!isNativePlatform()) return []
  try {
    const res = await NativePrinter.getPairedDevices()
    return res?.devices || []
  } catch (err: any) {
    console.warn('[Bluetooth] getNativePairedDevices error:', err)
    throw err
  }
}

/**
 * Connect to Bluetooth Thermal Printer (Native APK Android or Web Bluetooth)
 */
export async function connectBluetoothPrinter(targetAddress?: string): Promise<{
  success: boolean
  deviceName?: string
  error?: string
  needsSelection?: boolean
  devices?: Array<{ name: string; address: string }>
}> {
  if (isNativePlatform()) {
    try {
      let addrToConnect = targetAddress || getSavedPrinterAddress()
      if (!addrToConnect) {
        let paired: Array<{ name: string; address: string }> = []
        try {
          paired = await getNativePairedDevices()
        } catch (fetchErr: any) {
          return {
            success: false,
            error: fetchErr?.message || 'Gagal mengambil daftar Bluetooth HP. Pastikan Bluetooth aktif dan izin diberikan.'
          }
        }

        if (paired.length === 0) {
          return {
            success: false,
            needsSelection: true,
            devices: [],
            error: 'Belum ada printer Bluetooth yang dipasangkan (paired) di HP. Silakan buka Pengaturan Bluetooth HP Anda, cari & pasangkan printer Iware C-58BT (PIN: 0000 atau 1234).'
          }
        }
        if (paired.length === 1) {
          addrToConnect = paired[0].address
        } else {
          const match = paired.find(p => /pos|printer|iware|rpp|thermal|mpt|bluetooth/i.test(p.name))
          if (match) {
            addrToConnect = match.address
          } else {
            return {
              success: false,
              needsSelection: true,
              devices: paired,
              error: 'Pilih printer yang ingin dihubungkan.'
            }
          }
        }
      }

      const res = await NativePrinter.connect({ address: addrToConnect })
      if (res && res.success) {
        nativeConnectedName = res.name || 'Printer Thermal'
        nativeConnectedAddress = addrToConnect
        try {
          localStorage.setItem(STORAGE_KEY_BT_NAME, nativeConnectedName)
          localStorage.setItem(STORAGE_KEY_BT_ADDR, nativeConnectedAddress)
        } catch {}
        notifyListeners()
        return { success: true, deviceName: nativeConnectedName }
      }
      return { success: false, error: 'Gagal menyambungkan ke printer.' }
    } catch (e: any) {
      return { success: false, error: e?.message || 'Gagal koneksi Bluetooth Android.' }
    }
  }

  if (!isWebBluetoothSupported()) {
    return {
      success: false,
      error: 'Browser ini belum mendukung Web Bluetooth. Gunakan Google Chrome versi terbaru.'
    }
  }

  try {
    const device = await navigator.bluetooth!.requestDevice({
      acceptAllDevices: true,
      optionalServices: PRINTER_SERVICES
    })

    if (!device) {
      return { success: false, error: 'Tidak ada printer yang dipilih.' }
    }

    device.addEventListener('gattserverdisconnected', () => {
      activeCharacteristic = null
      notifyListeners()
    })

    const server = await device.gatt.connect()
    
    // Find writable characteristic across discovered services
    let writeChar: any = null
    const services = await server.getPrimaryServices()

    for (const service of services) {
      try {
        const characteristics = await service.getCharacteristics()
        for (const char of characteristics) {
          if (char.properties.write || char.properties.writeWithoutResponse) {
            writeChar = char
            break
          }
        }
        if (writeChar) break
      } catch {
        // Continue searching other services
      }
    }

    if (!writeChar) {
      return {
        success: false,
        error: 'Printer terhubung tapi tidak ditemukan jalur cetak (write characteristic) yang kompatibel.'
      }
    }

    activeDevice = device
    activeCharacteristic = writeChar
    const name = device.name || 'Printer Thermal Bluetooth'

    try {
      localStorage.setItem(STORAGE_KEY_BT_NAME, name)
    } catch {}

    notifyListeners()
    return { success: true, deviceName: name }
  } catch (err: any) {
    if (err.name === 'NotFoundError' || err.message?.includes('User cancelled')) {
      return { success: false, error: 'Pencarian perangkat dibatalkan.' }
    }
    return { success: false, error: err.message || 'Gagal menyambungkan ke printer.' }
  }
}

/**
 * Disconnect current Bluetooth printer
 */
export async function disconnectBluetoothPrinter(): Promise<void> {
  if (isNativePlatform()) {
    try {
      await NativePrinter.disconnect()
    } catch {}
    nativeConnectedName = ''
    nativeConnectedAddress = ''
    try {
      localStorage.removeItem(STORAGE_KEY_BT_ADDR)
    } catch {}
    notifyListeners()
    return
  }

  if (activeDevice && activeDevice.gatt && activeDevice.gatt.connected) {
    try {
      activeDevice.gatt.disconnect()
    } catch {}
  }
  activeDevice = null
  activeCharacteristic = null
  try {
    localStorage.removeItem(STORAGE_KEY_BT_NAME)
  } catch {}
  notifyListeners()
}

/**
 * Send binary ESC/POS data to connected Bluetooth Printer
 */
export async function printDirectBluetooth(bytes: Uint8Array): Promise<{ success: boolean; error?: string }> {
  if (isNativePlatform()) {
    if (!isBluetoothConnected()) {
      const savedAddr = getSavedPrinterAddress()
      if (savedAddr) {
        await connectBluetoothPrinter(savedAddr)
      } else {
        const auto = await connectBluetoothPrinter()
        if (!auto.success) {
          return { success: false, error: auto.error || 'Printer Bluetooth belum terhubung.' }
        }
      }
    }

    try {
      let binary = ''
      const len = bytes.byteLength
      for (let i = 0; i < len; i++) {
        binary += String.fromCharCode(bytes[i])
      }
      const base64 = btoa(binary)
      const res = await NativePrinter.print({ data: base64 })
      if (res && res.success) {
        return { success: true }
      }
      return { success: false, error: 'Gagal mencetak struk lewat Bluetooth Android.' }
    } catch (err: any) {
      return { success: false, error: err.message || 'Gagal mengirim data cetak ke printer.' }
    }
  }

  if (!isBluetoothConnected()) {
    // Try reconnecting if device object is still available
    if (activeDevice && activeDevice.gatt) {
      try {
        const server = await activeDevice.gatt.connect()
        const services = await server.getPrimaryServices()
        for (const service of services) {
          try {
            const characteristics = await service.getCharacteristics()
            for (const char of characteristics) {
              if (char.properties.write || char.properties.writeWithoutResponse) {
                activeCharacteristic = char
                break
              }
            }
            if (activeCharacteristic) break
          } catch {}
        }
      } catch {}
    }
  }

  if (!isBluetoothConnected()) {
    return {
      success: false,
      error: 'Printer Bluetooth belum terhubung. Silakan sambungkan printer terlebih dahulu.'
    }
  }

  try {
    const CHUNK_SIZE = 100 // Safe chunk size for mini thermal printer buffers
    for (let i = 0; i < bytes.length; i += CHUNK_SIZE) {
      const chunk = bytes.slice(i, i + CHUNK_SIZE)
      if (activeCharacteristic.properties.writeWithoutResponse) {
        await activeCharacteristic.writeValueWithoutResponse(chunk)
      } else {
        await activeCharacteristic.writeValue(chunk)
      }
      // Small pause to prevent buffer overflow on low-memory thermal MCUs
      await new Promise(r => setTimeout(r, 25))
    }
    return { success: true }
  } catch (err: any) {
    return {
      success: false,
      error: err.message || 'Gagal mengirim data cetak ke printer.'
    }
  }
}

/**
 * Direct print using RawBT URL scheme (Android 1-click fallback)
 */
export function printViaRawBt(bytes: Uint8Array) {
  let binary = ''
  const len = bytes.byteLength
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i])
  }
  const base64 = btoa(binary)
  window.location.href = 'rawbt:data:application/octet-stream;base64,' + base64
}

// ==========================================
// ESC/POS Command Builder
// ==========================================

export class EscPosBuilder {
  private buffer: number[] = []

  constructor() {
    this.init()
  }

  init(): this {
    // ESC @ (Initialize printer)
    this.buffer.push(0x1b, 0x40)
    return this
  }

  align(align: 'left' | 'center' | 'right'): this {
    // ESC a n
    const code = align === 'center' ? 0x01 : align === 'right' ? 0x02 : 0x00
    this.buffer.push(0x1b, 0x61, code)
    return this
  }

  bold(enable: boolean): this {
    // ESC E n
    this.buffer.push(0x1b, 0x45, enable ? 0x01 : 0x00)
    return this
  }

  size(widthMultiplier: 1 | 2 = 1, heightMultiplier: 1 | 2 = 1): this {
    // GS ! n (Character size)
    const w = widthMultiplier === 2 ? 0x10 : 0x00
    const h = heightMultiplier === 2 ? 0x01 : 0x00
    this.buffer.push(0x1d, 0x21, w | h)
    return this
  }

  text(str: string): this {
    for (let i = 0; i < str.length; i++) {
      const code = str.charCodeAt(i)
      if (code < 128) {
        this.buffer.push(code)
      } else {
        // Safe mapping for common non-ASCII characters
        this.buffer.push(0x20)
      }
    }
    return this
  }

  wrappedLines(text: string, maxCols: number): string[] {
    if (!text) return []
    const words = text.split(/\s+/)
    const lines: string[] = []
    let currentLine = ''

    for (const word of words) {
      if (!word) continue
      if (!currentLine) {
        if (word.length <= maxCols) {
          currentLine = word
        } else {
          for (let i = 0; i < word.length; i += maxCols) {
            lines.push(word.slice(i, i + maxCols))
          }
        }
      } else if (currentLine.length + 1 + word.length <= maxCols) {
        currentLine += ' ' + word
      } else {
        lines.push(currentLine)
        if (word.length <= maxCols) {
          currentLine = word
        } else {
          for (let i = 0; i < word.length; i += maxCols) {
            lines.push(word.slice(i, i + maxCols))
          }
          currentLine = ''
        }
      }
    }
    if (currentLine) {
      lines.push(currentLine)
    }
    return lines
  }

  printWrapped(text: string, maxCols: number): this {
    const lines = this.wrappedLines(text, maxCols)
    for (const l of lines) {
      this.line(l)
    }
    return this
  }

  line(str: string = ''): this {
    if (str) this.text(str)
    this.buffer.push(0x0a) // LF
    return this
  }

  row(left: string, right: string, maxCols: number): this {
    const leftLen = left.length
    const rightLen = right.length
    if (leftLen + rightLen <= maxCols) {
      const spaces = maxCols - leftLen - rightLen
      this.line(left + ' '.repeat(spaces) + right)
    } else {
      // Split into two lines if too long
      this.line(left)
      const spaces = Math.max(0, maxCols - rightLen)
      this.line(' '.repeat(spaces) + right)
    }
    return this
  }

  divider(char: string = '-', maxCols: number): this {
    this.line(char.repeat(maxCols))
    return this
  }

  feed(lines: number = 2): this {
    for (let i = 0; i < lines; i++) {
      this.buffer.push(0x0a)
    }
    return this
  }

  cut(): this {
    // Feed 3 lines then partial cut (GS V 66 0)
    this.feed(3)
    this.buffer.push(0x1d, 0x56, 0x42, 0x00)
    return this
  }

  getBytes(): Uint8Array {
    return new Uint8Array(this.buffer)
  }
}

// ==========================================
// High-Level ESC/POS Formatters
// ==========================================

export function buildReceiptEscPos(
  order: Order,
  config: ReceiptConfig,
  cashierName?: string
): Uint8Array {
  const maxCols = config.paperWidth === '80mm' ? 48 : 32
  const builder = new EscPosBuilder()

  // 1. HEADER (Store Info)
  builder.align('center')
  if (config.showStoreName !== false) {
    const storeName = config.storeName || 'WARKOP SUDUT TEMU'
    // Ukuran font pintar untuk nama toko:
    // Di printer 58mm (max 32 karakter per baris), mode double-width (size 2,2) hanya memuat 16 karakter.
    // "WARKOP SUDUT TEMU" = 17 karakter, sehingga huruf 'U' terlempar ke baris baru jika dipaksa double-width.
    // Gunakan size(1, 2) (Double Height / tinggi 2x, tebal) agar pas 1 baris utuh dan tetap berukuran besar.
    if (maxCols <= 32) {
      if (storeName.length <= 16) {
        builder.bold(true).size(2, 2)
      } else {
        builder.bold(true).size(1, 2)
      }
    } else {
      if (storeName.length <= 24) {
        builder.bold(true).size(2, 2)
      } else {
        builder.bold(true).size(1, 2)
      }
    }
    builder.line(storeName)
    builder.bold(false).size(1, 1)
  }

  if (config.showTagline && config.tagline) {
    builder.printWrapped(config.tagline, maxCols)
  }

  if (config.showAddress !== false && config.address) {
    builder.printWrapped(config.address, maxCols)
  }

  const hasPhone = config.showPhone !== false && !!config.phone
  const hasSocmed = config.showSocialMedia && !!config.socialMedia
  if (hasPhone && hasSocmed) {
    const combined = `Telp: ${config.phone} | IG: ${config.socialMedia}`
    if (combined.length <= maxCols) {
      builder.line(combined)
    } else {
      builder.line(`Telp: ${config.phone}`)
      builder.line(`IG: ${config.socialMedia}`)
    }
  } else {
    if (hasPhone) builder.line(`Telp: ${config.phone}`)
    if (hasSocmed) builder.line(`IG: ${config.socialMedia}`)
  }

  builder.divider('-', maxCols)

  // 2. ORDER META
  builder.align('left')
  builder.row('No: ' + order.order_number, new Date(order.created_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) + ' WIB', maxCols)

  const activeCashier = (cashierName || order.cashier_name || 'Kasir').trim()
  const cashierLabel = activeCashier.toLowerCase().startsWith('kasir')
    ? activeCashier
    : 'Kasir: ' + activeCashier
  const orderTypeStr = order.order_type === 'dine_in' ? 'Di Tempat' : 'Bungkus'
  builder.row(cashierLabel, orderTypeStr, maxCols)

  if (config.showCustomerName && order.customer_name && order.customer_name !== 'Pelanggan') {
    builder.row('Pelanggan:', order.customer_name, maxCols)
  }

  if (config.showTableNumber !== false && order.table_number) {
    builder.row('Meja:', order.table_number, maxCols)
  }

  builder.divider('-', maxCols)

  // 3. ORDER ITEMS
  order.items.forEach(item => {
    const itemTotalStr = 'Rp ' + item.subtotal.toLocaleString('id-ID')
    builder.bold(true)
    builder.row(item.product_name, itemTotalStr, maxCols)
    builder.bold(false)

    const qtyPriceStr = `  ${item.quantity}x @ Rp ${item.price.toLocaleString('id-ID')}`
    if (config.showItemNotes !== false && item.notes) {
      builder.row(qtyPriceStr, `(${item.notes})`, maxCols)
    } else {
      builder.line(qtyPriceStr)
    }
  })

  builder.divider('-', maxCols)

  // 4. TOTALS
  if (order.discount_amount && order.discount_amount > 0) {
    const subtotal = order.total_amount + order.discount_amount
    builder.row('Subtotal', 'Rp ' + subtotal.toLocaleString('id-ID'), maxCols)
    const discLabel = 'Diskon' + (order.discount_reason ? ` (${order.discount_reason})` : '')
    builder.row(discLabel, '-Rp ' + order.discount_amount.toLocaleString('id-ID'), maxCols)
  }

  builder.bold(true).size(1, 2)
  builder.row('TOTAL', 'Rp ' + order.total_amount.toLocaleString('id-ID'), maxCols)
  builder.bold(false).size(1, 1)

  if (order.payment_method === 'split') {
    builder.row('Bayar Tunai', 'Rp ' + (order.cash_tendered || 0).toLocaleString('id-ID'), maxCols)
    const qrisPart = Math.max(0, order.total_amount - (order.cash_tendered || 0))
    builder.row('Bayar QRIS', 'Rp ' + qrisPart.toLocaleString('id-ID'), maxCols)
  } else {
    builder.row(
      `Bayar (${order.payment_method.toUpperCase()})`,
      'Rp ' + (order.cash_tendered ?? order.total_amount).toLocaleString('id-ID'),
      maxCols
    )
  }

  if (order.payment_method === 'cash') {
    builder.row('Kembalian', 'Rp ' + (order.change_amount || 0).toLocaleString('id-ID'), maxCols)
  }

  // 5. FOOTER & WIFI
  builder.feed(1)
  builder.align('center')

  if (config.showWifiInfo !== false && (config.wifiName || config.wifiPassword)) {
    builder.bold(true).line('Akses WiFi Pelanggan')
    builder.bold(false)
    if (config.wifiName) builder.line('SSID: ' + config.wifiName)
    if (config.wifiPassword) builder.line('Pass: ' + config.wifiPassword)
    builder.divider('-', maxCols)
  }

  if (config.showFooterMessage !== false) {
    builder.bold(true)
    builder.printWrapped(config.footerMessage || 'Terima Kasih Atas Kunjungannya!', maxCols)
    builder.bold(false)
    if (config.footerSubmessage) builder.printWrapped(config.footerSubmessage, maxCols)
    if (config.showCustomNotice && config.customNotice) {
      builder.printWrapped('* ' + config.customNotice, maxCols)
    }
  }

  builder.cut()
  return builder.getBytes()
}

export function buildKitchenEscPos(
  order: Order,
  config: ReceiptConfig,
  cashierName?: string
): Uint8Array {
  const maxCols = config.paperWidth === '80mm' ? 48 : 32
  const builder = new EscPosBuilder()

  // Header Tiket Dapur
  builder.align('center')
  if (maxCols <= 32) {
    builder.bold(true).size(1, 2)
  } else {
    builder.bold(true).size(2, 2)
  }
  builder.line('TIKET DAPUR / BAR')
  builder.size(1, 1)
  builder.line(config.storeName || 'WARKOP SUDUT TEMU')
  builder.divider('=', maxCols)

  // Order Info
  builder.align('left')
  builder.bold(true).size(1, 2)
  builder.row('ORDER: ' + order.order_number, new Date(order.created_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) + ' WIB', maxCols)
  builder.bold(false).size(1, 1)

  const activeCashier = cashierName || order.cashier_name || 'Kasir'
  builder.row('Kasir: ' + activeCashier, order.order_type === 'dine_in' ? '[DINE IN]' : '[BUNGKUS]', maxCols)

  // Highlight Meja
  builder.divider('-', maxCols)
  builder.align('center')
  builder.bold(true).size(2, 2)
  if (order.table_number) {
    builder.line('MEJA ' + order.table_number.replace(/\D/g, '') || order.table_number)
  } else {
    builder.line('TAKEAWAY / BUNGKUS')
  }
  if (order.customer_name && order.customer_name !== 'Pelanggan') {
    builder.size(1, 1).line('Pelanggan: ' + order.customer_name)
  }
  builder.bold(false).size(1, 1)
  builder.divider('=', maxCols)

  // Items
  builder.align('left')
  builder.bold(true).line('DAFTAR PESANAN:')
  builder.feed(1)

  order.items.forEach(item => {
    builder.bold(true).size(1, 2)
    builder.line(`[${item.quantity}x]  ${item.product_name}`)
    builder.bold(false).size(1, 1)
    if (item.notes) {
      builder.bold(true).line(`    * Catatan: ${item.notes}`)
      builder.bold(false)
    }
    builder.divider('.', maxCols)
  })

  builder.align('center')
  builder.feed(1)
  builder.line('*** SEGERA SAJIKAN DENGAN RAMAH ***')

  builder.cut()
  return builder.getBytes()
}

export function buildShiftRecapEscPos(
  closedData: any,
  scheduleStr: { range: string; duration: string },
  finalExpected: number,
  finalDiff: number,
  config?: ReceiptConfig
): Uint8Array {
  const maxCols = config?.paperWidth === '80mm' ? 48 : 32
  const builder = new EscPosBuilder()

  builder.align('center')
  const storeTitle = config?.storeName || 'WARKOP SUDUT TEMU'
  if (maxCols <= 32 && storeTitle.length > 16) {
    builder.bold(true).size(1, 2)
  } else {
    builder.bold(true).size(2, 2)
  }
  builder.line(storeTitle)
  builder.size(1, 1)
  builder.line('Kopi - Mi - Tempat Bersua')
  builder.bold(true).line('REKAP TUTUP SHIFT KASIR')
  builder.bold(false)
  builder.divider('=', maxCols)

  builder.align('left')
  builder.row('Petugas Kasir:', closedData.cashier_name || 'Kasir', maxCols)
  builder.row('Jam Shift:', scheduleStr.range, maxCols)
  builder.row('Durasi:', scheduleStr.duration, maxCols)
  builder.divider('-', maxCols)

  builder.row('Modal Awal Kas', 'Rp ' + (closedData.initial_cash || 0).toLocaleString('id-ID'), maxCols)
  builder.bold(true)
  builder.row('Penjualan Tunai', 'Rp ' + (closedData.total_cash_sales || 0).toLocaleString('id-ID'), maxCols)
  builder.bold(false)
  builder.row('Penjualan QRIS', 'Rp ' + (closedData.total_qris_sales || 0).toLocaleString('id-ID'), maxCols)

  const incomes = closedData.total_incomes || 0
  const expenses = closedData.total_expenses || 0
  if (incomes > 0) {
    builder.row('Kas Masuk (Tambah)', '+Rp ' + incomes.toLocaleString('id-ID'), maxCols)
  }
  if (expenses > 0) {
    builder.row('Kas Keluar (Operasional)', '-Rp ' + expenses.toLocaleString('id-ID'), maxCols)
  }

  const totalOmzet = (closedData.total_cash_sales || 0) + (closedData.total_qris_sales || 0)
  builder.bold(true)
  builder.row('Total Omzet', 'Rp ' + totalOmzet.toLocaleString('id-ID'), maxCols)
  builder.bold(false)
  builder.divider('-', maxCols)

  builder.row('Wajib Ada di Laci:', 'Rp ' + finalExpected.toLocaleString('id-ID'), maxCols)
  builder.bold(true)
  builder.row('Uang Fisik Dihitung:', 'Rp ' + (closedData.actual_cash_counted || 0).toLocaleString('id-ID'), maxCols)
  
  const diffStr = finalDiff === 0 
    ? 'PAS (Rp 0)' 
    : (finalDiff > 0 ? '+Rp ' : '-Rp ') + Math.abs(finalDiff).toLocaleString('id-ID')
  builder.row('Selisih Kas:', diffStr, maxCols)
  builder.bold(false)
  builder.divider('=', maxCols)

  builder.align('center')
  builder.line('*** TANDA TANGAN SERAH TERIMA ***')
  builder.feed(3)
  builder.line('( ................................ )')
  builder.feed(1)
  builder.line('Kasir Bertugas: ' + (closedData.cashier_name || 'Kasir'))
  builder.cut()

  return builder.getBytes()
}

export function buildTestReceiptEscPos(config?: ReceiptConfig): Uint8Array {
  const maxCols = config?.paperWidth === '80mm' ? 48 : 32
  const builder = new EscPosBuilder()

  builder.align('center')
  const storeTitle = config?.storeName || 'WARKOP SUDUT TEMU'
  if (maxCols <= 32 && storeTitle.length > 16) {
    builder.bold(true).size(1, 2)
  } else {
    builder.bold(true).size(2, 2)
  }
  builder.line(storeTitle)
  builder.size(1, 1)
  builder.line('TES KONEKSI PRINTER THERMAL')
  builder.divider('=', maxCols)

  builder.align('left')
  builder.line('Status: TERHUBUNG SUKSES!')
  builder.line('Waktu:  ' + new Date().toLocaleTimeString('id-ID') + ' WIB')
  builder.line('Format: ' + (config?.paperWidth || '58mm') + ' ESC/POS')
  builder.divider('-', maxCols)

  builder.row('Direct Print:', 'BERHASIL [OK]', maxCols)
  builder.row('Kualitas Cetak:', 'OPTIMAL [OK]', maxCols)

  builder.divider('=', maxCols)
  builder.align('center')
  builder.bold(true).line('Printer Siap Digunakan!')
  builder.cut()

  return builder.getBytes()
}


