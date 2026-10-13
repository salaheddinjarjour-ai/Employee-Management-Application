export type Money = { TRY: number; USD: number }
export type Line = { category: string; label: string; currency: 'TRY'|'USD'; amount: number }

export function sumMoney(lines: Line[]): Money {
  return lines.reduce<Money>((acc, l) => {
    if (l.currency === 'TRY') acc.TRY += l.amount || 0
    else acc.USD += l.amount || 0
    return acc
  }, { TRY: 0, USD: 0 })
}

// Helper: pick subset by category or label
export function pick(lines: Line[], pred: (l: Line) => boolean): Line[] {
  return lines.filter(pred)
}

/**
 * Business rules:
 *   total_allowances = sum of:
 *      - base_min (TRY, from header)
 *      - admin_allowance (TRY)
 *      - edu_allowance (TRY)
 *      - experience_allowance (TRY) = exp_rate * years_of_exp
 *      - exceptional additions (TRY or USD)
 *      - dynamic allowances (TRY or USD)
 *
 *   indemnity_monthly = (salary / 12)
 *   gross = total_allowances + indemnity_monthly
 *   net = gross - total_deductions - indemnity_monthly
 *
 * NOTE: We will do the math **per currency**. If a component is TRY,
 * it affects TRY totals only; same for USD.
 */
export function computeTotals(
  header: { base_min: number; years_of_exp: number },
  lines: Line[],
  experienceRateTRY: number // بدل خبرة (per year) in TRY. If you need USD too, pass two rates.
) {
  // explicit mapped lines by label (these are optional)
  const baseMin: Line = { category: 'allowance', label: 'الحد الأدنى', currency: 'TRY', amount: header.base_min || 0 }

  const adminAllowance = pick(lines, l => l.category === 'allowance' && l.label === 'بدل علاوة إدارية')
  const eduAllowance   = pick(lines, l => l.category === 'allowance' && l.label === 'بدل المؤهل العلمي')
  const expAllowance: Line = { 
    category: 'allowance', 
    label: 'بدل خبرة', 
    currency: 'TRY', 
    amount: (experienceRateTRY || 0) * (header.years_of_exp || 0) 
  }

  const exceptional    = pick(lines, l => l.category === 'exception')
  const dynAllowances  = pick(lines, l => l.category === 'allowance' && !['بدل علاوة إدارية','بدل المؤهل العلمي','بدل خبرة','الحد الأدنى'].includes(l.label))

  // breakdown & others (for reporting)
  const breakdown      = pick(lines, l => l.category === 'breakdown')          // من البنك TL, تأمين صحي TL, ضريبة TL (likely TRY)
  const cash           = pick(lines, l => l.category === 'cash')                // نقداً TL + USD
  const indemnity      = pick(lines, l => l.category === 'indemnity')          // بدل تعويض TL + USD
  const deductions     = pick(lines, l => l.category === 'deduction')          // السلفة, قرض, عقوبة, دفعات...

  const totalAllowances = sumMoney([
    baseMin,
    ...adminAllowance,
    ...eduAllowance,
    expAllowance,
    ...exceptional,
    ...dynAllowances
  ])

  // بدل تعويض نهاية الخدمة = (salary/12)
  // We'll derive monthly indemnity by splitting TRY & USD:
  // - For TRY: indemnTRY = totalAllowances.TRY / 12
  // - For USD: indemnUSD = totalAllowances.USD / 12
  const indemnMonthly: Money = {
    TRY: (totalAllowances.TRY || 0) / 12,
    USD: (totalAllowances.USD || 0) / 12,
  }

  // إجمالي الراتب = مجموع + تعويض نهاية الخدمة
  const gross: Money = {
    TRY: totalAllowances.TRY + indemnMonthly.TRY,
    USD: totalAllowances.USD + indemnMonthly.USD,
  }

  // إجمالي الخصومات = sum(deductions)
  const totalDeductions = sumMoney(deductions)

  // صافي = إجمالي - الخصومات - تعويض نهاية الخدمة
  const net: Money = {
    TRY: gross.TRY - totalDeductions.TRY - indemnMonthly.TRY,
    USD: gross.USD - totalDeductions.USD - indemnMonthly.USD,
  }

  return {
    totalAllowances,
    indemnMonthly,
    gross,
    totalDeductions,
    net,
    breakdown, 
    cash, 
    indemnity,
  }
}
