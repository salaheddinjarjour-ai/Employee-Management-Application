export function navigateToPayrollPage({ employeeId, period }: { employeeId: number; period?: string }) {
  const params = new URLSearchParams()
  params.set('employeeId', String(employeeId))
  if (period) {
    params.set('period', period)
  }
  window.location.hash = `/payroll?${params.toString()}`
}
