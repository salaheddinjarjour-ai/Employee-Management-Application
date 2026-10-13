import { Trash2, Edit3, Paperclip, Eye } from "lucide-react"

export default function ActionCell({
  onView,
  onEdit,
  onDelete,
  showView = true,
  showEdit = true,
  showDelete = true,
  titleView = "عرض / مرفقات",
  titleEdit = "تعديل",
  titleDelete = "حذف",
}: {
  onView?: () => void
  onEdit?: () => void
  onDelete?: () => void
  showView?: boolean
  showEdit?: boolean
  showDelete?: boolean
  titleView?: string
  titleEdit?: string
  titleDelete?: string
}) {
  return (
    <div className="flex items-center justify-center gap-2 min-w-[120px]">
      {showView && (
        <button
          type="button"
          title={titleView}
          onClick={onView}
          className="inline-flex items-center justify-center w-8 h-8 rounded hover:bg-gray-100 transition-colors"
          data-testid="action-view"
        >
          <Eye className="w-[18px] h-[18px] text-gray-600" />
        </button>
      )}
      {showEdit && (
        <button
          type="button"
          title={titleEdit}
          onClick={onEdit}
          className="inline-flex items-center justify-center w-8 h-8 rounded hover:bg-blue-100 text-blue-600 transition-colors"
          data-testid="action-edit"
        >
          <Edit3 className="w-[18px] h-[18px]" />
        </button>
      )}
      {showDelete && (
        <button
          type="button"
          title={titleDelete}
          onClick={onDelete}
          className="inline-flex items-center justify-center w-8 h-8 rounded hover:bg-red-100 text-red-600 transition-colors"
          data-testid="action-delete"
        >
          <Trash2 className="w-[18px] h-[18px]" />
        </button>
      )}
    </div>
  )
}
