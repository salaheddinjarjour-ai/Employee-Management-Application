// Layout locked to Figma v2.1 (2024-09-25). Do not alter without design approval.

import React, { useState } from 'react'
import { Button } from '../src/components/ui/Button'
import { Download, FileText, BarChart3, Users, Calendar } from 'lucide-react'

export function ReportsPage() {
  const [selectedReport, setSelectedReport] = useState('')

  const reports = [
    {
      id: 'employees',
      title: 'تقرير الموظفين',
      description: 'تقرير شامل عن جميع الموظفين وحالتهم',
      icon: <Users className="w-6 h-6" />
    },
    {
      id: 'payroll',
      title: 'تقرير الرواتب',
      description: 'كشوف الرواتب الشهرية والسنوية',
      icon: <BarChart3 className="w-6 h-6" />
    },
    {
      id: 'leaves',
      title: 'تقرير الإجازات',
      description: 'إحصائيات الإجازات والغياب',
      icon: <Calendar className="w-6 h-6" />
    },
    {
      id: 'evaluations',
      title: 'تقرير التقييمات',
      description: 'تقييمات الأداء والدرجات',
      icon: <FileText className="w-6 h-6" />
    }
  ]

  const handleGenerateReport = (reportId: string) => {
    // Simulate report generation
    alert(`جاري إنشاء ${reports.find(r => r.id === reportId)?.title}...`)
  }

  return (
    <div style={{ padding: 'var(--spacing-xl)' }}>
      {/* Header */}
      <h1 style={{ 
        fontSize: 'var(--font-size-3xl)', 
        fontWeight: 'bold', 
        color: 'var(--neutral-900)', 
        textAlign: 'right',
        marginBottom: 'var(--spacing-lg)'
      }}>
        التقارير والإحصائيات
      </h1>

      {/* Reports Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
        gap: 'var(--spacing-lg)',
        marginBottom: 'var(--spacing-xl)'
      }}>
        {reports.map((report) => (
          <div 
            key={report.id}
            style={{
              backgroundColor: 'white',
              borderRadius: 'var(--radius-lg)',
              boxShadow: 'var(--shadow-sm)',
              border: '1px solid var(--neutral-200)',
              padding: 'var(--spacing-lg)',
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.boxShadow = 'var(--shadow-md)'
              e.currentTarget.style.borderColor = 'var(--primary-blue)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.boxShadow = 'var(--shadow-sm)'
              e.currentTarget.style.borderColor = 'var(--neutral-200)'
            }}
            onClick={() => setSelectedReport(report.id)}
          >
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: 'var(--spacing-md)',
              marginBottom: 'var(--spacing-md)'
            }}>
              <div style={{ 
                color: 'var(--primary-blue)',
                backgroundColor: 'var(--primary-blue-light)',
                padding: 'var(--spacing-sm)',
                borderRadius: 'var(--radius-md)'
              }}>
                {report.icon}
              </div>
              <h3 style={{
                fontSize: 'var(--font-size-lg)',
                fontWeight: '600',
                color: 'var(--neutral-900)',
                textAlign: 'right'
              }}>
                {report.title}
              </h3>
            </div>
            <p style={{
              fontSize: 'var(--font-size-sm)',
              color: 'var(--neutral-600)',
              textAlign: 'right',
              marginBottom: 'var(--spacing-md)'
            }}>
              {report.description}
            </p>
            <Button
              onClick={(e) => {
                e.stopPropagation()
                handleGenerateReport(report.id)
              }}
              style={{
                backgroundColor: 'var(--primary-blue)',
                color: 'white',
                padding: 'var(--spacing-sm) var(--spacing-md)',
                borderRadius: 'var(--radius-md)',
                display: 'flex',
                alignItems: 'center',
                gap: 'var(--spacing-sm)',
                border: 'none',
                cursor: 'pointer',
                width: '100%',
                justifyContent: 'center'
              }}
            >
              <Download style={{ width: '16px', height: '16px' }} />
              <span>إنشاء التقرير</span>
            </Button>
          </div>
        ))}
      </div>

      {/* Recent Reports */}
      <div style={{
        backgroundColor: 'white',
        borderRadius: 'var(--radius-lg)',
        boxShadow: 'var(--shadow-sm)',
        border: '1px solid var(--neutral-200)',
        padding: 'var(--spacing-lg)'
      }}>
        <h2 style={{
          fontSize: 'var(--font-size-xl)',
          fontWeight: '600',
          color: 'var(--neutral-900)',
          textAlign: 'right',
          marginBottom: 'var(--spacing-md)'
        }}>
          التقارير الأخيرة
        </h2>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-sm)' }}>
          {[
            { name: 'تقرير الموظفين - سبتمبر 2024', date: '2024-09-25', size: '2.3 MB' },
            { name: 'تقرير الرواتب - أغسطس 2024', date: '2024-08-31', size: '1.8 MB' },
            { name: 'تقرير التقييمات - الربع الثالث', date: '2024-09-30', size: '1.2 MB' }
          ].map((report, index) => (
            <div 
              key={index}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: 'var(--spacing-sm)',
                borderRadius: 'var(--radius-md)',
                backgroundColor: 'var(--neutral-50)',
                border: '1px solid var(--neutral-200)'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-sm)' }}>
                <Button
                  variant="ghost"
                  size="sm"
                  style={{ padding: 'var(--spacing-xs)' }}
                >
                  <Download style={{ width: '16px', height: '16px', color: 'var(--primary-blue)' }} />
                </Button>
                <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--neutral-500)' }}>
                  {report.size}
                </span>
                <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--neutral-500)' }}>
                  {report.date}
                </span>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ 
                  fontSize: 'var(--font-size-sm)', 
                  fontWeight: '500', 
                  color: 'var(--neutral-900)' 
                }}>
                  {report.name}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
