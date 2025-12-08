import { useState, useEffect } from 'react'
import { Loader2, AlertTriangle } from 'lucide-react'
import { Modal } from '@/components/shared/Modal'
import { useLostReasons } from '@/hooks/useLostReasons'

interface LostReasonModalProps {
    isOpen: boolean
    onClose: () => void
    onConfirm: (reason: string) => Promise<void>
    opportunityTitle: string
}

export function LostReasonModal({ isOpen, onClose, onConfirm, opportunityTitle }: LostReasonModalProps) {
    const { reasons, loading: loadingReasons } = useLostReasons()
    const [selectedReasonId, setSelectedReasonId] = useState<string>('')
    const [customReason, setCustomReason] = useState('')
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const isOther = reasons.find(r => r.id === selectedReasonId)?.reason === 'Other' || selectedReasonId === 'other_custom'

    // Check if "Other" exists in reasons, if not, we use a fake id
    const otherOptionId = reasons.find(r => r.reason.toLowerCase() === 'other')?.id || 'other_custom'

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        if (!selectedReasonId) {
            setError('Please select a reason.')
            return
        }

        let finalReason = ''
        if (selectedReasonId === otherOptionId) {
            if (!customReason.trim()) {
                setError('Please provide a description.')
                return
            }
            finalReason = customReason.trim()
        } else {
            const reasonObj = reasons.find(r => r.id === selectedReasonId)
            finalReason = reasonObj ? reasonObj.reason : ''
        }

        if (!finalReason) {
            setError('Invalid reason selected.')
            return
        }

        setLoading(true)
        setError(null)

        try {
            await onConfirm(finalReason)
            setCustomReason('')
            setSelectedReasonId('')
            onClose()
        } catch (err) {
            setError('Failed to update opportunity. Please try again.')
        } finally {
            setLoading(false)
        }
    }

    const handleClose = () => {
        setCustomReason('')
        setSelectedReasonId('')
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
                    {loadingReasons ? (
                        <div className="h-10 w-full bg-muted animate-pulse rounded" />
                    ) : (
                        <select
                            value={selectedReasonId}
                            onChange={(e) => {
                                setSelectedReasonId(e.target.value)
                                setError(null)
                            }}
                            className="input w-full"
                        >
                            <option value="">Select a reason...</option>
                            {reasons.map(reason => (
                                <option key={reason.id} value={reason.id}>{reason.reason}</option>
                            ))}
                            {/* Ensure Other option is available if not in DB */}
                            {!reasons.find(r => r.reason.toLowerCase() === 'other') && (
                                <option value="other_custom">Other</option>
                            )}
                        </select>
                    )}
                </div>

                {(selectedReasonId === otherOptionId || selectedReasonId === 'other_custom') && (
                    <div>
                        <label className="block text-sm font-medium mb-1.5">
                            Description <span className="text-destructive">*</span>
                        </label>
                        <textarea
                            value={customReason}
                            onChange={(e) => setCustomReason(e.target.value)}
                            className="input min-h-[80px] w-full resize-y"
                            placeholder="Please provide more details..."
                        />
                    </div>
                )}

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
                        disabled={loading || !selectedReasonId || (selectedReasonId === otherOptionId && !customReason.trim())}
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
