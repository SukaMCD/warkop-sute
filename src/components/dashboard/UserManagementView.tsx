import { useState, useEffect } from 'react'
import type { User } from '../../types'
import {
  Users,
  UserPlus,
  KeyRound,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Loader2,
  X
} from 'lucide-react'
import { ConfirmDialog } from '../ui/ConfirmDialog'

interface DbUser {
  id: string
  name: string
  role: string
  username: string
}

interface UserManagementViewProps {
  currentUser: User
}

export const UserManagementView = ({ currentUser }: UserManagementViewProps) => {
  const [users, setUsers] = useState<DbUser[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [successMessage, setSuccessMessage] = useState('')
  const [errorMessage, setErrorMessage] = useState('')

  // Create User Modal
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [newName, setNewName] = useState('')
  const [newUsername, setNewUsername] = useState('')
  const [newPin, setNewPin] = useState('')
  const [isCreating, setIsCreating] = useState(false)

  // Change PIN Modal
  const [selectedUserForPin, setSelectedUserForPin] = useState<DbUser | null>(null)
  const [editPin, setEditPin] = useState('')
  const [isUpdatingPin, setIsUpdatingPin] = useState(false)

  // Dialog Konfirmasi & Alert
  const [userToDelete, setUserToDelete] = useState<DbUser | null>(null)
  const [isDeletingUser, setIsDeletingUser] = useState(false)
  const [isOwnerAlertOpen, setIsOwnerAlertOpen] = useState(false)

  // Fetch users
  const fetchUsers = async () => {
    setIsLoading(true)
    try {
      const res = await fetch('/api/users')
      if (res.ok) {
        const json: any = await res.json()
        if (json.success && Array.isArray(json.data)) {
          setUsers(json.data)
        }
      }
    } catch {
      // fallback
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchUsers()
  }, [])

  // Helper: Otomatis generate username dari nama petugas
  const generateUsername = (name: string): string => {
    return name
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s]/g, '')
      .replace(/\s+/g, '_')
      .slice(0, 30)
  }

  // Handle Create Cashier
  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault()
    const autoUsername = newUsername.trim() || generateUsername(newName)
    if (!newName.trim() || !autoUsername || newPin.length !== 6 || !/^\d{6}$/.test(newPin)) {
      setErrorMessage('Harap isi nama petugas dan PIN 6-digit angka valid.')
      return
    }

    setIsCreating(true)
    setErrorMessage('')
    setSuccessMessage('')

    try {
      const res = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newName.trim(),
          username: autoUsername,
          pin: newPin,
          role: 'cashier'
        })
      })

      const data: any = await res.json()
      if (res.ok && data.success) {
        setSuccessMessage(`Petugas ${newName} berhasil ditambahkan!`)
        setIsCreateModalOpen(false)
        setNewName('')
        setNewUsername('')
        setNewPin('')
        fetchUsers()
      } else {
        setErrorMessage(data.message || 'Gagal menambahkan petugas.')
      }
    } catch {
      setErrorMessage('Gagal menghubungi server database.')
    } finally {
      setIsCreating(false)
    }
  }

  // Handle Update PIN
  const handleUpdatePin = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedUserForPin) return

    if (editPin.length !== 6 || !/^\d{6}$/.test(editPin)) {
      setErrorMessage('PIN baru harus tepat 6-digit angka.')
      return
    }

    setIsUpdatingPin(true)
    setErrorMessage('')
    setSuccessMessage('')

    try {
      const res = await fetch(`/api/users/${selectedUserForPin.id}/pin`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pin: editPin })
      })

      const data: any = await res.json()
      if (res.ok && data.success) {
        setSuccessMessage(`PIN untuk ${selectedUserForPin.name} berhasil diubah!`)
        setSelectedUserForPin(null)
        setEditPin('')
      } else {
        setErrorMessage(data.message || 'Gagal mengubah PIN.')
      }
    } catch {
      setErrorMessage('Gagal menghubungi server database.')
    } finally {
      setIsUpdatingPin(false)
    }
  }

  // Handle Delete Cashier
  const handleDeleteUser = (user: DbUser) => {
    if (user.role === 'owner') {
      setIsOwnerAlertOpen(true)
      return
    }
    setUserToDelete(user)
  }

  const handleConfirmDelete = async () => {
    if (!userToDelete) return
    setIsDeletingUser(true)

    try {
      const res = await fetch(`/api/users/${userToDelete.id}`, { method: 'DELETE' })
      if (res.ok) {
        setUsers(prev => prev.filter(u => u.id !== userToDelete.id))
        setSuccessMessage(`Petugas ${userToDelete.name} berhasil dihapus.`)
      } else {
        setErrorMessage('Gagal menghapus petugas.')
      }
    } catch {
      setErrorMessage('Gagal menghapus petugas.')
    } finally {
      setIsDeletingUser(false)
      setUserToDelete(null)
    }
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="bg-stone-900/80 border border-stone-800 rounded-2xl p-5 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-stone-800 gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-stone-950 border border-stone-800 flex items-center justify-center text-[#E2DFD2] shadow-xs">
              <Users className="w-4 h-4 stroke-2" />
            </div>
            <div>
              <h2 className="text-sm font-bold tracking-tight text-stone-100">
                Kelola Petugas Kasir
              </h2>
              <p className="text-[11px] text-stone-400">
                Atur akun kasir, ubah PIN, dan tambah petugas warkop baru
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => {
              setIsCreateModalOpen(true)
              setErrorMessage('')
            }}
            className="px-3.5 py-2 rounded-xl bg-[#E2DFD2] hover:bg-[#d6d3c6] text-stone-950 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-sm active:scale-95"
          >
            <UserPlus className="w-4 h-4" />
            <span>Tambah Petugas Baru</span>
          </button>
        </div>

        {/* Alerts */}
        {successMessage && (
          <div className="mt-4 p-3 rounded-xl bg-emerald-950/40 border border-emerald-800/80 flex items-center justify-between text-emerald-300 text-xs">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>{successMessage}</span>
            </div>
            <button type="button" onClick={() => setSuccessMessage('')} className="text-emerald-400 hover:text-white">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {errorMessage && (
          <div className="mt-4 p-3 rounded-xl bg-rose-950/40 border border-rose-800/80 flex items-center justify-between text-rose-300 text-xs">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
              <span>{errorMessage}</span>
            </div>
            <button type="button" onClick={() => setErrorMessage('')} className="text-rose-400 hover:text-white">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Users Table */}
        <div className="mt-4 overflow-hidden">
          <table className="w-full text-left text-xs table-auto">
            <thead>
              <tr className="border-b border-stone-800 text-stone-400 font-mono text-[11px] uppercase tracking-wider bg-stone-950/40">
                <th className="py-2.5 px-3 font-semibold rounded-l-lg">Nama Petugas</th>
                <th className="py-2.5 px-3 font-semibold">Username Login</th>
                <th className="py-2.5 px-3 font-semibold text-center">Peran (Role)</th>
                <th className="py-2.5 px-3 font-semibold text-right rounded-r-lg">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-800/60">
              {isLoading ? (
                <tr>
                  <td colSpan={4} className="py-8 text-center text-stone-400">
                    <Loader2 className="w-5 h-5 animate-spin mx-auto mb-2 text-[#E2DFD2]" />
                    <span>Memuat data petugas...</span>
                  </td>
                </tr>
              ) : (
                users.map((u) => (
                  <tr key={u.id} className="hover:bg-stone-800/30 transition-colors">
                    <td className="py-3 px-3 font-semibold text-stone-100">
                      <div className="flex items-center gap-2">
                        <span>{u.name}</span>
                        {u.id === currentUser.id && (
                          <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-stone-800 text-stone-300">
                            (Anda)
                          </span>
                        )}
                      </div>
                    </td>

                    <td className="py-3 px-3 font-mono text-stone-300">
                      @{u.username}
                    </td>

                    <td className="py-3 px-3 text-center">
                      <span className={`inline-block px-2 py-0.5 rounded-md text-[10px] font-mono uppercase tracking-wider font-semibold border ${
                        u.role === 'owner'
                          ? 'border-[#E2DFD2]/40 bg-[#E2DFD2]/10 text-[#E2DFD2]'
                          : 'border-stone-800 bg-stone-950 text-stone-300'
                      }`}>
                        {u.role === 'owner' ? 'Owner' : 'Kasir'}
                      </span>
                    </td>

                    <td className="py-3 px-3 text-right">

                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedUserForPin(u)
                            setEditPin('')
                            setErrorMessage('')
                          }}
                          className="px-2.5 py-1 rounded-lg bg-stone-950 border border-stone-800 hover:border-[#E2DFD2]/60 hover:bg-[#E2DFD2]/10 text-stone-300 hover:text-[#E2DFD2] text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                          title="Ganti PIN 6-digit"
                        >
                          <KeyRound className="w-3 h-3 text-[#E2DFD2]" />
                          <span>Ubah PIN</span>
                        </button>

                        {u.role !== 'owner' && (
                          <button
                            type="button"
                            onClick={() => handleDeleteUser(u)}
                            className="p-1 rounded-lg bg-stone-950 border border-stone-800 hover:border-rose-900 hover:bg-rose-950/40 text-stone-400 hover:text-rose-400 transition-colors cursor-pointer"
                            title="Hapus Petugas"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: Tambah Petugas Baru */}
      {/* Modal: Tambah Petugas Baru */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 bg-stone-950 flex flex-col text-stone-100 animate-in fade-in duration-150">
          <header className="px-6 py-4 border-b border-stone-800 bg-stone-900/60 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-stone-900 border border-stone-800 flex items-center justify-center text-[#E2DFD2] shadow-xs">
                <UserPlus className="w-5 h-5 stroke-2" />
              </div>
              <div>
                <h3 className="text-base font-bold text-stone-100">Tambah Kasir Baru</h3>
                <p className="text-xs text-stone-400">Daftarkan akun kasir atau operator baru untuk operasional warkop</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setIsCreateModalOpen(false)}
              className="p-2 rounded-xl text-stone-400 hover:text-stone-100 hover:bg-stone-800 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </header>

          <div className="flex-1 overflow-y-auto p-4 sm:p-8 flex items-center justify-center">
            <div className="w-full max-w-md bg-stone-900 border border-stone-800 rounded-2xl p-6 sm:p-8 shadow-xl space-y-6">
              <form onSubmit={handleCreateUser} className="space-y-4">
                <div>
                  <label className="block text-xs font-mono text-stone-400 uppercase tracking-wider mb-1.5 font-semibold">
                    Nama Petugas
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: Budi Santoso"
                    value={newName}
                    onChange={(e) => {
                      const val = e.target.value
                      setNewName(val)
                      setNewUsername(generateUsername(val))
                    }}
                    className="w-full bg-stone-950 border border-stone-800 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-stone-100 placeholder-stone-500 focus:outline-none focus:border-[#E2DFD2]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-mono text-stone-400 uppercase tracking-wider mb-1.5 font-semibold">
                    PIN Akses (6-Digit Angka)
                  </label>
                  <input
                    type="password"
                    inputMode="numeric"
                    maxLength={6}
                    required
                    placeholder="Contoh: 123456"
                    value={newPin}
                    onChange={(e) => setNewPin(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    className="w-full bg-stone-950 border border-stone-800 rounded-xl px-3.5 py-2.5 text-sm font-mono tracking-widest text-center text-stone-100 placeholder-stone-500 focus:outline-none focus:border-[#E2DFD2]"
                  />
                  <span className="text-[11px] text-stone-500 font-mono block mt-1.5 text-center">
                    Harus tepat 6 digit angka numerik.
                  </span>
                </div>

                <div className="flex items-center gap-3 pt-3 border-t border-stone-800">
                  <button
                    type="button"
                    onClick={() => setIsCreateModalOpen(false)}
                    className="flex-1 py-2.5 rounded-xl bg-stone-950 border border-stone-800 hover:bg-stone-800 text-stone-300 text-xs font-semibold cursor-pointer"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    disabled={isCreating}
                    className="flex-1 py-2.5 rounded-xl bg-[#E2DFD2] hover:bg-[#d6d3c6] text-stone-950 text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50 shadow-sm"
                  >
                    {isCreating ? 'Menyimpan...' : 'Simpan Petugas'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Ubah PIN */}
      {selectedUserForPin && (
        <div className="fixed inset-0 z-50 bg-stone-950 flex flex-col text-stone-100 animate-in fade-in duration-150">
          <header className="px-6 py-4 border-b border-stone-800 bg-stone-900/60 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-stone-900 border border-stone-800 flex items-center justify-center text-[#E2DFD2] shadow-xs">
                <KeyRound className="w-5 h-5 stroke-2" />
              </div>
              <div>
                <h3 className="text-base font-bold text-stone-100">Ubah PIN Akses</h3>
                <p className="text-xs text-stone-400">{selectedUserForPin.name} (@{selectedUserForPin.username})</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setSelectedUserForPin(null)}
              className="p-2 rounded-xl text-stone-400 hover:text-stone-100 hover:bg-stone-800 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </header>

          <div className="flex-1 overflow-y-auto p-4 sm:p-8 flex items-center justify-center">
            <div className="w-full max-w-md bg-stone-900 border border-stone-800 rounded-2xl p-6 sm:p-8 shadow-xl space-y-6">
              <form onSubmit={handleUpdatePin} className="space-y-4">
                <div>
                  <label className="block text-xs font-mono text-stone-400 uppercase tracking-wider mb-1.5 font-semibold">
                    Masukkan PIN 6-Digit Baru
                  </label>
                  <input
                    type="password"
                    inputMode="numeric"
                    maxLength={6}
                    required
                    placeholder="******"
                    value={editPin}
                    onChange={(e) => setEditPin(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    className="w-full bg-stone-950 border border-stone-800 rounded-xl px-3.5 py-3 text-sm font-mono tracking-widest text-center text-stone-100 placeholder-stone-500 focus:outline-none focus:border-[#E2DFD2]"
                  />
                  <span className="text-[11px] text-stone-500 font-mono block mt-1.5 text-center">
                    PIN baru akan dienkripsi dengan standar SHA-256.
                  </span>
                </div>

                <div className="flex items-center gap-3 pt-3 border-t border-stone-800">
                  <button
                    type="button"
                    onClick={() => setSelectedUserForPin(null)}
                    className="flex-1 py-2.5 rounded-xl bg-stone-950 border border-stone-800 hover:bg-stone-800 text-stone-300 text-xs font-semibold cursor-pointer"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    disabled={isUpdatingPin || editPin.length !== 6}
                    className="flex-1 py-2.5 rounded-xl bg-[#E2DFD2] hover:bg-[#edebe2] active:bg-[#d6d3c6] text-stone-950 text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-40 shadow-sm"
                  >
                    {isUpdatingPin ? 'Menyimpan...' : 'Perbarui PIN'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Dialog Konfirmasi Hapus Petugas */}
      <ConfirmDialog
        isOpen={!!userToDelete}
        title="Hapus Petugas Kasir"
        message={`Yakin ingin menghapus petugas "${userToDelete?.name}"? Akun ini tidak akan dapat login lagi ke sistem warkop.`}
        confirmText="Hapus Petugas"
        cancelText="Batal"
        variant="danger"
        isLoading={isDeletingUser}
        onConfirm={handleConfirmDelete}
        onCancel={() => !isDeletingUser && setUserToDelete(null)}
      />

      {/* Dialog Informasi Proteksi Akun Owner */}
      <ConfirmDialog
        isOpen={isOwnerAlertOpen}
        title="Akun Owner Dilindungi"
        message="Akun Owner adalah akun administrator utama warkop dan tidak dapat dihapus dari sistem."
        confirmText="Mengerti"
        variant="info"
        onConfirm={() => setIsOwnerAlertOpen(false)}
        onCancel={() => setIsOwnerAlertOpen(false)}
      />

    </div>
  )
}
