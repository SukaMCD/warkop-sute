import { useState } from 'react'
import type { Order } from '../../types'
import { formatRupiah } from '../../utils/formatters'
import { Receipt, Eye, X, Calendar, User, CreditCard } from 'lucide-react'

interface RecentOrdersProps {
  orders: Order[]
}

export const RecentOrders = ({ orders }: RecentOrdersProps) => {
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)

  // Compact time formatter to keep table clean without horizontal scroll
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

  return (
    <div className="bg-stone-900/80 border border-stone-800 rounded-2xl p-5 shadow-sm">
      
      {/* Header */}
      <div className="flex items-center justify-between mb-4 pb-3 border-b border-stone-800/80">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-stone-950 border border-stone-800 flex items-center justify-center text-[#E2DFD2] shadow-xs">
            <Receipt className="w-4 h-4 stroke-[2]" />
          </div>
          <div>
            <h2 className="text-sm font-bold tracking-tight text-stone-100">
              Transaksi Terkini
            </h2>
            <p className="text-[11px] text-stone-400">
              Daftar transaksi kasir real-time
            </p>
          </div>
        </div>

        <span className="text-xs text-stone-400 font-mono px-2.5 py-1 rounded-lg bg-stone-950 border border-stone-800">
          {orders.length} transaksi terakhir
        </span>
      </div>

      {/* Table: Fully responsive without horizontal scrollbar */}
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
            {orders.length === 0 ? (
              <tr>
                <td colSpan={8} className="py-8 text-center text-stone-400">
                  Belum ada transaksi pada shift ini.
                </td>
              </tr>
            ) : (
              orders.map((order) => (
                <tr key={order.id} className="hover:bg-stone-800/30 transition-colors group">
                  
                  {/* Order ID */}
                  <td className="py-3 px-2 font-mono font-bold text-stone-100 whitespace-nowrap">
                    {order.order_number}
                  </td>

                  {/* Time: Compact HH:mm to fit nicely without breaking */}
                  <td className="py-3 px-2 text-stone-400 font-mono text-[11px] whitespace-nowrap" title={order.created_at}>
                    {formatOrderTime(order.created_at)}
                  </td>

                  {/* Customer / Table */}
                  <td className="py-3 px-2 text-stone-200 font-medium whitespace-nowrap">
                    <span className="truncate max-w-[120px] block" title={order.customer_name}>
                      {order.customer_name}
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
                    ) : (
                      <span className="inline-block px-2 py-0.5 rounded-md text-[10px] font-mono tracking-wider uppercase border border-stone-800 bg-stone-950 text-[#E2DFD2] font-semibold">
                        QRIS
                      </span>
                    )}
                  </td>

                  {/* Total Amount */}
                  <td className="py-3 px-2 text-right font-mono tabular-nums font-bold text-stone-100 whitespace-nowrap">
                    {formatRupiah(order.total_amount)}
                  </td>

                  {/* Status */}
                  <td className="py-3 px-2 text-center whitespace-nowrap">
                    <span className="inline-block px-2 py-0.5 rounded-md text-[10px] font-mono font-bold uppercase tracking-wider border border-emerald-900/60 bg-emerald-950/40 text-emerald-400">
                      Selesai
                    </span>
                  </td>

                  {/* Detail Button */}
                  <td className="py-3 px-2 text-right whitespace-nowrap">
                    <button
                      type="button"
                      onClick={() => setSelectedOrder(order)}
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

      {/* Modal Detail Transaksi */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-stone-900 border border-stone-800 rounded-2xl w-full max-w-md p-6 shadow-2xl relative">
            
            {/* Header Modal */}
            <div className="flex items-center justify-between pb-3 border-b border-stone-800 mb-4">
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

            {/* Info Grid */}
            <div className="grid grid-cols-2 gap-2 text-xs mb-4 p-3 bg-stone-950 border border-stone-800 rounded-xl">
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

            {/* Item List */}
            <div className="space-y-2 mb-4 max-h-56 overflow-y-auto pr-1">
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
            <div className="pt-3 border-t border-stone-800 space-y-1.5 text-xs">
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
                <span className="font-mono tabular-nums text-[#E2DFD2] text-base">
                  {formatRupiah(selectedOrder.total_amount)}
                </span>
              </div>
            </div>

            {/* Footer Button */}
            <div className="mt-5">
              <button
                type="button"
                onClick={() => setSelectedOrder(null)}
                className="w-full py-2.5 rounded-xl bg-stone-800 hover:bg-stone-750 text-stone-200 text-xs font-semibold tracking-wide transition-all cursor-pointer border border-stone-700 active:scale-[0.98]"
              >
                Tutup Rincian
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  )
}
