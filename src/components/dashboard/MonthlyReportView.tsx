import { useState, useEffect, useMemo } from 'react'
import {
  CalendarRange,
  Download,
  Coins,
  Receipt,
  TrendingUp,
  QrCode,
  ArrowUpRight,
  RefreshCw,
  Award,
  Wallet,
  Layers,
  FileSpreadsheet,
  Plus,
  Trash2,
  Building2,
  Zap,
  Droplets,
  Wifi,
  Users,
  Wrench,
  Package
} from 'lucide-react'
import type { MonthlyReportData, User, OverheadExpense } from '../../types'
import { formatRupiah, formatNumber } from '../../utils/formatters'
import * as XLSX from 'xlsx'
import { SearchableSelect } from '../ui/SearchableSelect'
import { apiFetch } from '../../utils/api'
import { OverheadExpenseModal } from './OverheadExpenseModal'

interface MonthlyReportViewProps {
  currentUser?: User | null
}

const MONTH_NAMES = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
]

const OVERHEAD_CATEGORY_CONFIG: Record<string, { label: string; icon: React.ElementType }> = {
  rent: { label: 'Sewa Ruko / Tempat', icon: Building2 },
  electricity: { label: 'Listrik PLN', icon: Zap },
  water: { label: 'Air PDAM & Galon', icon: Droplets },
  internet: { label: 'WiFi & Internet', icon: Wifi },
  salary: { label: 'Gaji / Upah Tim', icon: Users },
  maintenance: { label: 'Servis & Perbaikan', icon: Wrench },
  other: { label: 'Operasional Lainnya', icon: Package }
}

const getPaymentSourceText = (src: string) => {
  switch (src) {
    case 'cash_drawer':
      return 'Laci Kas Toko'
    case 'bank_transfer':
      return 'Transfer Bank'
    default:
      return 'Dana Pribadi Owner'
  }
}

export const MonthlyReportView = ({ currentUser: _currentUser }: MonthlyReportViewProps) => {
  const now = new Date()
  const currentYear = now.getFullYear()
  const currentMonth = now.getMonth() + 1 // 1-12

  const [selectedYear, setSelectedYear] = useState<number>(currentYear)
  const [selectedMonth, setSelectedMonth] = useState<number>(currentMonth)
  const [reportData, setReportData] = useState<MonthlyReportData | null>(null)
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)
  const [activeSubTab, setActiveSubTab] = useState<'daily' | 'products' | 'cashflow'>('daily')
  const [showOnlyActiveDays, setShowOnlyActiveDays] = useState<boolean>(false)
  const [isOverheadModalOpen, setIsOverheadModalOpen] = useState<boolean>(false)
  const [deletingOverheadId, setDeletingOverheadId] = useState<string | null>(null)

  // Generate Year Options (e.g. currentYear - 2 to currentYear + 1)
  const yearOptions = useMemo(() => {
    const list: number[] = []
    for (let y = currentYear - 2; y <= currentYear + 1; y++) {
      list.push(y)
    }
    return list
  }, [currentYear])

  const fetchMonthlyReport = async (year: number, month: number) => {
    setIsLoading(true)
    setError(null)
    try {
      const res = await apiFetch(`/api/reports/monthly?year=${year}&month=${month}`)
      if (!res.ok) {
        throw new Error(`Gagal mengambil laporan (${res.status})`)
      }
      const json: any = await res.json()
      if (json.success && json.data) {
        setReportData(json.data)
      } else {
        throw new Error(json.message || 'Data laporan tidak valid')
      }
    } catch (err: any) {
      setError(err.message || 'Terjadi kesalahan saat memuat rekapan bulanan.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleDeleteOverhead = async (id: string, desc: string) => {
    if (!window.confirm(`Yakin ingin menghapus catatan beban "${desc || 'Beban ini'}"?`)) {
      return
    }

    setDeletingOverheadId(id)
    try {
      const res = await apiFetch(`/api/expenses/overhead/${id}`, { method: 'DELETE' })
      const json: any = await res.json()
      if (!res.ok || !json.success) {
        throw new Error(json.message || 'Gagal menghapus beban operasional.')
      }
      // Refresh report
      fetchMonthlyReport(selectedYear, selectedMonth)
    } catch (err: any) {
      alert(err.message || 'Terjadi kesalahan saat menghapus.')
    } finally {
      setDeletingOverheadId(null)
    }
  }

  useEffect(() => {
    fetchMonthlyReport(selectedYear, selectedMonth)
  }, [selectedYear, selectedMonth])

  // Quick Filters
  const handleSelectCurrentMonth = () => {
    setSelectedYear(currentYear)
    setSelectedMonth(currentMonth)
  }

  const handleSelectLastMonth = () => {
    if (currentMonth === 1) {
      setSelectedYear(currentYear - 1)
      setSelectedMonth(12)
    } else {
      setSelectedYear(currentYear)
      setSelectedMonth(currentMonth - 1)
    }
  }

  // Export to true native Microsoft Excel OpenXML (.xlsx) without any warning popup
  const handleExportExcel = () => {
    if (!reportData) return

    const wb = XLSX.utils.book_new()

    // 1. Data Sheet: Rincian Penjualan & Performa
    const sheetData: any[][] = [
      ['WARKOP SUDUT TEMU - LAPORAN KEUANGAN & PENJUALAN BULANAN'],
      [`Periode: ${reportData.monthName}`, `Tanggal Unduh: ${new Date().toLocaleDateString('id-ID', { dateStyle: 'full' })}`],
      [],
      ['RINGKASAN PERFORMA BULANAN'],
      ['Total Omzet Kotor (Gross Sales)', reportData.totalRevenue],
      ['  - Pembayaran Tunai (Laci)', reportData.totalCash],
      ['  - Pembayaran QRIS (Bank)', reportData.totalQris],
      ['Total Beban Operasional Toko', -reportData.totalExpenses],
      ['  - Pengeluaran Shift (Petty Kasir)', -(reportData.totalShiftExpenses || 0)],
      ['  - Beban Tetap Toko (Overhead Owner)', -(reportData.totalOverhead || 0)],
      ['Total Estimasi HPP (Modal Bahan)', reportData.totalCost],
      ['Estimasi Laba Bersih (Net Profit)', reportData.netProfit],
      ['Total Pesanan / Transaksi Selesai', `${reportData.totalTransactions} transaksi`],
      [],
      ['RINCIAN PENJUALAN HARIAN'],
      ['Tanggal', 'Hari', 'Qty Transaksi', 'Omzet Tunai (Rp)', 'Omzet QRIS (Rp)', 'Total Omzet (Rp)', 'Pengeluaran Kas (Rp)', 'Estimasi HPP (Rp)', 'Laba Bersih (Rp)'],
      ...reportData.dailyBreakdown.map(d => [
        d.date,
        d.dayName,
        d.transactions,
        d.cash,
        d.qris,
        d.revenue,
        d.expenses,
        d.cost,
        d.netProfit
      ]),
      [
        `TOTAL ${reportData.monthName.toUpperCase()}`,
        '',
        reportData.totalTransactions,
        reportData.totalCash,
        reportData.totalQris,
        reportData.totalRevenue,
        reportData.totalExpenses,
        reportData.totalCost,
        reportData.netProfit
      ]
    ]

    const ws = XLSX.utils.aoa_to_sheet(sheetData)
    ws['!cols'] = [
      { wch: 15 }, // Tanggal
      { wch: 8 },  // Hari
      { wch: 14 }, // Transaksi
      { wch: 18 }, // Omzet Tunai
      { wch: 18 }, // Omzet QRIS
      { wch: 18 }, // Total Omzet
      { wch: 20 }, // Pengeluaran Kas
      { wch: 18 }, // Estimasi HPP
      { wch: 18 }  // Laba Bersih
    ]
    XLSX.utils.book_append_sheet(wb, ws, 'Rekap Bulanan')

    // 2. Sheet 2: Menu Terlaris
    if (reportData.topProducts.length > 0) {
      const topData: any[][] = [
        ['WARKOP SUDUT TEMU - TOP MENU TERLARIS BULAN INI'],
        [`Periode: ${reportData.monthName}`],
        [],
        ['Peringkat', 'Nama Menu', 'Kategori', 'Porsi Terjual', 'Total Omzet (Rp)', 'Kontribusi Omzet (%)'],
        ...reportData.topProducts.map((p, idx) => [
          idx + 1,
          p.name,
          p.category_name || 'Menu',
          p.quantity,
          p.revenue,
          reportData.totalRevenue > 0 ? Number(((p.revenue / reportData.totalRevenue) * 100).toFixed(1)) : 0
        ])
      ]
      const wsTop = XLSX.utils.aoa_to_sheet(topData)
      wsTop['!cols'] = [
        { wch: 12 },
        { wch: 32 },
        { wch: 18 },
        { wch: 15 },
        { wch: 18 },
        { wch: 20 }
      ]
      XLSX.utils.book_append_sheet(wb, wsTop, 'Menu Terlaris')
    }

    // 3. Sheet 3: Beban Overhead & Biaya Tetap
    if (reportData.overheadExpenses && reportData.overheadExpenses.length > 0) {
      const overheadData: any[][] = [
        ['WARKOP SUDUT TEMU - RINCIAN BEBAN OPERASIONAL & OVERHEAD'],
        [`Periode: ${reportData.monthName}`],
        [],
        ['Tanggal Bayar', 'Kategori', 'Keterangan', 'Sumber Dana', 'Dicatat Oleh', 'Nominal (Rp)'],
        ...reportData.overheadExpenses.map(o => [
          o.paid_date,
          OVERHEAD_CATEGORY_CONFIG[o.category]?.label || o.category,
          o.description || '-',
          getPaymentSourceText(o.payment_source),
          o.recorded_by || 'Owner',
          o.amount
        ]),
        ['TOTAL BEBAN OVERHEAD', '', '', '', '', reportData.totalOverhead || 0]
      ]
      const wsOverhead = XLSX.utils.aoa_to_sheet(overheadData)
      wsOverhead['!cols'] = [
        { wch: 15 },
        { wch: 22 },
        { wch: 35 },
        { wch: 20 },
        { wch: 15 },
        { wch: 18 }
      ]
      XLSX.utils.book_append_sheet(wb, wsOverhead, 'Beban Overhead')
    }

    XLSX.writeFile(wb, `Rekap_Bulanan_SUTE_${reportData.year}_${String(reportData.month).padStart(2, '0')}.xlsx`)
  }

  // Export to CSV with explicit delimiter directive so Excel Windows splits columns properly
  const handleExportCSV = () => {
    if (!reportData) return

    const bom = '\uFEFF'
    const sepDirective = 'sep=,\n'
    const headers = [
      'Tanggal',
      'Hari',
      'Qty Transaksi',
      'Omzet Tunai (Rp)',
      'Omzet QRIS (Rp)',
      'Total Omzet (Rp)',
      'Pengeluaran Kas/Operasional (Rp)',
      'Estimasi HPP (Rp)',
      'Laba Bersih (Rp)'
    ]

    const rows = reportData.dailyBreakdown.map(item => [
      `"${item.date}"`,
      `"${item.dayName}"`,
      item.transactions,
      item.cash,
      item.qris,
      item.revenue,
      item.expenses,
      item.cost,
      item.netProfit
    ])

    // Summary totals row
    rows.push([
      `"TOTAL ${reportData.monthName.toUpperCase()}"`,
      '""',
      reportData.totalTransactions,
      reportData.totalCash,
      reportData.totalQris,
      reportData.totalRevenue,
      reportData.totalExpenses,
      reportData.totalCost,
      reportData.netProfit
    ])

    // Add extra section: Top Selling Products
    rows.push([])
    rows.push(['"--- MENU TERLARIS BULAN INI ---"'])
    rows.push(['Ranking', 'Nama Menu', 'Kategori', 'Qty Terjual', 'Total Omzet (Rp)'])
    reportData.topProducts.forEach((p, idx) => {
      rows.push([
        idx + 1,
        `"${p.name.replace(/"/g, '""')}"`,
        `"${p.category_name || '-'}"`,
        p.quantity,
        p.revenue
      ])
    })

    const csvContent = bom + sepDirective + [headers.join(','), ...rows.map(r => r.join(','))].join('\n')
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `Rekap_Bulanan_SUTE_${reportData.year}_${String(reportData.month).padStart(2, '0')}.csv`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  // Calculated Metrics
  const activeDaysCount = useMemo(() => {
    if (!reportData) return 1
    const count = reportData.dailyBreakdown.filter(d => d.transactions > 0).length
    return Math.max(1, count)
  }, [reportData])

  const averageDailyRevenue = useMemo(() => {
    if (!reportData) return 0
    return Math.round(reportData.totalRevenue / activeDaysCount)
  }, [reportData, activeDaysCount])

  const profitMarginPercent = useMemo(() => {
    if (!reportData || reportData.totalRevenue === 0) return 0
    return Math.round((reportData.netProfit / reportData.totalRevenue) * 100)
  }, [reportData])

  const isCurrentMonthActive = selectedYear === currentYear && selectedMonth === currentMonth

  return (
    <div className="space-y-6">
      
      {/* 1. Header Toolbar & Month Selector */}
      <div className="bg-white dark:bg-stone-900/80 border border-stone-200 dark:border-stone-800 rounded-2xl p-5 shadow-xs space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between pb-3 border-b border-stone-200 dark:border-stone-800/80 gap-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-stone-50 dark:bg-stone-950 border border-stone-200 dark:border-stone-800 flex items-center justify-center text-amber-700 dark:text-[#E2DFD2] shadow-xs">
              <CalendarRange className="w-5 h-5 stroke-2" />
            </div>
            <div>
              <h2 className="text-base font-bold tracking-tight text-stone-900 dark:text-stone-100 flex items-center gap-2">
                <span>Rekapan & Laporan Keuangan Bulanan</span>
                {reportData && (
                  <span className="text-xs font-mono font-medium px-2 py-0.5 rounded-md bg-stone-100 dark:bg-stone-950 border border-stone-200 dark:border-stone-800 text-amber-800 dark:text-[#E2DFD2]">
                    {reportData.monthName}
                  </span>
                )}
              </h2>
              <p className="text-xs text-stone-500 dark:text-stone-400">
                Pembukuan lengkap omzet, biaya operasional, estimasi laba bersih, serta tren penjualan harian
              </p>
            </div>
          </div>

          {/* Export Action Buttons */}
          <div className="flex flex-wrap items-center gap-2 self-start md:self-auto">
            {(!_currentUser || _currentUser.role === 'owner') && (
              <button
                type="button"
                onClick={() => setIsOverheadModalOpen(true)}
                className="px-3.5 py-2 rounded-xl bg-stone-900 hover:bg-stone-850 text-white dark:bg-[#E2DFD2] dark:hover:bg-[#d6d3c4] dark:text-stone-950 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-xs"
                title="Catat beban tetap operasional toko (sewa, listrik, air, wifi, gaji, servis)"
              >
                <Plus className="w-4 h-4 stroke-2" />
                <span>+ Catat Beban</span>
              </button>
            )}

            <button
              type="button"
              onClick={handleExportExcel}
              disabled={isLoading || !reportData || reportData.totalTransactions === 0}
              className="px-3.5 py-2 rounded-xl bg-amber-700 hover:bg-amber-800 text-white dark:bg-stone-800 dark:hover:bg-stone-700 dark:text-stone-200 text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-40 shadow-xs border border-transparent dark:border-stone-700"
              title="Download format Spreadsheet Microsoft Excel (.xlsx) resmi tanpa peringatan"
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>Ekspor Excel (.xlsx)</span>
            </button>

            <button
              type="button"
              onClick={handleExportCSV}
              disabled={isLoading || !reportData || reportData.totalTransactions === 0}
              className="px-3 py-2 rounded-xl bg-stone-50 dark:bg-stone-950 border border-stone-200 dark:border-stone-800 hover:border-stone-300 dark:hover:border-stone-600 text-stone-700 dark:text-stone-300 text-xs font-medium transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-40"
              title="Download format CSV dengan kolom terpisah"
            >
              <Download className="w-3.5 h-3.5 text-stone-400" />
              <span>CSV</span>
            </button>

            <button
              type="button"
              onClick={() => fetchMonthlyReport(selectedYear, selectedMonth)}
              disabled={isLoading}
              className="p-2 rounded-xl bg-stone-50 dark:bg-stone-950 border border-stone-200 dark:border-stone-800 hover:border-stone-300 dark:hover:border-stone-700 text-stone-500 dark:text-stone-400 hover:text-stone-800 dark:hover:text-stone-200 transition-all cursor-pointer disabled:opacity-40"
              title="Perbarui data"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* Filter Controls: Year & Month Selectors */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
          <div className="flex flex-wrap items-center gap-2">
            
            {/* Quick preset buttons */}
            <button
              type="button"
              onClick={handleSelectCurrentMonth}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium border transition-all cursor-pointer ${
                isCurrentMonthActive
                  ? 'bg-amber-700 text-white border-amber-700 dark:bg-[#E2DFD2] dark:text-stone-950 dark:border-[#E2DFD2] font-bold shadow-xs'
                  : 'bg-stone-50 dark:bg-stone-950 border-stone-200 dark:border-stone-800 text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-200 hover:border-stone-300 dark:hover:border-stone-700'
              }`}
            >
              Bulan Ini
            </button>

            <button
              type="button"
              onClick={handleSelectLastMonth}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium border transition-all cursor-pointer ${
                selectedMonth === (currentMonth === 1 ? 12 : currentMonth - 1) &&
                selectedYear === (currentMonth === 1 ? currentYear - 1 : currentYear)
                  ? 'bg-amber-700 text-white border-amber-700 dark:bg-[#E2DFD2] dark:text-stone-950 dark:border-[#E2DFD2] font-bold shadow-xs'
                  : 'bg-stone-50 dark:bg-stone-950 border-stone-200 dark:border-stone-800 text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-200 hover:border-stone-300 dark:hover:border-stone-700'
              }`}
            >
              Bulan Lalu
            </button>

            <div className="h-4 w-px bg-stone-200 dark:bg-stone-800 mx-1 hidden sm:block" />

            {/* Dropdown Bulan */}
            <div className="w-36">
              <SearchableSelect
                value={String(selectedMonth)}
                onChange={val => setSelectedMonth(Number(val))}
                options={MONTH_NAMES.map((name, idx) => ({
                  value: String(idx + 1),
                  label: name
                }))}
                placeholder="Pilih Bulan"
                searchPlaceholder="Cari bulan..."
              />
            </div>

            {/* Dropdown Tahun */}
            <div className="w-28">
              <SearchableSelect
                value={String(selectedYear)}
                onChange={val => setSelectedYear(Number(val))}
                options={yearOptions.map(y => ({
                  value: String(y),
                  label: String(y)
                }))}
                placeholder="Pilih Tahun"
                searchPlaceholder="Cari tahun..."
              />
            </div>
          </div>

          {/* Sub-tab view switchers */}
          <div className="flex items-center gap-1 bg-stone-100 dark:bg-stone-950 p-1 rounded-xl border border-stone-200 dark:border-stone-800 text-xs">
            <button
              type="button"
              onClick={() => setActiveSubTab('daily')}
              className={`px-3 py-1 rounded-lg font-medium transition-all cursor-pointer ${
                activeSubTab === 'daily'
                  ? 'bg-white dark:bg-stone-800 text-stone-900 dark:text-[#E2DFD2] font-bold shadow-xs'
                  : 'text-stone-500 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-200'
              }`}
            >
              Tabel Harian (1-31)
            </button>
            <button
              type="button"
              onClick={() => setActiveSubTab('products')}
              className={`px-3 py-1 rounded-lg font-medium transition-all cursor-pointer ${
                activeSubTab === 'products'
                  ? 'bg-white dark:bg-stone-800 text-stone-900 dark:text-[#E2DFD2] font-bold shadow-xs'
                  : 'text-stone-500 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-200'
              }`}
            >
              Menu Terlaris
            </button>
            <button
              type="button"
              onClick={() => setActiveSubTab('cashflow')}
              className={`px-3 py-1 rounded-lg font-medium transition-all cursor-pointer ${
                activeSubTab === 'cashflow'
                  ? 'bg-white dark:bg-stone-800 text-stone-900 dark:text-[#E2DFD2] font-bold shadow-xs'
                  : 'text-stone-500 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-200'
              }`}
            >
              Arus Kas
            </button>
          </div>
        </div>
      </div>

      {/* Error state */}
      {error && (
        <div className="p-4 rounded-xl border border-rose-200 dark:border-rose-900/60 bg-rose-50 dark:bg-rose-950/40 text-rose-800 dark:text-rose-300 text-xs">
          {error}
        </div>
      )}

      {/* 2. Key Monthly Financial KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Card 1: Total Omzet Kotor */}
        <div className="bg-white dark:bg-stone-900/80 border border-stone-200 dark:border-stone-800 rounded-2xl p-4 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-stone-500 dark:text-stone-400">
            <span className="text-xs font-medium uppercase tracking-wider">Total Omzet Kotor</span>
            <div className="w-8 h-8 rounded-xl bg-stone-50 dark:bg-stone-950 border border-stone-200 dark:border-stone-800 flex items-center justify-center text-amber-700 dark:text-[#E2DFD2]">
              <Coins className="w-4 h-4 stroke-2" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono tabular-nums text-stone-900 dark:text-stone-100 tracking-tight">
              {reportData ? formatRupiah(reportData.totalRevenue) : '...'}
            </span>
          </div>
          <div className="pt-2 border-t border-stone-200 dark:border-stone-800/80 flex items-center justify-between text-[11px] text-stone-500 dark:text-stone-400 font-mono">
            <span>Tunai: {reportData ? formatRupiah(reportData.totalCash) : '0'}</span>
            <span>QRIS: {reportData ? formatRupiah(reportData.totalQris) : '0'}</span>
          </div>
        </div>

        {/* Card 2: Pengeluaran Kas Operasional & Beban Overhead */}
        <div className="bg-white dark:bg-stone-900/80 border border-stone-200 dark:border-stone-800 rounded-2xl p-4 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-stone-500 dark:text-stone-400">
            <span className="text-xs font-medium uppercase tracking-wider">Total Beban Operasional</span>
            <div className="w-8 h-8 rounded-xl bg-rose-50 dark:bg-stone-950 border border-rose-200 dark:border-stone-800 flex items-center justify-center text-rose-600 dark:text-rose-400">
              <Wallet className="w-4 h-4 stroke-2" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono tabular-nums text-rose-600 dark:text-rose-300 tracking-tight">
              {reportData ? formatRupiah(reportData.totalExpenses) : '...'}
            </span>
          </div>
          <div className="pt-2 border-t border-stone-200 dark:border-stone-800/80 flex items-center justify-between text-[11px] text-stone-500 dark:text-stone-400 font-mono">
            <span>Petty: {reportData ? formatRupiah(reportData.totalShiftExpenses || 0) : '0'}</span>
            <span>Overhead: {reportData ? formatRupiah(reportData.totalOverhead || 0) : '0'}</span>
          </div>
        </div>

        {/* Card 3: Estimasi Laba Bersih */}
        <div className="bg-white dark:bg-stone-900/80 border border-stone-200 dark:border-stone-800 rounded-2xl p-4 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-stone-500 dark:text-stone-400">
            <span className="text-xs font-medium uppercase tracking-wider">Estimasi Laba Bersih</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 dark:bg-stone-950 border border-emerald-200 dark:border-stone-800 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
              <TrendingUp className="w-4 h-4 stroke-2" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className={`text-2xl font-bold font-mono tabular-nums tracking-tight ${
              reportData && reportData.netProfit < 0 ? 'text-rose-600 dark:text-rose-400' : 'text-emerald-600 dark:text-emerald-400'
            }`}>
              {reportData ? formatRupiah(reportData.netProfit) : '...'}
            </span>
          </div>
          <div className="pt-2 border-t border-stone-200 dark:border-stone-800/80 flex items-center justify-between text-[11px] text-stone-500 dark:text-stone-400">
            <span>Margin Laba:</span>
            <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">
              ~{profitMarginPercent}%
            </span>
          </div>
        </div>

        {/* Card 4: Transaksi & Rata-rata Harian */}
        <div className="bg-white dark:bg-stone-900/80 border border-stone-200 dark:border-stone-800 rounded-2xl p-4 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-stone-500 dark:text-stone-400">
            <span className="text-xs font-medium uppercase tracking-wider">Total Transaksi</span>
            <div className="w-8 h-8 rounded-xl bg-stone-50 dark:bg-stone-950 border border-stone-200 dark:border-stone-800 flex items-center justify-center text-stone-600 dark:text-stone-300">
              <Receipt className="w-4 h-4 stroke-2" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono tabular-nums text-stone-900 dark:text-stone-100 tracking-tight">
              {reportData ? formatNumber(reportData.totalTransactions) : '...'}
            </span>
            <span className="text-xs text-stone-500 dark:text-stone-400 font-medium">pesanan</span>
          </div>
          <div className="pt-2 border-t border-stone-200 dark:border-stone-800/80 flex items-center justify-between text-[11px] text-stone-500 dark:text-stone-400">
            <span>Rata-rata / Hari:</span>
            <span className="font-mono text-stone-800 dark:text-stone-200 font-medium">
              {formatRupiah(averageDailyRevenue)}
            </span>
          </div>
        </div>

      </div>

      {/* 3. Main Content Views */}
      {activeSubTab === 'daily' && (
        <div className="bg-white dark:bg-stone-900/80 border border-stone-200 dark:border-stone-800 rounded-2xl overflow-hidden shadow-xs">
          <div className="p-4 border-b border-stone-200 dark:border-stone-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-bold text-stone-900 dark:text-stone-100 flex items-center gap-2">
                <span>Rincian Penjualan Harian</span>
                <span className="text-xs text-stone-500 dark:text-stone-400 font-normal font-mono">
                  ({showOnlyActiveDays ? `${activeDaysCount} hari aktif` : `Hari ke-1 s/d ${reportData?.dailyBreakdown.length || 31}`})
                </span>
              </h3>
              <p className="text-[11px] text-stone-500 dark:text-stone-400">
                Pencatatan akumulasi penjualan, kas masuk, pengeluaran kasir, dan hasil bersih tiap tanggal
              </p>
            </div>

            {/* Filter Toggle: All Days vs Active Days Only */}
            <div className="flex items-center gap-1 bg-stone-100 dark:bg-stone-950 p-1 rounded-xl border border-stone-200 dark:border-stone-800 text-xs self-start sm:self-auto">
              <button
                type="button"
                onClick={() => setShowOnlyActiveDays(false)}
                className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                  !showOnlyActiveDays
                    ? 'bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100 font-semibold shadow-xs'
                    : 'text-stone-500 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-200'
                }`}
              >
                Semua Hari (1-31)
              </button>
              <button
                type="button"
                onClick={() => setShowOnlyActiveDays(true)}
                className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                  showOnlyActiveDays
                    ? 'bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100 font-semibold shadow-xs'
                    : 'text-stone-500 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-200'
                }`}
              >
                Hanya Hari Aktif ({activeDaysCount})
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-stone-50 dark:bg-stone-950/60 border-b border-stone-200 dark:border-stone-800/80 text-[11px] text-stone-500 dark:text-stone-400 font-mono uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-3 text-center w-12">Tgl</th>
                  <th className="py-3 px-3">Hari</th>
                  <th className="py-3 px-3 text-center">Transaksi</th>
                  <th className="py-3 px-3 text-right">Omzet Tunai</th>
                  <th className="py-3 px-3 text-right">Omzet QRIS</th>
                  <th className="py-3 px-3 text-right">Total Omzet</th>
                  <th className="py-3 px-3 text-right">Pengeluaran Kas</th>
                  <th className="py-3 px-3 text-right">Laba Bersih</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100 dark:divide-stone-800/50">
                {isLoading ? (
                  <tr>
                    <td colSpan={8} className="py-8 text-center text-stone-400 dark:text-stone-500 font-mono">
                      Memuat data rekapan bulanan...
                    </td>
                  </tr>
                ) : !reportData || reportData.dailyBreakdown.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-8 text-center text-stone-500">
                      Tidak ada catatan penjualan pada bulan ini.
                    </td>
                  </tr>
                ) : (
                  (showOnlyActiveDays
                    ? reportData.dailyBreakdown.filter(d => d.transactions > 0 || d.expenses > 0)
                    : reportData.dailyBreakdown
                  ).map(item => {
                    const isToday =
                      isCurrentMonthActive &&
                      item.day === now.getDate()
                    const hasTransactions = item.transactions > 0

                    return (
                      <tr
                        key={item.date}
                        className={`hover:bg-stone-50 dark:hover:bg-stone-800/40 transition-colors ${
                          isToday
                            ? 'bg-amber-50 dark:bg-[#E2DFD2]/10 text-stone-900 dark:text-stone-100 font-medium'
                            : hasTransactions
                            ? 'text-stone-800 dark:text-stone-200'
                            : 'text-stone-400 dark:text-stone-500'
                        }`}
                      >
                        {/* Day Number */}
                        <td className="py-2.5 px-3 text-center font-mono font-bold">
                          <span className={`inline-block w-6 h-6 rounded-md text-center leading-6 text-xs ${
                            isToday
                              ? 'bg-amber-700 text-white dark:bg-[#E2DFD2] dark:text-stone-950 font-bold'
                              : 'text-stone-600 dark:text-stone-300'
                          }`}>
                            {item.day}
                          </span>
                        </td>

                        {/* Day Name */}
                        <td className="py-2.5 px-3 font-mono text-[11px] whitespace-nowrap">
                          {item.dayName}
                        </td>

                        {/* Transactions Count */}
                        <td className="py-2.5 px-3 text-center font-mono tabular-nums">
                          {item.transactions > 0 ? (
                            <span className="px-2 py-0.5 rounded-md bg-stone-100 dark:bg-stone-950 border border-stone-200 dark:border-stone-800 text-stone-700 dark:text-stone-300 font-medium">
                              {item.transactions}
                            </span>
                          ) : (
                            <span className="text-stone-400 dark:text-stone-600">-</span>
                          )}
                        </td>

                        {/* Cash Amount */}
                        <td className="py-2.5 px-3 text-right font-mono tabular-nums text-stone-500 dark:text-stone-400">
                          {item.cash > 0 ? formatRupiah(item.cash) : '-'}
                        </td>

                        {/* QRIS Amount */}
                        <td className="py-2.5 px-3 text-right font-mono tabular-nums text-stone-500 dark:text-stone-400">
                          {item.qris > 0 ? formatRupiah(item.qris) : '-'}
                        </td>

                        {/* Total Revenue */}
                        <td className="py-2.5 px-3 text-right font-mono tabular-nums font-bold text-stone-900 dark:text-stone-100">
                          {item.revenue > 0 ? formatRupiah(item.revenue) : '-'}
                        </td>

                        {/* Expenses */}
                        <td className="py-2.5 px-3 text-right font-mono tabular-nums text-rose-600 dark:text-rose-400">
                          {item.expenses > 0 ? `-${formatRupiah(item.expenses)}` : '-'}
                        </td>

                        {/* Net Profit */}
                        <td className={`py-2.5 px-3 text-right font-mono tabular-nums font-semibold ${
                          item.netProfit > 0
                            ? 'text-emerald-600 dark:text-emerald-400'
                            : item.netProfit < 0
                            ? 'text-rose-600 dark:text-rose-400'
                            : 'text-stone-400 dark:text-stone-600'
                        }`}>
                          {item.revenue > 0 ? formatRupiah(item.netProfit) : '-'}
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>

              {/* Total Footer */}
              {reportData && (
                <tfoot className="bg-stone-50 dark:bg-stone-950 border-t-2 border-stone-200 dark:border-stone-800 font-mono text-xs font-bold text-stone-900 dark:text-stone-100">
                  <tr>
                    <td colSpan={2} className="py-3 px-3 uppercase tracking-wider text-stone-500 dark:text-stone-400">
                      TOTAL {reportData.monthName}
                    </td>
                    <td className="py-3 px-3 text-center text-amber-800 dark:text-[#E2DFD2]">
                      {formatNumber(reportData.totalTransactions)}
                    </td>
                    <td className="py-3 px-3 text-right text-stone-700 dark:text-stone-300">
                      {formatRupiah(reportData.totalCash)}
                    </td>
                    <td className="py-3 px-3 text-right text-stone-700 dark:text-stone-300">
                      {formatRupiah(reportData.totalQris)}
                    </td>
                    <td className="py-3 px-3 text-right text-amber-800 dark:text-[#E2DFD2] font-black">
                      {formatRupiah(reportData.totalRevenue)}
                    </td>
                    <td className="py-3 px-3 text-right text-rose-600 dark:text-rose-400">
                      {reportData.totalExpenses > 0 ? `-${formatRupiah(reportData.totalExpenses)}` : 'Rp 0'}
                    </td>
                    <td className="py-3 px-3 text-right text-emerald-600 dark:text-emerald-400 font-black">
                      {formatRupiah(reportData.netProfit)}
                    </td>
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        </div>
      )}

      {/* View 2: Top Selling Menu Bulan Ini */}
      {activeSubTab === 'products' && (
        <div className="bg-white dark:bg-stone-900/80 border border-stone-200 dark:border-stone-800 rounded-2xl p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-stone-200 dark:border-stone-800/80">
            <div>
              <h3 className="text-sm font-bold text-stone-900 dark:text-stone-100 flex items-center gap-2">
                <Award className="w-4 h-4 text-amber-700 dark:text-[#E2DFD2]" />
                <span>Peringkat Menu Terlaris</span>
                <span className="text-xs text-stone-500 dark:text-stone-400 font-mono">({reportData?.monthName})</span>
              </h3>
              <p className="text-[11px] text-stone-500 dark:text-stone-400">
                Menu paling diminati pelanggan warkop berdasarkan volume porsi terjual sepanjang bulan ini
              </p>
            </div>
          </div>

          {!reportData || reportData.topProducts.length === 0 ? (
            <div className="py-12 text-center text-stone-400 dark:text-stone-500 text-xs">
              Belum ada penjualan menu yang tercatat pada bulan ini.
            </div>
          ) : (
            <div className="space-y-3">
              {reportData.topProducts.map((prod, index) => {
                const percentOfTotal =
                  reportData.totalRevenue > 0
                    ? Math.round((prod.revenue / reportData.totalRevenue) * 100)
                    : 0

                return (
                  <div
                    key={prod.id || index}
                    className="p-3.5 rounded-xl bg-stone-50 dark:bg-stone-950 border border-stone-200 dark:border-stone-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-mono font-bold text-xs ${
                        index === 0
                          ? 'bg-amber-700 text-white dark:bg-[#E2DFD2] dark:text-stone-950 font-bold'
                          : index === 1
                          ? 'bg-stone-200 text-stone-900 dark:bg-stone-300 dark:text-stone-950 font-bold'
                          : index === 2
                          ? 'bg-stone-100 text-stone-800 dark:bg-stone-700 dark:text-stone-100 font-bold'
                          : 'bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 text-stone-600 dark:text-stone-400'
                      }`}>
                        #{index + 1}
                      </div>

                      <div>
                        <div className="text-sm font-bold text-stone-900 dark:text-stone-200">
                          {prod.name}
                        </div>
                        <div className="text-xs text-stone-500 font-mono">
                          {prod.category_name || 'Menu'}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between sm:justify-end gap-6 text-xs">
                      <div className="text-left sm:text-right">
                        <div className="font-mono font-bold text-stone-900 dark:text-stone-100">
                          {formatNumber(prod.quantity)} <span className="text-[10px] text-stone-500 dark:text-stone-400 font-normal">porsi</span>
                        </div>
                        <div className="text-[10px] text-stone-500 font-mono">
                          {percentOfTotal}% dari total omzet
                        </div>
                      </div>

                      <div className="text-right">
                        <div className="font-mono font-bold text-amber-800 dark:text-[#E2DFD2]">
                          {formatRupiah(prod.revenue)}
                        </div>
                        <div className="text-[10px] text-stone-500">
                          Kontribusi Penjualan
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}

      {/* View 3: Ringkasan Arus Kas Masuk & Keluar */}
      {activeSubTab === 'cashflow' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* Inflow Card */}
          <div className="bg-white dark:bg-stone-900/80 border border-stone-200 dark:border-stone-800 rounded-2xl p-5 shadow-xs space-y-4">
            <div className="flex items-center gap-2.5 pb-3 border-b border-stone-200 dark:border-stone-800/80">
              <div className="w-8 h-8 rounded-xl bg-emerald-50 dark:bg-stone-950 border border-emerald-200 dark:border-stone-800 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                <ArrowUpRight className="w-4 h-4 stroke-2" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-stone-900 dark:text-stone-100">Arus Kas Masuk (Inflow)</h3>
                <p className="text-[11px] text-stone-500 dark:text-stone-400">Penerimaan transaksi lunas</p>
              </div>
            </div>

            <div className="space-y-3 text-xs">
              <div className="flex items-center justify-between p-3 rounded-xl bg-stone-50 dark:bg-stone-950 border border-stone-200 dark:border-stone-800">
                <div className="flex items-center gap-2">
                  <Coins className="w-4 h-4 text-stone-500 dark:text-stone-400" />
                  <span className="text-stone-700 dark:text-stone-300">Penjualan Tunai (Laci Kasir)</span>
                </div>
                <span className="font-mono font-bold text-stone-900 dark:text-stone-100">
                  {reportData ? formatRupiah(reportData.totalCash) : '0'}
                </span>
              </div>

              <div className="flex items-center justify-between p-3 rounded-xl bg-stone-50 dark:bg-stone-950 border border-stone-200 dark:border-stone-800">
                <div className="flex items-center gap-2">
                  <QrCode className="w-4 h-4 text-amber-700 dark:text-[#E2DFD2]" />
                  <span className="text-stone-700 dark:text-stone-300">Penjualan QRIS (Bank Settlement)</span>
                </div>
                <span className="font-mono font-bold text-stone-900 dark:text-stone-100">
                  {reportData ? formatRupiah(reportData.totalQris) : '0'}
                </span>
              </div>

              <div className="pt-2 border-t border-stone-200 dark:border-stone-800/80 flex items-center justify-between text-xs font-bold">
                <span className="text-stone-700 dark:text-stone-300">Total Kas Masuk Kotor</span>
                <span className="font-mono text-emerald-600 dark:text-emerald-400 text-sm">
                  {reportData ? formatRupiah(reportData.totalRevenue) : '0'}
                </span>
              </div>
            </div>
          </div>

          {/* Outflow & Net Card */}
          <div className="bg-white dark:bg-stone-900/80 border border-stone-200 dark:border-stone-800 rounded-2xl p-5 shadow-xs space-y-4">
            <div className="flex items-center gap-2.5 pb-3 border-b border-stone-200 dark:border-stone-800/80">
              <div className="w-8 h-8 rounded-xl bg-rose-50 dark:bg-stone-950 border border-rose-200 dark:border-stone-800 flex items-center justify-center text-rose-600 dark:text-rose-400">
                <Wallet className="w-4 h-4 stroke-2" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-stone-900 dark:text-stone-100">Arus Kas Keluar & Estimasi HPP</h3>
                <p className="text-[11px] text-stone-500 dark:text-stone-400">Biaya operasional kasir & bahan baku</p>
              </div>
            </div>

            <div className="space-y-3 text-xs">
              <div className="flex items-center justify-between p-3 rounded-xl bg-stone-50 dark:bg-stone-950 border border-stone-200 dark:border-stone-800">
                <div className="flex items-center gap-2">
                  <Receipt className="w-4 h-4 text-rose-600 dark:text-rose-400" />
                  <span className="text-stone-700 dark:text-stone-300">Pengeluaran Shift (Petty Kasir)</span>
                </div>
                <span className="font-mono font-bold text-rose-600 dark:text-rose-400">
                  {reportData ? formatRupiah(reportData.totalShiftExpenses || 0) : '0'}
                </span>
              </div>

              <div className="flex items-center justify-between p-3 rounded-xl bg-stone-50 dark:bg-stone-950 border border-stone-200 dark:border-stone-800">
                <div className="flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-amber-700 dark:text-[#E2DFD2]" />
                  <span className="text-stone-700 dark:text-stone-300">Beban Tetap Toko (Overhead)</span>
                </div>
                <span className="font-mono font-bold text-amber-800 dark:text-[#E2DFD2]">
                  {reportData ? formatRupiah(reportData.totalOverhead || 0) : '0'}
                </span>
              </div>

              <div className="flex items-center justify-between p-3 rounded-xl bg-stone-50 dark:bg-stone-950 border border-stone-200 dark:border-stone-800">
                <div className="flex items-center gap-2">
                  <Layers className="w-4 h-4 text-stone-500 dark:text-stone-400" />
                  <span className="text-stone-700 dark:text-stone-300">Estimasi HPP (Modal Menu)</span>
                </div>
                <span className="font-mono font-bold text-stone-600 dark:text-stone-400">
                  {reportData ? formatRupiah(reportData.totalCost) : '0'}
                </span>
              </div>

              <div className="pt-2 border-t border-stone-200 dark:border-stone-800/80 flex items-center justify-between text-xs font-bold">
                <span className="text-stone-700 dark:text-stone-300">Estimasi Sisa Kas Bersih</span>
                <span className={`font-mono text-sm ${
                  reportData && reportData.netProfit >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
                }`}>
                  {reportData ? formatRupiah(reportData.netProfit) : '0'}
                </span>
              </div>
            </div>
          </div>

          {/* Section: Daftar Rincian Beban Operasional / Overhead */}
          <div className="md:col-span-2 bg-white dark:bg-stone-900/80 border border-stone-200 dark:border-stone-800 rounded-2xl overflow-hidden shadow-xs">
            <div className="p-4 sm:p-5 border-b border-stone-200 dark:border-stone-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-sm font-bold text-stone-900 dark:text-stone-100 flex items-center gap-2">
                  <span>Daftar Beban Operasional / Overhead Bulan Ini</span>
                  <span className="text-xs font-mono text-stone-500 dark:text-stone-400 font-normal">
                    ({reportData?.overheadExpenses?.length || 0} transaksi)
                  </span>
                </h3>
                <p className="text-[11px] text-stone-500 dark:text-stone-400 mt-0.5">
                  Rincian pengeluaran sewa ruko, tagihan listrik PLN, air PAM, WiFi, gaji tim, serta perawatan mesin
                </p>
              </div>

              {(!_currentUser || _currentUser.role === 'owner') && (
                <button
                  type="button"
                  onClick={() => setIsOverheadModalOpen(true)}
                  className="px-3 py-1.5 rounded-xl bg-stone-900 hover:bg-stone-850 text-white dark:bg-[#E2DFD2] dark:hover:bg-[#d6d3c4] dark:text-stone-950 text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer shadow-xs self-start sm:self-auto"
                >
                  <Plus className="w-3.5 h-3.5 stroke-2" />
                  <span>+ Catat Beban Overhead</span>
                </button>
              )}
            </div>

            {reportData?.overheadExpenses && reportData.overheadExpenses.length > 0 ? (
              <div className="divide-y divide-stone-100 dark:divide-stone-800/60 overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-stone-50 dark:bg-stone-950/60 text-[11px] text-stone-500 dark:text-stone-400 font-mono uppercase tracking-wider">
                    <tr>
                      <th className="py-2.5 px-4">Kategori & Keterangan</th>
                      <th className="py-2.5 px-3">Tgl Bayar</th>
                      <th className="py-2.5 px-3">Sumber Dana</th>
                      <th className="py-2.5 px-3">Dicatat Oleh</th>
                      <th className="py-2.5 px-4 text-right">Nominal</th>
                      <th className="py-2.5 px-3 text-center w-12">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-100 dark:divide-stone-800/50">
                    {reportData.overheadExpenses.map((ovh: OverheadExpense) => {
                      const catConfig = OVERHEAD_CATEGORY_CONFIG[ovh.category] || OVERHEAD_CATEGORY_CONFIG.other
                      const CatIcon = catConfig.icon
                      const isDeleting = deletingOverheadId === ovh.id

                      return (
                        <tr key={ovh.id} className="hover:bg-stone-50/60 dark:hover:bg-stone-850/40 transition-colors">
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-2.5">
                              <div className="w-7 h-7 rounded-lg bg-stone-100 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 flex items-center justify-center text-stone-600 dark:text-stone-300 shrink-0">
                                <CatIcon className="w-3.5 h-3.5" />
                              </div>
                              <div>
                                <span className="font-semibold text-stone-900 dark:text-stone-100">
                                  {catConfig.label}
                                </span>
                                {ovh.description && (
                                  <p className="text-[11px] text-stone-500 dark:text-stone-400 line-clamp-1">
                                    {ovh.description}
                                  </p>
                                )}
                              </div>
                            </div>
                          </td>
                          <td className="py-3 px-3 font-mono text-stone-600 dark:text-stone-400 whitespace-nowrap">
                            {ovh.paid_date}
                          </td>
                          <td className="py-3 px-3">
                            <span className="inline-block px-2 py-0.5 rounded-md text-[10px] font-medium bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300 border border-stone-200 dark:border-stone-700 whitespace-nowrap">
                              {getPaymentSourceText(ovh.payment_source)}
                            </span>
                          </td>
                          <td className="py-3 px-3 text-stone-600 dark:text-stone-400">
                            {ovh.recorded_by || 'Owner'}
                          </td>
                          <td className="py-3 px-4 text-right font-mono font-bold text-rose-600 dark:text-rose-400 whitespace-nowrap">
                            {formatRupiah(ovh.amount)}
                          </td>
                          <td className="py-3 px-3 text-center">
                            {(!_currentUser || _currentUser.role === 'owner') && (
                              <button
                                type="button"
                                onClick={() => handleDeleteOverhead(ovh.id, ovh.description || catConfig.label)}
                                disabled={isDeleting}
                                className="p-1.5 rounded-lg text-stone-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-stone-800 transition-colors cursor-pointer disabled:opacity-40"
                                title="Hapus catatan beban ini"
                              >
                                <Trash2 className={`w-3.5 h-3.5 ${isDeleting ? 'animate-spin' : ''}`} />
                              </button>
                            )}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="p-8 text-center space-y-3">
                <div className="w-10 h-10 rounded-2xl bg-stone-100 dark:bg-stone-800 text-stone-400 flex items-center justify-center mx-auto">
                  <Building2 className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-xs font-semibold text-stone-700 dark:text-stone-300">
                    Belum ada beban operasional overhead bulan ini
                  </h4>
                  <p className="text-[11px] text-stone-500 dark:text-stone-400 max-w-sm mx-auto mt-0.5">
                    Catat beban seperti sewa ruko, token listrik PLN, internet, gaji kru, atau servis mesin agar laba bersih toko tercatat akurat.
                  </p>
                </div>
                {(!_currentUser || _currentUser.role === 'owner') && (
                  <button
                    type="button"
                    onClick={() => setIsOverheadModalOpen(true)}
                    className="px-3.5 py-1.5 rounded-xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 hover:bg-stone-50 dark:hover:bg-stone-800 text-stone-800 dark:text-stone-200 text-xs font-medium transition-colors cursor-pointer inline-flex items-center gap-1.5 shadow-xs"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Catat Beban Sekarang</span>
                  </button>
                )}
              </div>
            )}
          </div>

        </div>
      )}

      {/* Modal Catat Beban Operasional / Overhead */}
      <OverheadExpenseModal
        isOpen={isOverheadModalOpen}
        onClose={() => setIsOverheadModalOpen(false)}
        onSuccess={() => fetchMonthlyReport(selectedYear, selectedMonth)}
      />

    </div>
  )
}
