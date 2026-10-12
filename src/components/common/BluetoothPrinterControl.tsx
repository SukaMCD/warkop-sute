import React, { useState, useEffect } from 'react'
import {
  Bluetooth,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Power,
  Printer,
  Sparkles,
  Smartphone,
  Info
} from 'lucide-react'
import {
  isWebBluetoothSupported,
  connectBluetoothPrinter,
  disconnectBluetoothPrinter,
  addBluetoothListener,
  printDirectBluetooth,
  buildTestReceiptEscPos,
  printViaRawBt
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
  const [isConnecting, setIsConnecting] = useState<boolean>(false)
  const [isTesting, setIsTesting] = useState<boolean>(false)
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null)

  useEffect(() => {
    setSupported(isWebBluetoothSupported())
    const unsubscribe = addBluetoothListener((isConnected, name) => {
      setConnected(isConnected)
      setPrinterName(name)
    })
    return () => unsubscribe()
  }, [])

  const handleConnect = async () => {
    setIsConnecting(true)
    setStatusMessage(null)
    try {
      const res = await connectBluetoothPrinter()
      if (res.success) {
        setStatusMessage({
          type: 'success',
          text: `Berhasil terhubung ke ${res.deviceName || 'Printer Thermal'}!`
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
        text: err.message || 'Gagal menyambungkan Bluetooth.'
      })
    } finally {
      setIsConnecting(false)
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
          text: 'Struk uji coba berhasil dikirim ke printer!'
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
        text: err.message || 'Terjadi kesalahan saat mencetak.'
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

  // COMPACT MODE (Untuk disematkan di Modal Kasir / POS Toolbar)
  if (compact) {
    return (
      <div className={`flex flex-wrap items-center gap-2 ${className}`}>
        {connected ? (
          <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800/80 rounded-xl">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <Bluetooth className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            <span className="text-[11px] font-bold text-emerald-800 dark:text-emerald-300 truncate max-w-[140px]">
              {printerName || 'Printer Konek'}
            </span>
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
            onClick={handleConnect}
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
    )
  }

  // FULL CARD MODE (Untuk Halaman Pengaturan Struk & Manajemen Perangkat)
  return (
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
            onClick={handleConnect}
            disabled={isConnecting || !supported}
            className="w-full py-3 px-4 rounded-xl bg-stone-900 hover:bg-stone-850 text-white dark:bg-[#E2DFD2] dark:hover:bg-[#edebe2] dark:text-stone-950 text-xs font-bold transition-all shadow-xs flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
          >
            {isConnecting ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Mencari & Menghubungkan Printer...</span>
              </>
            ) : (
              <>
                <Bluetooth className="w-4 h-4" />
                <span>Cari & Sambungkan Printer Kasir Bluetooth</span>
              </>
            )}
          </button>

          {/* Quick Guidance */}
          <div className="p-3 rounded-xl bg-stone-50 dark:bg-stone-950/60 border border-stone-200 dark:border-stone-800/80 text-stone-600 dark:text-stone-400 text-xs space-y-1.5">
            <div className="flex items-center gap-1.5 font-semibold text-stone-900 dark:text-stone-200">
              <Sparkles className="w-3.5 h-3.5 text-amber-700 dark:text-[#E2DFD2]" />
              <span>Langkah Menghubungkan Sekali Saja:</span>
            </div>
            <ol className="list-decimal list-inside space-y-0.5 text-[11px] text-stone-600 dark:text-stone-400 pl-1">
              <li>Nyalakan printer kasir thermal dan pastikan Bluetooth HP/Laptop aktif.</li>
              <li>Klik tombol hitam di atas $\rightarrow$ browser akan memunculkan daftar perangkat Bluetooth.</li>
              <li>Pilih nama printer kasir Anda (misal: <em>POS-58, MPT-II, RPP02N, dll.</em>) lalu klik <strong>Pair / Hubungkan</strong>.</li>
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
  )
}
