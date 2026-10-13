/**
 * Date formatting utilities for Gregorian calendar with Arabic locale
 */

/**
 * Format date for display with Arabic month names and Western numerals
 * Example: "20 يناير 2026"
 */
export function formatDate(date: Date | string | null | undefined): string {
  if (!date) return '-'

  const d = typeof date === 'string' ? new Date(date) : date

  if (isNaN(d.getTime())) return '-'

  return d.toLocaleDateString('ar-EG', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    numberingSystem: 'latn' // Use Western (Latin) numerals
  })
}

/**
 * Format date for display with short month name
 * Example: "20 يناير 2026"
 */
export function formatDateShort(date: Date | string | null | undefined): string {
  if (!date) return '-'

  const d = typeof date === 'string' ? new Date(date) : date

  if (isNaN(d.getTime())) return '-'

  return d.toLocaleDateString('ar-EG', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    numberingSystem: 'latn'
  })
}

/**
 * Format date with time
 * Example: "20 يناير 2026، 5:30 م"
 */
export function formatDateTime(date: Date | string | null | undefined): string {
  if (!date) return '-'

  const d = typeof date === 'string' ? new Date(date) : date

  if (isNaN(d.getTime())) return '-'

  return d.toLocaleDateString('ar-EG', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    numberingSystem: 'latn'
  })
}

/**
 * Format date for input fields (ISO format: YYYY-MM-DD)
 * Example: "2026-01-20"
 */
export function formatDateForInput(date: Date | string | null | undefined): string {
  if (!date) return ''

  const d = typeof date === 'string' ? new Date(date) : date

  if (isNaN(d.getTime())) return ''

  return d.toISOString().split('T')[0]
}

/**
 * Format number with Western numerals (for currency, etc.)
 * Example: "1,234.56"
 */
export function formatNumber(value: number | string | null | undefined, decimals: number = 0): string {
  if (value === null || value === undefined || value === '') return '0'

  const num = typeof value === 'string' ? parseFloat(value) : value

  if (isNaN(num)) return '0'

  return num.toLocaleString('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  })
}

/**
 * Format currency with symbol
 * Example: "₺1,234.56" or "$1,234.56"
 */
export function formatCurrency(
  value: number | string | null | undefined,
  currency: 'TRY' | 'USD' = 'TRY'
): string {
  if (value === null || value === undefined || value === '') return currency === 'TRY' ? '₺0' : '$0'

  const num = typeof value === 'string' ? parseFloat(value) : value

  if (isNaN(num)) return currency === 'TRY' ? '₺0' : '$0'

  const symbol = currency === 'TRY' ? '₺' : '$'
  const formatted = num.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })

  return `${symbol}${formatted}`
}

/**
 * Parse ISO date string to Date object
 */
export function parseDate(dateString: string | null | undefined): Date | null {
  if (!dateString) return null

  const d = new Date(dateString)

  return isNaN(d.getTime()) ? null : d
}

/**
 * Get month name in Arabic
 */
export function getMonthName(monthIndex: number): string {
  const months = [
    'يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو',
    'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'
  ]

  return months[monthIndex] || ''
}

/**
 * Format period (YYYY-MM) for display
 * Example: "يناير 2026"
 */
export function formatPeriod(period: string | null | undefined): string {
  if (!period) return '-'

  const [year, month] = period.split('-')
  const monthIndex = parseInt(month, 10) - 1

  return `${getMonthName(monthIndex)} ${year}`
}

// Legacy compatibility exports
export const formatGregorian = formatDate
export const formatISODate = formatDate
