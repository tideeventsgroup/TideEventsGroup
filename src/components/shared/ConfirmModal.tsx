import React from 'react'
import { AlertTriangle } from 'lucide-react'
import { Modal } from '../ui/Modal'
import { Button } from '../ui/Button'

interface ConfirmModalProps {
  open: boolean
  onClose: () => void
  onConfirm: () => void
  title: string
  message: string
  confirmLabel?: string
  loading?: boolean
  danger?: boolean
}

export function ConfirmModal({ open, onClose, onConfirm, title, message, confirmLabel = 'Confirm', loading, danger = true }: ConfirmModalProps) {
  return (
    <Modal open={open} onClose={onClose} size="sm">
      <div className="text-center">
        <div className={`mx-auto mb-4 h-12 w-12 rounded-full flex items-center justify-center ${danger ? 'bg-danger/10' : 'bg-amber/10'}`}>
          <AlertTriangle size={24} className={danger ? 'text-danger' : 'text-amber'} />
        </div>
        <h3 className="text-base font-semibold text-navy mb-2">{title}</h3>
        <p className="text-sm text-gray-600 mb-6">{message}</p>
        <div className="flex gap-3 justify-center">
          <Button variant="outline" onClick={onClose} disabled={loading}>Cancel</Button>
          <Button variant={danger ? 'danger' : 'primary'} onClick={onConfirm} loading={loading}>
            {confirmLabel}
          </Button>
        </div>
      </div>
    </Modal>
  )
}
