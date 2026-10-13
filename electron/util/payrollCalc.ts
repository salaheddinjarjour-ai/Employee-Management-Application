export type Money = { TRY: number; USD: number }
export type PayrollLine = { category: string; label: string; currency: 'TRY' | 'USD'; amount: number }

export function sumMoney(lines: PayrollLine[]): Money {
    return lines.reduce<Money>((acc, l) => {
        if (l.currency === 'TRY') acc.TRY += Number(l.amount) || 0
        else acc.USD += Number(l.amount) || 0
        return acc
    }, { TRY: 0, USD: 0 })
}

export function pick(lines: PayrollLine[], pred: (l: PayrollLine) => boolean): PayrollLine[] {
    return lines.filter(pred)
}

export function computeTotals(
    header: {
        base_min: number;
        years_of_exp: number;
        base_min_currency?: string;
        experience_allowance_amount?: number;
        experience_allowance_currency?: string;
    },
    lines: PayrollLine[],
    experienceRateTRY?: number
) {
    const baseMin: PayrollLine = {
        category: 'allowance',
        label: 'الحد الأدنى',
        currency: (header.base_min_currency || 'TRY') as 'TRY' | 'USD',
        amount: Number(header.base_min) || 0
    }

    const adminAllowance = pick(lines, l => l.category === 'allowance' && l.label === 'بدل علاوة إدارية')
    const eduAllowance = pick(lines, l => l.category === 'allowance' && l.label === 'بدل المؤهل العلمي')

    const expAmount = header.experience_allowance_amount
        ? (Number(header.experience_allowance_amount) * (Number(header.years_of_exp) || 0))
        : ((Number(experienceRateTRY) || 0) * (Number(header.years_of_exp) || 0))
    const expCurrency = (header.experience_allowance_currency || 'TRY') as 'TRY' | 'USD'

    const expAllowance: PayrollLine = {
        category: 'allowance',
        label: 'بدل خبرة',
        currency: expCurrency,
        amount: expAmount
    }

    const exceptional = pick(lines, l => l.category === 'exception')
    const dynAllowances = pick(lines, l => l.category === 'allowance' && !['بدل علاوة إدارية', 'بدل المؤهل العلمي', 'بدل خبرة', 'الحد الأدنى'].includes(l.label))

    const deductions = pick(lines, l => l.category === 'deduction')
    const indemnity = pick(lines, l => l.category === 'indemnity')
    const cash = pick(lines, l => l.category === 'cash')

    const totalAllowances = sumMoney([
        baseMin,
        ...adminAllowance,
        ...eduAllowance,
        expAllowance,
        ...exceptional,
        ...dynAllowances
    ])

    const indemnMonthly: Money = {
        TRY: (totalAllowances.TRY || 0) / 12,
        USD: (totalAllowances.USD || 0) / 12,
    }

    const gross: Money = {
        TRY: totalAllowances.TRY + indemnMonthly.TRY,
        USD: totalAllowances.USD + indemnMonthly.USD,
    }

    const totalDeductions = sumMoney(deductions)

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
        exceptional,
        cash,
        indemnity,
        deductions
    }
}
