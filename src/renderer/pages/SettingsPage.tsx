// Layout locked to Figma v2.1 (2024-09-25). Do not alter without design approval.

import React, { useState } from 'react'
import { Button } from '../src/components/ui/Button'
import { Settings, DollarSign, Users, Bell, Shield, Database } from 'lucide-react'

export function SettingsPage() {
  const [activeTab, setActiveTab] = useState('general')

  const tabs = [
    { id: 'general', label: 'إعدادات عامة', icon: <Settings className="w-5 h-5" /> },
    { id: 'exchange', label: 'أسعار الصرف', icon: <DollarSign className="w-5 h-5" /> },
    { id: 'users', label: 'المستخدمين', icon: <Users className="w-5 h-5" /> },
    { id: 'notifications', label: 'الإشعارات', icon: <Bell className="w-5 h-5" /> },
    { id: 'security', label: 'الأمان', icon: <Shield className="w-5 h-5" /> },
    { id: 'backup', label: 'النسخ الاحتياطي', icon: <Database className="w-5 h-5" /> }
  ]

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
        الإعدادات
      </h1>

      <div style={{ display: 'flex', gap: 'var(--spacing-lg)' }}>
        {/* Sidebar */}
        <div style={{
          width: '280px',
          backgroundColor: 'white',
          borderRadius: 'var(--radius-lg)',
          boxShadow: 'var(--shadow-sm)',
          border: '1px solid var(--neutral-200)',
          padding: 'var(--spacing-md)'
        }}>
          <nav style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-xs)' }}>
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 'var(--spacing-sm)',
                  padding: 'var(--spacing-sm) var(--spacing-md)',
                  borderRadius: 'var(--radius-md)',
                  border: 'none',
                  backgroundColor: activeTab === tab.id ? 'var(--primary-blue-light)' : 'transparent',
                  color: activeTab === tab.id ? 'var(--primary-blue)' : 'var(--neutral-700)',
                  cursor: 'pointer',
                  textAlign: 'right',
                  width: '100%',
                  justifyContent: 'flex-end'
                }}
              >
                <span style={{ fontSize: 'var(--font-size-sm)' }}>{tab.label}</span>
                {tab.icon}
              </button>
            ))}
          </nav>
        </div>

        {/* Content */}
        <div style={{ flex: 1 }}>
          <div style={{
            backgroundColor: 'white',
            borderRadius: 'var(--radius-lg)',
            boxShadow: 'var(--shadow-sm)',
            border: '1px solid var(--neutral-200)',
            padding: 'var(--spacing-xl)'
          }}>
            {activeTab === 'general' && (
              <div>
                <h2 style={{ 
                  fontSize: 'var(--font-size-xl)', 
                  fontWeight: '600', 
                  color: 'var(--neutral-900)', 
                  textAlign: 'right',
                  marginBottom: 'var(--spacing-lg)'
                }}>
                  الإعدادات العامة
                </h2>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-md)' }}>
                  <div>
                    <label style={{ 
                      fontSize: 'var(--font-size-sm)', 
                      fontWeight: '500', 
                      color: 'var(--neutral-700)',
                      display: 'block',
                      marginBottom: 'var(--spacing-xs)',
                      textAlign: 'right'
                    }}>
                      اسم الشركة
                    </label>
                    <input
                      type="text"
                      defaultValue="شركة إدارة الموظفين"
                      style={{
                        width: '100%',
                        padding: 'var(--spacing-sm)',
                        border: '1px solid var(--neutral-300)',
                        borderRadius: 'var(--radius-md)',
                        fontSize: 'var(--font-size-sm)',
                        textAlign: 'right'
                      }}
                    />
                  </div>
                  <div>
                    <label style={{ 
                      fontSize: 'var(--font-size-sm)', 
                      fontWeight: '500', 
                      color: 'var(--neutral-700)',
                      display: 'block',
                      marginBottom: 'var(--spacing-xs)',
                      textAlign: 'right'
                    }}>
                      العملة الافتراضية
                    </label>
                    <select style={{
                      width: '200px',
                      padding: 'var(--spacing-sm)',
                      border: '1px solid var(--neutral-300)',
                      borderRadius: 'var(--radius-md)',
                      fontSize: 'var(--font-size-sm)',
                      textAlign: 'right'
                    }}>
                      <option value="SAR">ريال سعودي (SAR)</option>
                      <option value="USD">دولار أمريكي (USD)</option>
                      <option value="EUR">يورو (EUR)</option>
                    </select>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'exchange' && (
              <div>
                <h2 style={{ 
                  fontSize: 'var(--font-size-xl)', 
                  fontWeight: '600', 
                  color: 'var(--neutral-900)', 
                  textAlign: 'right',
                  marginBottom: 'var(--spacing-lg)'
                }}>
                  أسعار الصرف
                </h2>
                <div style={{ overflow: 'auto' }}>
                  <table style={{ width: '100%' }}>
                    <thead style={{ backgroundColor: 'var(--neutral-50)', borderBottom: '1px solid var(--neutral-200)' }}>
                      <tr style={{ height: 'var(--table-row-height)' }}>
                        <th style={{ 
                          padding: '0 var(--spacing-lg)', 
                          textAlign: 'right', 
                          fontSize: 'var(--font-size-sm)', 
                          fontWeight: 'bold', 
                          color: 'var(--neutral-900)' 
                        }}>
                          العملة
                        </th>
                        <th style={{ 
                          padding: '0 var(--spacing-lg)', 
                          textAlign: 'right', 
                          fontSize: 'var(--font-size-sm)', 
                          fontWeight: 'bold', 
                          color: 'var(--neutral-900)' 
                        }}>
                          السعر مقابل الريال
                        </th>
                        <th style={{ 
                          padding: '0 var(--spacing-lg)', 
                          textAlign: 'right', 
                          fontSize: 'var(--font-size-sm)', 
                          fontWeight: 'bold', 
                          color: 'var(--neutral-900)' 
                        }}>
                          آخر تحديث
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {[
                        { currency: 'USD', rate: '3.75', updated: '2024-09-25' },
                        { currency: 'EUR', rate: '4.12', updated: '2024-09-25' },
                        { currency: 'GBP', rate: '4.85', updated: '2024-09-25' }
                      ].map((rate, index) => (
                        <tr 
                          key={rate.currency}
                          style={{
                            height: 'var(--table-row-height)',
                            backgroundColor: index % 2 === 0 ? 'white' : 'var(--neutral-50)',
                            borderBottom: '1px solid var(--neutral-200)'
                          }}
                        >
                          <td style={{ 
                            padding: '0 var(--spacing-lg)', 
                            textAlign: 'right', 
                            fontSize: 'var(--font-size-sm)', 
                            fontWeight: '500',
                            color: 'var(--neutral-900)' 
                          }}>
                            {rate.currency}
                          </td>
                          <td style={{ 
                            padding: '0 var(--spacing-lg)', 
                            textAlign: 'right', 
                            fontSize: 'var(--font-size-sm)', 
                            color: 'var(--neutral-900)' 
                          }}>
                            {rate.rate}
                          </td>
                          <td style={{ 
                            padding: '0 var(--spacing-lg)', 
                            textAlign: 'right', 
                            fontSize: 'var(--font-size-sm)', 
                            color: 'var(--neutral-600)' 
                          }}>
                            {rate.updated}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Other tab content would go here */}
            {activeTab !== 'general' && activeTab !== 'exchange' && (
              <div style={{ textAlign: 'center', padding: 'var(--spacing-xl)' }}>
                <p style={{ color: 'var(--neutral-500)' }}>
                  محتوى تبويب {tabs.find(t => t.id === activeTab)?.label} سيتم إضافته قريباً
                </p>
              </div>
            )}

            {/* Save Button */}
            <div style={{ 
              marginTop: 'var(--spacing-xl)', 
              paddingTop: 'var(--spacing-lg)', 
              borderTop: '1px solid var(--neutral-200)',
              textAlign: 'right'
            }}>
              <Button 
                style={{
                  backgroundColor: 'var(--primary-blue)',
                  color: 'white',
                  padding: 'var(--spacing-sm) var(--spacing-lg)',
                  borderRadius: 'var(--radius-md)',
                  border: 'none',
                  cursor: 'pointer'
                }}
              >
                حفظ التغييرات
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
