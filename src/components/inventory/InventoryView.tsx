import { useState, useEffect, useMemo } from 'react'
import {
  Plus,
  ArrowDownLeft,
  Trash2,
  Pencil,
  Search,
  AlertTriangle,
  RefreshCw,
  History,
  Coins,
  ShieldCheck,
  Boxes
} from 'lucide-react'
import type { User, RawMaterial, StockMovement, StockMovementType } from '../../types'
import { formatRupiah } from '../../utils/formatters'
import { RecordMovementModal } from './RecordMovementModal'
import { MaterialFormModal } from './MaterialFormModal'
import { ConfirmDialog } from '../ui/ConfirmDialog'
import { SearchableSelect } from '../ui/SearchableSelect'
import { InfoTooltip } from '../ui/InfoTooltip'
import { apiFetch } from '../../utils/api'

interface InventoryViewProps {
  currentUser: User
}

export const InventoryView = ({ currentUser }: InventoryViewProps) => {
  const isOwner = currentUser.role === 'owner'

  const [materials, setMaterials] = useState<RawMaterial[]>([])
  const [movements, setMovements] = useState<StockMovement[]>([])
  const [totalAssetValuation, setTotalAssetValuation] = useState<number>(0)
  const [isLoading, setIsLoading] = useState(true)

  // Active Sub-tab
  const [viewTab, setViewTab] = useState<'catalog' | 'history'>('catalog')

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [stockFilter, setStockFilter] = useState<'all' | 'low' | 'out' | 'safe'>('all')

  // Modals
  const [isMovementModalOpen, setIsMovementModalOpen] = useState(false)
  const [movementInitialMaterialId, setMovementInitialMaterialId] = useState<string | undefined>()
  const [movementInitialType, setMovementInitialType] = useState<StockMovementType>('in')

  const [isFormModalOpen, setIsFormModalOpen] = useState(false)
  const [materialToEdit, setMaterialToEdit] = useState<RawMaterial | null>(null)

  const [materialToDelete, setMaterialToDelete] = useState<RawMaterial | null>(null)

  // Fetch materials & movements
  const fetchInventory = async () => {
    setIsLoading(true)
    try {
      const headers = { 'x-user-role': currentUser.role }

      const [resMat, resMov] = await Promise.all([
        apiFetch(`/api/inventory?role=${currentUser.role}`, { headers }),
        apiFetch('/api/inventory/movements', { headers })
      ])

      if (resMat.ok) {
        const jsonMat: any = await resMat.json()
        if (jsonMat.success && Array.isArray(jsonMat.data)) {
          setMaterials(jsonMat.data)
          if (jsonMat.totalAssetValuation !== undefined) {
            setTotalAssetValuation(jsonMat.totalAssetValuation)
          }
        }
      }

      if (resMov.ok) {
        const jsonMov: any = await resMov.json()
        if (jsonMov.success && Array.isArray(jsonMov.data)) {
          setMovements(jsonMov.data)
        }
      }
    } catch (err) {
      console.error('Failed to fetch inventory:', err)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchInventory()
  }, [currentUser.role])

  // Categories list
  const categories = useMemo(() => {
    const set = new Set<string>()
    materials.forEach(m => {
      if (m.category) set.add(m.category)
    })
    return Array.from(set)
  }, [materials])

  // Filtered Materials
  const filteredMaterials = useMemo(() => {
    return materials.filter(m => {
      const matchSearch =
        m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (m.supplier && m.supplier.toLowerCase().includes(searchQuery.toLowerCase()))
      const matchCategory = selectedCategory === 'all' || m.category === selectedCategory

      let matchStock = true
      if (stockFilter === 'low') {
        matchStock = m.current_stock > 0 && m.current_stock <= m.min_stock_alert
      } else if (stockFilter === 'out') {
        matchStock = m.current_stock <= 0
      } else if (stockFilter === 'safe') {
        matchStock = m.current_stock > m.min_stock_alert
      }

      return matchSearch && matchCategory && matchStock
    })
  }, [materials, searchQuery, selectedCategory, stockFilter])

  // Metrics
  const lowStockCount = useMemo(() => {
    return materials.filter(m => m.current_stock > 0 && m.current_stock <= m.min_stock_alert).length
  }, [materials])

  const outOfStockCount = useMemo(() => {
    return materials.filter(m => m.current_stock <= 0).length
  }, [materials])

  // Quick Action: Open Movement Modal
  const handleOpenMovement = (materialId?: string, type: StockMovementType = 'in') => {
    setMovementInitialMaterialId(materialId)
    setMovementInitialType(type)
    setIsMovementModalOpen(true)
  }

  // Handlers for modal results
  const handleMovementSuccess = (newMovement: StockMovement, updatedMaterial: RawMaterial) => {
    setMaterials(prev => prev.map(m => m.id === updatedMaterial.id ? { ...m, ...updatedMaterial } : m))
    setMovements(prev => [newMovement, ...prev])
  }

  const handleSaveMaterial = (savedMaterial: RawMaterial) => {
    setMaterials(prev => {
      const exists = prev.some(m => m.id === savedMaterial.id)
      if (exists) {
        return prev.map(m => m.id === savedMaterial.id ? savedMaterial : m)
      }
      return [...prev, savedMaterial]
    })
  }

  const handleDeleteMaterial = async () => {
    if (!materialToDelete) return
    try {
      await apiFetch(`/api/inventory/${materialToDelete.id}`, { method: 'DELETE' })
      setMaterials(prev => prev.filter(m => m.id !== materialToDelete.id))
    } catch {
      setMaterials(prev => prev.filter(m => m.id !== materialToDelete.id))
    } finally {
      setMaterialToDelete(null)
    }
  }

  return (
    <div className="space-y-6">
      
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-stone-200 dark:border-stone-800">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl font-bold tracking-tight text-stone-900 dark:text-stone-100">
              Pengelolaan Stok & Bahan Baku
            </h1>
          </div>
          <p className="text-xs text-stone-500 dark:text-stone-400 mt-1">
            {isOwner
              ? 'Pantau stok riil, atur harga beli modal (HPP), dan kelola batas minimum belanja warkop.'
              : 'Catat stok masuk barang belanjaan, pemakaian bahan, dan barang rusak selama shift operasional.'}
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={fetchInventory}
            disabled={isLoading}
            className="p-2 rounded-xl bg-stone-100 dark:bg-stone-900 border border-stone-200 dark:border-stone-800 hover:bg-stone-200 dark:hover:bg-stone-800 text-stone-700 dark:text-stone-300 transition-colors cursor-pointer shadow-xs"
            title="Refresh Data Stok"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>

          <button
            type="button"
            onClick={() => handleOpenMovement(undefined, 'in')}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-50 dark:bg-stone-900 border border-emerald-200 dark:border-stone-800 hover:bg-emerald-100 dark:hover:bg-stone-850 hover:border-emerald-300 dark:hover:border-emerald-800/80 text-emerald-800 dark:text-emerald-400 text-xs font-semibold transition-all cursor-pointer shadow-xs active:scale-95"
          >
            <ArrowDownLeft className="w-3.5 h-3.5 stroke-[2.2]" />
            <span>Catat Mutasi Stok</span>
          </button>

          {isOwner && (
            <button
              type="button"
              onClick={() => {
                setMaterialToEdit(null)
                setIsFormModalOpen(true)
              }}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-stone-900 hover:bg-stone-800 text-stone-50 dark:bg-[#E2DFD2] dark:hover:bg-[#edebe2] dark:text-stone-950 text-xs font-bold transition-all cursor-pointer shadow-xs active:scale-95"
            >
              <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
              <span>Tambah Bahan Baru</span>
            </button>
          )}
        </div>
      </div>

      {/* KPI Stats Overview */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        
        {/* Total Macam Bahan */}
        <div className="p-4 rounded-2xl bg-white dark:bg-stone-900/80 border border-stone-200 dark:border-stone-800 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs text-stone-500 dark:text-stone-400 block font-mono">Total Macam Bahan</span>
            <span className="font-mono tabular-nums text-xl font-bold text-stone-900 dark:text-stone-100 mt-0.5 block">
              {materials.length} <span className="text-xs font-sans text-stone-400 dark:text-stone-500 font-normal">item</span>
            </span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-stone-100 dark:bg-stone-950 border border-stone-200 dark:border-stone-800 flex items-center justify-center text-amber-800 dark:text-[#E2DFD2]">
            <Boxes className="w-5 h-5 stroke-[1.8]" />
          </div>
        </div>

        {/* Bahan Menipis */}
        <div className={`p-4 rounded-2xl border shadow-xs flex items-center justify-between ${
          lowStockCount > 0 ? 'bg-amber-50/70 border-amber-200 dark:bg-amber-950/20 dark:border-amber-900/50' : 'bg-white dark:bg-stone-900/80 border-stone-200 dark:border-stone-800'
        }`}>
          <div>
            <span className="text-xs text-stone-500 dark:text-stone-400 block font-mono">Perlu Belanja (Menipis)</span>
            <span className={`font-mono tabular-nums text-xl font-bold mt-0.5 block ${
              lowStockCount > 0 ? 'text-amber-700 dark:text-amber-400' : 'text-stone-700 dark:text-stone-300'
            }`}>
              {lowStockCount} <span className="text-xs font-sans text-stone-400 dark:text-stone-500 font-normal">bahan</span>
            </span>
          </div>
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center border ${
            lowStockCount > 0
              ? 'bg-amber-100 border-amber-300 text-amber-800 dark:bg-amber-950/60 dark:border-amber-800 dark:text-amber-400'
              : 'bg-stone-100 border-stone-200 text-stone-400 dark:bg-stone-950 dark:border-stone-800 dark:text-stone-500'
          }`}>
            <AlertTriangle className="w-5 h-5 stroke-2" />
          </div>
        </div>

        {/* Bahan Habis */}
        <div className={`p-4 rounded-2xl border shadow-xs flex items-center justify-between ${
          outOfStockCount > 0 ? 'bg-rose-50/70 border-rose-200 dark:bg-rose-950/20 dark:border-rose-900/50' : 'bg-white dark:bg-stone-900/80 border-stone-200 dark:border-stone-800'
        }`}>
          <div>
            <span className="text-xs text-stone-500 dark:text-stone-400 block font-mono">Stok Habis (Kosong)</span>
            <span className={`font-mono tabular-nums text-xl font-bold mt-0.5 block ${
              outOfStockCount > 0 ? 'text-rose-700 dark:text-rose-400' : 'text-stone-700 dark:text-stone-300'
            }`}>
              {outOfStockCount} <span className="text-xs font-sans text-stone-400 dark:text-stone-500 font-normal">bahan</span>
            </span>
          </div>
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center border ${
            outOfStockCount > 0
              ? 'bg-rose-100 border-rose-300 text-rose-700 dark:bg-rose-950/60 dark:border-rose-800 dark:text-rose-400'
              : 'bg-stone-100 border-stone-200 text-stone-400 dark:bg-stone-950 dark:border-stone-800 dark:text-stone-500'
          }`}>
            <Trash2 className="w-5 h-5 stroke-[1.8]" />
          </div>
        </div>

        {/* Role Differentiated Card: Valuation (Owner) vs Privileges (Cashier) */}
        {isOwner ? (
          <div className="p-4 rounded-2xl bg-white dark:bg-stone-900/80 border border-stone-200 dark:border-stone-800 shadow-xs flex items-center justify-between">
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-xs text-stone-500 dark:text-stone-400 block font-mono">Estimasi Nilai Aset Stok</span>
                <InfoTooltip
                  title="Estimasi Nilai Aset Stok"
                  content="Total nilai rupiah dari seluruh stok bahan fisik yang ada di warkop saat ini (Stok Fisik × Harga Beli HPP)."
                  placement="top"
                  align="left"
                />
              </div>
              <span className="font-mono tabular-nums text-lg sm:text-xl font-bold text-emerald-700 dark:text-emerald-400 mt-0.5 block truncate max-w-40">
                {formatRupiah(totalAssetValuation)}
              </span>
            </div>
            <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-stone-950 border border-emerald-200 dark:border-stone-800 flex items-center justify-center text-emerald-700 dark:text-emerald-400">
              <Coins className="w-5 h-5 stroke-[1.8]" />
            </div>
          </div>
        ) : (
          <div className="p-4 rounded-2xl bg-white dark:bg-stone-900/80 border border-stone-200 dark:border-stone-800 shadow-xs flex items-center justify-between">
            <div>
              <span className="text-xs text-stone-500 dark:text-stone-400 block font-mono">Hak Akses Kasir</span>
              <span className="text-xs font-bold text-stone-900 dark:text-[#E2DFD2] mt-0.5 block">
                Catat Masuk & Pemakaian
              </span>
              <span className="text-[10px] text-stone-400 dark:text-stone-500 font-mono mt-0.5 block">
                Harga modal HPP dirahasiakan
              </span>
            </div>
            <div className="w-10 h-10 rounded-xl bg-stone-100 dark:bg-stone-950 border border-stone-200 dark:border-stone-800 flex items-center justify-center text-amber-800 dark:text-[#E2DFD2]">
              <ShieldCheck className="w-5 h-5 stroke-[1.8]" />
            </div>
          </div>
        )}
      </div>

      {/* Navigation Sub-tabs: Daftar Bahan vs Riwayat Mutasi */}
      <div className="flex items-center gap-2 border-b border-stone-200 dark:border-stone-800">
        <button
          type="button"
          onClick={() => setViewTab('catalog')}
          className={`pb-2.5 px-3 text-xs font-semibold transition-all border-b-2 cursor-pointer ${
            viewTab === 'catalog'
              ? 'border-stone-900 text-stone-900 dark:border-[#E2DFD2] dark:text-[#E2DFD2]'
              : 'border-transparent text-stone-500 hover:text-stone-900 dark:text-stone-400 dark:hover:text-stone-200'
          }`}
        >
          Daftar Bahan Baku ({materials.length})
        </button>

        <button
          type="button"
          onClick={() => setViewTab('history')}
          className={`pb-2.5 px-3 text-xs font-semibold transition-all border-b-2 flex items-center gap-1.5 cursor-pointer ${
            viewTab === 'history'
              ? 'border-stone-900 text-stone-900 dark:border-[#E2DFD2] dark:text-[#E2DFD2]'
              : 'border-transparent text-stone-500 hover:text-stone-900 dark:text-stone-400 dark:hover:text-stone-200'
          }`}
        >
          <History className="w-3.5 h-3.5" />
          <span>Riwayat Mutasi Stok ({movements.length})</span>
        </button>
      </div>

      {/* VIEW: CATALOG OF RAW MATERIALS */}
      {viewTab === 'catalog' && (
        <div className="space-y-4">
          
          {/* Filter Bar */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            
            {/* Search Input */}
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                placeholder="Cari bahan baku (misal: kopi, gas, susu)..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-stone-50 dark:bg-stone-950 border border-stone-200 dark:border-stone-800 rounded-xl pl-10 pr-3 py-2 text-xs text-stone-900 dark:text-stone-100 placeholder-stone-400 dark:placeholder-stone-500 focus:outline-none focus:border-stone-900 dark:focus:border-[#E2DFD2] transition-colors shadow-xs"
              />
            </div>

            {/* Category and Stock Filters */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
              
              {/* Category Select */}
              <div className="min-w-40">
                <SearchableSelect
                  value={selectedCategory}
                  onChange={setSelectedCategory}
                  options={[
                    { value: 'all', label: 'Semua Kategori' },
                    ...categories.map(c => ({ value: c, label: c }))
                  ]}
                  placeholder="Pilih Kategori"
                  searchPlaceholder="Cari kategori..."
                />
              </div>

              {/* Status Filter */}
              <div className="min-w-40">
                <SearchableSelect
                  value={stockFilter}
                  onChange={val => setStockFilter(val as any)}
                  options={[
                    { value: 'all', label: 'Semua Status' },
                    { value: 'low', label: 'Menipis / Perlu Beli', badge: 'Perlu Beli' },
                    { value: 'out', label: 'Habis (0)', badge: 'Habis' },
                    { value: 'safe', label: 'Stok Aman', badge: 'Aman' }
                  ]}
                  placeholder="Pilih Status"
                  searchPlaceholder="Cari status..."
                />
              </div>
            </div>
          </div>

          {/* Table Container */}
          <div className="bg-white dark:bg-stone-900/80 border border-stone-200 dark:border-stone-800 rounded-2xl overflow-hidden shadow-xs">
            {/* Desktop / Tablet Table View */}
            <div className="hidden sm:block overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-stone-200 dark:border-stone-800 text-stone-500 dark:text-stone-400 font-mono text-[11px] uppercase tracking-wider bg-stone-50/60 dark:bg-stone-950/60">
                    <th className="py-3 px-3.5 font-semibold">Nama Bahan Baku</th>
                    <th className="py-3 px-3.5 font-semibold">Kategori</th>
                    <th className="py-3 px-3.5 font-semibold text-center">Status</th>
                    <th className="py-3 px-3.5 font-semibold text-right">Stok Fisik</th>
                    <th className="py-3 px-3.5 font-semibold text-right">
                      <span className="inline-flex items-center justify-end gap-1">
                        <span>Batas Min</span>
                        <InfoTooltip
                          title="Batas Minimum Stok"
                          content="Jika stok fisik menyentuh angka ini atau lebih rendah, sistem otomatis menandai status 'Menipis' agar segera belanja ulang."
                          placement="top"
                          align="right"
                        />
                      </span>
                    </th>
                    {isOwner && (
                      <>
                        <th className="py-3 px-3.5 font-semibold text-right">
                          <span className="inline-flex items-center justify-end gap-1">
                            <span>Harga Modal</span>
                            <InfoTooltip
                              title="Harga Modal (HPP)"
                              content="Harga beli netto per satuan bahan baku saat kulakan/belanja."
                              placement="top"
                              align="right"
                            />
                          </span>
                        </th>
                        <th className="py-3 px-3.5 font-semibold text-right">
                          <span className="inline-flex items-center justify-end gap-1">
                            <span>Nilai Aset</span>
                            <InfoTooltip
                              title="Nilai Aset Bahan"
                              content="Akumulasi modal bahan ini: Stok Fisik × Harga Modal Beli (HPP)."
                              placement="top"
                              align="right"
                            />
                          </span>
                        </th>
                      </>
                    )}
                    <th className="py-3 px-3.5 font-semibold">Supplier</th>
                    <th className="py-3 px-3.5 font-semibold text-center">Aksi Cepat</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-200 dark:divide-stone-800/60">
                  {filteredMaterials.length === 0 ? (
                    <tr>
                      <td colSpan={isOwner ? 9 : 7} className="py-10 text-center text-stone-400 dark:text-stone-500 font-mono">
                        Tidak ada bahan baku yang cocok dengan pencarian / filter.
                      </td>
                    </tr>
                  ) : (
                    filteredMaterials.map((mat) => {
                      const isOutOfStock = mat.current_stock <= 0
                      const isLowStock = !isOutOfStock && mat.current_stock <= mat.min_stock_alert
                      const assetValue = (mat.current_stock || 0) * (mat.cost_per_unit || 0)

                      return (
                        <tr key={mat.id} className="hover:bg-stone-50 dark:hover:bg-stone-800/30 transition-colors">
                          
                          {/* Nama */}
                          <td className="py-3 px-3.5 font-medium text-stone-900 dark:text-stone-100">
                            <div>
                              <span className="font-semibold">{mat.name}</span>
                              {mat.name.toLowerCase().includes('gas') && (
                                <span className="ml-2 text-[10px] font-mono px-1.5 py-0.2 rounded bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-900/60 text-amber-800 dark:text-amber-300">
                                  Gas LPG
                                </span>
                              )}
                            </div>
                          </td>

                          {/* Kategori */}
                          <td className="py-3 px-3 text-stone-500 dark:text-stone-400 font-mono text-[11px]">
                            {mat.category}
                          </td>

                          {/* Status Badge */}
                          <td className="py-3 px-3 text-center">
                            {isOutOfStock ? (
                              <span className="inline-block px-2 py-0.5 rounded text-[10px] font-mono uppercase font-bold bg-rose-50 border border-rose-200 text-rose-700 dark:bg-rose-950/60 dark:border-rose-900/80 dark:text-rose-400">
                                Habis
                              </span>
                            ) : isLowStock ? (
                              <span className="inline-block px-2 py-0.5 rounded text-[10px] font-mono uppercase font-bold bg-amber-50 border border-amber-200 text-amber-800 dark:bg-amber-950/60 dark:border-amber-900/80 dark:text-amber-400">
                                Menipis
                              </span>
                            ) : (
                              <span className="inline-block px-2 py-0.5 rounded text-[10px] font-mono uppercase font-semibold bg-stone-100 dark:bg-stone-950 border border-stone-200 dark:border-stone-800 text-stone-600 dark:text-stone-400">
                                Aman
                              </span>
                            )}
                          </td>

                          {/* Stok Fisik */}
                          <td className="py-3 px-3 text-right font-mono tabular-nums">
                            <span className={`font-bold text-sm ${
                              isOutOfStock ? 'text-rose-600 dark:text-rose-400' : isLowStock ? 'text-amber-700 dark:text-amber-400' : 'text-stone-900 dark:text-[#E2DFD2]'
                            }`}>
                              {mat.current_stock}
                            </span>
                            <span className="text-[11px] text-stone-500 ml-1 font-sans">
                              {mat.unit}
                            </span>
                          </td>

                          {/* Batas Minimum */}
                          <td className="py-3 px-3 text-right font-mono tabular-nums text-stone-400 dark:text-stone-500 text-[11px]">
                            {mat.min_stock_alert} {mat.unit}
                          </td>

                          {/* Owner Columns: Cost per Unit & Total Asset Value */}
                          {isOwner && (
                            <>
                              <td className="py-3 px-3 text-right font-mono tabular-nums text-stone-600 dark:text-stone-300">
                                {mat.cost_per_unit ? formatRupiah(mat.cost_per_unit) : '-'}
                              </td>
                              <td className="py-3 px-3 text-right font-mono tabular-nums font-semibold text-emerald-700 dark:text-emerald-400">
                                {assetValue > 0 ? formatRupiah(assetValue) : '-'}
                              </td>
                            </>
                          )}

                          {/* Supplier */}
                          <td className="py-3 px-3 text-stone-500 dark:text-stone-400 text-[11px] truncate max-w-32.5">
                            {mat.supplier || '-'}
                          </td>

                          {/* Action Buttons */}
                          <td className="py-3 px-3.5 text-center">
                            <div className="flex items-center justify-center gap-1">
                              
                              {/* Fast Stock In */}
                              <button
                                type="button"
                                onClick={() => handleOpenMovement(mat.id, 'in')}
                                className="px-2 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/60 hover:bg-emerald-100 dark:hover:bg-emerald-900/50 text-emerald-800 dark:text-emerald-400 text-[10px] font-mono font-semibold transition-colors cursor-pointer"
                                title="Catat Stok Masuk"
                              >
                                + Masuk
                              </button>

                              {/* Fast Stock Out */}
                              <button
                                type="button"
                                onClick={() => handleOpenMovement(mat.id, 'out')}
                                className="px-2 py-1 rounded-lg bg-stone-100 dark:bg-stone-950 border border-stone-200 dark:border-stone-800 hover:bg-stone-200 dark:hover:bg-[#E2DFD2]/10 text-stone-700 dark:text-stone-300 dark:hover:text-[#E2DFD2] text-[10px] font-mono font-semibold transition-colors cursor-pointer"
                                title="Catat Pemakaian Bahan"
                              >
                                - Pakai
                              </button>

                              {/* Owner Edit & Delete */}
                              {isOwner && (
                                <>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setMaterialToEdit(mat)
                                      setIsFormModalOpen(true)
                                    }}
                                    className="p-1 rounded-lg text-stone-400 hover:text-stone-900 dark:hover:text-stone-100 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors cursor-pointer ml-1"
                                    title="Edit Master Bahan"
                                  >
                                    <Pencil className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => setMaterialToDelete(mat)}
                                    className="p-1 rounded-lg text-stone-400 hover:text-rose-600 dark:text-stone-500 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
                                    title="Hapus Bahan"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </>
                              )}
                            </div>
                          </td>

                        </tr>
                      )
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Mobile Card View (< 640px) */}
            <div className="block sm:hidden divide-y divide-stone-200 dark:divide-stone-800/80">
              {filteredMaterials.length === 0 ? (
                <div className="py-10 text-center text-stone-400 dark:text-stone-500 font-mono text-xs">
                  Tidak ada bahan baku yang cocok dengan pencarian / filter.
                </div>
              ) : (
                filteredMaterials.map((mat) => {
                  const isOutOfStock = mat.current_stock <= 0
                  const isLowStock = !isOutOfStock && mat.current_stock <= mat.min_stock_alert
                  const assetValue = (mat.current_stock || 0) * (mat.cost_per_unit || 0)

                  return (
                    <div key={mat.id} className="p-4 space-y-3">
                      {/* Top: Name, Category, Status */}
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <h4 className="font-bold text-stone-900 dark:text-stone-100 text-sm leading-snug">
                            {mat.name}
                          </h4>
                          <span className="text-[11px] font-mono text-stone-500 dark:text-stone-400">
                            {mat.category} {mat.supplier ? `• ${mat.supplier}` : ''}
                          </span>
                        </div>
                        <div>
                          {isOutOfStock ? (
                            <span className="px-2 py-0.5 rounded text-[10px] font-mono uppercase font-bold bg-rose-50 border border-rose-200 text-rose-700 dark:bg-rose-950/60 dark:border-rose-900/80 dark:text-rose-400">
                              Habis
                            </span>
                          ) : isLowStock ? (
                            <span className="px-2 py-0.5 rounded text-[10px] font-mono uppercase font-bold bg-amber-50 border border-amber-200 text-amber-800 dark:bg-amber-950/60 dark:border-amber-900/80 dark:text-amber-400">
                              Menipis
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded text-[10px] font-mono uppercase font-semibold bg-stone-100 dark:bg-stone-950 border border-stone-200 dark:border-stone-800 text-stone-600 dark:text-stone-400">
                              Aman
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Metric Grid */}
                      <div className={`grid ${isOwner ? 'grid-cols-3' : 'grid-cols-2'} gap-2 p-2.5 rounded-xl bg-stone-50 dark:bg-stone-950/60 border border-stone-200/80 dark:border-stone-800/80 text-xs font-mono`}>
                        <div>
                          <span className="text-[10px] text-stone-400 dark:text-stone-500 block">Stok Fisik</span>
                          <span className={`font-bold text-sm tabular-nums ${
                            isOutOfStock ? 'text-rose-600 dark:text-rose-400' : isLowStock ? 'text-amber-700 dark:text-amber-400' : 'text-stone-900 dark:text-[#E2DFD2]'
                          }`}>
                            {mat.current_stock} <span className="text-[10px] font-sans font-normal text-stone-500">{mat.unit}</span>
                          </span>
                        </div>
                        <div>
                          <span className="text-[10px] text-stone-400 dark:text-stone-500 block">Batas Min</span>
                          <span className="font-semibold text-stone-600 dark:text-stone-400 tabular-nums">
                            {mat.min_stock_alert} <span className="text-[10px] font-sans font-normal">{mat.unit}</span>
                          </span>
                        </div>
                        {isOwner && (
                          <div>
                            <span className="text-[10px] text-stone-400 dark:text-stone-500 block">Nilai Aset</span>
                            <span className="font-bold text-emerald-700 dark:text-emerald-400 tabular-nums text-[11px] truncate block">
                              {assetValue > 0 ? formatRupiah(assetValue) : '-'}
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Action Buttons */}
                      <div className="flex items-center justify-between gap-2 pt-0.5">
                        <div className="flex items-center gap-1.5 flex-1">
                          <button
                            type="button"
                            onClick={() => handleOpenMovement(mat.id, 'in')}
                            className="flex-1 py-1.5 px-2 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/60 hover:bg-emerald-100 text-emerald-800 dark:text-emerald-400 text-xs font-mono font-bold transition-all text-center cursor-pointer active:scale-95"
                          >
                            + Masuk
                          </button>
                          <button
                            type="button"
                            onClick={() => handleOpenMovement(mat.id, 'out')}
                            className="flex-1 py-1.5 px-2 rounded-lg bg-stone-100 dark:bg-stone-950 border border-stone-200 dark:border-stone-800 text-stone-700 dark:text-stone-300 text-xs font-mono font-bold transition-all text-center cursor-pointer active:scale-95"
                          >
                            - Pakai
                          </button>
                        </div>

                        {isOwner && (
                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => {
                                setMaterialToEdit(mat)
                                setIsFormModalOpen(true)
                              }}
                              className="p-2 rounded-lg text-stone-500 hover:text-stone-900 dark:text-stone-400 dark:hover:text-stone-100 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors"
                              title="Edit Bahan"
                            >
                              <Pencil className="w-4 h-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => setMaterialToDelete(mat)}
                              className="p-2 rounded-lg text-stone-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                              title="Hapus Bahan"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  )
                })
              )}
            </div>
          </div>

        </div>
      )}

      {/* VIEW: STOCK MOVEMENTS HISTORY */}
      {viewTab === 'history' && (
        <div className="bg-white dark:bg-stone-900/80 border border-stone-200 dark:border-stone-800 rounded-2xl overflow-hidden shadow-xs">
          <div className="p-4 border-b border-stone-200 dark:border-stone-800 flex items-center justify-between">
            <h3 className="text-sm font-bold text-stone-900 dark:text-stone-100">
              Riwayat Transaksi & Perubahan Stok
            </h3>
            <span className="text-[11px] font-mono text-stone-500 dark:text-stone-400">
              Menampilkan {movements.length} transaksi terakhir
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-stone-200 dark:border-stone-800 text-stone-500 dark:text-stone-400 font-mono text-[11px] uppercase tracking-wider bg-stone-50/60 dark:bg-stone-950/60">
                  <th className="py-3 px-3.5 font-semibold">Waktu</th>
                  <th className="py-3 px-3.5 font-semibold">Bahan Baku</th>
                  <th className="py-3 px-3.5 font-semibold text-center">Jenis Perubahan</th>
                  <th className="py-3 px-3.5 font-semibold text-right">Jumlah</th>
                  <th className="py-3 px-3.5 font-semibold">Petugas</th>
                  <th className="py-3 px-3.5 font-semibold">Catatan / Keterangan</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-200 dark:divide-stone-800/60">
                {movements.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-10 text-center text-stone-400 dark:text-stone-500 font-mono">
                      Belum ada riwayat mutasi stok bahan baku.
                    </td>
                  </tr>
                ) : (
                  movements.map((mov) => {
                    const isMasuk = mov.type === 'in'
                    const isWaste = mov.type === 'waste'

                    return (
                      <tr key={mov.id} className="hover:bg-stone-50 dark:hover:bg-stone-800/30 transition-colors">
                        <td className="py-3 px-3.5 font-mono text-stone-500 dark:text-stone-400 text-[11px] whitespace-nowrap">
                          {mov.created_at ? mov.created_at.substring(0, 16).replace('T', ' ') : '-'}
                        </td>
                        <td className="py-3 px-3 font-semibold text-stone-900 dark:text-stone-100">
                          {mov.material_name || '-'}
                        </td>
                        <td className="py-3 px-3 text-center">
                          <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-mono uppercase font-bold border ${
                            isMasuk
                              ? 'bg-emerald-50 border-emerald-200 text-emerald-800 dark:bg-emerald-950/60 dark:border-emerald-900/80 dark:text-emerald-400'
                              : isWaste
                              ? 'bg-rose-50 border-rose-200 text-rose-700 dark:bg-rose-950/60 dark:border-rose-900/80 dark:text-rose-400'
                              : 'bg-amber-50 border-amber-200 text-amber-800 dark:bg-amber-950/60 dark:border-amber-900/80 dark:text-amber-400'
                          }`}>
                            {isMasuk ? 'Stok Masuk' : isWaste ? 'Rusak / Basi' : 'Pemakaian'}
                          </span>
                        </td>
                        <td className={`py-3 px-3 text-right font-mono font-bold tabular-nums text-sm ${
                          isMasuk ? 'text-emerald-700 dark:text-emerald-400' : 'text-amber-700 dark:text-amber-400'
                        }`}>
                          {isMasuk ? '+' : '-'}{mov.quantity} {mov.unit || ''}
                        </td>
                        <td className="py-3 px-3 text-stone-700 dark:text-stone-300 font-mono text-[11px]">
                          {mov.created_by_name || 'Petugas'}
                        </td>
                        <td className="py-3 px-3.5 text-stone-500 dark:text-stone-400 text-[11px] italic">
                          {mov.notes || '-'}
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Movement Modal */}
      <RecordMovementModal
        isOpen={isMovementModalOpen}
        onClose={() => setIsMovementModalOpen(false)}
        materials={materials}
        initialMaterialId={movementInitialMaterialId}
        initialType={movementInitialType}
        currentUserName={currentUser.name}
        onMovementSuccess={handleMovementSuccess}
      />

      {/* Material Master Form Modal (Owner Only) */}
      {isOwner && (
        <MaterialFormModal
          isOpen={isFormModalOpen}
          onClose={() => {
            setIsFormModalOpen(false)
            setMaterialToEdit(null)
          }}
          materialToEdit={materialToEdit}
          onSaveSuccess={handleSaveMaterial}
        />
      )}

      {/* Confirm Delete Dialog */}
      <ConfirmDialog
        isOpen={!!materialToDelete}
        title="Hapus Master Bahan Baku"
        message={`Apakah Anda yakin ingin menghapus "${materialToDelete?.name}" dari katalog bahan baku warkop? Data mutasi terkait juga akan dihapus.`}
        confirmText="Ya, Hapus Bahan"
        variant="danger"
        onConfirm={handleDeleteMaterial}
        onCancel={() => setMaterialToDelete(null)}
      />

    </div>
  )
}
