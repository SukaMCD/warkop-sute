import { useState, useMemo } from 'react'
import type { Order } from '../../types'
import { formatRupiah } from '../../utils/formatters'
import {
  Receipt,
  Eye,
  X,
  Calendar,
  User,
  CreditCard,
  Printer,
  Download,
  Search,
  AlertTriangle,
  Ban,
  Filter,
  UtensilsCrossed,
  FileSpreadsheet
} from 'lucide-react'
import type { ReceiptConfig } from '../../types'
import * as XLSX from 'xlsx'

interface RecentOrdersProps {
  orders: Order[]
  receiptConfig?: ReceiptConfig
  onOrderCancelled?: (orderId: string) => void
}

export const RecentOrders = ({ orders, receiptConfig, onOrderCancelled }: RecentOrdersProps) => {
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [paymentFilter, setPaymentFilter] = useState<'all' | 'cash' | 'qris'>('all')
  const [dateFilter, setDateFilter] = useState<'all' | 'today' | 'yesterday' | '7days'>('all')
  const [statusFilter, setStatusFilter] = useState<'all' | 'completed' | 'cancelled'>('all')

  // Cancel order state
  const [isCancelling, setIsCancelling] = useState(false)
  const [cancelConfirm, setCancelConfirm] = useState(false)
  const [cancelError, setCancelError] = useState('')

  // Print format state: 'receipt' for customer, 'kitchen' for bar / cook ticket
  const [printType, setPrintType] = useState<'receipt' | 'kitchen'>('receipt')

  // Compact time formatter
  const formatOrderTime = (timeStr: string) => {
    try {
      if (timeStr.includes(' ')) {
        const parts = timeStr.split(' ')[1].split(':')
        return `${parts[0]}:${parts[1]}`
      }
      if (timeStr.includes('T')) {
        const timePart = timeStr.split('T')[1].split('.')[0]
        const parts = timePart.split(':')
        return `${parts[0]}:${parts[1]}`
      }
      return timeStr
    } catch {
      return timeStr
    }
  }

  // Filtered orders
  const filteredOrders = useMemo(() => {
    const nowMs = Date.now()
    const oneDay = 86400000
    const todayStr = new Date(nowMs).toISOString().slice(0, 10)
    const yesterdayStr = new Date(nowMs - oneDay).toISOString().slice(0, 10)
    const sevenDaysAgoStr = new Date(nowMs - 6 * oneDay).toISOString().slice(0, 10)

    return orders.filter((order) => {
      // Search
      const q = searchQuery.toLowerCase().trim()
      if (q) {
        const matchNumber = order.order_number.toLowerCase().includes(q)
        const matchCustomer = (order.customer_name || '').toLowerCase().includes(q)
        const matchTable = (order.table_number || '').toLowerCase().includes(q)
        if (!matchNumber && !matchCustomer && !matchTable) return false
      }

      // Payment
      if (paymentFilter !== 'all' && order.payment_method !== paymentFilter) {
        return false
      }

      // Status
      if (statusFilter !== 'all' && order.status !== statusFilter) {
        return false
      }

      // Date
      if (dateFilter !== 'all') {
        const orderDate = order.created_at.split('T')[0].split(' ')[0]
        if (dateFilter === 'today' && orderDate !== todayStr) return false
        if (dateFilter === 'yesterday' && orderDate !== yesterdayStr) return false
        if (dateFilter === '7days' && orderDate < sevenDaysAgoStr) return false
      }

      return true
    })
  }, [orders, searchQuery, paymentFilter, statusFilter, dateFilter])

  // Export CSV
  const handleExportCSV = () => {
    if (filteredOrders.length === 0) return

    const headers = [
      'No Order',
      'Tanggal & Waktu',
      'Petugas Kasir',
      'Nama Pelanggan',
      'Tipe Order',
      'Nomor Meja',
      'Metode Bayar',
      'Daftar Menu & Qty',
      'Catatan Khusus',
      'Diskon (Rp)',
      'Total Omzet (Rp)',
      'Total Modal HPP (Rp)',
      'Estimasi Laba Bersih (Rp)',
      'Status'
    ]

    let sumOmzet = 0
    let sumModal = 0
    let sumDiskon = 0

    const rows = filteredOrders.map((o) => {
      const itemsSummary = o.items.map(it => `${it.product_name} (${it.quantity}x)`).join('; ')
      const allNotes = o.items.filter(it => it.notes).map(it => `${it.product_name}: ${it.notes}`).join('; ')
      const diskon = o.discount_amount || 0
      const omzet = o.total_amount
      const modal = o.total_cost || Math.round(omzet * 0.48)
      const laba = Math.max(0, omzet - modal)

      if (o.status === 'completed') {
        sumOmzet += omzet
        sumModal += modal
        sumDiskon += diskon
      }

      const methodLabel = o.payment_method === 'split' 
        ? `SPLIT (Tunai: Rp ${(o.cash_tendered || 0).toLocaleString('id-ID')}, QRIS: Rp ${(omzet - (o.cash_tendered || 0)).toLocaleString('id-ID')})`
        : o.payment_method.toUpperCase()

      return [
        `"${o.order_number}"`,
        `"${o.created_at}"`,
        `"${o.cashier_name || '-'}"`,
        `"${o.customer_name || '-'}"`,
        `"${o.order_type === 'dine_in' ? 'Dine In' : 'Takeaway'}"`,
        `"${o.table_number || '-'}"`,
        `"${methodLabel}"`,
        `"${itemsSummary.replace(/"/g, '""')}"`,
        `"${allNotes.replace(/"/g, '""') || '-'}"`,
        diskon,
        omzet,
        modal,
        laba,
        `"${o.status === 'completed' ? 'Selesai' : 'Dibatalkan'}"`
      ]
    })

    const summaryRow = [
      '"TOTAL RINGKASAN"',
      `"${filteredOrders.length} Transaksi"`,
      '""',
      '""',
      '""',
      '""',
      '""',
      '""',
      '""',
      sumDiskon,
      sumOmzet,
      sumModal,
      sumOmzet - sumModal,
      '""'
    ]

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFFsep=,\n' + [
      headers.join(','),
      ...rows.map(r => r.join(',')),
      summaryRow.join(',')
    ].join('\n')

    const encodedUri = encodeURI(csvContent)
    const link = document.createElement('a')
    link.setAttribute('href', encodedUri)
    const dateTag = new Date().toISOString().split('T')[0]
    link.setAttribute('download', `rekap_transaksi_warkop_sudut_temu_${dateTag}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  // Export to true native Microsoft Excel OpenXML (.xlsx) without any warning popup
  const handleExportExcel = () => {
    if (filteredOrders.length === 0) return

    const wb = XLSX.utils.book_new()

    let sumOmzet = 0
    let sumModal = 0
    let sumDiskon = 0

    const rows = filteredOrders.map(o => {
      const itemsSummary = o.items.map(it => `${it.product_name} (${it.quantity}x)`).join(', ')
      const allNotes = o.items.filter(it => it.notes).map(it => `${it.product_name}: ${it.notes}`).join('; ')
      const diskon = o.discount_amount || 0
      const omzet = o.total_amount
      const modal = o.total_cost || Math.round(omzet * 0.48)
      const laba = Math.max(0, omzet - modal)

      if (o.status === 'completed') {
        sumOmzet += omzet
        sumModal += modal
        sumDiskon += diskon
      }

      const methodLabel = o.payment_method === 'split' 
        ? `SPLIT (Tunai: Rp ${(o.cash_tendered || 0).toLocaleString('id-ID')}, QRIS: Rp ${(omzet - (o.cash_tendered || 0)).toLocaleString('id-ID')})`
        : o.payment_method.toUpperCase()

      return [
        o.order_number,
        o.created_at,
        o.cashier_name || '-',
        o.customer_name || '-',
        o.table_number || '-',
        o.order_type === 'dine_in' ? 'Dine In' : 'Takeaway',
        methodLabel,
        itemsSummary,
        allNotes || '-',
        diskon,
        omzet,
        modal,
        laba,
        o.status === 'completed' ? 'Selesai' : 'Batal'
      ]
    })

    const summaryRow = [
      'TOTAL KESELURUHAN',
      `${filteredOrders.length} Transaksi`,
      '',
      '',
      '',
      '',
      '',
      '',
      '',
      sumDiskon,
      sumOmzet,
      sumModal,
      sumOmzet - sumModal,
      ''
    ]

    const data: any[][] = [
      ['WARKOP SUDUT TEMU - RIWAYAT TRANSAKSI PENJUALAN'],
      [`Total: ${filteredOrders.length} Transaksi`, `Diunduh: ${new Date().toLocaleString('id-ID')}`],
      [],
      ['No. Order', 'Waktu', 'Kasir', 'Pelanggan', 'Meja', 'Tipe', 'Metode Bayar', 'Item Pesanan', 'Catatan Item', 'Diskon (Rp)', 'Total Bayar (Rp)', 'Total Modal (Rp)', 'Laba Kotor (Rp)', 'Status'],
      ...rows,
      summaryRow
    ]

    const ws = XLSX.utils.aoa_to_sheet(data)
    ws['!cols'] = [
      { wch: 20 }, // No Order
      { wch: 20 }, // Waktu
      { wch: 15 }, // Kasir
      { wch: 18 }, // Pelanggan
      { wch: 8 },  // Meja
      { wch: 12 }, // Tipe
      { wch: 18 }, // Metode
      { wch: 35 }, // Item Pesanan
      { wch: 25 }, // Catatan
      { wch: 14 }, // Diskon
      { wch: 16 }, // Total Bayar
      { wch: 16 }, // Total Modal
      { wch: 16 }, // Laba
      { wch: 12 }  // Status
    ]

    XLSX.utils.book_append_sheet(wb, ws, 'Riwayat Transaksi')
    const dateTag = new Date().toISOString().split('T')[0]
    XLSX.writeFile(wb, `rekap_transaksi_warkop_sudut_temu_${dateTag}.xlsx`)
  }

  // Print Handlers
  const handlePrintReceipt = () => {
    setPrintType('receipt')
    setTimeout(() => window.print(), 50)
  }

  const handlePrintKitchen = () => {
    setPrintType('kitchen')
    setTimeout(() => window.print(), 50)
  }

  // Cancel / Void Order
  const handleCancelOrder = async (orderId: string) => {
    setIsCancelling(true)
    setCancelError('')
    try {
      const res = await fetch(`/api/orders/${orderId}/cancel`, { method: 'POST' })
      const data: any = await res.json()
      if (res.ok && data.success) {
        if (selectedOrder && selectedOrder.id === orderId) {
          setSelectedOrder({ ...selectedOrder, status: 'cancelled' })
        }
        if (onOrderCancelled) {
          onOrderCancelled(orderId)
        }
        setCancelConfirm(false)
      } else {
        setCancelError(data.message || 'Gagal membatalkan pesanan.')
      }
    } catch {
      setCancelError('Gagal menghubungi server untuk membatalkan pesanan.')
    } finally {
      setIsCancelling(false)
    }
  }

  return (
    <div className="bg-stone-900/80 border border-stone-800 rounded-2xl p-5 shadow-sm space-y-4">
      
      {/* Header & Export Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-stone-800/80 gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-stone-950 border border-stone-800 flex items-center justify-center text-[#E2DFD2] shadow-xs">
            <Receipt className="w-4 h-4 stroke-2" />
          </div>
          <div>
            <h2 className="text-sm font-bold tracking-tight text-stone-100">
              Riwayat Transaksi Penjualan
            </h2>
            <p className="text-[11px] text-stone-400">
              Monitoring pesanan real-time, filter, cetak ulang struk & pembatalan
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={handleExportExcel}
            disabled={filteredOrders.length === 0}
            className="px-3 py-1.5 rounded-xl bg-[#E2DFD2] hover:bg-[#d6d3c4] text-stone-950 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-40 shadow-xs"
            title="Download format Spreadsheet Microsoft Excel (.xlsx) resmi tanpa peringatan"
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            <span>Ekspor Excel (.xlsx)</span>
          </button>

          <button
            type="button"
            onClick={handleExportCSV}
            disabled={filteredOrders.length === 0}
            className="px-2.5 py-1.5 rounded-xl bg-stone-950 border border-stone-800 hover:border-stone-600 text-stone-300 text-xs font-medium transition-all flex items-center gap-1 cursor-pointer disabled:opacity-40"
            title="Download Rekap CSV dengan kolom terpisah"
          >
            <Download className="w-3.5 h-3.5 text-stone-400" />
            <span>CSV</span>
          </button>

          <span className="text-xs text-stone-400 font-mono px-2.5 py-1.5 rounded-lg bg-stone-950 border border-stone-800">
            {filteredOrders.length} transaksi
          </span>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-wrap items-center gap-2.5 text-xs">
        {/* Search Input */}
        <div className="relative flex-1 min-w-50">
          <Search className="w-3.5 h-3.5 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            placeholder="Cari no order / pelanggan / meja..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-stone-950 border border-stone-800 rounded-xl pl-9 pr-8 py-1.5 text-xs text-stone-100 placeholder-stone-500 focus:outline-none focus:border-[#E2DFD2] transition-colors"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-stone-400 hover:text-white"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Date Filter */}
        <div className="flex items-center gap-1 bg-stone-950 border border-stone-800 rounded-xl p-1 shrink-0">
          <Calendar className="w-3.5 h-3.5 text-stone-400 ml-1.5" />
          {(['all', 'today', 'yesterday', '7days'] as const).map((df) => (
            <button
              key={df}
              type="button"
              onClick={() => setDateFilter(df)}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all cursor-pointer ${
                dateFilter === df
                  ? 'bg-[#E2DFD2] text-stone-950 shadow-xs'
                  : 'text-stone-400 hover:text-stone-200'
              }`}
            >
              {df === 'all' ? 'Semua' : df === 'today' ? 'Hari Ini' : df === 'yesterday' ? 'Kemarin' : '7 Hari'}
            </button>
          ))}
        </div>

        {/* Payment Filter */}
        <div className="flex items-center gap-1 bg-stone-950 border border-stone-800 rounded-xl p-1 shrink-0">
          <Filter className="w-3.5 h-3.5 text-stone-400 ml-1.5" />
          {(['all', 'cash', 'qris'] as const).map((pf) => (
            <button
              key={pf}
              type="button"
              onClick={() => setPaymentFilter(pf)}
              className={`px-2 py-1 rounded-lg text-[11px] font-semibold transition-all cursor-pointer ${
                paymentFilter === pf
                  ? 'bg-[#E2DFD2] text-stone-950 shadow-xs'
                  : 'text-stone-400 hover:text-stone-200'
              }`}
            >
              {pf === 'all' ? 'Semua Bayar' : pf === 'cash' ? 'Tunai' : 'QRIS'}
            </button>
          ))}
        </div>

        {/* Status Filter */}
        <div className="flex items-center gap-1 bg-stone-950 border border-stone-800 rounded-xl p-1 shrink-0">
          {(['all', 'completed', 'cancelled'] as const).map((sf) => (
            <button
              key={sf}
              type="button"
              onClick={() => setStatusFilter(sf)}
              className={`px-2 py-1 rounded-lg text-[11px] font-semibold transition-all cursor-pointer ${
                statusFilter === sf
                  ? 'bg-[#E2DFD2] text-stone-950 shadow-xs'
                  : 'text-stone-400 hover:text-stone-200'
              }`}
            >
              {sf === 'all' ? 'Semua Status' : sf === 'completed' ? 'Selesai' : 'Batal'}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="w-full overflow-hidden">
        <table className="w-full text-left text-xs table-auto">
          <thead>
            <tr className="border-b border-stone-800 text-stone-400 font-mono text-[11px] uppercase tracking-wider bg-stone-950/40">
              <th className="py-2.5 px-2 font-semibold rounded-l-lg">No. Order</th>
              <th className="py-2.5 px-2 font-semibold">Waktu</th>
              <th className="py-2.5 px-2 font-semibold">Pelanggan / Meja</th>
              <th className="py-2.5 px-2 font-semibold text-center">Tipe</th>
              <th className="py-2.5 px-2 font-semibold text-center">Metode</th>
              <th className="py-2.5 px-2 font-semibold text-right">Total</th>
              <th className="py-2.5 px-2 font-semibold text-center">Status</th>
              <th className="py-2.5 px-2 font-semibold text-right rounded-r-lg">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-800/60">
            {filteredOrders.length === 0 ? (
              <tr>
                <td colSpan={8} className="py-8 text-center text-stone-400">
                  Tidak ada transaksi yang sesuai dengan filter.
                </td>
              </tr>
            ) : (
              filteredOrders.map((order) => (
                <tr key={order.id} className="hover:bg-stone-800/30 transition-colors group">
                  
                  {/* Order ID */}
                  <td className="py-3 px-2 font-mono font-bold text-stone-100 whitespace-nowrap">
                    {order.order_number}
                  </td>

                  {/* Time */}
                  <td className="py-3 px-2 text-stone-400 font-mono text-[11px] whitespace-nowrap" title={order.created_at}>
                    {formatOrderTime(order.created_at)}
                  </td>

                  {/* Customer / Table */}
                  <td className="py-3 px-2 text-stone-200 font-medium whitespace-nowrap">
                    <span className="truncate max-w-30 block" title={order.customer_name}>
                      {order.customer_name}
                      {order.table_number && <span className="text-stone-400 ml-1 font-mono">({order.table_number})</span>}
                    </span>
                  </td>

                  {/* Order Type */}
                  <td className="py-3 px-2 text-center whitespace-nowrap">
                    <span className="inline-block px-2 py-0.5 rounded-md text-[10px] font-mono tracking-wider uppercase border border-stone-800 bg-stone-950 text-stone-300 font-semibold">
                      {order.order_type === 'dine_in' ? 'Dine In' : 'Takeaway'}
                    </span>
                  </td>

                  {/* Payment Method */}
                  <td className="py-3 px-2 text-center whitespace-nowrap">
                    {order.payment_method === 'cash' ? (
                      <span className="inline-block px-2 py-0.5 rounded-md text-[10px] font-mono tracking-wider uppercase border border-stone-800 bg-stone-950 text-stone-300 font-semibold">
                        Tunai
                      </span>
                    ) : order.payment_method === 'split' ? (
                      <span className="inline-block px-2 py-0.5 rounded-md text-[10px] font-mono tracking-wider uppercase border border-amber-900/60 bg-amber-950/40 text-amber-300 font-semibold" title={`Split: Tunai ${formatRupiah((order.total_amount || 0) - (order.qris_amount || 0))} + QRIS ${formatRupiah(order.qris_amount || 0)}`}>
                        Split
                      </span>
                    ) : (
                      <span className="inline-block px-2 py-0.5 rounded-md text-[10px] font-mono tracking-wider uppercase border border-stone-800 bg-stone-950 text-[#E2DFD2] font-semibold">
                        QRIS
                      </span>
                    )}
                  </td>

                  {/* Total Amount */}
                  <td className={`py-3 px-2 text-right font-mono tabular-nums font-bold whitespace-nowrap ${
                    order.status === 'cancelled' ? 'line-through text-stone-500' : 'text-stone-100'
                  }`}>
                    {formatRupiah(order.total_amount)}
                  </td>

                  {/* Status */}
                  <td className="py-3 px-2 text-center whitespace-nowrap">
                    {order.status === 'cancelled' ? (
                      <span className="inline-block px-2 py-0.5 rounded-md text-[10px] font-mono font-bold uppercase tracking-wider border border-rose-900/60 bg-rose-950/40 text-rose-400">
                        Batal
                      </span>
                    ) : (
                      <span className="inline-block px-2 py-0.5 rounded-md text-[10px] font-mono font-bold uppercase tracking-wider border border-emerald-900/60 bg-emerald-950/40 text-emerald-400">
                        Selesai
                      </span>
                    )}
                  </td>

                  {/* Detail Button */}
                  <td className="py-3 px-2 text-right whitespace-nowrap">
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedOrder(order)
                        setCancelConfirm(false)
                        setCancelError('')
                      }}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl border border-stone-800 bg-stone-950 hover:bg-stone-800 hover:border-stone-700 text-stone-300 hover:text-stone-100 transition-all cursor-pointer text-xs font-semibold shadow-xs active:scale-95"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>Detail</span>
                    </button>
                  </td>

                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Modal Detail Transaksi & Cetak Ulang Struk */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-stone-900 border border-stone-800 rounded-2xl w-full max-w-md p-6 shadow-2xl relative max-h-[90vh] flex flex-col">
            
            {/* Header Modal */}
            <div className="flex items-center justify-between pb-3 border-b border-stone-800 mb-4 shrink-0">
              <div>
                <span className="text-[10px] font-mono uppercase text-[#E2DFD2] tracking-wider font-semibold">
                  Rincian Transaksi
                </span>
                <h3 className="text-base font-bold font-mono text-stone-100">
                  {selectedOrder.order_number}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedOrder(null)}
                className="w-8 h-8 rounded-xl bg-stone-950 hover:bg-stone-800 border border-stone-800 flex items-center justify-center text-stone-400 hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Content (Scrollable) */}
            <div className="flex-1 overflow-y-auto space-y-4 pr-1">

              {/* Status Notice if Cancelled */}
              {selectedOrder.status === 'cancelled' && (
                <div className="p-3 rounded-xl bg-rose-950/40 border border-rose-900/60 flex items-center gap-2 text-rose-300 text-xs">
                  <Ban className="w-4 h-4 text-rose-400 shrink-0" />
                  <span>Transaksi ini telah dibatalkan (void). Nominal tidak lagi dihitung pada pendapatan aktif.</span>
                </div>
              )}

              {/* Info Grid */}
              <div className="grid grid-cols-2 gap-2 text-xs p-3 bg-stone-950 border border-stone-800 rounded-xl">
                <div>
                  <div className="flex items-center gap-1 text-stone-400 text-[11px] mb-0.5">
                    <Calendar className="w-3 h-3" />
                    <span>Waktu</span>
                  </div>
                  <span className="font-mono text-stone-200">{selectedOrder.created_at} WIB</span>
                </div>
                <div>
                  <div className="flex items-center gap-1 text-stone-400 text-[11px] mb-0.5">
                    <User className="w-3 h-3" />
                    <span>Petugas Kasir</span>
                  </div>
                  <span className="text-stone-200 font-semibold">{selectedOrder.cashier_name}</span>
                </div>
                <div>
                  <span className="text-stone-400 block text-[11px] mb-0.5">Pelanggan / Tipe</span>
                  <span className="text-stone-200">
                    {selectedOrder.customer_name} ({selectedOrder.order_type === 'dine_in' ? 'Dine In' : 'Takeaway'})
                  </span>
                </div>
                <div>
                  <div className="flex items-center gap-1 text-stone-400 text-[11px] mb-0.5">
                    <CreditCard className="w-3 h-3" />
                    <span>Metode Bayar</span>
                  </div>
                  <span className="font-mono uppercase text-[#E2DFD2] font-semibold">
                    {selectedOrder.payment_method === 'cash' ? 'Tunai' : 'QRIS Statis'}
                  </span>
                </div>
              </div>

              {/* Items List */}
              <div className="space-y-2">
                <span className="text-xs font-semibold text-stone-400 uppercase tracking-wide block mb-1 font-mono">
                  Item Pesanan
                </span>
                {selectedOrder.items.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between text-xs py-2 border-b border-stone-800/60"
                  >
                    <div>
                      <div className="font-medium text-stone-100">{item.product_name}</div>
                      <div className="text-stone-400 text-[11px] font-mono">
                        {item.quantity} x {formatRupiah(item.price)}
                      </div>
                      {item.notes && (
                        <div className="text-[11px] text-[#E2DFD2]/90 italic mt-0.5">
                          Catatan: {item.notes}
                        </div>
                      )}
                    </div>
                    <div className="font-mono tabular-nums font-bold text-stone-100">
                      {formatRupiah(item.subtotal)}
                    </div>
                  </div>
                ))}
              </div>

              {/* Payment Summary */}
              <div className="pt-2 border-t border-stone-800 space-y-1.5 text-xs">
                <div className="flex justify-between text-stone-300">
                  <span>Subtotal Item:</span>
                  <span className="font-mono tabular-nums">{formatRupiah(selectedOrder.total_amount)}</span>
                </div>
                
                {selectedOrder.payment_method === 'cash' && selectedOrder.cash_tendered !== undefined && (
                  <>
                    <div className="flex justify-between text-stone-400 text-[11px]">
                      <span>Uang Diterima:</span>
                      <span className="font-mono tabular-nums">{formatRupiah(selectedOrder.cash_tendered)}</span>
                    </div>
                    <div className="flex justify-between text-stone-400 text-[11px]">
                      <span>Kembalian:</span>
                      <span className="font-mono tabular-nums text-emerald-400 font-bold">{formatRupiah(selectedOrder.change_amount || 0)}</span>
                    </div>
                  </>
                )}

                <div className="flex justify-between text-sm font-bold text-stone-100 pt-2 border-t border-stone-800">
                  <span>Total Bayar:</span>
                  <span className={`font-mono tabular-nums text-base ${
                    selectedOrder.status === 'cancelled' ? 'line-through text-stone-500' : 'text-[#E2DFD2]'
                  }`}>
                    {formatRupiah(selectedOrder.total_amount)}
                  </span>
                </div>
              </div>

              {/* Void Order Section */}
              {selectedOrder.status === 'completed' && (
                <div className="pt-2">
                  {!cancelConfirm ? (
                    <button
                      type="button"
                      onClick={() => setCancelConfirm(true)}
                      className="text-[11px] font-mono text-rose-400 hover:text-rose-300 flex items-center gap-1 cursor-pointer transition-colors"
                    >
                      <AlertTriangle className="w-3.5 h-3.5" />
                      <span>Batalkan Transaksi Ini (Void)</span>
                    </button>
                  ) : (
                    <div className="p-3 rounded-xl bg-rose-950/50 border border-rose-900/60 space-y-2">
                      <p className="text-xs text-rose-200 font-medium">
                        Yakin ingin membatalkan transaksi {selectedOrder.order_number}?
                      </p>
                      <p className="text-[11px] text-rose-300/80">
                        Nominal {formatRupiah(selectedOrder.total_amount)} akan dikurangkan dari shift dan omzet penjualan.
                      </p>
                      {cancelError && <p className="text-[11px] text-rose-400 font-bold">{cancelError}</p>}
                      <div className="flex items-center gap-2 pt-1">
                        <button
                          type="button"
                          onClick={() => setCancelConfirm(false)}
                          className="px-3 py-1 rounded-lg bg-stone-900 text-stone-300 text-xs font-semibold"
                        >
                          Jangan Batalkan
                        </button>
                        <button
                          type="button"
                          disabled={isCancelling}
                          onClick={() => handleCancelOrder(selectedOrder.id)}
                          className="px-3 py-1 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold transition-colors cursor-pointer"
                        >
                          {isCancelling ? 'Memproses...' : 'Ya, Batalkan Pesanan'}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* View Mode Switcher in Modal */}
              <div className="flex items-center gap-1.5 p-1 bg-stone-950 rounded-xl border border-stone-800">
                <button
                  type="button"
                  onClick={() => setPrintType('receipt')}
                  className={`flex-1 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                    printType === 'receipt'
                      ? 'bg-stone-850 text-stone-100 border border-stone-700 shadow-xs'
                      : 'text-stone-400 hover:text-stone-200'
                  }`}
                >
                  <Receipt className="w-3.5 h-3.5" />
                  <span>Struk Kasir</span>
                </button>
                <button
                  type="button"
                  onClick={() => setPrintType('kitchen')}
                  className={`flex-1 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                    printType === 'kitchen'
                      ? 'bg-[#E2DFD2]/10 text-[#E2DFD2] border border-[#E2DFD2]/50 shadow-xs'
                      : 'text-stone-400 hover:text-stone-200'
                  }`}
                >
                  <UtensilsCrossed className="w-3.5 h-3.5" />
                  <span>Tiket Dapur / Barista</span>
                </button>
              </div>

              {printType === 'kitchen' ? (
                /* Thermal Kitchen Order Ticket */
                <div
                  id="kitchen-ticket"
                  className={`bg-white text-stone-950 p-4 font-mono text-[11px] rounded-xl shadow-inner border border-stone-300 ${
                    receiptConfig?.paperWidth === '80mm' ? 'paper-80mm' : 'paper-58mm'
                  }`}
                >
                  <div className="text-center pb-2 border-b-2 border-black">
                    <p className="font-black text-sm tracking-wider uppercase">TIKET DAPUR & BARISTA</p>
                    <p className="text-[10px] font-bold text-stone-700">WARKOP SUDUT TEMU</p>
                  </div>

                  <div className="py-2 border-b border-dashed border-stone-500 text-[10px] space-y-0.5">
                    <div className="flex justify-between">
                      <span>No Order:</span>
                      <span className="font-bold">{selectedOrder.order_number}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Waktu:</span>
                      <span>{selectedOrder.created_at}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Kasir:</span>
                      <span>{selectedOrder.cashier_name || 'Kasir'}</span>
                    </div>
                  </div>

                  {/* Highlight Meja & Pelanggan */}
                  <div className="py-2.5 my-2 border-2 border-black bg-stone-100 rounded-lg text-center space-y-0.5">
                    <p className="text-xs font-bold uppercase tracking-wider text-stone-700">
                      PELANGGAN: {selectedOrder.customer_name || 'Pelanggan'}
                    </p>
                    <p className="text-base font-black tracking-wide text-black">
                      {selectedOrder.table_number ? `MEJA ${selectedOrder.table_number.replace(/\D/g, '') || selectedOrder.table_number}` : 'TANPA MEJA'}
                      {' '}<span className="text-xs font-bold text-stone-700">({selectedOrder.order_type === 'dine_in' ? 'DINE IN' : 'BUNGKUS'})</span>
                    </p>
                  </div>

                  {/* Items to prepare */}
                  <div className="py-2 border-b border-dashed border-black space-y-2">
                    <p className="font-bold text-[10px] tracking-wider uppercase text-stone-800">Daftar Menu Masak & Seduh:</p>
                    {selectedOrder.items.map((it, idx) => (
                      <div key={idx} className="border-b border-dotted border-stone-300 pb-1.5 last:border-b-0">
                        <div className="flex items-center gap-2 text-xs font-bold">
                          <span className="bg-black text-white px-1.5 py-0.5 rounded text-[11px] font-mono leading-none">
                            {it.quantity}x
                          </span>
                          <span className="leading-tight">{it.product_name}</span>
                        </div>
                        {it.notes && (
                          <p className="text-[10px] font-bold text-rose-700 pl-7 mt-0.5">
                            * Catatan: {it.notes}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>

                  <div className="pt-2 text-center text-[9px] text-stone-600 font-bold uppercase tracking-wider">
                    *** SELESAIKAN & SAJIKAN DENGAN RAMAH ***
                  </div>
                </div>
              ) : (
                /* Customer Thermal Receipt */
                <div
                  id="printable-receipt"
                  className={`bg-white text-stone-950 p-4 font-mono text-[11px] rounded-xl shadow-inner border border-stone-300 ${
                    receiptConfig?.paperWidth === '80mm' ? 'paper-80mm' : 'paper-58mm'
                  }`}
                >
                  <div className="text-center pb-2 border-b border-dashed border-stone-400">
                    {receiptConfig?.showStoreName !== false && (
                      <p className="font-bold text-sm tracking-wider uppercase">
                        {receiptConfig?.storeName || 'WARKOP SUDUT TEMU'}
                      </p>
                    )}
                    {receiptConfig?.showTagline && receiptConfig?.tagline && (
                      <p className="text-[10px] text-stone-700 italic">{receiptConfig.tagline}</p>
                    )}
                    {receiptConfig?.showAddress !== false && receiptConfig?.address && (
                      <p className="text-[10px] text-stone-700">{receiptConfig.address}</p>
                    )}
                    <div className="flex justify-center gap-2 text-[10px] text-stone-700 flex-wrap">
                      {receiptConfig?.showPhone !== false && receiptConfig?.phone && (
                        <span>Telp: {receiptConfig.phone}</span>
                      )}
                      {receiptConfig?.showSocialMedia && receiptConfig?.socialMedia && (
                        <span>IG: {receiptConfig.socialMedia}</span>
                      )}
                    </div>
                    <p className="text-[9px] font-bold text-stone-600 uppercase mt-1">
                      {selectedOrder.status === 'cancelled' ? '*** STRUK DIBATALKAN (VOID) ***' : 'STRUK PEMBAYARAN KASIR'}
                    </p>
                  </div>
                  <div className="py-2 border-b border-dashed border-stone-400 space-y-0.5 text-[10px]">
                    <div className="flex justify-between">
                      <span>No: {selectedOrder.order_number}</span>
                      <span>{selectedOrder.created_at}</span>
                    </div>
                    <div className="flex justify-between">
                      {receiptConfig?.showCashierName !== false && <span>Kasir: {selectedOrder.cashier_name}</span>}
                      {receiptConfig?.showOrderType !== false && (
                        <span>{selectedOrder.order_type === 'dine_in' ? 'Di Tempat' : 'Bungkus'}</span>
                      )}
                    </div>
                    {receiptConfig?.showCustomerName && selectedOrder.customer_name && selectedOrder.customer_name !== 'Pelanggan' && (
                      <div className="flex justify-between">
                        <span>Pelanggan: {selectedOrder.customer_name}</span>
                      </div>
                    )}
                    {receiptConfig?.showTableNumber !== false && selectedOrder.table_number && (
                      <div className="flex justify-between">
                        <span>Meja: {selectedOrder.table_number}</span>
                      </div>
                    )}
                  </div>
                  <div className="py-2 border-b border-dashed border-stone-400 space-y-1">
                    {selectedOrder.items.map((it, idx) => (
                      <div key={idx} className="space-y-0.5 text-[10px]">
                        <div className="flex justify-between font-semibold">
                          <span>{it.product_name}</span>
                          <span>{formatRupiah(it.subtotal)}</span>
                        </div>
                        <div className="flex justify-between text-stone-600">
                          <span>{it.quantity}x {formatRupiah(it.price)}</span>
                          {receiptConfig?.showItemNotes !== false && it.notes && (
                            <span className="italic">({it.notes})</span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="py-2 border-b border-dashed border-stone-400 space-y-0.5 text-[10px]">
                    {selectedOrder.discount_amount && selectedOrder.discount_amount > 0 && (
                      <>
                        <div className="flex justify-between text-stone-600">
                          <span>Subtotal</span>
                          <span>{formatRupiah(selectedOrder.total_amount + selectedOrder.discount_amount)}</span>
                        </div>
                        <div className="flex justify-between text-rose-600 font-semibold">
                          <span>Diskon {selectedOrder.discount_reason ? `(${selectedOrder.discount_reason})` : ''}</span>
                          <span>-{formatRupiah(selectedOrder.discount_amount)}</span>
                        </div>
                      </>
                    )}
                    <div className="flex justify-between font-bold text-xs pt-0.5">
                      <span>TOTAL</span>
                      <span>{formatRupiah(selectedOrder.total_amount)}</span>
                    </div>
                    {selectedOrder.payment_method === 'split' ? (
                      <>
                        <div className="flex justify-between text-[10px] text-stone-700">
                          <span>Bayar Tunai</span>
                          <span>{formatRupiah(selectedOrder.cash_tendered || 0)}</span>
                        </div>
                        <div className="flex justify-between text-[10px] text-stone-700">
                          <span>Bayar QRIS</span>
                          <span>{formatRupiah(Math.max(0, selectedOrder.total_amount - (selectedOrder.cash_tendered || 0)))}</span>
                        </div>
                      </>
                    ) : (
                      <div className="flex justify-between">
                        <span>Bayar ({selectedOrder.payment_method.toUpperCase()})</span>
                        <span>{formatRupiah(selectedOrder.cash_tendered || selectedOrder.total_amount)}</span>
                      </div>
                    )}
                    {selectedOrder.payment_method === 'cash' && (
                      <div className="flex justify-between">
                        <span>Kembalian</span>
                        <span>{formatRupiah(selectedOrder.change_amount || 0)}</span>
                      </div>
                    )}
                  </div>
                  <div className="pt-2 text-center text-[10px] text-stone-600 space-y-0.5">
                    {receiptConfig?.showWifiInfo !== false && (receiptConfig?.wifiName || receiptConfig?.wifiPassword) && (
                      <>
                        <p className="font-semibold text-stone-800">WiFi: {receiptConfig?.wifiName || 'Warkop Sudut Temu'}</p>
                        <p className="font-mono text-[9px]">Pass: {receiptConfig?.wifiPassword || 'kopienak2026'}</p>
                      </>
                    )}
                    {receiptConfig?.showFooterMessage !== false && (
                      <div className="pt-1 border-t border-dashed border-stone-300 mt-1">
                        <p>{receiptConfig?.footerMessage || 'Terima Kasih!'}</p>
                        {receiptConfig?.footerSubmessage && (
                          <p className="text-[9px]">{receiptConfig.footerSubmessage}</p>
                        )}
                        {receiptConfig?.showCustomNotice && receiptConfig?.customNotice && (
                          <p className="text-[8px] text-stone-500 pt-1">* {receiptConfig.customNotice}</p>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )}

            </div>

            {/* Footer Buttons */}
            <div className="mt-4 pt-3 border-t border-stone-800 flex flex-col sm:flex-row items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={handlePrintReceipt}
                className="w-full sm:flex-1 py-2 rounded-xl bg-stone-950 border border-stone-800 hover:border-[#E2DFD2] text-stone-200 text-xs font-semibold transition-all flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Printer className="w-3.5 h-3.5 text-[#E2DFD2]" />
                <span>Cetak Struk Kasir</span>
              </button>
              <button
                type="button"
                onClick={handlePrintKitchen}
                className="w-full sm:flex-1 py-2 rounded-xl bg-stone-900 border border-stone-800 hover:border-[#E2DFD2]/60 hover:bg-[#E2DFD2]/10 text-[#E2DFD2] text-xs font-semibold transition-all flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <UtensilsCrossed className="w-3.5 h-3.5 text-[#E2DFD2]" />
                <span>Cetak Tiket Dapur</span>
              </button>
              <button
                type="button"
                onClick={() => setSelectedOrder(null)}
                className="w-full sm:w-auto px-4 py-2 rounded-xl bg-stone-800 hover:bg-stone-750 text-stone-200 text-xs font-semibold transition-all cursor-pointer border border-stone-700"
              >
                Tutup
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  )
}
