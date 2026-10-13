import React, { useState } from 'react'
import { Button } from '../ui/Button'
import { cn } from '../ui/utils'
import { Save, X, TrendingUp } from 'lucide-react'
import { toast } from 'sonner'

interface ExchangeRate {
  id?: number
  from_currency: string
  to_currency: string
  rate: number
  effective_from: string
  effective_to?: string
  is_active: boolean
  note?: string
  created_by?: number
}

interface ExchangeRateFormProps {
  exchangeRate?: ExchangeRate
  onSave?: (rate: ExchangeRate) => Promise<boolean>
  onCancel?: () => void
  className?: string
}

export function ExchangeRateForm({ exchangeRate, onSave, onCancel, className }: ExchangeRateFormProps) {
  const [formData, setFormData] = useState<ExchangeRate>({
    from_currency: 'USD',
    to_currency: 'TRY',
    rate: 0,
    effective_from: new Date().toISOString().split('T')[0],
    is_active: true,
    note: '',
    ...exchangeRate
  })
  
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {}

    // Required fields
    if (!formData.rate || formData.rate <= 0) {
      newErrors.rate = 'معدل الصرف يجب أن يكون أكبر من صفر'
    }
    if (!formData.effective_from) {
      newErrors.effective_from = 'تاريخ السريان مطلوب'
    }

    // Rate validation
    if (formData.rate && (formData.rate < 0.01 || formData.rate > 1000)) {
      newErrors.rate = 'معدل الصرف يجب أن يكون بين 0.01 و 1000'
    }

    // Date validation
    if (formData.effective_from) {
      const effectiveDate = new Date(formData.effective_from)
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      
      if (effectiveDate < today) {
        newErrors.effective_from = 'تاريخ السريان لا يمكن أن يكون في الماضي'
      }
    }

    // Effective to date validation
    if (formData.effective_to && formData.effective_from) {
      const fromDate = new Date(formData.effective_from)
      const toDate = new Date(formData.effective_to)
      
      if (toDate <= fromDate) {
        newErrors.effective_to = 'تاريخ الانتهاء يجب أن يكون بعد تاريخ السريان'
      }
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) {
      toast.error('يرجى تصحيح الأخطاء في النموذج')
      return
    }

    if (!onSave) {
      toast.error('وظيفة الحفظ غير متوفرة')
      return
    }

    setIsSubmitting(true)
    
    try {
      const success = await onSave(formData)
      if (success) {
        toast.success(exchangeRate ? 'تم تحديث معدل الصرف بنجاح' : 'تم إضافة معدل الصرف بنجاح')
        if (!exchangeRate) {
          // Reset form for new rate
          setFormData({
            from_currency: 'USD',
            to_currency: 'TRY',
            rate: 0,
            effective_from: new Date().toISOString().split('T')[0],
            is_active: true,
            note: ''
          })
        }
      } else {
        toast.error('فشل في حفظ معدل الصرف')
      }
    } catch (error) {
      console.error('Form submission error:', error)
      toast.error('حدث خطأ أثناء حفظ البيانات')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleChange = (field: keyof ExchangeRate, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }))
    }
  }

  // Calculate example conversion
  const exampleAmount = 1000
  const convertedAmount = formData.rate ? (exampleAmount * formData.rate) : 0

  return (
    <div className={cn("bg-white rounded-lg shadow-sm border", className)}>
      <div className="px-6 py-4 border-b">
        <h2 className="text-lg font-semibold text-gray-900">
          {exchangeRate ? 'تحديث معدل الصرف' : 'إضافة معدل صرف جديد'}
        </h2>
      </div>

      <form onSubmit={handleSubmit} className="p-6 space-y-6">
        {/* Currency Pair */}
        <div>
          <h3 className="text-md font-medium text-gray-900 mb-4">زوج العملات</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                العملة الأساسية
              </label>
              <select
                value={formData.from_currency}
                onChange={(e) => handleChange('from_currency', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={!!exchangeRate} // Don't allow changing currency pair for existing rates
              >
                <option value="USD">USD - الدولار الأمريكي</option>
                <option value="EUR">EUR - اليورو</option>
                <option value="GBP">GBP - الجنيه الإسترليني</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                العملة المقابلة
              </label>
              <select
                value={formData.to_currency}
                onChange={(e) => handleChange('to_currency', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={!!exchangeRate} // Don't allow changing currency pair for existing rates
              >
                <option value="TRY">TRY - الليرة التركية</option>
                <option value="USD">USD - الدولار الأمريكي</option>
                <option value="EUR">EUR - اليورو</option>
              </select>
            </div>
          </div>
        </div>

        {/* Rate Information */}
        <div>
          <h3 className="text-md font-medium text-gray-900 mb-4">معلومات المعدل</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                معدل الصرف *
              </label>
              <div className="relative">
                <TrendingUp className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                <input
                  type="number"
                  step="0.0001"
                  min="0.01"
                  max="1000"
                  value={formData.rate || ''}
                  onChange={(e) => handleChange('rate', parseFloat(e.target.value) || 0)}
                  className={cn(
                    "w-full pl-10 pr-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500",
                    errors.rate ? "border-red-500" : "border-gray-300"
                  )}
                  placeholder="36.5000"
                />
              </div>
              {errors.rate && (
                <p className="text-red-500 text-xs mt-1">{errors.rate}</p>
              )}
              {formData.rate > 0 && (
                <p className="text-gray-500 text-xs mt-1">
                  1 {formData.from_currency} = {formData.rate.toFixed(4)} {formData.to_currency}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                تاريخ السريان *
              </label>
              <input
                type="date"
                value={formData.effective_from}
                onChange={(e) => handleChange('effective_from', e.target.value)}
                className={cn(
                  "w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500",
                  errors.effective_from ? "border-red-500" : "border-gray-300"
                )}
              />
              {errors.effective_from && (
                <p className="text-red-500 text-xs mt-1">{errors.effective_from}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                تاريخ الانتهاء (اختياري)
              </label>
              <input
                type="date"
                value={formData.effective_to || ''}
                onChange={(e) => handleChange('effective_to', e.target.value || undefined)}
                className={cn(
                  "w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500",
                  errors.effective_to ? "border-red-500" : "border-gray-300"
                )}
              />
              {errors.effective_to && (
                <p className="text-red-500 text-xs mt-1">{errors.effective_to}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                الحالة
              </label>
              <div className="flex items-center space-x-reverse space-x-3 pt-2">
                <input
                  type="checkbox"
                  id="is_active"
                  checked={formData.is_active}
                  onChange={(e) => handleChange('is_active', e.target.checked)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="is_active" className="text-sm text-gray-700">
                  معدل نشط
                </label>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                المعدلات النشطة تُستخدم في تحويل العملات
              </p>
            </div>
          </div>
        </div>

        {/* Additional Information */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            ملاحظات
          </label>
          <textarea
            value={formData.note || ''}
            onChange={(e) => handleChange('note', e.target.value)}
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="ملاحظات إضافية حول هذا المعدل..."
          />
        </div>

        {/* Preview */}
        {formData.rate > 0 && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="font-medium text-blue-900 mb-2">معاينة التحويل</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-blue-700">{exampleAmount.toLocaleString()} {formData.from_currency}</span>
                <span className="text-blue-600 mx-2">→</span>
                <span className="font-medium text-blue-900">{convertedAmount.toLocaleString()} {formData.to_currency}</span>
              </div>
              <div className="text-blue-600">
                معدل: 1 {formData.from_currency} = {formData.rate.toFixed(4)} {formData.to_currency}
              </div>
            </div>
          </div>
        )}

        {/* Form Actions */}
        <div className="flex items-center justify-end space-x-reverse space-x-3 pt-6 border-t">
          {onCancel && (
            <Button type="button" variant="outline" onClick={onCancel}>
              <X className="w-4 h-4 mr-2" />
              إلغاء
            </Button>
          )}
          <Button type="submit" disabled={isSubmitting || formData.rate <= 0}>
            <Save className="w-4 h-4 mr-2" />
            {isSubmitting ? 'جاري الحفظ...' : 'حفظ'}
          </Button>
        </div>
      </form>
    </div>
  )
}
