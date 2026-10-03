export function formatRupiah(amount: number): string {
  return 'Rp ' + (amount || 0).toLocaleString('id-ID')
}

export function formatNumber(value: number): string {
  return new Intl.NumberFormat('id-ID').format(value)
}
