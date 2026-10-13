import React, { useState, useEffect } from 'react'
import { FileText, Trash2, Download, Eye, Upload, File } from 'lucide-react'
import { Button } from '../ui/Button'
import { cn } from '../ui/utils'

interface Attachment {
  id: number
  file_name: string
  file_type: string
  file_size: number
  uploaded_at: string
  file_path: string
}

interface EmployeeAttachmentsListProps {
  employeeId: number
}

export function EmployeeAttachmentsList({ employeeId }: EmployeeAttachmentsListProps) {
  const [attachments, setAttachments] = useState<Attachment[]>([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)

  const loadAttachments = async () => {
    try {
      setLoading(true)
      const data = await window.api.invoke('attachments:list', 'employee', employeeId)
      if (Array.isArray(data)) {
        setAttachments(data)
      } else {
        console.warn('Attachments data is not an array:', data)
        setAttachments([])
      }
    } catch (error) {
      console.error('Failed to load attachments:', error)
      setAttachments([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (employeeId) {
      loadAttachments()
    }
  }, [employeeId])

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return

    try {
      setUploading(true)
      for (let i = 0; i < files.length; i++) {
        const file = files[i]
        // In Electron, file.path is available
        const filePath = (file as any).path

        await window.api.invoke('attachments:upload', {
          entityType: 'employee',
          entityId: employeeId,
          fileName: file.name,
          filePath: filePath,
          size: file.size
        })
      }
      loadAttachments()
      window.toast?.success?.('تم رفع المرفقات بنجاح')
    } catch (error) {
      console.error('Failed to upload attachment:', error)
      window.toast?.error?.('فشل رفع الملف')
    } finally {
      setUploading(false)
      // Reset input
      e.target.value = ''
    }
  }

  const handleDelete = async (id: number) => {
    if (!confirm('هل أنت متأكد من حذف هذا المرفق؟')) return

    try {
      await window.api.invoke('attachments:delete', id)
      loadAttachments()
    } catch (error) {
      console.error('Failed to delete attachment:', error)
      alert('فشل حذف المرفق')
    }
  }

  const handleOpen = async (id: number) => {
    console.log('[Frontend] handleOpen called with id:', id, 'type:', typeof id)
    try {
      await window.api.invoke('attachments:open', id)
    } catch (error) {
      console.error('Failed to open attachment:', error)
    }
  }

  const formatSize = (bytes: number) => {
    if (bytes === 0) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i]
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">المرفقات</h3>
        <div className="relative">
          <input
            type="file"
            multiple
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            onChange={handleFileSelect}
            disabled={uploading}
          />
          <Button variant="outline" size="sm" disabled={uploading}>
            <Upload className="w-4 h-4 ml-2" />
            {uploading ? 'جاري الرفع...' : 'إضافة مرفق'}
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-4 text-gray-500">جاري التحميل...</div>
      ) : attachments.length === 0 ? (
        <div className="text-center py-8 border-2 border-dashed rounded-lg text-gray-500 bg-gray-50">
          <File className="w-8 h-8 mx-auto mb-2 text-gray-400" />
          <p>لا توجد مرفقات</p>
          <p className="text-sm text-gray-400 mt-1">يمكنك رفع السيرة الذاتية، الشهادات، العقود...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-2">
          {attachments.map((file) => (
            <div
              key={file.id}
              className="flex items-center justify-between p-3 bg-white border rounded-lg hover:shadow-sm transition-shadow"
            >
              <div className="flex items-center gap-3 overflow-hidden">
                <div className="p-2 bg-blue-50 rounded text-blue-600">
                  <FileText className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <p className="font-medium truncate" title={file.file_name}>
                    {file.file_name}
                  </p>
                  <p className="text-xs text-gray-500">
                    {formatSize(file.file_size)} • {new Date(file.uploaded_at).toLocaleDateString('ar-SA')}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleOpen(file.id)}
                  title="عرض"
                >
                  <Eye className="w-4 h-4 text-gray-600" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-red-600 hover:bg-red-50 hover:text-red-700"
                  onClick={() => handleDelete(file.id)}
                  title="حذف"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
