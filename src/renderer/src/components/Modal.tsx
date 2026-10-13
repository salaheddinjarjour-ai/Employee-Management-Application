import { createPortal } from 'react-dom'
import { useEffect } from 'react'

type ModalChildren =
  | React.ReactNode
  | ((api: { close: () => void }) => React.ReactNode)

// Safely get modal root, create if missing
const getModalRoot = () => {
  let modalRoot = document.getElementById('modal-root')
  if (!modalRoot) {
    modalRoot = document.createElement('div')
    modalRoot.id = 'modal-root'
    document.body.appendChild(modalRoot)
  }
  return modalRoot
}

export default function Modal({
  open,
  onClose,
  children,
}: {
  open: boolean
  onClose: () => void
  children: ModalChildren
}) {
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose()
      }
    }
    
    if (open) {
      document.addEventListener('keydown', handleEscape)
      // Prevent body scroll when modal is open
      document.body.style.overflow = 'hidden'
    }
    
    return () => {
      document.removeEventListener('keydown', handleEscape)
      document.body.style.overflow = 'unset'
    }
  }, [open, onClose])

  if (!open) return null

  const modalRoot = getModalRoot()
  if (!modalRoot) return null

  // Safe children resolution - handle both ReactNode and render function
  const content = typeof children === 'function' 
    ? (children as (api: { close: () => void }) => React.ReactNode)({ close: onClose })
    : children

  return createPortal(
    <div className="fixed inset-0 z-[1000]">
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />
      <div
        className="absolute inset-y-0 right-0 w-full max-w-3xl bg-white shadow-xl overflow-auto"
        role="dialog"
        aria-modal="true"
      >
        {content}
      </div>
    </div>,
    modalRoot
  )
}
