import React from 'react'
import { Trash2, XCircle, CheckCircle2, Eye, Edit3 } from 'lucide-react'

interface ActionsBarProps {
  onDelete?: () => void
  onReject?: () => void
  onApprove?: () => void
  onView?: () => void
  onEdit?: () => void
  showReject?: boolean
  showApprove?: boolean
}

interface ActionButtonProps {
  title: string
  onClick?: () => void
  className?: string
  children: React.ReactNode
}

const ActionButton: React.FC<ActionButtonProps> = ({ title, onClick, className = '', children }) => (
  <button
    type="button"
    title={title}
    onClick={(e) => {
      e.stopPropagation()
      onClick?.()
    }}
    onKeyDown={(e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault()
        e.stopPropagation()
        onClick?.()
      }
    }}
    className={`inline-flex items-center justify-center w-8 h-8 rounded hover:bg-gray-100 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 ${className}`}
    aria-label={title}
  >
    {children}
  </button>
)

export default function ActionsBar({
  onDelete,
  onReject,
  onApprove,
  onView,
  onEdit,
  showReject = false,
  showApprove = false
}: ActionsBarProps) {
  return (
    <div className="flex items-center justify-center gap-3 min-w-[200px]">
      {onDelete && (
        <ActionButton
          title="حذف"
          onClick={onDelete}
          className="text-red-600 hover:bg-red-100"
        >
          <Trash2 className="w-[18px] h-[18px]" />
        </ActionButton>
      )}
      
      {showReject && onReject && (
        <ActionButton
          title="رفض"
          onClick={onReject}
          className="text-red-600 hover:bg-red-100"
        >
          <XCircle className="w-[18px] h-[18px]" />
        </ActionButton>
      )}
      
      {showApprove && onApprove && (
        <ActionButton
          title="موافقة"
          onClick={onApprove}
          className="text-green-600 hover:bg-green-100"
        >
          <CheckCircle2 className="w-[18px] h-[18px]" />
        </ActionButton>
      )}
      
      {onView && (
        <ActionButton
          title="عرض"
          onClick={onView}
          className="text-blue-600 hover:bg-blue-100"
        >
          <Eye className="w-[18px] h-[18px]" />
        </ActionButton>
      )}
      
      {onEdit && (
        <ActionButton
          title="تعديل"
          onClick={onEdit}
          className="text-gray-600 hover:bg-gray-100"
        >
          <Edit3 className="w-[18px] h-[18px]" />
        </ActionButton>
      )}
    </div>
  )
}
