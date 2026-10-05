import { useState, useMemo } from 'react'
import {
  Printer,
  Save,
  RotateCcw,
  Store,
  Wifi,
  Sliders,
  Check,
  AlertCircle,
  Eye,
  FileText,
  Phone,
  MapPin,
  AtSign,
  MessageSquare
} from 'lucide-react'
import type { ReceiptConfig, User } from '../../types'
import { DEFAULT_RECEIPT_CONFIG, saveReceiptConfig } from '../../utils/receiptConfig'
import { ConfirmDialog } from '../ui/ConfirmDialog'

interface ReceiptSettingsViewProps {
  currentUser?: User | null
  config: ReceiptConfig
  onConfigChange: (newConfig: ReceiptConfig) => void
}

export const ReceiptSettingsView = ({
  currentUser,
  config,
  onConfigChange
}: ReceiptSettingsViewProps) => {
  const [formData, setFormData] = useState<ReceiptConfig>({ ...config })
  const [isSaving, setIsSaving] = useState(false)
  const [saveSuccess, setSaveSuccess] = useState(false)
  const [activeSubTab, setActiveSubTab] = useState<'store' | 'display' | 'footer'>('store')
  const [showResetConfirm, setShowResetConfirm] = useState(false)

  // Sample data for preview
  const sampleOrder = useMemo(() => ({
    order_number: 'SUTE-261004-0018',
    created_at: '14:30 WIB',
    cashier_name: currentUser?.name || 'Kasir Shift Pagi',
    customer_name: 'Budi Santoso',
    table_number: 'Meja 04',
    order_type: 'Di Tempat (Dine In)',
    payment_method: 'TUNAI',
    items: [
      { name: 'Kopi Susu Sudut Temu', qty: 2, price: 12000, subtotal: 24000, notes: 'Less sugar, es pisah' },
      { name: 'Indomie Goreng + Telur', qty: 1, price: 12000, subtotal: 12000, notes: 'Pedas, telur setengah matang' },
      { name: 'Cireng Crispy Bumbu Rujak', qty: 1, price: 10000, subtotal: 10000, notes: '' }
    ],
    subtotal: 46000,
    total: 46000,
    tendered: 50000,
    change: 4000
  }), [currentUser?.name])

  const handleChange = <K extends keyof ReceiptConfig>(field: K, value: ReceiptConfig[K]) => {
    const updated = { ...formData, [field]: value }
    setFormData(updated)
    setSaveSuccess(false)
  }

  const handleSave = async () => {
    setIsSaving(true)
    setSaveSuccess(false)
    try {
      const ok = await saveReceiptConfig(formData)
      if (ok) {
        onConfigChange(formData)
        setSaveSuccess(true)
        setTimeout(() => setSaveSuccess(false), 3000)
      }
    } catch (err) {
      console.error('Failed to save receipt settings:', err)
    } finally {
      setIsSaving(false)
    }
  }

  const handleReset = () => {
    setShowResetConfirm(true)
  }

  const handleConfirmReset = () => {
    setFormData({ ...DEFAULT_RECEIPT_CONFIG })
    setSaveSuccess(false)
    setShowResetConfirm(false)
  }

  const handleTestPrint = () => {
    // Open print dialog directly
    window.print()
  }

  return (
    <div className="space-y-6">
      
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-stone-200 dark:border-stone-800">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold tracking-wider uppercase text-amber-800 dark:text-[#E2DFD2] font-mono">
              Kustomisasi Mesin Struk
            </span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-stone-900 dark:text-stone-100 mt-1">
            Format & Tata Letak Struk Kasir
          </h1>
          <p className="text-sm text-stone-500 dark:text-stone-400 mt-1 max-w-2xl">
            Sesuaikan nama outlet, ucapan terima kasih, akses WiFi pelanggan, dan elemen yang dicetak pada printer thermal 58mm / 80mm.
          </p>
        </div>

        {/* Global Action Buttons */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleReset}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-200 bg-stone-100 dark:bg-stone-900 hover:bg-stone-200 dark:hover:bg-stone-800 border border-stone-200 dark:border-stone-800 rounded-xl transition-colors cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Default</span>
          </button>

          <button
            type="button"
            onClick={handleTestPrint}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium text-stone-700 dark:text-stone-200 bg-stone-100 dark:bg-stone-850 hover:bg-stone-200 dark:hover:bg-stone-800 border border-stone-300 dark:border-stone-700/80 rounded-xl transition-colors shadow-xs cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5 text-amber-700 dark:text-[#E2DFD2]" />
            <span>Cetak Sampel</span>
          </button>

          <button
            type="button"
            onClick={handleSave}
            disabled={isSaving}
            className="flex items-center gap-2 px-4 py-2 text-xs font-bold text-white dark:text-stone-950 bg-amber-700 hover:bg-amber-800 active:bg-amber-900 dark:bg-[#E2DFD2] dark:hover:bg-[#edebe2] dark:active:bg-[#d6d3c6] disabled:opacity-50 rounded-xl transition-all shadow-xs active:scale-95 cursor-pointer"
          >
            {isSaving ? (
              <>
                <span className="w-3.5 h-3.5 border-2 border-white dark:border-stone-950 border-t-transparent rounded-full animate-spin" />
                <span>Menyimpan...</span>
              </>
            ) : saveSuccess ? (
              <>
                <Check className="w-3.5 h-3.5 text-white dark:text-stone-950" />
                <span>Tersimpan!</span>
              </>
            ) : (
              <>
                <Save className="w-3.5 h-3.5" />
                <span>Simpan Perubahan</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Main Grid: Left Settings Form, Right Live Thermal Preview */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* LEFT COLUMN: Settings Controls (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          
          {/* Segmented Sub Tabs */}
          <div className="flex items-center p-1 bg-stone-100 dark:bg-stone-900/90 border border-stone-200 dark:border-stone-800 rounded-xl gap-1">
            <button
              type="button"
              onClick={() => setActiveSubTab('store')}
              className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                activeSubTab === 'store'
                  ? 'bg-white dark:bg-stone-800 text-stone-900 dark:text-[#E2DFD2] shadow-xs font-bold'
                  : 'text-stone-500 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-200'
              }`}
            >
              <Store className="w-3.5 h-3.5" />
              <span>Identitas & Header</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveSubTab('display')}
              className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                activeSubTab === 'display'
                  ? 'bg-white dark:bg-stone-800 text-stone-900 dark:text-[#E2DFD2] shadow-xs font-bold'
                  : 'text-stone-500 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-200'
              }`}
            >
              <Sliders className="w-3.5 h-3.5" />
              <span>Kertas & Transaksi</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveSubTab('footer')}
              className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                activeSubTab === 'footer'
                  ? 'bg-white dark:bg-stone-800 text-stone-900 dark:text-[#E2DFD2] shadow-xs font-bold'
                  : 'text-stone-500 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-200'
              }`}
            >
              <Wifi className="w-3.5 h-3.5" />
              <span>WiFi & Catatan Kaki</span>
            </button>
          </div>

          {/* TAB 1: IDENTITAS TOKO & HEADER */}
          {activeSubTab === 'store' && (
            <div className="bg-white dark:bg-stone-900/50 border border-stone-200 dark:border-stone-800/80 rounded-2xl p-5 space-y-5 shadow-xs">
              <div className="flex items-center justify-between border-b border-stone-200 dark:border-stone-800 pb-3">
                <div className="flex items-center gap-2 text-stone-900 dark:text-stone-200 font-semibold text-sm">
                  <Store className="w-4 h-4 text-amber-700 dark:text-[#E2DFD2]" />
                  <span>Informasi Outlet Pada Kepala Struk</span>
                </div>
                <span className="text-[11px] font-mono text-stone-500">Baris Atas Struk</span>
              </div>

              {/* Nama Tempat / Usaha */}
              <div className="space-y-1.5">
                <div className="flex justify-between items-center">
                  <label className="text-xs font-medium text-stone-700 dark:text-stone-300">
                    Nama Usaha / Outlet <span className="text-rose-500">*</span>
                  </label>
                  <label className="flex items-center gap-1.5 text-[11px] text-stone-500 dark:text-stone-400 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.showStoreName}
                      onChange={(e) => handleChange('showStoreName', e.target.checked)}
                      className="w-4 h-4 rounded accent-amber-700 dark:accent-[#E2DFD2] cursor-pointer"
                    />
                    <span>Tampilkan</span>
                  </label>
                </div>
                <input
                  type="text"
                  value={formData.storeName}
                  onChange={(e) => handleChange('storeName', e.target.value)}
                  placeholder="Contoh: WARKOP SUDUT TEMU"
                  className="w-full px-3.5 py-2.5 bg-stone-50 dark:bg-stone-950 border border-stone-200 dark:border-stone-800 rounded-xl text-stone-900 dark:text-stone-100 placeholder-stone-400 dark:placeholder-stone-600 text-sm focus:outline-none focus:border-amber-700 dark:focus:border-[#E2DFD2] font-mono"
                />
                <p className="text-[11px] text-stone-500">Dicetak dengan huruf kapital tebal di baris paling atas.</p>
              </div>

              {/* Tagline / Sub-judul */}
              <div className="space-y-1.5">
                <div className="flex justify-between items-center">
                  <label className="text-xs font-medium text-stone-700 dark:text-stone-300">
                    Slogan / Tagline Outlet
                  </label>
                  <label className="flex items-center gap-1.5 text-[11px] text-stone-500 dark:text-stone-400 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.showTagline}
                      onChange={(e) => handleChange('showTagline', e.target.checked)}
                      className="w-4 h-4 rounded accent-amber-700 dark:accent-[#E2DFD2] cursor-pointer"
                    />
                    <span>Tampilkan</span>
                  </label>
                </div>
                <input
                  type="text"
                  value={formData.tagline}
                  onChange={(e) => handleChange('tagline', e.target.value)}
                  placeholder="Contoh: Kopi, Cerita, & Sudut Temu"
                  className="w-full px-3.5 py-2.5 bg-stone-50 dark:bg-stone-950 border border-stone-200 dark:border-stone-800 rounded-xl text-stone-900 dark:text-stone-100 placeholder-stone-400 dark:placeholder-stone-600 text-sm focus:outline-none focus:border-amber-700 dark:focus:border-[#E2DFD2]"
                />
              </div>

              {/* Alamat Lengkap */}
              <div className="space-y-1.5">
                <div className="flex justify-between items-center">
                  <label className="flex items-center gap-1.5 text-xs font-medium text-stone-700 dark:text-stone-300">
                    <MapPin className="w-3.5 h-3.5 text-stone-400" />
                    <span>Alamat Lengkap</span>
                  </label>
                  <label className="flex items-center gap-1.5 text-[11px] text-stone-500 dark:text-stone-400 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.showAddress}
                      onChange={(e) => handleChange('showAddress', e.target.checked)}
                      className="w-4 h-4 rounded accent-amber-700 dark:accent-[#E2DFD2] cursor-pointer"
                    />
                    <span>Tampilkan</span>
                  </label>
                </div>
                <textarea
                  rows={2}
                  value={formData.address}
                  onChange={(e) => handleChange('address', e.target.value)}
                  placeholder="Contoh: Jln. Raya Ciawi Gebang No 2, Kuningan"
                  className="w-full px-3.5 py-2 bg-stone-50 dark:bg-stone-950 border border-stone-200 dark:border-stone-800 rounded-xl text-stone-900 dark:text-stone-100 placeholder-stone-400 dark:placeholder-stone-600 focus:outline-none focus:border-amber-700 dark:focus:border-[#E2DFD2] resize-none font-mono text-xs"
                />
              </div>

              {/* Kontak Telepon & Sosial Media */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <div className="flex justify-between items-center">
                    <label className="flex items-center gap-1.5 text-xs font-medium text-stone-700 dark:text-stone-300">
                      <Phone className="w-3.5 h-3.5 text-stone-400" />
                      <span>No. Telp / WhatsApp</span>
                    </label>
                    <label className="flex items-center gap-1 text-[11px] text-stone-500 dark:text-stone-400 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.showPhone}
                        onChange={(e) => handleChange('showPhone', e.target.checked)}
                        className="w-4 h-4 rounded accent-amber-700 dark:accent-[#E2DFD2] cursor-pointer"
                      />
                      <span>Cetak</span>
                    </label>
                  </div>
                  <input
                    type="tel"
                    inputMode="tel"
                    pattern="[0-9+ -]*"
                    value={formData.phone}
                    onChange={(e) => handleChange('phone', e.target.value)}
                    placeholder="0812-3456-7890"
                    className="w-full px-3.5 py-2.5 bg-stone-50 dark:bg-stone-950 border border-stone-200 dark:border-stone-800 rounded-xl text-stone-900 dark:text-stone-100 placeholder-stone-400 dark:placeholder-stone-600 text-sm focus:outline-none focus:border-amber-700 dark:focus:border-[#E2DFD2] font-mono"
                  />
                </div>

                <div className="space-y-1.5">
                  <div className="flex justify-between items-center">
                    <label className="flex items-center gap-1.5 text-xs font-medium text-stone-700 dark:text-stone-300">
                      <AtSign className="w-3.5 h-3.5 text-stone-400" />
                      <span>Akun Instagram</span>
                    </label>
                    <label className="flex items-center gap-1 text-[11px] text-stone-500 dark:text-stone-400 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.showSocialMedia}
                        onChange={(e) => handleChange('showSocialMedia', e.target.checked)}
                        className="w-4 h-4 rounded accent-amber-700 dark:accent-[#E2DFD2] cursor-pointer"
                      />
                      <span>Cetak</span>
                    </label>
                  </div>
                  <input
                    type="text"
                    value={formData.socialMedia}
                    onChange={(e) => handleChange('socialMedia', e.target.value)}
                    placeholder="@warkopsuduttemu"
                    className="w-full px-3.5 py-2.5 bg-stone-50 dark:bg-stone-950 border border-stone-200 dark:border-stone-800 rounded-xl text-stone-900 dark:text-stone-100 placeholder-stone-400 dark:placeholder-stone-600 text-sm focus:outline-none focus:border-amber-700 dark:focus:border-[#E2DFD2] font-mono"
                  />
                </div>
              </div>

            </div>
          )}

          {/* TAB 2: FORMAT KERTAS & DETAIL TRANSAKSI */}
          {activeSubTab === 'display' && (
            <div className="bg-white dark:bg-stone-900/50 border border-stone-200 dark:border-stone-800/80 rounded-2xl p-5 space-y-6 shadow-xs">
              
              {/* Ukuran Lebar Kertas Struk */}
              <div className="space-y-3 pb-5 border-b border-stone-200 dark:border-stone-800">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-stone-900 dark:text-stone-200 font-semibold text-sm">
                    <FileText className="w-4 h-4 text-amber-700 dark:text-[#E2DFD2]" />
                    <span>Lebar Kertas Printer Thermal</span>
                  </div>
                  <span className="text-[11px] font-mono text-amber-800 dark:text-[#E2DFD2] font-bold">
                    {formData.paperWidth}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => handleChange('paperWidth', '58mm')}
                    className={`flex flex-col items-center justify-center p-4 rounded-xl border text-center transition-all cursor-pointer ${
                      formData.paperWidth === '58mm'
                        ? 'bg-amber-50 dark:bg-[#E2DFD2]/10 border-amber-600 dark:border-[#E2DFD2]/60 text-amber-900 dark:text-[#E2DFD2] font-bold'
                        : 'bg-stone-50 dark:bg-stone-950/60 border-stone-200 dark:border-stone-800 text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-200 hover:border-stone-300 dark:hover:border-stone-700'
                    }`}
                  >
                    <span className="font-bold text-sm tracking-wide">58 mm</span>
                    <span className="text-[11px] text-stone-500 dark:text-stone-400 mt-0.5">Printer Kasir Standar / Mini Bluetooth</span>
                    <span className="mt-2 text-[10px] font-mono px-2 py-0.5 bg-stone-100 dark:bg-stone-900 border border-stone-200 dark:border-stone-700 rounded text-stone-700 dark:text-stone-300">
                      Rekomendasi Warkop
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleChange('paperWidth', '80mm')}
                    className={`flex flex-col items-center justify-center p-4 rounded-xl border text-center transition-all cursor-pointer ${
                      formData.paperWidth === '80mm'
                        ? 'bg-amber-50 dark:bg-[#E2DFD2]/10 border-amber-600 dark:border-[#E2DFD2]/60 text-amber-900 dark:text-[#E2DFD2] font-bold'
                        : 'bg-stone-50 dark:bg-stone-950/60 border-stone-200 dark:border-stone-800 text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-200 hover:border-stone-300 dark:hover:border-stone-700'
                    }`}
                  >
                    <span className="font-bold text-sm tracking-wide">80 mm</span>
                    <span className="text-[11px] text-stone-500 dark:text-stone-400 mt-0.5">Printer Thermal Lebar / POS Desktop</span>
                    <span className="mt-2 text-[10px] font-mono px-2 py-0.5 bg-stone-100 dark:bg-stone-900 border border-stone-200 dark:border-stone-700 rounded text-stone-700 dark:text-stone-300">
                      Lebih Lega
                    </span>
                  </button>
                </div>
              </div>

              {/* Toggles Informasi Transaksi */}
              <div className="space-y-3">
                <div className="text-stone-900 dark:text-stone-200 font-semibold text-sm">
                  Pilihan Elemen Informasi Transaksi
                </div>
                <p className="text-xs text-stone-500 dark:text-stone-400">
                  Pilih informasi detail yang ingin ditampilkan atau disembunyikan pada struk fisik.
                </p>

                <div className="space-y-2.5 pt-1">
                  
                  {/* Kasir */}
                  <label className="flex items-center justify-between p-3 bg-stone-50 dark:bg-stone-950/60 border border-stone-200 dark:border-stone-800/80 rounded-xl cursor-pointer hover:border-stone-300 dark:hover:border-stone-700 transition-colors">
                    <div>
                      <p className="text-xs font-medium text-stone-900 dark:text-stone-200">Nama Petugas Kasir</p>
                      <p className="text-[11px] text-stone-500">Mencetak nama kasir yang melayani pesanan</p>
                    </div>
                    <input
                      type="checkbox"
                      checked={formData.showCashierName}
                      onChange={(e) => handleChange('showCashierName', e.target.checked)}
                      className="w-4 h-4 rounded accent-amber-700 dark:accent-[#E2DFD2] cursor-pointer"
                    />
                  </label>

                  {/* Pelanggan */}
                  <label className="flex items-center justify-between p-3 bg-stone-50 dark:bg-stone-950/60 border border-stone-200 dark:border-stone-800/80 rounded-xl cursor-pointer hover:border-stone-300 dark:hover:border-stone-700 transition-colors">
                    <div>
                      <p className="text-xs font-medium text-stone-900 dark:text-stone-200">Nama Pelanggan</p>
                      <p className="text-[11px] text-stone-500">Mencetak nama pemesan jika diisi kasir</p>
                    </div>
                    <input
                      type="checkbox"
                      checked={formData.showCustomerName}
                      onChange={(e) => handleChange('showCustomerName', e.target.checked)}
                      className="w-4 h-4 rounded accent-amber-700 dark:accent-[#E2DFD2] cursor-pointer"
                    />
                  </label>

                  {/* Nomor Meja */}
                  <label className="flex items-center justify-between p-3 bg-stone-50 dark:bg-stone-950/60 border border-stone-200 dark:border-stone-800/80 rounded-xl cursor-pointer hover:border-stone-300 dark:hover:border-stone-700 transition-colors">
                    <div>
                      <p className="text-xs font-medium text-stone-900 dark:text-stone-200">Nomor Meja</p>
                      <p className="text-[11px] text-stone-500">Mencetak nomor meja untuk pesanan Di Tempat</p>
                    </div>
                    <input
                      type="checkbox"
                      checked={formData.showTableNumber}
                      onChange={(e) => handleChange('showTableNumber', e.target.checked)}
                      className="w-4 h-4 rounded accent-amber-700 dark:accent-[#E2DFD2] cursor-pointer"
                    />
                  </label>

                  {/* Tipe Pesanan */}
                  <label className="flex items-center justify-between p-3 bg-stone-50 dark:bg-stone-950/60 border border-stone-200 dark:border-stone-800/80 rounded-xl cursor-pointer hover:border-stone-300 dark:hover:border-stone-700 transition-colors">
                    <div>
                      <p className="text-xs font-medium text-stone-900 dark:text-stone-200">Jenis Pesanan (Dine In / Bungkus)</p>
                      <p className="text-[11px] text-stone-500">Mencetak label Di Tempat atau Bungkus</p>
                    </div>
                    <input
                      type="checkbox"
                      checked={formData.showOrderType}
                      onChange={(e) => handleChange('showOrderType', e.target.checked)}
                      className="w-4 h-4 rounded accent-amber-700 dark:accent-[#E2DFD2] cursor-pointer"
                    />
                  </label>

                  {/* Catatan Item */}
                  <label className="flex items-center justify-between p-3 bg-stone-50 dark:bg-stone-950/60 border border-stone-200 dark:border-stone-800/80 rounded-xl cursor-pointer hover:border-stone-300 dark:hover:border-stone-700 transition-colors">
                    <div>
                      <p className="text-xs font-medium text-stone-900 dark:text-stone-200">Catatan Khusus Menu (Notes)</p>
                      <p className="text-[11px] text-stone-500">Contoh: &ldquo;less sugar&rdquo;, &ldquo;pedas mantap&rdquo;</p>
                    </div>
                    <input
                      type="checkbox"
                      checked={formData.showItemNotes}
                      onChange={(e) => handleChange('showItemNotes', e.target.checked)}
                      className="w-4 h-4 rounded accent-amber-700 dark:accent-[#E2DFD2] cursor-pointer"
                    />
                  </label>

                </div>
              </div>

            </div>
          )}


          {/* TAB 3: WIFI & FOOTER CATATAN KAKI */}
          {activeSubTab === 'footer' && (
            <div className="bg-white dark:bg-stone-900/50 border border-stone-200 dark:border-stone-800/80 rounded-2xl p-5 space-y-5 shadow-xs">
              
              {/* Bagian WiFi Pelanggan */}
              <div className="space-y-4 pb-5 border-b border-stone-200 dark:border-stone-800">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-stone-900 dark:text-stone-200 font-semibold text-sm">
                    <Wifi className="w-4 h-4 text-amber-700 dark:text-[#E2DFD2]" />
                    <span>Informasi Akses WiFi Warkop</span>
                  </div>
                  <label className="flex items-center gap-1.5 text-xs text-stone-500 dark:text-stone-400 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.showWifiInfo}
                      onChange={(e) => handleChange('showWifiInfo', e.target.checked)}
                      className="w-4 h-4 rounded accent-amber-700 dark:accent-[#E2DFD2] cursor-pointer"
                    />
                    <span>Aktifkan Pada Struk</span>
                  </label>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-stone-700 dark:text-stone-300">
                      Nama WiFi (SSID)
                    </label>
                    <input
                      type="text"
                      disabled={!formData.showWifiInfo}
                      value={formData.wifiName}
                      onChange={(e) => handleChange('wifiName', e.target.value)}
                      placeholder="Contoh: Warkop Sudut Temu"
                      className="w-full px-3.5 py-2.5 bg-stone-50 dark:bg-stone-950 border border-stone-200 dark:border-stone-800 rounded-xl text-stone-900 dark:text-stone-100 placeholder-stone-400 dark:placeholder-stone-600 text-sm focus:outline-none focus:border-amber-700 dark:focus:border-[#E2DFD2] disabled:opacity-40 font-mono"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-stone-700 dark:text-stone-300">
                      Password WiFi
                    </label>
                    <input
                      type="text"
                      disabled={!formData.showWifiInfo}
                      value={formData.wifiPassword}
                      onChange={(e) => handleChange('wifiPassword', e.target.value)}
                      placeholder="Contoh: kopienak2026"
                      className="w-full px-3.5 py-2.5 bg-stone-50 dark:bg-stone-950 border border-stone-200 dark:border-stone-800 rounded-xl text-stone-900 dark:text-stone-100 placeholder-stone-400 dark:placeholder-stone-600 text-sm focus:outline-none focus:border-amber-700 dark:focus:border-[#E2DFD2] disabled:opacity-40 font-mono"
                    />
                  </div>
                </div>
              </div>

              {/* Ucapan Terima Kasih (Footer Message) */}
              <div className="space-y-1.5">
                <div className="flex justify-between items-center">
                  <label className="flex items-center gap-1.5 text-xs font-medium text-stone-700 dark:text-stone-300">
                    <MessageSquare className="w-3.5 h-3.5 text-stone-400" />
                    <span>Ucapan Terima Kasih (Baris 1)</span>
                  </label>
                  <label className="flex items-center gap-1.5 text-[11px] text-stone-500 dark:text-stone-400 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.showFooterMessage}
                      onChange={(e) => handleChange('showFooterMessage', e.target.checked)}
                      className="w-4 h-4 rounded accent-amber-700 dark:accent-[#E2DFD2] cursor-pointer"
                    />
                    <span>Tampilkan</span>
                  </label>
                </div>
                <input
                  type="text"
                  value={formData.footerMessage}
                  onChange={(e) => handleChange('footerMessage', e.target.value)}
                  placeholder="Terima Kasih Atas Kunjungannya!"
                  className="w-full px-3.5 py-2.5 bg-stone-50 dark:bg-stone-950 border border-stone-200 dark:border-stone-800 rounded-xl text-stone-900 dark:text-stone-100 placeholder-stone-400 dark:placeholder-stone-600 text-sm focus:outline-none focus:border-amber-700 dark:focus:border-[#E2DFD2]"
                />
              </div>

              {/* Pesan Subfooter (Baris 2) */}
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-stone-700 dark:text-stone-300">
                  Pesan Tambahan (Baris 2)
                </label>
                <input
                  type="text"
                  value={formData.footerSubmessage}
                  onChange={(e) => handleChange('footerSubmessage', e.target.value)}
                  placeholder="Ditunggu cangkruk & nongkrong berikutnya!"
                  className="w-full px-3.5 py-2.5 bg-stone-50 dark:bg-stone-950 border border-stone-200 dark:border-stone-800 rounded-xl text-stone-900 dark:text-stone-100 placeholder-stone-400 dark:placeholder-stone-600 text-sm focus:outline-none focus:border-amber-700 dark:focus:border-[#E2DFD2]"
                />
              </div>

              {/* Ketentuan / Garansi Pesanan */}
              <div className="space-y-1.5 pt-2 border-t border-stone-200 dark:border-stone-800">
                <div className="flex justify-between items-center">
                  <label className="flex items-center gap-1.5 text-xs font-medium text-stone-700 dark:text-stone-300">
                    <AlertCircle className="w-3.5 h-3.5 text-stone-400" />
                    <span>Catatan Ketentuan Toko (Opsional)</span>
                  </label>
                  <label className="flex items-center gap-1.5 text-[11px] text-stone-500 dark:text-stone-400 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.showCustomNotice}
                      onChange={(e) => handleChange('showCustomNotice', e.target.checked)}
                      className="w-4 h-4 rounded accent-amber-700 dark:accent-[#E2DFD2] cursor-pointer"
                    />
                    <span>Aktifkan</span>
                  </label>
                </div>

                <input
                  type="text"
                  disabled={!formData.showCustomNotice}
                  value={formData.customNotice}
                  onChange={(e) => handleChange('customNotice', e.target.value)}
                  placeholder="Contoh: Barang yang sudah dibeli tidak dapat ditukar"
                  className="w-full px-3.5 py-2.5 bg-stone-50 dark:bg-stone-950 border border-stone-200 dark:border-stone-800 rounded-xl text-stone-900 dark:text-stone-100 placeholder-stone-400 dark:placeholder-stone-600 text-sm focus:outline-none focus:border-amber-700 dark:focus:border-[#E2DFD2] disabled:opacity-40"
                />
                <p className="text-[11px] text-stone-500">Cocok untuk catatan pengingat atau aturan outlet.</p>
              </div>

            </div>
          )}

        </div>

        {/* RIGHT COLUMN: Interactive Live Thermal Receipt Preview (5 cols) */}
        <div className="lg:col-span-5 space-y-4 sticky top-6">
          
          <div className="flex items-center justify-between px-1">
            <div className="flex items-center gap-2">
              <Eye className="w-4 h-4 text-amber-700 dark:text-[#E2DFD2]" />
              <span className="text-xs font-semibold text-stone-900 dark:text-stone-200 uppercase tracking-wider font-mono">
                Pratinjau Kertas Struk Fisik
              </span>
            </div>
            <span className="text-[11px] font-mono px-2 py-0.5 bg-stone-100 dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded text-stone-600 dark:text-stone-400">
              Format {formData.paperWidth}
            </span>
          </div>

          {/* Authentic Thermal Paper Container with Jagged / Perforated Edge */}
          <div className="flex justify-center p-6 bg-stone-100 dark:bg-stone-950 border border-stone-200 dark:border-stone-800/80 rounded-2xl overflow-hidden shadow-xl relative">
            
            {/* The Thermal Paper Sheet */}
            <div
              style={{
                width: formData.paperWidth === '80mm' ? '340px' : '260px'
              }}
              className="bg-white text-stone-950 rounded-sm font-mono text-[11px] leading-tight shadow-xl select-all border-x border-stone-300 transition-all duration-300 relative"
            >
              
              {/* Paper Top Jagged Cut Simulation */}
              <div className="h-2 w-full bg-white relative overflow-hidden">
                <div
                  className="absolute inset-x-0 top-0 h-1"
                  style={{
                    backgroundImage: `radial-gradient(circle, #0c0a09 1px, transparent 1.5px)`,
                    backgroundSize: '6px 4px'
                  }}
                />
              </div>

              {/* Printable Body Content */}
              <div className="p-4 space-y-2">
                
                {/* 1. Header Section */}
                <div className="text-center pb-2.5 border-b border-dashed border-stone-400 space-y-0.5">
                  {formData.showStoreName && (
                    <p className="font-bold text-xs tracking-wider uppercase">
                      {formData.storeName || 'WARKOP SUDUT TEMU'}
                    </p>
                  )}
                  {formData.showTagline && formData.tagline && (
                    <p className="text-[9px] text-stone-700 italic">
                      {formData.tagline}
                    </p>
                  )}
                  {formData.showAddress && formData.address && (
                    <p className="text-[9px] text-stone-700 mt-1 whitespace-pre-line leading-tight">
                      {formData.address}
                    </p>
                  )}
                  <div className="flex justify-center gap-2 text-[9px] text-stone-700 flex-wrap">
                    {formData.showPhone && formData.phone && (
                      <span>Telp: {formData.phone}</span>
                    )}
                    {formData.showSocialMedia && formData.socialMedia && (
                      <span>IG: {formData.socialMedia}</span>
                    )}
                  </div>
                </div>

                {/* 2. Metadata Transaksi */}
                <div className="py-1.5 border-b border-dashed border-stone-400 space-y-0.5 text-[10px]">
                  <div className="flex justify-between">
                    <span className="font-semibold">{sampleOrder.order_number}</span>
                    <span>{sampleOrder.created_at}</span>
                  </div>
                  
                  {(formData.showCashierName || formData.showOrderType) && (
                    <div className="flex justify-between text-stone-700">
                      {formData.showCashierName && <span>Kasir: {sampleOrder.cashier_name}</span>}
                      {formData.showOrderType && <span>{sampleOrder.order_type}</span>}
                    </div>
                  )}

                  {(formData.showCustomerName || formData.showTableNumber) && (
                    <div className="flex justify-between text-stone-700">
                      {formData.showCustomerName && <span>Pelanggan: {sampleOrder.customer_name}</span>}
                      {formData.showTableNumber && <span>{sampleOrder.table_number}</span>}
                    </div>
                  )}
                </div>

                {/* 3. Items List */}
                <div className="py-2 border-b border-dashed border-stone-400 space-y-1.5 text-[10px]">
                  {sampleOrder.items.map((it, idx) => (
                    <div key={idx} className="space-y-0.5">
                      <div className="flex justify-between font-semibold">
                        <span className="truncate pr-1">{it.name}</span>
                        <span className="tabular-nums">Rp {it.subtotal.toLocaleString('id-ID')}</span>
                      </div>
                      <div className="flex justify-between text-[9px] text-stone-600">
                        <span>{it.qty}x Rp {it.price.toLocaleString('id-ID')}</span>
                        {formData.showItemNotes && it.notes && (
                          <span className="italic text-[8px] text-stone-700 truncate max-w-30">
                            ({it.notes})
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                {/* 4. Subtotal & Totals */}
                <div className="py-1.5 border-b border-dashed border-stone-400 space-y-1 text-[10px]">
                  <div className="flex justify-between font-bold text-xs pt-0.5">
                    <span>TOTAL AKHIR</span>
                    <span className="tabular-nums">Rp {sampleOrder.total.toLocaleString('id-ID')}</span>
                  </div>
                  <div className="flex justify-between text-stone-700">
                    <span>Metode Bayar ({sampleOrder.payment_method})</span>
                    <span className="tabular-nums">Rp {sampleOrder.tendered.toLocaleString('id-ID')}</span>
                  </div>
                  <div className="flex justify-between text-stone-700">
                    <span>Kembalian</span>
                    <span className="tabular-nums">Rp {sampleOrder.change.toLocaleString('id-ID')}</span>
                  </div>
                </div>

                {/* 5. WiFi Section */}
                {formData.showWifiInfo && (formData.wifiName || formData.wifiPassword) && (
                  <div className="py-1.5 text-center text-[9px] text-stone-800 space-y-0.5 bg-stone-100/70 p-1.5 rounded">
                    <p className="font-bold">Akses WiFi Pengunjung</p>
                    <div className="flex justify-center gap-2 flex-wrap font-mono">
                      {formData.wifiName && <span>SSID: {formData.wifiName}</span>}
                      {formData.wifiPassword && <span>Pass: {formData.wifiPassword}</span>}
                    </div>
                  </div>
                )}

                {/* 6. Footer Thank You & Submessage */}
                {(formData.showFooterMessage || formData.footerSubmessage || formData.showCustomNotice) && (
                  <div className="pt-1.5 text-center text-[9px] text-stone-700 space-y-0.5">
                    {formData.showFooterMessage && formData.footerMessage && (
                      <p className="font-semibold text-stone-900">{formData.footerMessage}</p>
                    )}
                    {formData.footerSubmessage && (
                      <p className="text-[8px] text-stone-600">{formData.footerSubmessage}</p>
                    )}
                    {formData.showCustomNotice && formData.customNotice && (
                      <p className="text-[8px] text-stone-500 pt-1 border-t border-dotted border-stone-300 mt-1">
                        * {formData.customNotice}
                      </p>
                    )}
                  </div>
                )}

              </div>

              {/* Paper Bottom Jagged Cut Simulation */}
              <div className="h-3 w-full bg-white relative overflow-hidden">
                <div
                  className="absolute inset-x-0 bottom-0 h-1.5"
                  style={{
                    backgroundImage: `radial-gradient(circle, #0c0a09 1.5px, transparent 1.5px)`,
                    backgroundSize: '8px 5px'
                  }}
                />
              </div>

            </div>

          </div>

          <div className="text-center">
            <p className="text-[11px] text-stone-500">
              Pratinjau di atas merefleksikan posisi dan proporsi nyata pada gulungan kertas printer thermal Anda.
            </p>
          </div>

        </div>

      </div>

      {/* Hidden Printable Container used when clicking 'Cetak Sampel' */}
      <div
        id="printable-receipt"
        className={`hidden print:block ${formData.paperWidth === '80mm' ? 'paper-80mm' : 'paper-58mm'} bg-white text-stone-950 font-mono text-[11px] leading-tight`}
      >
        {/* Header */}
        <div className="text-center pb-2 border-b border-dashed border-black">
          {formData.showStoreName && (
            <p className="font-bold text-xs uppercase tracking-wider">{formData.storeName}</p>
          )}
          {formData.showTagline && formData.tagline && (
            <p className="text-[9px]">{formData.tagline}</p>
          )}
          {formData.showAddress && formData.address && (
            <p className="text-[9px] leading-tight">{formData.address}</p>
          )}
          <div className="text-[9px]">
            {formData.showPhone && formData.phone && <span>Telp: {formData.phone} </span>}
            {formData.showSocialMedia && formData.socialMedia && <span>IG: {formData.socialMedia}</span>}
          </div>
        </div>

        {/* Meta */}
        <div className="py-1.5 border-b border-dashed border-black text-[10px] space-y-0.5">
          <div className="flex justify-between">
            <span>{sampleOrder.order_number}</span>
            <span>{sampleOrder.created_at}</span>
          </div>
          {(formData.showCashierName || formData.showOrderType) && (
            <div className="flex justify-between">
              {formData.showCashierName && <span>Kasir: {sampleOrder.cashier_name}</span>}
              {formData.showOrderType && <span>{sampleOrder.order_type}</span>}
            </div>
          )}
          {(formData.showCustomerName || formData.showTableNumber) && (
            <div className="flex justify-between">
              {formData.showCustomerName && <span>Pelanggan: {sampleOrder.customer_name}</span>}
              {formData.showTableNumber && <span>{sampleOrder.table_number}</span>}
            </div>
          )}
        </div>

        {/* Items */}
        <div className="py-1.5 border-b border-dashed border-black space-y-1 text-[10px]">
          {sampleOrder.items.map((it, idx) => (
            <div key={idx}>
              <div className="flex justify-between font-semibold">
                <span>{it.name}</span>
                <span>Rp {it.subtotal.toLocaleString('id-ID')}</span>
              </div>
              <div className="flex justify-between text-[9px]">
                <span>{it.qty}x Rp {it.price.toLocaleString('id-ID')}</span>
                {formData.showItemNotes && it.notes && <span>({it.notes})</span>}
              </div>
            </div>
          ))}
        </div>

        {/* Totals */}
        <div className="py-1.5 border-b border-dashed border-black text-[10px] space-y-0.5">
          <div className="flex justify-between font-bold text-xs">
            <span>TOTAL</span>
            <span>Rp {sampleOrder.total.toLocaleString('id-ID')}</span>
          </div>
          <div className="flex justify-between">
            <span>Bayar ({sampleOrder.payment_method})</span>
            <span>Rp {sampleOrder.tendered.toLocaleString('id-ID')}</span>
          </div>
          <div className="flex justify-between">
            <span>Kembalian</span>
            <span>Rp {sampleOrder.change.toLocaleString('id-ID')}</span>
          </div>
        </div>

        {/* WiFi */}
        {formData.showWifiInfo && (formData.wifiName || formData.wifiPassword) && (
          <div className="py-1.5 text-center text-[9px] border-b border-dashed border-black">
            <p className="font-bold">Info WiFi</p>
            <p>SSID: {formData.wifiName} | Pass: {formData.wifiPassword}</p>
          </div>
        )}

        {/* Footer */}
        <div className="pt-2 text-center text-[9px] space-y-0.5">
          {formData.showFooterMessage && <p className="font-bold">{formData.footerMessage}</p>}
          {formData.footerSubmessage && <p>{formData.footerSubmessage}</p>}
          {formData.showCustomNotice && formData.customNotice && (
            <p className="text-[8px] pt-1">* {formData.customNotice}</p>
          )}
        </div>
      </div>

      {/* Dialog Konfirmasi Reset Template Struk */}
      <ConfirmDialog
        isOpen={showResetConfirm}
        title="Kembalikan Template Bawaan"
        message="Kembalikan seluruh format teks, pengaturan WiFi, dan tata letak struk thermal kasir ke pengaturan awal Warkop Sudut Temu?"
        confirmText="Kembalikan Template"
        cancelText="Batal"
        variant="warning"
        onConfirm={handleConfirmReset}
        onCancel={() => setShowResetConfirm(false)}
      />

    </div>
  )
}
