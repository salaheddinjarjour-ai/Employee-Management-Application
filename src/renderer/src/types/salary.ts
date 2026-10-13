export type Currency = 'TRY' | 'USD'

export interface SalaryModel {
  employeeId: number
  period: string

  // Multi-currency base salary
  minBaseAmount: number
  minBaseCurrency: Currency

  // Multi-currency experience allowance
  experienceAllowanceAmount: number // per year
  experienceAllowanceCurrency: Currency
  yearsOfExperience: number

  // Employee info
  idNumber?: string
  startDate?: string
  adminLevel?: string
  jobTitle?: string
  eduActual?: string
  eduRequired?: string
  notes?: string

  // Allowances and deductions arrays (already support currency per row)
  allowances?: Array<{
    category: string
    label: string
    currency: Currency
    amount: number
  }>

  deductions?: Array<{
    category: string
    label: string
    currency: Currency
    amount: number
  }>

  // Computed totals (frontend helper)
  totals?: {
    TRY: { 
      gross: number
      deductions: number
      net: number
      eosMonthly: number
      totalAllowances: number
    }
    USD: { 
      gross: number
      deductions: number
      net: number
      eosMonthly: number
      totalAllowances: number
    }
  }
}

export interface AllowanceRow {
  category: 'allowance' | 'exception' | 'breakdown' | 'cash' | 'indemnity' | 'deduction'
  label: string
  currency: Currency
  amount: number
}
