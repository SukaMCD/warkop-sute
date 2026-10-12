import React, { useState, useEffect, useCallback } from 'react'
import {
  Bluetooth,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Power,
  Printer,
  Sparkles,
  Smartphone,
  Info,
  X,
  Radio,
  Check,
  ChevronRight
} from 'lucide-react'
import {
  isWebBluetoothSupported,
  isNativePlatform,
  connectBluetoothPrinter,
  disconnectBluetoothPrinter,
  addBluetoothListener,
  printDirectBluetooth,
  buildTestReceiptEscPos,
  printViaRawBt,
  getNativePairedDevices,
  getSavedPrinterName
} from '../../utils/bluetoothPrinter'
import type { ReceiptConfig } from '../../types'

interface BluetoothPrinterControlProps {
  config?: ReceiptConfig
  compact?: boolean
  className?: string
  onPrintSuccess?: () => void
}

export const BluetoothPrinterControl: React.FC<BluetoothPrinterControlProps> = ({
  config,
  compact = false,
  className = '',
  onPrintSuccess
}) => {
  const [supported, setSupported] = useState<boolean>(true)
  const [connected, setConnected] = useState<boolean>(false)
  const [printerName, setPrinterName] = useState<string>('')
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false)
  const [isConnecting, setIsConnecting] = useState<boolean>(false)
  const [connectingAddress, setConnectingAddress] = useState<string | null>(null)
  const [isTesting, setIsTesting] = useState<boolean>(false)
  const [isRefreshingList, setIsRefreshingList] = useState<boolean>(false)
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null)
  const [pairedDevices, setPairedDevices] = useState<Array<{ name: string; address: string }>>([])

  // Load paired Bluetooth devices for Android APK
  const loadPairedDevices = useCallback(async () => {
    if (!isNativePlatform()) return
    setIsRefreshingList(true)
    try {
      const devices = await getNativePairedDevices()
      setPairedDevices(devices)
    } catch (err: any) {
      console.warn('[Bluetooth] Failed loading paired devices:', err)
      setStatusMessage({
        type: 'error',
        text: err?.message || 'Gagal memuat perangkat Bluetooth HP.'
      })
    } finally {
      setIsRefreshingList(false)
    }
  }, [])

  useEffect(() => {
    setSupported(isWebBluetoothSupported())
    const unsubscribe = addBluetoothListener((isConnected, name) => {
      setConnected(isConnected)
      setPrinterName(name || getSavedPrinterName())
    })

    // Listen for global open modal trigger (e.g. from POSView or RecentOrders)
    const handleOpenModal = () => {
      setIsModalOpen(true)
      setStatusMessage(null)
      loadPairedDevices()
    }
    window.addEventListener('open-bluetooth-printer-modal', handleOpenModal)

    return () => {
      unsubscribe()
      window.removeEventListener('open-bluetooth-printer-modal', handleOpenModal)
    }
  }, [loadPairedDevices])

  // When modal is opened, auto refresh paired list if on Android
  const handleOpenPrinterModal = () => {
    setIsModalOpen(true)
    setStatusMessage(null)
    loadPairedDevices()
  }

  const handleConnect = async (targetAddress?: string) => {
    setIsConnecting(true)
    setConnectingAddress(targetAddress || 'auto')
    setStatusMessage(null)
    try {
      const res = await connectBluetoothPrinter(targetAddress)
      if (res.success) {
        setStatusMessage({
          type: 'success',
          text: `Berhasil terhubung ke ${res.deviceName || 'Printer Thermal'}!`
        })
        if (isNativePlatform()) {
          loadPairedDevices()
        }
      } else if (res.needsSelection && res.devices) {
        setPairedDevices(res.devices)
        setStatusMessage({
          type: 'info',
          text: res.devices.length > 0
            ? 'Silakan ketuk nama printer di bawah ini untuk menghubungkan:'
            : 'Belum ada printer yang dipasangkan (paired) di HP Android.'
        })
      } else if (res.error) {
        setStatusMessage({
          type: 'error',
          text: res.error
        })
      }
    } catch (err: any) {
      setStatusMessage({
        type: 'error',
        text: err?.message || 'Gagal menyambungkan Bluetooth.'
      })
    } finally {
      setIsConnecting(false)
      setConnectingAddress(null)
    }
  }

  const handleDisconnect = async () => {
    setStatusMessage(null)
    await disconnectBluetoothPrinter()
    setStatusMessage({
      type: 'info',
      text: 'Koneksi printer Bluetooth telah diputuskan.'
    })
  }

  const handleTestPrint = async () => {
    setIsTesting(true)
    setStatusMessage(null)
    try {
      const bytes = buildTestReceiptEscPos(config)
      const res = await printDirectBluetooth(bytes)
      if (res.success) {
        setStatusMessage({
          type: 'success',
          text: 'Struk uji coba berhasil dicetak!'
        })
        if (onPrintSuccess) onPrintSuccess()
      } else {
        setStatusMessage({
          type: 'error',
          text: res.error || 'Gagal mencetak struk uji coba.'
        })
      }
    } catch (err: any) {
      setStatusMessage({
        type: 'error',
        text: err?.message || 'Terjadi kesalahan saat mencetak.'
      })
    } finally {
      setIsTesting(false)
    }
  }

  const handleRawBtTest = () => {
    try {
      const bytes = buildTestReceiptEscPos(config)
      printViaRawBt(bytes)
    } catch (e: any) {
      alert('Gagal membuka RawBT: ' + e.message)
    }
  }

  // MODAL DIALOG PEMILIHAN & KONEKSI PRINTER BLUETOOTH
  const renderPrinterModal = () => {
    if (!isModalOpen) return null

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/70 backdrop-blur-xs animate-in fade-in duration-150">
        <div
          className="relative w-full max-w-lg bg-white dark:bg-stone-900 rounded-3xl border border-stone-200 dark:border-stone-800 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Modal Header */}
          <div className="flex items-center justify-between px-6 py-4.5 border-b border-stone-100 dark:border-stone-800 bg-[#FAF8F5]/80 dark:bg-stone-950/80">
            <div className="flex items-center gap-3">
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                connected
                  ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400'
                  : 'bg-amber-500/15 text-amber-700 dark:text-amber-400'
              }`}>
                <Bluetooth className="w-5 h-5 stroke-[2.2]" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-stone-900 dark:text-stone-100">
                  Printer Thermal Bluetooth
                </h3>
                <p className="text-[11px] text-stone-500 dark:text-stone-400">
                  {connected
                    ? `Terhubung: ${printerName || 'Printer Thermal'}`
                    : 'Sambungkan Iware C-58BT / Thermal Printer'}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="w-8 h-8 rounded-xl flex items-center justify-center text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Modal Content */}
          <div className="p-6 overflow-y-auto space-y-5 flex-1">
            {/* Status Card Active */}
            {connected ? (
              <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                    <CheckCircle2 className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-stone-900 dark:text-stone-100 font-mono">
                        {printerName || 'Printer Thermal'}
                      </span>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500 text-white">
                        ONLINE
                      </span>
                    </div>
                    <p className="text-[11px] text-emerald-800 dark:text-emerald-300 mt-0.5">
                      Siap mencetak struk transaksi kasir secara instan.
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={handleTestPrint}
                    disabled={isTesting}
                    className="px-3 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                  >
                    {isTesting ? (
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Printer className="w-3.5 h-3.5" />
                    )}
                    <span>{isTesting ? 'Mencetak...' : 'Tes Cetak'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleDisconnect}
                    className="px-2.5 py-2 rounded-xl bg-white hover:bg-stone-100 dark:bg-stone-800 dark:hover:bg-stone-700 text-stone-700 dark:text-stone-300 text-xs font-semibold border border-stone-200 dark:border-stone-700 transition-colors flex items-center gap-1 cursor-pointer"
                  >
                    <Power className="w-3.5 h-3.5 text-rose-500" />
                    <span>Putus</span>
                  </button>
                </div>
              </div>
            ) : (
              /* If not connected */
              <div className="space-y-4">
                {/* Notice Banner */}
                <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/25 flex items-start gap-3 text-xs text-amber-900 dark:text-amber-200">
                  <Radio className="w-4 h-4 text-amber-700 dark:text-amber-400 shrink-0 mt-0.5 animate-pulse" />
                  <div>
                    <p className="font-bold">Sambungkan Printer Bluetooth</p>
                    <p className="text-[11px] text-amber-800 dark:text-amber-300/90 mt-0.5 leading-relaxed">
                      Pastikan printer <strong>Iware C-58BT</strong> dalam keadaan menyala (lampu indikator aktif) dan sudah dipasangkan di menu Bluetooth Android.
                    </p>
                  </div>
                </div>

                {/* Android Paired Devices List */}
                {isNativePlatform() && (
                  <div className="space-y-2.5">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold text-stone-800 dark:text-stone-200">
                        Perangkat Terpasang di HP ({pairedDevices.length}):
                      </label>
                      <button
                        type="button"
                        onClick={loadPairedDevices}
                        disabled={isRefreshingList}
                        className="text-[11px] font-semibold text-amber-800 dark:text-amber-300 hover:underline flex items-center gap-1 cursor-pointer disabled:opacity-50"
                      >
                        <RefreshCw className={`w-3 h-3 ${isRefreshingList ? 'animate-spin' : ''}`} />
                        <span>Segarkan</span>
                      </button>
                    </div>

                    {pairedDevices.length > 0 ? (
                      <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                        {pairedDevices.map((dev, idx) => {
                          const isConnectingThis = isConnecting && connectingAddress === dev.address
                          const isLikelyPrinter = /pos|printer|iware|rpp|thermal|mpt|bluetooth/i.test(dev.name)

                          return (
                            <div
                              key={idx}
                              className={`p-3 rounded-xl border transition-all flex items-center justify-between gap-3 ${
                                isLikelyPrinter
                                  ? 'bg-amber-500/5 dark:bg-stone-800/80 border-amber-500/30'
                                  : 'bg-white dark:bg-stone-850 border-stone-200 dark:border-stone-800'
                              }`}
                            >
                              <div className="flex items-center gap-3 min-w-0">
                                <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                                  isLikelyPrinter
                                    ? 'bg-amber-500/15 text-amber-700 dark:text-amber-400'
                                    : 'bg-stone-100 dark:bg-stone-700 text-stone-500'
                                }`}>
                                  <Printer className="w-4 h-4" />
                                </div>
                                <div className="min-w-0">
                                  <p className="text-xs font-bold text-stone-900 dark:text-stone-100 truncate">
                                    {dev.name}
                                  </p>
                                  <p className="text-[10px] text-stone-500 dark:text-stone-400 font-mono">
                                    {dev.address}
                                  </p>
                                </div>
                              </div>

                              <button
                                type="button"
                                onClick={() => handleConnect(dev.address)}
                                disabled={isConnecting}
                                className="px-3.5 py-1.5 rounded-xl bg-stone-900 hover:bg-stone-800 text-stone-50 dark:bg-[#E2DFD2] dark:hover:bg-[#d8d5c7] dark:text-stone-950 text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer disabled:opacity-50 shrink-0"
                              >
                                {isConnectingThis ? (
                                  <>
                                    <RefreshCw className="w-3 h-3 animate-spin" />
                                    <span>Menyambungkan...</span>
                                  </>
                                ) : (
                                  <>
                                    <span>Hubungkan</span>
                                    <ChevronRight className="w-3.5 h-3.5" />
                                  </>
                                )}
                              </button>
                            </div>
                          )
                        })}
                      </div>
                    ) : (
                      <div className="p-4 rounded-xl bg-stone-50 dark:bg-stone-950/60 border border-dashed border-stone-300 dark:border-stone-800 text-center space-y-2">
                        <p className="text-xs font-medium text-stone-600 dark:text-stone-400">
                          Belum ada printer Bluetooth yang dipasangkan di HP ini.
                        </p>
                        <p className="text-[11px] text-stone-500 dark:text-stone-500 leading-relaxed max-w-sm mx-auto">
                          Buka menu <strong>Pengaturan $\rightarrow$ Bluetooth</strong> di HP Anda, hidupkan printer Iware C-58BT, cari nama printer (biasanya <em>POS-58</em> atau <em>RPP02N</em>), dan pasangkan dengan PIN <strong>0000</strong> atau <strong>1234</strong>.
                        </p>
                        <button
                          type="button"
                          onClick={loadPairedDevices}
                          className="mt-1 px-3 py-1.5 rounded-lg bg-stone-200 hover:bg-stone-300 dark:bg-stone-800 dark:hover:bg-stone-700 text-stone-800 dark:text-stone-200 text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer"
                        >
                          <RefreshCw className="w-3 h-3" />
                          <span>Cek Ulang Bluetooth HP</span>
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {/* Primary Scan Button (for Web Bluetooth or fallback) */}
                {!isNativePlatform() && (
                  <button
                    type="button"
                    onClick={() => handleConnect()}
                    disabled={isConnecting || !supported}
                    className="w-full py-3 px-4 rounded-xl bg-stone-900 hover:bg-stone-800 text-white dark:bg-[#E2DFD2] dark:hover:bg-[#d8d5c7] dark:text-stone-950 text-xs font-bold transition-all shadow-xs flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    {isConnecting ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        <span>Mencari & Menyambungkan Printer...</span>
                      </>
                    ) : (
                      <>
                        <Bluetooth className="w-4 h-4" />
                        <span>Cari & Hubungkan Printer Kasir</span>
                      </>
                    )}
                  </button>
                )}

                {/* Quick 3-Step Guide */}
                <div className="p-3.5 rounded-xl bg-stone-50 dark:bg-stone-950/60 border border-stone-200 dark:border-stone-800/80 text-stone-600 dark:text-stone-400 text-xs space-y-1.5">
                  <div className="flex items-center gap-1.5 font-semibold text-stone-900 dark:text-stone-200">
                    <Sparkles className="w-3.5 h-3.5 text-amber-700 dark:text-[#E2DFD2]" />
                    <span>Petunjuk Singkat Penggunaan:</span>
                  </div>
                  <ol className="list-decimal list-inside space-y-1 text-[11px] text-stone-600 dark:text-stone-400 pl-1 leading-relaxed">
                    <li>Nyalakan saklar printer Iware C-58BT (lampu indikator menyala hijau/biru).</li>
                    <li>Jika lampu indikator merah menyala, buka penutup printer dan pastikan kertas thermal terpasang menghadap ke atas.</li>
                    <li>Pastikan printer sudah di-pairing di HP, lalu ketuk tombol <strong>Hubungkan</strong> di atas.</li>
                  </ol>
                </div>
              </div>
            )}

            {/* Status Message Display */}
            {statusMessage && (
              <div className={`p-3 rounded-xl text-xs flex items-start gap-2 ${
                statusMessage.type === 'success'
                  ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                  : statusMessage.type === 'error'
                  ? 'bg-rose-50 dark:bg-rose-950/60 text-rose-800 dark:text-rose-300 border border-rose-200 dark:border-rose-800'
                  : 'bg-stone-100 dark:bg-stone-850 text-stone-700 dark:text-stone-300 border border-stone-200 dark:border-stone-800'
              }`}>
                {statusMessage.type === 'success' && <Check className="w-4 h-4 shrink-0 text-emerald-600 mt-0.5" />}
                {statusMessage.type === 'error' && <AlertCircle className="w-4 h-4 shrink-0 text-rose-600 mt-0.5" />}
                {statusMessage.type === 'info' && <Info className="w-4 h-4 shrink-0 text-stone-600 mt-0.5" />}
                <span className="leading-snug">{statusMessage.text}</span>
              </div>
            )}
          </div>

          {/* Modal Footer */}
          <div className="px-6 py-3.5 border-t border-stone-100 dark:border-stone-800 bg-[#FAF8F5]/80 dark:bg-stone-950/80 flex items-center justify-between text-[11px] text-stone-500">
            <button
              type="button"
              onClick={handleRawBtTest}
              className="hover:text-amber-800 dark:hover:text-[#E2DFD2] font-semibold flex items-center gap-1 cursor-pointer"
            >
              <Smartphone className="w-3.5 h-3.5" />
              <span>Opsi Cadangan: Cetak via RawBT</span>
            </button>

            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-1.5 rounded-xl bg-stone-200 hover:bg-stone-300 dark:bg-stone-800 dark:hover:bg-stone-700 text-stone-800 dark:text-stone-200 font-semibold cursor-pointer transition-colors"
            >
              Tutup
            </button>
          </div>
        </div>
      </div>
    )
  }

  // COMPACT MODE (Untuk disematkan di Modal Kasir / POS Toolbar)
  if (compact) {
    return (
      <>
        <div className={`flex flex-wrap items-center gap-2 ${className}`}>
          {connected ? (
            <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800/80 rounded-xl">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <Bluetooth className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              <button
                type="button"
                onClick={handleOpenPrinterModal}
                title="Kelola Printer Bluetooth"
                className="text-[11px] font-bold text-emerald-800 dark:text-emerald-300 hover:underline truncate max-w-[140px] cursor-pointer"
              >
                {printerName || 'Printer Konek'}
              </button>
              <button
                type="button"
                onClick={handleDisconnect}
                title="Putuskan Bluetooth"
                className="text-emerald-700 hover:text-emerald-900 dark:text-emerald-400 p-0.5 rounded hover:bg-emerald-100 dark:hover:bg-emerald-900/50 transition-colors cursor-pointer"
              >
                <Power className="w-3 h-3" />
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={handleOpenPrinterModal}
              disabled={isConnecting}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-900 dark:text-amber-200 border border-amber-500/30 transition-all cursor-pointer disabled:opacity-50"
            >
              {isConnecting ? (
                <RefreshCw className="w-3.5 h-3.5 animate-spin text-amber-700 dark:text-amber-300" />
              ) : (
                <Bluetooth className="w-3.5 h-3.5 text-amber-700 dark:text-amber-300" />
              )}
              <span>{isConnecting ? 'Mencari...' : 'Konek Bluetooth'}</span>
            </button>
          )}
        </div>
        {renderPrinterModal()}
      </>
    )
  }

  // FULL CARD MODE (Untuk Halaman Pengaturan Struk & Manajemen Perangkat)
  return (
    <>
      <div className={`p-5 rounded-2xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 shadow-xs space-y-4 ${className}`}>
        
        {/* Header */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
              connected
                ? 'bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-600 dark:text-emerald-400'
                : 'bg-amber-50 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-800 text-amber-700 dark:text-[#E2DFD2]'
            }`}>
              <Bluetooth className="w-5 h-5 stroke-[2.2]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-stone-900 dark:text-stone-100">
                  Direct Bluetooth Thermal Printer
                </h3>
                {connected && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                    ONLINE
                  </span>
                )}
              </div>
              <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5">
                Cetak struk seketika tanpa pop-up sistem dan tanpa perlu aplikasi pihak ketiga.
              </p>
            </div>
          </div>

          {/* Live Status Pill */}
          <div className="shrink-0">
            {connected ? (
              <div className="flex items-center gap-1.5 px-3 py-1 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 rounded-full text-xs font-semibold text-emerald-700 dark:text-emerald-300">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                <span>Terhubung</span>
              </div>
            ) : (
              <div className="flex items-center gap-1.5 px-3 py-1 bg-stone-100 dark:bg-stone-850 border border-stone-200 dark:border-stone-800 rounded-full text-xs font-medium text-stone-600 dark:text-stone-400">
                <span className="w-2 h-2 rounded-full bg-stone-400" />
                <span>Belum Terhubung</span>
              </div>
            )}
          </div>
        </div>

        {/* Browser Support Warning if not supported */}
        {!supported && (
          <div className="p-3.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/80 text-amber-900 dark:text-amber-200 text-xs space-y-1">
            <div className="flex items-center gap-2 font-bold">
              <AlertCircle className="w-4 h-4 text-amber-700 dark:text-amber-400 shrink-0" />
              <span>Web Bluetooth Tidak Terdeteksi di Browser Ini</span>
            </div>
            <p className="text-[11px] text-amber-800 dark:text-amber-300 leading-relaxed">
              Untuk fitur cetak Bluetooth langsung tanpa install aplikasi, buka sistem kasir ini menggunakan <strong>Google Chrome</strong> di Android atau Laptop.
            </p>
          </div>
        )}

        {/* Printer Info Detail if connected */}
        {connected ? (
          <div className="p-4 rounded-xl bg-stone-50 dark:bg-stone-950/60 border border-stone-200 dark:border-stone-800 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <div>
              <p className="text-[11px] text-stone-500 font-medium">Perangkat Aktif:</p>
              <p className="text-sm font-bold text-stone-900 dark:text-stone-100 font-mono">
                {printerName || 'Printer Kasir Thermal'}
              </p>
              <p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium mt-0.5">
                Protokol ESC/POS (Lebar: {config?.paperWidth || '58mm'})
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleTestPrint}
                disabled={isTesting}
                className="px-3.5 py-2 rounded-xl bg-amber-700 hover:bg-amber-800 text-white dark:bg-[#E2DFD2] dark:hover:bg-[#edebe2] dark:text-stone-950 text-xs font-bold transition-all shadow-xs flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {isTesting ? (
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Printer className="w-3.5 h-3.5" />
                )}
                <span>{isTesting ? 'Mencetak...' : 'Tes Cetak'}</span>
              </button>

              <button
                type="button"
                onClick={handleDisconnect}
                className="px-3 py-2 rounded-xl bg-stone-100 hover:bg-stone-200 dark:bg-stone-850 dark:hover:bg-stone-800 text-stone-700 dark:text-stone-300 text-xs font-semibold border border-stone-200 dark:border-stone-800 transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Power className="w-3.5 h-3.5" />
                <span>Putuskan</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <button
              type="button"
              onClick={handleOpenPrinterModal}
              className="w-full py-3 px-4 rounded-xl bg-stone-900 hover:bg-stone-850 text-white dark:bg-[#E2DFD2] dark:hover:bg-[#edebe2] dark:text-stone-950 text-xs font-bold transition-all shadow-xs flex items-center justify-center gap-2 cursor-pointer"
            >
              <Bluetooth className="w-4 h-4" />
              <span>Cari & Sambungkan Printer Kasir Bluetooth</span>
            </button>

            {/* Quick Guidance */}
            <div className="p-3 rounded-xl bg-stone-50 dark:bg-stone-950/60 border border-stone-200 dark:border-stone-800/80 text-stone-600 dark:text-stone-400 text-xs space-y-1.5">
              <div className="flex items-center gap-1.5 font-semibold text-stone-900 dark:text-stone-200">
                <Sparkles className="w-3.5 h-3.5 text-amber-700 dark:text-[#E2DFD2]" />
                <span>Langkah Menghubungkan Sekali Saja:</span>
              </div>
              <ol className="list-decimal list-inside space-y-0.5 text-[11px] text-stone-600 dark:text-stone-400 pl-1">
                <li>Nyalakan printer kasir thermal dan pastikan Bluetooth HP/Laptop aktif.</li>
                <li>Klik tombol di atas → pilih printer Bluetooth yang terdaftar.</li>
                <li>Pilih nama printer kasir Anda (misal: <em>POS-58, Iware C-58BT, RPP02N, dll.</em>) lalu klik <strong>Hubungkan</strong>.</li>
                <li>Setelah terhubung, setiap transaksi kasir akan langsung mencetak struk seketika!</li>
              </ol>
            </div>
          </div>
        )}

        {/* Status Messages */}
        {statusMessage && (
          <div className={`p-3 rounded-xl text-xs flex items-center gap-2 ${
            statusMessage.type === 'success'
              ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
              : statusMessage.type === 'error'
              ? 'bg-rose-50 dark:bg-rose-950/60 text-rose-800 dark:text-rose-300 border border-rose-200 dark:border-rose-800'
              : 'bg-stone-100 dark:bg-stone-850 text-stone-700 dark:text-stone-300 border border-stone-200 dark:border-stone-800'
          }`}>
            {statusMessage.type === 'success' && <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />}
            {statusMessage.type === 'error' && <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />}
            {statusMessage.type === 'info' && <Info className="w-4 h-4 shrink-0 text-stone-600" />}
            <span>{statusMessage.text}</span>
          </div>
        )}

        {/* Alternative Android RawBT option for backup */}
        <div className="pt-2 border-t border-stone-200 dark:border-stone-800 flex items-center justify-between text-[11px] text-stone-500">
          <span className="flex items-center gap-1.5">
            <Smartphone className="w-3.5 h-3.5" />
            <span>Cadangan Android:</span>
          </span>
          <button
            type="button"
            onClick={handleRawBtTest}
            className="text-amber-800 dark:text-[#E2DFD2] font-semibold hover:underline cursor-pointer"
          >
            Tes Cetak via RawBT
          </button>
        </div>

      </div>
      {renderPrinterModal()}
    </>
  )
}
