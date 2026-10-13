export default function Confirm({
  open,
  title = "تأكيد الحذف",
  message = "هل أنت متأكد من الحذف؟ لا يمكن التراجع.",
  confirmText = "حذف",
  cancelText = "إلغاء",
  onConfirm,
  onClose
}: {
  open: boolean
  title?: string
  message?: string
  confirmText?: string
  cancelText?: string
  onConfirm: () => void
  onClose: () => void
}) {
  if (!open) return null

  return (
    <div className="fixed inset-0 z-[1100]">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="absolute inset-0 flex items-center justify-center p-6 pointer-events-none">
        <div className="pointer-events-auto w-full max-w-md rounded-2xl bg-white shadow-2xl p-6" dir="rtl">
          <h3 className="text-lg font-semibold mb-2 text-gray-900">{title}</h3>
          <p className="text-sm text-gray-600 mb-4">{message}</p>
          <div className="flex gap-2 justify-end">
            <button
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              onClick={onClose}
            >
              {cancelText}
            </button>
            <button
              className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors"
              onClick={onConfirm}
            >
              {confirmText}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
