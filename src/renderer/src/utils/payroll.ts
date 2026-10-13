import { SalaryModel, Currency } from '../types/salary'

const add = (a = 0, b = 0) => Number((a + b).toFixed(2))

export function computeTotalsByCurrency(s: SalaryModel) {
  const buckets: Record<Currency, {
    gross: number
    deductions: number
    eosMonthly: number
    net: number
    totalAllowances: number
  }> = {
    TRY: { gross: 0, deductions: 0, eosMonthly: 0, net: 0, totalAllowances: 0 },
    USD: { gross: 0, deductions: 0, eosMonthly: 0, net: 0, totalAllowances: 0 },
  }

  // Helper to ensure bucket exists (or use fallback)
  const getBucket = (c: any) => {
    if (buckets[c as Currency]) return buckets[c as Currency]
    // If currency matches rough string (e.g. "try", "usd"), use it
    const normalized = String(c).toUpperCase() as Currency
    if (buckets[normalized]) return buckets[normalized]
    // Default to TRY if invalid
    return buckets.TRY
  }

  // Base minimum salary
  const baseBucket = getBucket(s.minBaseCurrency)
  baseBucket.totalAllowances = add(
    baseBucket.totalAllowances,
    s.minBaseAmount || 0
  )

  // Experience allowance per year
  const expTotal = (s.experienceAllowanceAmount || 0) * (s.yearsOfExperience || 0)
  const expBucket = getBucket(s.experienceAllowanceCurrency)
  expBucket.totalAllowances = add(
    expBucket.totalAllowances,
    expTotal
  )

  // Process allowances array (admin, education, dynamic allowances, etc.)
  for (const row of (s.allowances || [])) {
    if (row.category === 'allowance' || row.category === 'exception') {
      const bucket = getBucket(row.currency)
      bucket.totalAllowances = add(
        bucket.totalAllowances,
        row.amount || 0
      )
    }
  }

  // Process deductions
  for (const row of (s.deductions || [])) {
    if (row.category === 'deduction') {
      const bucket = getBucket(row.currency)
      bucket.deductions = add(
        bucket.deductions,
        row.amount || 0
      )
    }
  }

  // Calculate gross, EOS monthly, and net for each currency
  for (const currency of Object.keys(buckets) as Currency[]) {
    const bucket = buckets[currency]

    // Gross = total allowances
    bucket.gross = bucket.totalAllowances

    // EOS Monthly = gross / 12 (بدل نهاية الخدمة الشهري)
    bucket.eosMonthly = add(bucket.gross / 12, 0)

    // Net = gross - deductions (note: EOS is not deducted from net in this calculation)
    bucket.net = add(bucket.gross, -bucket.deductions)
  }

  return buckets
}

export function formatMoney(amount: number, currency: Currency): string {
  return `${amount.toFixed(2)} ${currency}`
}

export function getCurrentPeriod(): string {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
}
