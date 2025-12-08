import { useState, useRef } from 'react'
import { Loader2, CheckCircle2, UploadCloud, FileText, X } from 'lucide-react'
import { Modal } from '@/components/shared/Modal'
import { supabase } from '@/lib/supabase'

interface MarkAsWonModalProps {
    isOpen: boolean
    onClose: () => void
    onConfirm: (data: { description?: string, fileUrl?: string }) => Promise<void>
    opportunityTitle: string
}

export function MarkAsWonModal({ isOpen, onClose, onConfirm, opportunityTitle }: MarkAsWonModalProps) {
    const [description, setDescription] = useState('')
    const [file, setFile] = useState<File | null>(null)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const fileInputRef = useRef<HTMLInputElement>(null)

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        if (!description.trim() && !file) {
            setError('Please provide either an order description OR upload a purchase order.')
            return
        }

        setLoading(true)
        setError(null)

        try {
            let fileUrl = undefined

            if (file) {
                const fileExt = file.name.split('.').pop()
                const fileName = `won_po_${Date.now()}.${fileExt}`
                const filePath = `won_orders/${fileName}`

                const { error: uploadError } = await supabase.storage
                    .from('documents')
                    .upload(filePath, file)

                if (uploadError) throw uploadError

                // Get public URL or assume path
                // Using path for consistency if using signed urls, but usually we need full path
                // For now, storing path
                fileUrl = filePath
            }

            await onConfirm({
                description: description.trim() || undefined,
                fileUrl
            })

            setDescription('')
            setFile(null)
            onClose()
        } catch (err) {
            console.error(err)
            setError('Failed to update opportunity. Please try again.')
        } finally {
            setLoading(false)
        }
    }

    const handleClose = () => {
        setDescription('')
        setFile(null)
        setError(null)
        onClose()
    }

    return (
        <Modal isOpen={isOpen} onClose={handleClose} title="Mark as Won" size="md">
            <form onSubmit={handleSubmit} className="space-y-6">
                <div className="flex gap-4">
                    <div className="flex-shrink-0 w-10 h-10 rounded-full bg-green-100 text-green-600 flex items-center justify-center">
                        <CheckCircle2 className="w-5 h-5" />
                    </div>
                    <div className="flex-1">
                        <p className="text-sm text-muted-foreground mb-2">
                            Congratulations! You are marking <strong>"{opportunityTitle}"</strong> as won.
                            Please provide the order details.
                        </p>
                    </div>
                </div>

                <div className="space-y-4">
                    {/* Description Field */}
                    <div>
                        <label className="block text-sm font-medium mb-1.5">
                            Order Agreement / Description
                        </label>
                        <textarea
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            className="input min-h-[80px] w-full resize-y"
                            placeholder="Enter details about the agreement..."
                        />
                    </div>

                    <div className="relative">
                        <div className="absolute inset-0 flex items-center">
                            <span className="w-full border-t border-border" />
                        </div>
                        <div className="relative flex justify-center text-xs uppercase">
                            <span className="bg-background px-2 text-muted-foreground">OR</span>
                        </div>
                    </div>

                    {/* File Upload */}
                    <div>
                        <label className="block text-sm font-medium mb-1.5">
                            Purchase Order (PO)
                        </label>

                        {!file ? (
                            <div
                                onClick={() => fileInputRef.current?.click()}
                                className="border-2 border-dashed border-border hover:border-primary/50 rounded-lg p-6 flex flex-col items-center justify-center cursor-pointer transition-colors bg-muted/20 hover:bg-muted/40"
                            >
                                <input
                                    type="file"
                                    ref={fileInputRef}
                                    className="hidden"
                                    onChange={(e) => e.target.files?.[0] && setFile(e.target.files[0])}
                                    accept=".pdf,.doc,.docx,.jpg,.png"
                                />
                                <UploadCloud className="w-8 h-8 text-muted-foreground mb-2" />
                                <p className="text-sm font-medium">Click to upload PO</p>
                                <p className="text-xs text-muted-foreground mt-1">PDF, DOC, Images (max 10MB)</p>
                            </div>
                        ) : (
                            <div className="flex items-center justify-between p-3 rounded-lg border border-border bg-card">
                                <div className="flex items-center gap-3 overflow-hidden">
                                    <div className="p-2 rounded bg-green-50 text-green-600">
                                        <FileText className="w-4 h-4" />
                                    </div>
                                    <div className="min-w-0">
                                        <p className="text-sm font-medium truncate">{file.name}</p>
                                        <p className="text-xs text-muted-foreground">{(file.size / 1024).toFixed(1)} KB</p>
                                    </div>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => setFile(null)}
                                    className="p-1 hover:bg-muted rounded-full"
                                >
                                    <X className="w-4 h-4 text-muted-foreground" />
                                </button>
                            </div>
                        )}
                    </div>
                </div>

                {error && (
                    <p className="text-destructive text-sm">{error}</p>
                )}

                <div className="flex gap-3 justify-end border-t border-border pt-4">
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
                        disabled={loading || (!description.trim() && !file)}
                        className="btn bg-green-600 text-white hover:bg-green-700"
                    >
                        {loading ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                            'Confirm Won'
                        )}
                    </button>
                </div>
            </form>
        </Modal>
    )
}
