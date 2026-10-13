import React, { useState, useEffect } from 'react'
import { Button } from '../ui/Button'
import { Download, FileText, BarChart3, PieChart, TrendingUp, Calendar, Users, DollarSign, Eye, Globe, X } from 'lucide-react'

interface ReportTemplate {
  id: string
  name: string
  description: string
  category: 'hr' | 'payroll' | 'performance' | 'attendance'
  icon: React.ReactNode
  fields: string[]
  lastGenerated?: string
}

export function ReportsPage() {
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [reportLang, setReportLang] = useState<'ar' | 'en'>('ar')
  const [showPrintPreview, setShowPrintPreview] = useState(false)
  const [previewHtml, setPreviewHtml] = useState('')
  const [recentReports, setRecentReports] = useState<any[]>([])
  const [generatedCount, setGeneratedCount] = useState(0)

  const reportTemplates: ReportTemplate[] = [
    {
      id: 'employee-list',
      name: 'قائمة الموظفين',
      description: 'تقرير شامل بجميع بيانات الموظفين',
      category: 'hr',
      icon: <Users className="w-6 h-6" />,
      fields: ['الاسم', 'المسمى الوظيفي', 'القسم', 'تاريخ التوظيف', 'الراتب']
    },
    {
      id: 'payroll-summary',
      name: 'ملخص كشف الرواتب',
      description: 'تقرير مالي شامل للرواتب والمكافآت',
      category: 'payroll',
      icon: <DollarSign className="w-6 h-6" />,
      fields: ['الموظف', 'الراتب الأساسي', 'البدلات', 'المكافآت', 'الصافي']
    },
    {
      id: 'performance-review',
      name: 'تقرير تقييم الأداء',
      description: 'تحليل شامل لتقييمات أداء الموظفين',
      category: 'performance',
      icon: <TrendingUp className="w-6 h-6" />,
      fields: ['الموظف', 'الدرجة الإجمالية', 'المهارات', 'الأهداف', 'التوصيات']
    },
    {
      id: 'attendance-report',
      name: 'تقرير الحضور والغياب',
      description: 'إحصائيات مفصلة للحضور والغياب',
      category: 'attendance',
      icon: <Calendar className="w-6 h-6" />,
      fields: ['الموظف', 'أيام الحضور', 'أيام الغياب', 'ساعات التأخير', 'الإجازات']
    },
    {
      id: 'promotions-report',
      name: 'تقرير الترقيات',
      description: 'تقرير شامل للترقيات والتطوير الوظيفي',
      category: 'hr',
      icon: <TrendingUp className="w-6 h-6" />,
      fields: ['الموظف', 'المنصب السابق', 'المنصب الجديد', 'تاريخ الترقية', 'زيادة الراتب']
    },
    {
      id: 'training-report',
      name: 'تقرير التدريب والتطوير',
      description: 'إحصائيات الدورات التدريبية والمشاركة',
      category: 'performance',
      icon: <BarChart3 className="w-6 h-6" />,
      fields: ['الدورة', 'المدرب', 'عدد المشاركين', 'معدل الإكمال', 'التقييم']
    },
    {
      id: 'rewards-report',
      name: 'تقرير المكافآت والحوافز',
      description: 'تحليل المكافآت والحوافز المقدمة',
      category: 'payroll',
      icon: <PieChart className="w-6 h-6" />,
      fields: ['الموظف', 'نوع المكافأة', 'المبلغ', 'التاريخ', 'السبب']
    },
    {
      id: 'leave-analysis',
      name: 'تحليل الإجازات',
      description: 'إحصائيات مفصلة لأنواع الإجازات ومعدلات الاستخدام',
      category: 'attendance',
      icon: <Calendar className="w-6 h-6" />,
      fields: ['الموظف', 'نوع الإجازة', 'عدد الأيام', 'الرصيد المتبقي', 'معدل الاستخدام']
    }
  ]

  const categories = [
    { id: 'all', name: 'جميع التقارير', count: reportTemplates.length },
    { id: 'hr', name: 'الموارد البشرية', count: reportTemplates.filter(r => r.category === 'hr').length },
    { id: 'payroll', name: 'الرواتب والمالية', count: reportTemplates.filter(r => r.category === 'payroll').length },
    { id: 'performance', name: 'الأداء والتطوير', count: reportTemplates.filter(r => r.category === 'performance').length },
    { id: 'attendance', name: 'الحضور والغياب', count: reportTemplates.filter(r => r.category === 'attendance').length }
  ]

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'hr': return 'bg-blue-100 text-blue-800'
      case 'payroll': return 'bg-green-100 text-green-800'
      case 'performance': return 'bg-purple-100 text-purple-800'
      case 'attendance': return 'bg-orange-100 text-orange-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const filteredReports = selectedCategory === 'all'
    ? reportTemplates
    : reportTemplates.filter(r => r.category === selectedCategory)

  /* State for filters */
  const [startDate, setStartDate] = useState<string>(() => {
    // Default to one year ago
    const d = new Date()
    d.setFullYear(d.getFullYear() - 1)
    return d.toISOString().slice(0, 10)
  })
  const [endDate, setEndDate] = useState<string>(new Date().toISOString().slice(0, 10)) // Today

  // Load recent reports
  useEffect(() => {
    const loadRecentReports = async () => {
      try {
        const reports = await window.api.invoke('reports:recent') || []
        setRecentReports(reports)
      } catch (error) {
        console.error('Failed to load recent reports:', error)
      }
    }
    loadRecentReports()
  }, [])

  // Format date to Gregorian (YYYY-MM-DD)
  const formatGregorianDate = (dateStr: string) => {
    if (!dateStr) return '-'
    try {
      const date = new Date(dateStr)
      return date.toLocaleDateString('en-CA') // YYYY-MM-DD format
    } catch {
      return dateStr
    }
  }

  const generateReport = async (reportId: string) => {
    const template = reportTemplates.find(r => r.id === reportId)
    if (!template) return

    try {
      const settings = await window.api.invoke('settings:get')

      // 1. Fetch Real Data based on reportId
      let reportData: any[] = []
      let headers: string[] = []

      // Helper to normalize date to YYYY-MM-DD for comparison
      const normalizeDate = (dateVal: any): string | null => {
        if (!dateVal) return null
        try {
          if (typeof dateVal === 'string') {
            // If it's already YYYY-MM-DD or similar
            if (dateVal.match(/^\d{4}-\d{2}-\d{2}/)) {
              return dateVal.slice(0, 10)
            }
            return new Date(dateVal).toISOString().slice(0, 10)
          }
          if (dateVal instanceof Date) {
            return dateVal.toISOString().slice(0, 10)
          }
          return new Date(dateVal).toISOString().slice(0, 10)
        } catch (e) {
          return null
        }
      }

      switch (reportId) {
        case 'employee-list': {
          const emps = await window.api.listRecords('employees') || []
          // Try to get the latest salary for each employee from all payroll headers
          const payrolls = await window.api.invoke('payroll:listByMonth', 'all').catch(() => []) || []
          const salaryMap: Record<number, number> = {}
          // payrolls are ordered DESC so first entry per employee = most recent
          payrolls.forEach((p: any) => {
            const h = p.header || p
            if (h.employee_id && h.base_min && !salaryMap[h.employee_id]) {
              salaryMap[h.employee_id] = Number(h.base_min)
            }
          })
          if (reportLang === 'ar') {
            headers = ['الاسم', 'المسمى الوظيفي', 'القسم', 'تاريخ التوظيف', 'الراتب']
            reportData = emps.map((e: any) => ({
              'الاسم': e.full_name || e.name,
              'المسمى الوظيفي': e.job_title || '-',
              'القسم': e.department || '-',
              'تاريخ التوظيف': e.hire_date || e.join_date || '-',
              'الراتب': salaryMap[e.id] || e.basic_salary || '-'
            }))
          } else {
            headers = ['Name', 'Job Title', 'Department', 'Hire Date', 'Salary']
            reportData = emps.map((e: any) => ({
              'Name': e.full_name || e.name,
              'Job Title': e.job_title || '-',
              'Department': e.department || '-',
              'Hire Date': e.hire_date || e.join_date || '-',
              'Salary': salaryMap[e.id] || e.basic_salary || '-'
            }))
          }
          break
        }
        case 'payroll-summary': {
          const month = startDate.slice(0, 7)
          const payrolls = await window.api.invoke('payroll:listByMonth', month) || []

          if (reportLang === 'ar') headers = ['الموظف', 'الراتب الأساسي', 'البدلات', 'المكافآت', 'الصافي']
          else headers = ['Employee', 'Basic Salary', 'Allowances', 'Bonuses', 'Net Salary']

          reportData = payrolls.map((p: any) => {
            const h = p.header || p
            const lines = p.lines || []
            const basic = Number(h.base_min || 0)
            const expAllowance = (Number(h.experience_allowance_amount) || 0) * (Number(h.years_of_exp) || 0)
            const allowancesFromLines = lines
              .filter((l: any) => l.category === 'allowance' || l.category === 'exception' || l.category === 'reward')
              .reduce((sum: number, l: any) => sum + (Number(l.amount) || 0), 0)
            const totalAllowances = expAllowance + allowancesFromLines
            const totalDeductions = lines
              .filter((l: any) => l.category === 'deduction')
              .reduce((sum: number, l: any) => sum + (Number(l.amount) || 0), 0)
            const net = basic + totalAllowances - totalDeductions

            if (reportLang === 'ar') {
              return {
                'الموظف': h.employee_name || h.full_name,
                'الراتب الأساسي': basic,
                'البدلات': totalAllowances,
                'المكافآت': 0,
                'الصافي': net
              }
            } else {
              return {
                'Employee': h.employee_name || h.full_name,
                'Basic Salary': basic,
                'Allowances': totalAllowances,
                'Bonuses': 0,
                'Net Salary': net
              }
            }
          })
          break
        }
        case 'rewards-report': {
          const allRewards = await window.api.listRecords('rewards') || []
          const filtered = allRewards.filter((r: any) => {
            const rawDate = r.reward_date || r.date || r.created_at
            const d = normalizeDate(rawDate)
            return d && d >= startDate && d <= endDate
          })

          if (reportLang === 'ar') {
            headers = ['الموظف', 'نوع المكافأة', 'المبلغ', 'التاريخ', 'السبب']
            reportData = filtered.map((r: any) => ({
              'الموظف': r.employee_name,
              'نوع المكافأة': r.kind,
              'المبلغ': r.amount_usd,
              'التاريخ': r.reward_date || normalizeDate(r.created_at) || '-',
              'السبب': r.title
            }))
          } else {
            headers = ['Employee', 'Type', 'Amount', 'Date', 'Reason']
            reportData = filtered.map((r: any) => ({
              'Employee': r.employee_name,
              'Type': r.kind,
              'Amount': r.amount_usd,
              'Date': r.reward_date || normalizeDate(r.created_at) || '-',
              'Reason': r.title
            }))
          }
          break
        }
        case 'leave-analysis': {
          const allLeaves = await window.api.listRecords('leaves') || []
          const filtered = allLeaves.filter((l: any) => {
            const rawDate = l.from_date || l.start_date || l.created_at
            const d = normalizeDate(rawDate)
            return d && d >= startDate && d <= endDate
          })

          if (reportLang === 'ar') {
            headers = ['الموظف', 'نوع الإجازة', 'عدد الأيام', 'الرصيد المتبقي', 'معدل الاستخدام']
            reportData = filtered.map((l: any) => ({
              'الموظف': l.employee_name,
              'نوع الإجازة': l.leave_type,
              'عدد الأيام': l.days_count || l.days || 1,
              'الرصيد المتبقي': '--',
              'معدل الاستخدام': '--'
            }))
          } else {
            headers = ['Employee', 'Leave Type', 'Days', 'Remaining Balance', 'Usage Rate']
            reportData = filtered.map((l: any) => ({
              'Employee': l.employee_name,
              'Leave Type': l.leave_type,
              'Days': l.days_count || l.days || 1,
              'Remaining Balance': '--',
              'Usage Rate': '--'
            }))
          }
          break
        }
        case 'promotions-report': {
          const promos = await window.api.listRecords('promotions') || []
          const filtered = promos.filter((p: any) => {
            const rawDate = p.effective_date || p.created_at
            const d = normalizeDate(rawDate)
            return d && d >= startDate && d <= endDate
          })

          if (reportLang === 'ar') {
            headers = ['الموظف', 'المسمى السابق', 'المسمى الجديد', 'تاريخ السريان', 'زيادة الراتب']
            reportData = filtered.map((p: any) => ({
              'الموظف': p.employee_name,
              'المسمى السابق': p.from_title || '-',
              'المسمى الجديد': p.to_title || '-',
              'تاريخ السريان': p.effective_date || normalizeDate(p.created_at) || '-',
              'زيادة الراتب': p.increase_amount_usd ? `${p.increase_amount_usd} ${p.increase_currency || 'USD'}` : (p.increase_percent ? `${p.increase_percent}%` : '-')
            }))
          } else {
            headers = ['Employee', 'Previous Title', 'New Title', 'Effective Date', 'Salary Increase']
            reportData = filtered.map((p: any) => ({
              'Employee': p.employee_name,
              'Previous Title': p.from_title || '-',
              'New Title': p.to_title || '-',
              'Effective Date': p.effective_date || normalizeDate(p.created_at) || '-',
              'Salary Increase': p.increase_amount_usd ? `${p.increase_amount_usd} ${p.increase_currency || 'USD'}` : (p.increase_percent ? `${p.increase_percent}%` : '-')
            }))
          }
          break
        }
        case 'performance-review': {
          const evals = await window.electronAPI.listEvaluations?.() || []
          const filtered = evals.filter((ev: any) => {
            const d = normalizeDate(ev.evaluation_date || ev.created_at)
            return d && d >= startDate && d <= endDate
          })

          if (reportLang === 'ar') {
            headers = ['الموظف', 'المقيم', 'الفترة', 'النتيجة', 'التقييم', 'الحالة']
            reportData = filtered.map((ev: any) => ({
              'الموظف': ev.employee_name,
              'المقيم': ev.evaluator_name,
              'الفترة': ev.period,
              'النتيجة': `${ev.overall_score}%`,
              'التقييم': ev.rating,
              'الحالة': ev.status
            }))
          } else {
            headers = ['Employee', 'Evaluator', 'Period', 'Score', 'Rating', 'Status']
            reportData = filtered.map((ev: any) => ({
              'Employee': ev.employee_name,
              'Evaluator': ev.evaluator_name,
              'Period': ev.period,
              'Score': `${ev.overall_score}%`,
              'Rating': ev.rating,
              'Status': ev.status
            }))
          }
          break
        }
        case 'training-report': {
          const courses = await window.api.listRecords('courses') || []
          const filtered = courses.filter((c: any) => {
            const d = normalizeDate(c.start_date || c.created_at)
            return d && d >= startDate && d <= endDate
          })

          if (reportLang === 'ar') {
            headers = ['الدورة', 'المدرب', 'تاريخ البداية', 'تاريخ الانتهاء', 'الحالة']
            reportData = filtered.map((c: any) => ({
              'الدورة': c.title || c.course_name,
              'المدرب': c.instructor || c.trainer_name || '-',
              'تاريخ البداية': c.start_date || '-',
              'تاريخ الانتهاء': c.end_date || '-',
              'الحالة': c.status || '-'
            }))
          } else {
            headers = ['Course', 'Instructor', 'Start Date', 'End Date', 'Status']
            reportData = filtered.map((c: any) => ({
              'Course': c.title || c.course_name,
              'Instructor': c.instructor || c.trainer_name || '-',
              'Start Date': c.start_date || '-',
              'End Date': c.end_date || '-',
              'Status': c.status || '-'
            }))
          }
          break
        }
        case 'attendance-report': {
          const absences = await window.api.listRecords('absences') || []
          const filtered = absences.filter((a: any) => {
            const d = normalizeDate(a.from_date || a.absence_date || a.created_at)
            return d && d >= startDate && d <= endDate
          })

          if (reportLang === 'ar') {
            headers = ['الموظف', 'نوع الغياب', 'من', 'إلى', 'عدد الأيام', 'الحالة']
            reportData = filtered.map((a: any) => ({
              'الموظف': a.employee_name,
              'نوع الغياب': a.absence_type || a.type || '-',
              'من': a.from_date || '-',
              'إلى': a.to_date || '-',
              'عدد الأيام': a.days_count || a.days || 1,
              'الحالة': a.status || '-'
            }))
          } else {
            headers = ['Employee', 'Type', 'From', 'To', 'Days', 'Status']
            reportData = filtered.map((a: any) => ({
              'Employee': a.employee_name,
              'Type': a.absence_type || a.type || '-',
              'From': a.from_date || '-',
              'To': a.to_date || '-',
              'Days': a.days_count || a.days || 1,
              'Status': a.status || '-'
            }))
          }
          break
        }
        default:
          headers = template.fields
          reportData = []
      }

      // Build HTML for in-app preview
      const html = `
        <!DOCTYPE html>
        <html dir="rtl" lang="ar">
        <head>
          <title>${template.name}</title>
          <style>
            @media print {
              @page { margin: 10mm; }
              body { margin: 0; }
              .header { position: fixed; top: 0; left: 0; right: 0; background: white; z-index: 10; padding-bottom: 20px; border-bottom: 2px solid #e5e7eb; height: 120px; }
              .footer { position: fixed; bottom: 0; left: 0; right: 0; background: white; z-index: 10; border-top: 1px solid #e5e7eb; height: 50px; }
              .content-wrap { margin-top: 140px; margin-bottom: 60px; }
              thead { display: table-header-group; }
              tfoot { display: table-footer-group; }
              tr { page-break-inside: avoid; }
            }
            body { font-family: system-ui, -apple-system, sans-serif; padding: 40px; color: #1a1a1a; max-width: 210mm; margin: 0 auto; direction: ${reportLang === 'ar' ? 'rtl' : 'ltr'}; }
            .header { display: flex; align-items: center; justify-content: space-between; border-bottom: 2px solid #e5e7eb; padding-bottom: 20px; margin-bottom: 30px; }
            .logo-section { display: flex; align-items: center; gap: 15px; }
            .logo { width: 80px; height: 80px; object-fit: contain; }
            .org-details { display: flex; flex-direction: column; }
            .org-name { font-size: 24px; font-weight: bold; color: #111827; }
            .report-info { text-align: left; font-size: 14px; color: #6b7280; line-height: 1.6; }
            .report-title { font-size: 28px; font-weight: bold; text-align: center; margin-bottom: 10px; color: #111827; }
            .report-meta { text-align: center; margin-bottom: 40px; color: #6b7280; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; font-size: 14px; }
            th, td { border: 1px solid #e5e7eb; padding: 12px; text-align: right; }
            th { background-color: #f9fafb; font-weight: 600; color: #374151; }
            tr:nth-child(even) { background-color: #f9fafb; }
            .footer { margin-top: 50px; padding-top: 20px; border-top: 1px solid #e5e7eb; display: flex; justify-content: space-between; font-size: 12px; color: #9ca3af; }
            .print-only { font-size: 12px; color: #9ca3af; text-align: center; margin-top: 10px; }
            @media print {
              body { padding: 0; width: 100%; max-width: none; }
              .no-print { display: none; }
              @page { margin: 20mm; }
            }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="logo-section">
              ${settings?.orgLogo ? `<img src="${settings.orgLogo}" class="logo" alt="Logo" />` : ''}
              <div class="org-details">
                <div class="org-name">${settings?.orgName || 'اسم المؤسسة'}</div>
                <div style="font-size: 13px; color: #6b7280;">نظام إدارة الموظفين</div>
              </div>
            </div>
            <div class="report-info">
              <div><strong>تاريخ الطباعة:</strong> ${formatGregorianDate(new Date().toISOString())}</div>
              <div><strong>الفترة:</strong> ${formatGregorianDate(startDate)} - ${formatGregorianDate(endDate)}</div>
              <div><strong>نوع التقرير:</strong> ${template.category}</div>
            </div>
          </div>

          <div class="content-wrap">
            <div class="report-title">${template.name}</div>
            <div class="report-meta">${template.description}</div>

            <table>
              <thead>
                <tr>
                  ${headers.map(f => `<th>${f}</th>`).join('')}
                </tr>
              </thead>
            <tbody>
                ${reportData.length > 0 ? reportData.map(row => `
                  <tr>
                    ${headers.map(field => `<td>${row[field] !== undefined && row[field] !== null ? row[field] : '--'}</td>`).join('')}
                  </tr>
                `).join('') : `
                  <tr>
                    <td colspan="${headers.length}" style="text-align: center; padding: 20px; color: #6b7280;">
                      ${reportLang === 'ar' ? 'لا توجد بيانات متاحة' : 'No data available'}
                    </td>
                  </tr>
                `}
            </tbody>
          </table>

          </div>

          <div class="footer">
            <div></div>
            <div>${reportLang === 'ar' ? 'صفحة' : 'Page'} 1</div>
          </div>
        </body>
        </html>
      `

      setPreviewHtml(html)
      setShowPrintPreview(true)
      setGeneratedCount(prev => prev + 1)

      // Save metadata for recent reports
      try {
        await window.api.invoke('reports:save-metadata', {
          report_type: reportId,
          report_name: template.name,
          parameters: JSON.stringify({ startDate, endDate }),
          row_count: reportData.length,
          generated_at: new Date().toISOString()
        })
        const updated = await window.api.invoke('reports:recent') || []
        setRecentReports(updated)
      } catch (e) { console.warn('metadata save skipped:', e) }
    } catch (error) {
      console.error('Failed to generate report:', error)
      alert('حدث خطأ أثناء إنشاء التقرير: ' + String(error))
    }
  }

  const exportCSV = async (reportId: string) => {
    const template = reportTemplates.find(r => r.id === reportId)
    if (!template) return

    try {
      // Re-use the same data fetching logic by generating the report first
      let reportData: any[] = []
      let headers: string[] = []

      const normalizeDate = (dateVal: any): string | null => {
        if (!dateVal) return null
        try {
          if (typeof dateVal === 'string' && dateVal.match(/^\d{4}-\d{2}-\d{2}/)) return dateVal.slice(0, 10)
          return new Date(dateVal).toISOString().slice(0, 10)
        } catch { return null }
      }

      switch (reportId) {
        case 'employee-list': {
          const emps = await window.api.listRecords('employees') || []
          headers = reportLang === 'ar' ? ['الاسم', 'المسمى الوظيفي', 'القسم', 'تاريخ التوظيف', 'الراتب'] : ['Name', 'Job Title', 'Department', 'Hire Date', 'Salary']
          reportData = emps.map((e: any) => reportLang === 'ar'
            ? { 'الاسم': e.full_name, 'المسمى الوظيفي': e.job_title, 'القسم': e.department, 'تاريخ التوظيف': e.hire_date || e.join_date, 'الراتب': e.basic_salary }
            : { 'Name': e.full_name, 'Job Title': e.job_title, 'Department': e.department, 'Hire Date': e.hire_date || e.join_date, 'Salary': e.basic_salary })
          break
        }
        case 'payroll-summary': {
          const month = startDate.slice(0, 7)
          const payrolls = await window.api.invoke('payroll:listByMonth', month) || []
          headers = reportLang === 'ar' ? ['الموظف', 'الراتب الأساسي', 'البدلات', 'الصافي'] : ['Employee', 'Basic', 'Allowances', 'Net']
          reportData = payrolls.map((p: any) => {
            const h = p.header || p, lines = p.lines || []
            const basic = Number(h.base_min || 0)
            const allowances = lines.filter((l: any) => l.category === 'allowance' || l.category === 'exception').reduce((s: number, l: any) => s + (Number(l.amount) || 0), 0)
            const deductions = lines.filter((l: any) => l.category === 'deduction').reduce((s: number, l: any) => s + (Number(l.amount) || 0), 0)
            return reportLang === 'ar'
              ? { 'الموظف': h.employee_name, 'الراتب الأساسي': basic, 'البدلات': allowances, 'الصافي': basic + allowances - deductions }
              : { 'Employee': h.employee_name, 'Basic': basic, 'Allowances': allowances, 'Net': basic + allowances - deductions }
          })
          break
        }
        case 'performance-review': {
          const evals = await window.electronAPI.listEvaluations?.() || []
          const filteredEvals = evals.filter((ev: any) => {
            const d = normalizeDate(ev.evaluation_date || ev.created_at)
            return d && d >= startDate && d <= endDate
          })
          headers = reportLang === 'ar' ? ['الموظف', 'المقيم', 'الفترة', 'النتيجة', 'التقييم', 'الحالة'] : ['Employee', 'Evaluator', 'Period', 'Score', 'Rating', 'Status']
          reportData = filteredEvals.map((ev: any) => reportLang === 'ar'
            ? { 'الموظف': ev.employee_name, 'المقيم': ev.evaluator_name, 'الفترة': ev.period, 'النتيجة': `${ev.overall_score}%`, 'التقييم': ev.rating, 'الحالة': ev.status }
            : { 'Employee': ev.employee_name, 'Evaluator': ev.evaluator_name, 'Period': ev.period, 'Score': `${ev.overall_score}%`, 'Rating': ev.rating, 'Status': ev.status })
          break
        }
        case 'training-report': {
          const courses = await window.api.listRecords('courses') || []
          const filteredCourses = courses.filter((c: any) => {
            const d = normalizeDate(c.start_date || c.created_at)
            return d && d >= startDate && d <= endDate
          })
          headers = reportLang === 'ar' ? ['الدورة', 'المدرب', 'تاريخ البداية', 'تاريخ الانتهاء', 'الحالة'] : ['Course', 'Instructor', 'Start Date', 'End Date', 'Status']
          reportData = filteredCourses.map((c: any) => reportLang === 'ar'
            ? { 'الدورة': c.title || c.course_name, 'المدرب': c.instructor || c.trainer_name || '-', 'تاريخ البداية': c.start_date || '-', 'تاريخ الانتهاء': c.end_date || '-', 'الحالة': c.status || '-' }
            : { 'Course': c.title || c.course_name, 'Instructor': c.instructor || c.trainer_name || '-', 'Start Date': c.start_date || '-', 'End Date': c.end_date || '-', 'Status': c.status || '-' })
          break
        }
        case 'attendance-report': {
          const absences = await window.api.listRecords('absences') || []
          const filteredAbs = absences.filter((a: any) => {
            const d = normalizeDate(a.from_date || a.absence_date || a.created_at)
            return d && d >= startDate && d <= endDate
          })
          headers = reportLang === 'ar' ? ['الموظف', 'نوع الغياب', 'من', 'إلى', 'عدد الأيام', 'الحالة'] : ['Employee', 'Type', 'From', 'To', 'Days', 'Status']
          reportData = filteredAbs.map((a: any) => reportLang === 'ar'
            ? { 'الموظف': a.employee_name, 'نوع الغياب': a.absence_type || a.type || '-', 'من': a.from_date || '-', 'إلى': a.to_date || '-', 'عدد الأيام': a.days_count || a.days || 1, 'الحالة': a.status || '-' }
            : { 'Employee': a.employee_name, 'Type': a.absence_type || a.type || '-', 'From': a.from_date || '-', 'To': a.to_date || '-', 'Days': a.days_count || a.days || 1, 'Status': a.status || '-' })
          break
        }
        default: {
          // For other reports, use the template fields
          headers = template.fields
          reportData = []
        }
      }

      if (reportData.length === 0) {
        alert(reportLang === 'ar' ? 'لا توجد بيانات للتصدير' : 'No data to export')
        return
      }

      // Build CSV
      const csvRows = [headers.join(',')]
      reportData.forEach(row => {
        csvRows.push(headers.map(h => {
          const val = String(row[h] ?? '')
          return val.includes(',') || val.includes('"') || val.includes('\n') ? `"${val.replace(/"/g, '""')}"` : val
        }).join(','))
      })

      const BOM = '\uFEFF'
      const blob = new Blob([BOM + csvRows.join('\n')], { type: 'text/csv;charset=utf-8' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${template.name}_${new Date().toISOString().slice(0, 10)}.csv`
      a.click()
      URL.revokeObjectURL(url)
      setGeneratedCount(prev => prev + 1)
    } catch (error) {
      console.error('CSV export failed:', error)
      alert('فشل تصدير الملف')
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">التقارير والإحصائيات</h1>
          <p className="text-gray-600">توليد التقارير وطباعتها للفترات المحددة</p>
        </div>

        {/* Date Filters Controls */}
        <div className="flex items-center gap-3 bg-white p-2 rounded-lg border shadow-sm">
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-gray-600">من:</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="border border-gray-300 rounded px-2 py-1 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-gray-600">إلى:</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="border border-gray-300 rounded px-2 py-1 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>

          <div className="h-6 w-px bg-gray-200 mx-1"></div>

          <Button variant="outline" size="sm" onClick={() => { }}>
            <Calendar className="w-4 h-4 mr-2" />
            تحديث
          </Button>

          <div className="h-6 w-px bg-gray-200 mx-1"></div>

          <div className="flex items-center gap-1">
            <Globe className="w-4 h-4 text-gray-400" />
            <select
              value={reportLang}
              onChange={(e) => setReportLang(e.target.value as 'ar' | 'en')}
              className="border-none bg-transparent text-sm focus:ring-0 text-gray-600 cursor-pointer"
            >
              <option value="ar">العربية</option>
              <option value="en">English</option>
            </select>
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center">
            <FileText className="w-8 h-8 text-blue-600" />
            <div className="mr-4">
              <h3 className="text-sm font-medium text-gray-500">قوالب التقارير</h3>
              <p className="text-2xl font-bold text-gray-900">{reportTemplates.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center">
            <BarChart3 className="w-8 h-8 text-green-600" />
            <div className="mr-4">
              <h3 className="text-sm font-medium text-gray-500">التقارير المولّدة</h3>
              <p className="text-2xl font-bold text-green-600">{generatedCount}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center">
            <TrendingUp className="w-8 h-8 text-purple-600" />
            <div className="mr-4">
              <h3 className="text-sm font-medium text-gray-500">الفئات المتاحة</h3>
              <p className="text-2xl font-bold text-purple-600">{categories.length - 1}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center">
            <Download className="w-8 h-8 text-orange-600" />
            <div className="mr-4">
              <h3 className="text-sm font-medium text-gray-500">التقارير الأخيرة</h3>
              <p className="text-2xl font-bold text-orange-600">{recentReports.length}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Category Filters */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">فئات التقارير</h3>
        <div className="flex flex-wrap gap-3">
          {categories.map(category => (
            <button
              key={category.id}
              onClick={() => setSelectedCategory(category.id)}
              className={`px-4 py-2 rounded-lg border transition-colors ${selectedCategory === category.id
                ? 'bg-blue-600 text-white border-blue-600'
                : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                }`}
            >
              {category.name} ({category.count})
            </button>
          ))}
        </div>
      </div>

      {/* Reports Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredReports.map(report => (
          <div key={report.id} className="bg-white rounded-lg shadow-sm border hover:shadow-md transition-shadow">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center">
                  <div className={`p-2 rounded-lg ${getCategoryColor(report.category)} mr-3`}>
                    {report.icon}
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">{report.name}</h3>
                    <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getCategoryColor(report.category)}`}>
                      {categories.find(c => c.id === report.category)?.name}
                    </span>
                  </div>
                </div>
              </div>

              <p className="text-sm text-gray-600 mb-4">{report.description}</p>

              <div className="mb-4">
                <h4 className="text-sm font-medium text-gray-700 mb-2">الحقول المتضمنة:</h4>
                <div className="flex flex-wrap gap-1">
                  {report.fields.slice(0, 3).map((field, index) => (
                    <span key={index} className="inline-flex px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded">
                      {field}
                    </span>
                  ))}
                  {report.fields.length > 3 && (
                    <span className="inline-flex px-2 py-1 text-xs bg-gray-100 text-gray-500 rounded">
                      +{report.fields.length - 3} أخرى
                    </span>
                  )}
                </div>
              </div>

              {report.lastGenerated && (
                <p className="text-xs text-gray-500 mb-4">
                  آخر إنشاء: {new Date(report.lastGenerated).toLocaleDateString('ar')}
                </p>
              )}

              <div className="flex items-center space-x-reverse space-x-2">
                <Button
                  onClick={() => generateReport(report.id)}
                  className="flex-1"
                >
                  <BarChart3 className="w-4 h-4 mr-2" />
                  إنشاء التقرير
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => exportCSV(report.id)}
                  title="تصدير CSV"
                >
                  <Download className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Recent Reports */}
      <div className="bg-white rounded-lg shadow-sm border">
        <div className="px-6 py-4 border-b">
          <h3 className="text-lg font-semibold text-gray-900">التقارير الأخيرة</h3>
        </div>
        <div className="p-6">
          <div className="space-y-4">
            {recentReports.length > 0 ? recentReports.slice(0, 4).map((report: any) => (
              <div key={report.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center">
                  <FileText className="w-6 h-6 text-blue-600 mr-3" />
                  <div>
                    <h4 className="text-sm font-medium text-gray-900">{report.report_name}</h4>
                    <p className="text-xs text-gray-500">
                      تم الإنشاء في: {formatGregorianDate(report.generated_at)}
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-reverse space-x-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={async () => {
                      try {
                        if (report.file_path) {
                          await window.api.invoke('app:open-path', report.file_path)
                        }
                      } catch (error) {
                        console.error('Failed to open report:', error)
                      }
                    }}
                  >
                    <Download className="w-4 h-4" />
                  </Button>
                  <Button variant="ghost" size="sm">
                    <Eye className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            )) : (
              <p className="text-center text-gray-500 py-8">لا توجد تقارير حديثة</p>
            )}
          </div>
        </div>
      </div>

      {/* Print Preview Modal */}
      {showPrintPreview && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg w-[95vw] h-[95vh] flex flex-col">
            <div className="flex items-center justify-between p-4 border-b">
              <h2 className="text-lg font-semibold">معاينة التقرير قبل الطباعة</h2>
              <div className="flex items-center gap-2">
                <Button
                  onClick={() => {
                    const iframe = document.querySelector('iframe[title="Print Preview"]') as HTMLIFrameElement
                    if (iframe && iframe.contentWindow) {
                      iframe.contentWindow.print()
                    }
                  }}
                >
                  طباعة
                </Button>
                <button
                  onClick={() => setShowPrintPreview(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>
            <div className="flex-1 overflow-auto p-4 bg-gray-100">
              <div className="bg-white shadow-lg mx-auto" style={{ maxWidth: '210mm' }}>
                <iframe
                  srcDoc={previewHtml}
                  className="w-full h-full min-h-[800px] border-0"
                  title="Print Preview"
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
