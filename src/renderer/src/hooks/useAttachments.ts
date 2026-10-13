import { useState, useEffect, useCallback } from 'react'

interface Attachment {
  id: number
  entity_type: string
  entity_id: number
  file_name: string
  file_path: string
  file_size: number
  mime_type: string
  uploaded_by: number
  created_at: string
}

interface UseAttachmentsReturn {
  attachments: Attachment[]
  loading: boolean
  error: string | null
  refresh: () => Promise<void>
  upload: (file: File, uploadedBy: number) => Promise<boolean>
  delete: (attachmentId: number) => Promise<boolean>
  open: (attachmentId: number) => Promise<boolean>
}

export function useAttachments(
  entityType: 'employee' | 'promotion' | 'reward' | 'leave' | 'absence' | 'payroll' | 'evaluation' | 'course',
  entityId: number
): UseAttachmentsReturn {
  const [attachments, setAttachments] = useState<Attachment[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const refresh = useCallback(async () => {
    if (!window.electronAPI || !entityId) return

    setLoading(true)
    setError(null)

    try {
      const result = await window.electronAPI.files.list(entityType, entityId)
      if (result.success && result.data) {
        setAttachments(result.data)
      } else {
        setError(result.error || 'Failed to load attachments')
      }
    } catch (err) {
      setError('Failed to load attachments')
      console.error('Attachments loading error:', err)
    } finally {
      setLoading(false)
    }
  }, [entityType, entityId])

  const upload = useCallback(async (file: File, uploadedBy: number): Promise<boolean> => {
    if (!window.electronAPI || !entityId) return false

    try {
      // In Electron, File objects have a .path property with the file system path
      const filePath = (file as any).path

      if (!filePath || typeof filePath !== 'string') {
        console.error('File path not available:', file)
        setError('File path not available')
        return false
      }

      // Pass as a single object to match preload API signature: save(data)
      const result = await window.electronAPI.files.save({
        entityType,
        entityId,
        fileName: file.name,
        filePath,
        size: file.size
      })

      if (result.success) {
        await refresh()
        return true
      } else {
        setError(result.error || 'Upload failed')
        return false
      }
    } catch (err) {
      setError('Upload failed')
      console.error('Upload error:', err)
      return false
    }
  }, [entityType, entityId, refresh])

  const deleteAttachment = useCallback(async (attachmentId: number): Promise<boolean> => {
    if (!window.electronAPI) return false

    try {
      const result = await window.electronAPI.files.delete(attachmentId)
      if (result.success) {
        await refresh()
        return true
      } else {
        setError(result.error || 'Delete failed')
        return false
      }
    } catch (err) {
      setError('Delete failed')
      console.error('Delete error:', err)
      return false
    }
  }, [refresh])

  const openAttachment = useCallback(async (attachmentId: number): Promise<boolean> => {
    if (!window.electronAPI) return false

    try {
      const result = await window.electronAPI.files.open(attachmentId)
      if (result.success) {
        return true
      } else {
        setError(result.error || 'Failed to open file')
        return false
      }
    } catch (err) {
      setError('Failed to open file')
      console.error('Open error:', err)
      return false
    }
  }, [])

  // Load attachments on mount
  useEffect(() => {
    refresh()
  }, [refresh])

  return {
    attachments,
    loading,
    error,
    refresh,
    upload,
    delete: deleteAttachment,
    open: openAttachment
  }
}
