import { ExchangeRate } from '../store/appStore'

/**
 * Format USD amount with proper currency symbol and locale
 */
export function formatUSD(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount)
}

/**
 * Format TRY amount with proper currency symbol and locale
 */
export function formatTRY(amount: number): string {
  return new Intl.NumberFormat('tr-TR', {
    style: 'currency',
    currency: 'TRY',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount)
}

/**
 * Convert USD amount to TRY using the provided exchange rate
 */
export function convertUsdToTry(usdAmount: number, rate: ExchangeRate | null): number {
  if (!rate) return 0
  return usdAmount * rate.rate
}

/**
 * Format currency amount based on the current currency view
 */
export function formatCurrency(
  usdAmount: number, 
  currencyView: 'USD' | 'TRY', 
  exchangeRate: ExchangeRate | null
): string {
  if (currencyView === 'USD') {
    return formatUSD(usdAmount)
  } else {
    const tryAmount = convertUsdToTry(usdAmount, exchangeRate)
    return formatTRY(tryAmount)
  }
}

/**
 * Get currency symbol for the current view
 */
export function getCurrencySymbol(currencyView: 'USD' | 'TRY'): string {
  return currencyView === 'USD' ? '$' : '₺'
}

/**
 * Parse currency string back to number (removes formatting)
 */
export function parseCurrency(currencyString: string): number {
  // Remove currency symbols, spaces, and commas, then parse
  const cleaned = currencyString.replace(/[₺$,\s]/g, '').replace(/[^\d.-]/g, '')
  return parseFloat(cleaned) || 0
}

/**
 * Format currency for input fields (no currency symbol, just number)
 */
export function formatCurrencyForInput(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount)
}
