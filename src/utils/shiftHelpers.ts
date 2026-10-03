export function parseShiftDateTime(dateStr: string): Date {
  if (!dateStr) return new Date()

  // Format: 'YYYY-MM-DD HH:mm:ss' or 'YYYY-MM-DD HH:mm'
  if (dateStr.includes(' ') && !dateStr.includes('T')) {
    const [datePart, timePart] = dateStr.split(' ')
    const [year, month, day] = datePart.split('-').map(Number)
    const timeParts = timePart.split(':').map(Number)
    const hour = timeParts[0] || 0
    const minute = timeParts[1] || 0
    const second = timeParts[2] || 0
    return new Date(year, month - 1, day, hour, minute, second)
  }

  // Format: 'HH:mm' or 'HH:mm:ss' (e.g. mock '08:00', '15:00')
  if (/^\d{2}:\d{2}(:\d{2})?$/.test(dateStr)) {
    const now = new Date()
    const parts = dateStr.split(':').map(Number)
    now.setHours(parts[0] || 0, parts[1] || 0, parts[2] || 0, 0)
    return now
  }

  const d = new Date(dateStr)
  return isNaN(d.getTime()) ? new Date() : d
}

export function formatTimeOnly(dateStr: string): string {
  if (!dateStr) return '--:--'
  if (/^\d{2}:\d{2}$/.test(dateStr)) return dateStr
  if (/^\d{2}:\d{2}:\d{2}$/.test(dateStr)) return dateStr.slice(0, 5)

  const d = parseShiftDateTime(dateStr)
  const hh = String(d.getHours()).padStart(2, '0')
  const mm = String(d.getMinutes()).padStart(2, '0')
  return `${hh}:${mm}`
}

export function calculateShiftDuration(startTime: string, endTime?: string | null): string {
  try {
    const start = parseShiftDateTime(startTime)
    const end = endTime ? parseShiftDateTime(endTime) : new Date()

    let diffMs = end.getTime() - start.getTime()
    if (diffMs < 0) diffMs = 0

    const totalMinutes = Math.floor(diffMs / (1000 * 60))
    const hours = Math.floor(totalMinutes / 60)
    const minutes = totalMinutes % 60

    if (hours === 0) {
      return `${minutes} menit`
    }
    if (minutes === 0) {
      return `${hours} jam`
    }
    return `${hours} jam ${minutes} menit`
  } catch {
    return '-'
  }
}

export function formatShiftSchedule(startTime: string, endTime?: string | null): {
  start: string
  end: string
  range: string
  duration: string
} {
  const start = formatTimeOnly(startTime)
  const isOngoing = !endTime || endTime === ''
  const end = isOngoing ? 'Sekarang' : formatTimeOnly(endTime)
  const duration = calculateShiftDuration(startTime, endTime)

  return {
    start,
    end,
    range: `${start} - ${end} WIB`,
    duration
  }
}
