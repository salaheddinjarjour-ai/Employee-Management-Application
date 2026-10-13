import React, { useState, useCallback, useRef } from 'react'
import { Upload, FileText, Image, Eye, Trash2 } from 'lucide-react'
import { Button } from './ui/Button'
import { cn } from './ui/utils'
import { toast } from 'sonner'
import { useAttachments } from '@/hooks/useAttachments'

interface AttachmentUploadProps {
  entityType: 'employee' | 'promotion' | 'reward' | 'leave' | 'absence' | 'payroll' | 'evaluation' | 'course'
  entityId: number
  uploadedBy: number
  className?: string
  maxFileSize?: number // in bytes, default 20MB
  allowedTypes?: string[] // mime types or extensions
}

const DEFAULT_MAX_SIZE = 20 * 1024 * 1024 // 20MB
const DEFAULT_ALLOWED_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'image/jpeg',
  'image/png',
  'image/gif',
  'text/plain',
  'text/csv'
]

export function AttachmentUpload({
  entityType,
  entityId,
  uploadedBy,
  className,
  maxFileSize = DEFAULT_MAX_SIZE,
  allowedTypes = DEFAULT_ALLOWED_TYPES
}: AttachmentUploadProps) {
  const { attachments, loading, error, refresh, upload, delete: deleteAttachment, open } = useAttachments(entityType, entityId)
  const [isDragging, setIsDragging] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const validateFile = (file: File): string | null => {
    if (file.size > maxFileSize) {
      return `File size exceeds ${Math.round(maxFileSize / 1024 / 1024)}MB limit`
    }
    
    if (!allowedTypes.includes(file.type)) {
      const ext = file.name.split('.').pop()?.toLowerCase()
      const allowedExts = allowedTypes.map(type => type.split('/').pop()).join(', ')
      return `File type not allowed. Allowed types: ${allowedExts}`
    }
    
    return null
  }

  const uploadFile = async (file: File) => {
    const validationError = validateFile(file)
    if (validationError) {
      toast.error(validationError)
      return
    }

    setIsUploading(true)
    
    try {
      const success = await upload(file, uploadedBy)
      if (success) {
        toast.success(`File "${file.name}" uploaded successfully`)
      } else {
        toast.error('Upload failed')
      }
    } catch (error) {
      console.error('Upload error:', error)
      toast.error('Upload failed')
    } finally {
      setIsUploading(false)
    }
  }

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    
    const files = Array.from(e.dataTransfer.files)
    files.forEach(uploadFile)
  }, [uploadFile])

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }, [])

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    files.forEach(uploadFile)
    
    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleDelete = async (attachmentId: number) => {
    const success = await deleteAttachment(attachmentId)
    if (success) {
      toast.success('File deleted successfully')
    } else {
      toast.error('Delete failed')
    }
  }

  const handleOpen = async (attachmentId: number) => {
    const success = await open(attachmentId)
    if (!success) {
      toast.error('Failed to open file')
    }
  }

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const getFileIcon = (mimeType: string) => {
    if (mimeType.startsWith('image/')) {
      return <Image className="w-4 h-4" />
    }
    return <FileText className="w-4 h-4" />
  }

  return (
    <div className={cn("space-y-4", className)}>
      {/* Upload Area */}
      <div
        className={cn(
          "border-2 border-dashed rounded-lg p-6 text-center transition-colors",
          isDragging
            ? "border-blue-400 bg-blue-50"
            : "border-gray-300 hover:border-gray-400",
          (isUploading || loading) && "opacity-50 pointer-events-none"
        )}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          className="hidden"
          onChange={handleFileSelect}
          accept={allowedTypes.join(',')}
        />
        
        <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
        <p className="text-sm text-gray-600 mb-2">
          اسحب الملفات هنا أو{' '}
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="text-blue-600 hover:text-blue-700 underline"
          >
            اختر ملفات
          </button>
        </p>
        <p className="text-xs text-gray-500">
          الحد الأقصى: {Math.round(maxFileSize / 1024 / 1024)}MB
          <br />
          الأنواع المدعومة: PDF, DOCX, XLSX, JPG, PNG
        </p>
        
        {(isUploading || loading) && (
          <div className="mt-2">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mx-auto"></div>
            <p className="text-xs text-gray-500 mt-1">
              {isUploading ? 'جاري الرفع...' : 'جاري التحميل...'}
            </p>
          </div>
        )}
      </div>

      {/* Error Display */}
      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      {/* Attachments List */}
      {attachments.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-gray-900">الملفات المرفقة ({attachments.length})</h4>
          <div className="space-y-2">
            {attachments.map((attachment) => (
              <div
                key={attachment.id}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border"
              >
                <div className="flex items-center space-x-reverse space-x-3 flex-1 min-w-0">
                  {getFileIcon(attachment.mime_type)}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {attachment.file_name}
                    </p>
                    <p className="text-xs text-gray-500">
                      {formatFileSize(attachment.file_size)} • {new Date(attachment.created_at).toLocaleDateString('ar')}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-reverse space-x-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleOpen(attachment.id)}
                    title="فتح الملف"
                  >
                    <Eye className="w-4 h-4" />
                  </Button>
                  
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDelete(attachment.id)}
                    title="حذف الملف"
                    className="text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
