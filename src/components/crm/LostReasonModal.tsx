import { useState } from 'react'
import { Loader2, AlertTriangle } from 'lucide-react'
import { Modal } from '@/components/shared/Modal'

interface LostReasonModalProps {
    isOpen: boolean
    onClose: () => void
    onConfirm: (reason: string) => Promise<void>
    opportunityTitle: string
}

export function LostReasonModal({ isOpen, onClose, onConfirm, opportunityTitle }: LostReasonModalProps) {
    const [reason, setReason] = useState('')
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        if (!reason.trim()) {
            setError('Please provide a reason for marking this opportunity as lost.')
            return
        }

        setLoading(true)
        setError(null)

        try {
            await onConfirm(reason.trim())
            setReason('')
            onClose()
        } catch (err) {
            setError('Failed to update opportunity. Please try again.')
        } finally {
            setLoading(false)
        }
    }

    const handleClose = () => {
        setReason('')
        setError(null)
        onClose()
    }

    return (
        <Modal isOpen={isOpen} onClose={handleClose} title="Mark as Lost" size="md">
            <form onSubmit={handleSubmit} className="space-y-4">
                <div className="flex gap-4">
                    <div className="flex-shrink-0 w-10 h-10 rounded-full bg-destructive/10 text-destructive flex items-center justify-center">
                        <AlertTriangle className="w-5 h-5" />
                    </div>
                    <div className="flex-1">
                        <p className="text-sm text-muted-foreground mb-2">
                            You are marking the opportunity <strong>"{opportunityTitle}"</strong> as lost.
                            Please provide a reason for this decision.
                        </p>
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-medium mb-1.5">
                        Lost Reason <span className="text-destructive">*</span>
                    </label>
                    <textarea
                        value={reason}
                        onChange={(e) => setReason(e.target.value)}
                        className="input min-h-[100px] resize-y"
                        placeholder="Why was this opportunity lost? (e.g., competitor won, budget constraints, no response...)"
                    />
                </div>

                {error && (
                    <p className="text-destructive text-sm">{error}</p>
                )}

                <div className="flex gap-3 justify-end pt-2">
                    <button
                        type="button"
                        onClick={handleClose}
                        disabled={loading}
                        className="btn-outline"
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        disabled={loading || !reason.trim()}
                        className="btn bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    >
                        {loading ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                            'Mark as Lost'
                        )}
                    </button>
                </div>
            </form>
        </Modal>
    )
}
