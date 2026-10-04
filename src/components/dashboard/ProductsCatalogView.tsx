import { useState, useEffect, useRef } from 'react'
import type { Product } from '../../types'
import { formatRupiah } from '../../utils/formatters'
import { NumericInput } from '../ui/NumericInput'
import { SearchableSelect } from '../ui/SearchableSelect'
import {
  Search,
  Coffee,
  CupSoda,
  Utensils,
  UtensilsCrossed,
  Cookie,
  Sparkles,
  X,
  MoreVertical,
  Plus,
  Pencil,
  Trash2,
  Power,
  AlertTriangle
} from 'lucide-react'

interface ProductsCatalogViewProps {
  products: Product[]
  onProductsChange?: (products: Product[]) => void
}

export const ProductsCatalogView = ({
  products: initialProducts,
  onProductsChange
}: ProductsCatalogViewProps) => {
  const [products, setProducts] = useState<Product[]>(initialProducts)
  const [selectedCategory, setSelectedCategory] = useState<string>('cat_kopi')
  const [searchQuery, setSearchQuery] = useState<string>('')

  // Dropdown & Modal States
  const [activeDropdownId, setActiveDropdownId] = useState<string | null>(null)
  const [isFormModalOpen, setIsFormModalOpen] = useState(false)
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)
  const [deletingProduct, setDeletingProduct] = useState<Product | null>(null)

  // Form Fields
  const [formName, setFormName] = useState('')
  const [formCategory, setFormCategory] = useState('cat_kopi')
  const [formPrice, setFormPrice] = useState<number>(10000)
  const [formCostPrice, setFormCostPrice] = useState<number>(5000)
  const [formIsAvailable, setFormIsAvailable] = useState(true)
  const [formIsFavorite, setFormIsFavorite] = useState(false)
  const [formStock, setFormStock] = useState<number | ''>('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const dropdownRef = useRef<HTMLDivElement | null>(null)

  // Sync internal state when props change
  useEffect(() => {
    setProducts(initialProducts)
  }, [initialProducts])

  // Close dropdown on outside click
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setActiveDropdownId(null)
      }
    }
    document.addEventListener('mousedown', handleOutsideClick)
    return () => document.removeEventListener('mousedown', handleOutsideClick)
  }, [])

  // Authentic Categories list matching POSView and D1 Database
  const categories = [
    { id: 'cat_kopi', label: 'Perkopian', icon: Coffee },
    { id: 'cat_minum', label: 'Minum-Minum', icon: CupSoda },
    { id: 'cat_mie', label: 'Permie-an', icon: Utensils },
    { id: 'cat_nasi', label: 'Pernasi-an', icon: UtensilsCrossed },
    { id: 'cat_cemilan', label: 'Cemal-Cemil', icon: Cookie },
    { id: 'cat_spesial', label: 'Spesial', icon: Sparkles }
  ]

  const categoryNameMap: Record<string, string> = {
    cat_kopi: 'Perkopian',
    cat_minum: 'Minum-Minum',
    cat_mie: 'Permie-an',
    cat_nasi: 'Pernasi-an',
    cat_cemilan: 'Cemal-Cemil',
    cat_spesial: 'Spesial'
  }

  // Open modal to create new menu item
  const handleOpenCreateModal = () => {
    setEditingProduct(null)
    setFormName('')
    setFormCategory(selectedCategory || 'cat_kopi')
    setFormPrice(10000)
    setFormCostPrice(5000)
    setFormIsAvailable(true)
    setFormIsFavorite(false)
    setFormStock('')
    setIsFormModalOpen(true)
    setActiveDropdownId(null)
  }

  // Open modal to edit existing menu item
  const handleOpenEditModal = (product: Product) => {
    setEditingProduct(product)
    setFormName(product.name)
    setFormCategory(product.category_id)
    setFormPrice(product.price)
    setFormCostPrice(product.cost_price || 0)
    setFormIsAvailable(Boolean(product.is_available))
    setFormIsFavorite(Boolean(product.is_favorite))
    setFormStock(product.stock !== undefined && product.stock !== null ? product.stock : '')
    setIsFormModalOpen(true)
    setActiveDropdownId(null)
  }

  // Toggle availability (Habis / Tersedia)
  const handleToggleAvailability = async (product: Product) => {
    setActiveDropdownId(null)
    const newStatus = !product.is_available
    const updatedList = products.map(p =>
      p.id === product.id ? { ...p, is_available: newStatus } : p
    )
    setProducts(updatedList)
    onProductsChange?.(updatedList)

    try {
      await fetch(`/api/products/${product.id}/toggle`, { method: 'PATCH' })
    } catch {
      // Offline / local state fallback handled
    }
  }

  // Save (Create or Update) handler
  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formName.trim() || formPrice < 0) return

    setIsSubmitting(true)
    const parsedStock = formStock === '' ? null : Math.max(0, parseInt(String(formStock), 10) || 0)

    try {
      if (editingProduct) {
        // UPDATE Existing
        const updatedItem: Product = {
          ...editingProduct,
          name: formName.trim(),
          category_id: formCategory,
          category_name: categoryNameMap[formCategory] || formCategory,
          price: formPrice,
          cost_price: formCostPrice,
          is_available: formIsAvailable,
          is_favorite: formIsFavorite,
          stock: parsedStock
        }

        const nextList = products.map(p => (p.id === editingProduct.id ? updatedItem : p))
        setProducts(nextList)
        onProductsChange?.(nextList)

        await fetch(`/api/products/${editingProduct.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: updatedItem.name,
            category_id: updatedItem.category_id,
            price: updatedItem.price,
            cost_price: updatedItem.cost_price,
            is_available: updatedItem.is_available,
            is_favorite: updatedItem.is_favorite,
            stock: parsedStock
          })
        })
      } else {
        // CREATE New
        const newId = `prod_${Date.now()}`
        const newItem: Product = {
          id: newId,
          name: formName.trim(),
          category_id: formCategory,
          category_name: categoryNameMap[formCategory] || formCategory,
          price: formPrice,
          cost_price: formCostPrice,
          is_available: formIsAvailable,
          is_favorite: formIsFavorite,
          stock: parsedStock,
          sales_count: 0
        }

        const nextList = [newItem, ...products]
        setProducts(nextList)
        onProductsChange?.(nextList)

        await fetch('/api/products', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: newItem.name,
            category_id: newItem.category_id,
            price: newItem.price,
            cost_price: newItem.cost_price,
            is_available: newItem.is_available,
            is_favorite: newItem.is_favorite,
            stock: parsedStock
          })
        })
      }

      setIsFormModalOpen(false)
    } finally {
      setIsSubmitting(false)
    }
  }

  // Delete product handler
  const handleDeleteProduct = async () => {
    if (!deletingProduct) return

    const nextList = products.filter(p => p.id !== deletingProduct.id)
    setProducts(nextList)
    onProductsChange?.(nextList)

    try {
      await fetch(`/api/products/${deletingProduct.id}`, { method: 'DELETE' })
    } catch {
      // Handled
    }

    setDeletingProduct(null)
  }

  // Filtered Products
  const filteredProducts = products.filter(p => {
    const matchCat = searchQuery.trim().length > 0 ? true : p.category_id === selectedCategory
    const matchSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase())
    return matchCat && matchSearch
  })

  return (
    <div className="space-y-4">
      
      {/* Top Filter & Action Bar */}
      <div className="bg-stone-900/80 border border-stone-800 rounded-2xl p-4 flex flex-col md:flex-row items-center justify-between gap-3 shadow-sm">
        
        {/* Left: Search & New Menu Button */}
        <div className="flex items-center gap-2.5 w-full md:w-auto flex-1 max-w-md">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              placeholder="Cari menu warkop..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-stone-950 border border-stone-800 rounded-xl pl-10 pr-9 py-2 text-xs text-stone-100 placeholder-stone-400 focus:outline-none focus:border-[#E2DFD2] transition-colors"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-200"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          <button
            type="button"
            onClick={handleOpenCreateModal}
            className="px-3.5 py-2 rounded-xl bg-[#E2DFD2] hover:bg-[#edebe2] text-stone-950 font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer shadow-sm active:scale-95 shrink-0"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>Tambah Menu</span>
          </button>
        </div>

        {/* Categories Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto pb-1 md:pb-0 scrollbar-none">
          {categories.map((cat) => {
            const Icon = cat.icon
            const isActive = selectedCategory === cat.id
            const count = products.filter(p => p.category_id === cat.id).length

            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => setSelectedCategory(cat.id)}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-medium whitespace-nowrap transition-all cursor-pointer ${
                  isActive
                    ? 'bg-[#E2DFD2] text-stone-950 font-bold shadow-sm'
                    : 'bg-stone-950 border border-stone-800 text-stone-400 hover:text-stone-200 hover:bg-stone-850'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{cat.label}</span>
                <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-mono ${
                  isActive ? 'bg-stone-950/15 text-stone-950 font-bold' : 'bg-stone-900 text-stone-400'
                }`}>
                  {count}
                </span>
              </button>
            )
          })}
        </div>

      </div>

      {/* Product List Table */}
      <div className="bg-stone-900/80 border border-stone-800 rounded-2xl p-5 shadow-sm overflow-visible">
        <div className="overflow-x-auto">
          <table className="w-full min-w-190 text-left text-xs table-auto">
            <thead>
              <tr className="border-b border-stone-800 text-stone-400 font-mono text-[11px] uppercase tracking-wider bg-stone-950/40">
                <th className="py-3 px-3.5 font-semibold rounded-l-lg">Nama Menu</th>
                <th className="py-3 px-3.5 font-semibold">Kategori</th>
                <th className="py-3 px-3.5 font-semibold text-right">Harga Jual</th>
                <th className="py-3 px-3.5 font-semibold text-right">Modal (HPP)</th>
                <th className="py-3 px-3.5 font-semibold text-right">Margin Laba</th>
                <th className="py-3 px-3.5 font-semibold text-center">Stok</th>
                <th className="py-3 px-3.5 font-semibold text-center">Ketersediaan</th>
                <th className="py-3 px-3.5 font-semibold text-center rounded-r-lg w-16">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-800/60">
              {filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-stone-400">
                    Tidak ada menu pada kategori ini.
                  </td>
                </tr>
              ) : (
                filteredProducts.map((p) => {
                  const profit = p.price - p.cost_price
                  const margin = p.price > 0 ? Math.round((profit / p.price) * 100) : 0
                  const isMenuDropdownOpen = activeDropdownId === p.id

                  return (
                    <tr key={p.id} className="hover:bg-stone-800/30 transition-colors group">
                      <td className="py-3.5 px-3.5 font-medium text-stone-100">
                        <div className="flex items-center gap-2">
                          <span>{p.name}</span>
                          {Boolean(p.is_favorite) && (
                            <span className="px-1.5 py-0.5 rounded text-[10px] font-mono uppercase bg-stone-950 border border-stone-800 text-[#E2DFD2] font-semibold">
                              Favorit
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-3.5 px-3.5 text-stone-400">
                        <span className="px-2 py-0.5 rounded-lg text-[10px] font-mono uppercase border border-stone-800 bg-stone-950 text-stone-300 font-semibold">
                          {p.category_name}
                        </span>
                      </td>
                      <td className="py-3.5 px-3.5 text-right font-mono tabular-nums font-bold text-stone-100">
                        {formatRupiah(p.price)}
                      </td>
                      <td className="py-3.5 px-3.5 text-right font-mono tabular-nums text-stone-400">
                        {formatRupiah(p.cost_price)}
                      </td>
                      <td className="py-3.5 px-3.5 text-right font-mono tabular-nums text-emerald-400 font-bold">
                        +{margin}% ({formatRupiah(profit)})
                      </td>
                      <td className="py-3.5 px-3.5 text-center font-mono">
                        {p.stock === undefined || p.stock === null ? (
                          <span className="text-stone-500 text-[10px]">Unlimited</span>
                        ) : p.stock <= 0 ? (
                          <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold border border-rose-900/60 bg-rose-950/40 text-rose-400">
                            Habis (0)
                          </span>
                        ) : p.stock <= 5 ? (
                          <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold border border-amber-900/60 bg-amber-950/40 text-amber-400">
                            Sisa {p.stock}
                          </span>
                        ) : (
                          <span className="text-stone-300 font-semibold text-xs">{p.stock} porsi</span>
                        )}
                      </td>
                      <td className="py-3.5 px-3.5 text-center">
                        {p.is_available ? (
                          <span className="inline-block px-2.5 py-0.5 rounded-md text-[10px] font-mono font-bold uppercase tracking-wider border border-emerald-900/60 bg-emerald-950/40 text-emerald-400">
                            Tersedia
                          </span>
                        ) : (
                          <span className="inline-block px-2.5 py-0.5 rounded-md text-[10px] font-mono font-bold uppercase tracking-wider border border-rose-900/60 bg-rose-950/40 text-rose-400">
                            Habis
                          </span>
                        )}
                      </td>

                      {/* AKSI: Sleek 3-dots Menu Button */}
                      <td className="py-3.5 px-3.5 text-center relative">
                        <div className="relative inline-block" ref={isMenuDropdownOpen ? dropdownRef : null}>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation()
                              setActiveDropdownId(isMenuDropdownOpen ? null : p.id)
                            }}
                            className={`w-8 h-8 rounded-xl border flex items-center justify-center transition-all cursor-pointer shadow-xs active:scale-95 ${
                              isMenuDropdownOpen
                                ? 'bg-stone-800 border-[#E2DFD2] text-[#E2DFD2]'
                                : 'bg-stone-950 border-stone-800 hover:bg-stone-850 hover:border-stone-700 text-stone-400 hover:text-stone-100'
                            }`}
                            title="Opsi Menu"
                          >
                            <MoreVertical className="w-4 h-4" />
                          </button>

                          {/* 3-Dots Dropdown Menu */}
                          {isMenuDropdownOpen && (
                            <div className="absolute right-0 top-9 z-30 w-44 rounded-xl bg-stone-900 border border-stone-800 shadow-2xl py-1 text-left text-xs animate-in fade-in zoom-in-95 duration-100">
                              <button
                                type="button"
                                onClick={() => handleOpenEditModal(p)}
                                className="w-full px-3 py-2 flex items-center gap-2.5 text-stone-200 hover:bg-stone-800 hover:text-white transition-colors cursor-pointer"
                              >
                                <Pencil className="w-3.5 h-3.5 text-[#E2DFD2]" />
                                <span>Edit Menu</span>
                              </button>

                              <button
                                type="button"
                                onClick={() => handleToggleAvailability(p)}
                                className="w-full px-3 py-2 flex items-center gap-2.5 text-stone-200 hover:bg-stone-800 hover:text-white transition-colors cursor-pointer"
                              >
                                <Power className={`w-3.5 h-3.5 ${p.is_available ? 'text-amber-400' : 'text-emerald-400'}`} />
                                <span>{p.is_available ? 'Tandai Habis' : 'Tandai Tersedia'}</span>
                              </button>

                              <div className="h-px bg-stone-800 my-1" />

                              <button
                                type="button"
                                onClick={() => {
                                  setActiveDropdownId(null)
                                  setDeletingProduct(p)
                                }}
                                className="w-full px-3 py-2 flex items-center gap-2.5 text-rose-400 hover:bg-rose-950/40 hover:text-rose-300 transition-colors cursor-pointer"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                                <span>Hapus Menu</span>
                              </button>
                            </div>
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
      </div>

      {/* MODAL: Tambah / Edit Menu */}
      {isFormModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-stone-900 border border-stone-800 rounded-2xl w-full max-w-md p-6 shadow-2xl relative">
            
            {/* Header Modal */}
            <div className="flex items-center justify-between pb-3 border-b border-stone-800 mb-4">
              <div>
                <span className="text-[10px] font-mono uppercase text-[#E2DFD2] tracking-wider font-semibold">
                  {editingProduct ? 'Edit Menu' : 'Menu Baru'}
                </span>
                <h3 className="text-base font-bold text-stone-100">
                  {editingProduct ? `Ubah: ${editingProduct.name}` : 'Tambah Menu Baru'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsFormModalOpen(false)}
                className="w-8 h-8 rounded-xl bg-stone-950 hover:bg-stone-800 border border-stone-800 flex items-center justify-center text-stone-400 hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSaveProduct} className="space-y-3.5 text-xs">
              <div>
                <label className="text-stone-300 font-medium block mb-1">
                  Nama Menu <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Kopi Tubruk Susu"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  className="w-full bg-stone-950 border border-stone-800 rounded-xl px-3 py-2 text-stone-100 placeholder-stone-500 focus:outline-none focus:border-[#E2DFD2]"
                />
              </div>

              <div>
                <label className="text-stone-300 font-medium block mb-1">
                  Kategori Menu <span className="text-rose-400">*</span>
                </label>
                <SearchableSelect
                  value={formCategory}
                  onChange={(val) => setFormCategory(val)}
                  options={categories.map((c) => ({
                    value: c.id,
                    label: c.label
                  }))}
                  placeholder="Pilih kategori menu..."
                  searchPlaceholder="Cari kategori..."
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-stone-300 font-medium block mb-1">
                    Harga Jual <span className="text-rose-400">*</span>
                  </label>
                  <NumericInput
                    value={formPrice}
                    onChange={setFormPrice}
                    min={0}
                    step={500}
                    prefix="Rp"
                    required
                    placeholder="0"
                  />
                </div>

                <div>
                  <label className="text-stone-300 font-medium block mb-1">
                    Modal / HPP
                  </label>
                  <NumericInput
                    value={formCostPrice}
                    onChange={setFormCostPrice}
                    min={0}
                    step={500}
                    prefix="Rp"
                    placeholder="0"
                  />
                </div>
              </div>

              {/* Stok Bahan / Porsi */}
              <div>
                <label className="text-stone-300 font-medium block mb-1">
                  Stok Porsi / Bahan (Opsional)
                </label>
                <NumericInput
                  value={formStock}
                  onChange={(val) => setFormStock(val === 0 ? '' : val)}
                  min={0}
                  step={1}
                  suffix="porsi"
                  placeholder="Kosongkan jika stok unlimited"
                />
                <span className="text-[10px] text-stone-500 font-mono block mt-1">
                  Sistem otomatis memberi peringatan &quot;Menipis&quot; pada kasir jika sisa &le; 5 porsi.
                </span>
              </div>

              {/* Toggles */}
              <div className="pt-2 border-t border-stone-800 space-y-2">
                <label className="flex items-center justify-between p-2.5 rounded-xl bg-stone-950 border border-stone-800 cursor-pointer">
                  <span className="text-stone-300 font-medium">Status Ketersediaan</span>
                  <input
                    type="checkbox"
                    checked={formIsAvailable}
                    onChange={(e) => setFormIsAvailable(e.target.checked)}
                    className="w-4 h-4 rounded accent-[#E2DFD2] cursor-pointer"
                  />
                </label>

                <label className="flex items-center justify-between p-2.5 rounded-xl bg-stone-950 border border-stone-800 cursor-pointer">
                  <div>
                    <span className="text-stone-300 font-medium block">Menu Favorit</span>
                    <span className="text-[10px] text-stone-500">Tampilkan badge favorit</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={formIsFavorite}
                    onChange={(e) => setFormIsFavorite(e.target.checked)}
                    className="w-4 h-4 rounded accent-[#E2DFD2] cursor-pointer"
                  />
                </label>
              </div>

              {/* Action Buttons */}
              <div className="pt-3 border-t border-stone-800 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsFormModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-stone-800 bg-stone-950 hover:bg-stone-850 text-stone-300 text-xs font-semibold transition-colors cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 rounded-xl bg-[#E2DFD2] hover:bg-[#edebe2] text-stone-950 font-bold text-xs transition-all cursor-pointer shadow-sm active:scale-95 disabled:opacity-50"
                >
                  {isSubmitting ? 'Menyimpan...' : editingProduct ? 'Simpan Perubahan' : 'Tambah Menu'}
                </button>
              </div>
            </form>

          </div>
        </div>
      )}

      {/* MODAL: Konfirmasi Hapus Menu */}
      {deletingProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-stone-900 border border-stone-800 rounded-2xl w-full max-w-sm p-6 shadow-2xl relative text-center">
            <div className="w-11 h-11 rounded-2xl bg-rose-950/60 border border-rose-900/60 text-rose-400 flex items-center justify-center mx-auto mb-3 shadow-inner">
              <AlertTriangle className="w-6 h-6 stroke-2" />
            </div>

            <h3 className="text-base font-bold text-stone-100">
              Hapus Menu Ini?
            </h3>
            <p className="text-xs text-stone-400 mt-1.5 leading-relaxed">
              Apakah Anda yakin ingin menghapus <strong className="text-stone-200">"{deletingProduct.name}"</strong>? Menu ini tidak akan muncul lagi di layar kasir.
            </p>

            <div className="mt-5 flex items-center justify-center gap-2.5">
              <button
                type="button"
                onClick={() => setDeletingProduct(null)}
                className="flex-1 py-2 rounded-xl border border-stone-800 bg-stone-950 hover:bg-stone-850 text-stone-300 text-xs font-semibold transition-colors cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleDeleteProduct}
                className="flex-1 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs transition-all cursor-pointer shadow-sm active:scale-95"
              >
                Ya, Hapus
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}
