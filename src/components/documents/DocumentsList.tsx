import { useEffect, useState } from 'react'
import { FileText, Download, Trash2, Loader2, File as FileIcon } from 'lucide-react'
import { useDocuments } from '@/hooks/useDocuments'
import { DocumentUpload } from './DocumentUpload'
import { clsx } from 'clsx'
import type { Document } from '@/lib/database.types'

interface DocumentsListProps {
    entityId?: string
    entityType: string
}

export function DocumentsList({ entityId, entityType }: DocumentsListProps) {
    const {
        documents,
        loading,
        fetchDocuments,
        uploadDocument,
        deleteDocument,
        getDownloadUrl
    } = useDocuments(entityId, entityType)

    const [processingId, setProcessingId] = useState<string | null>(null)

    useEffect(() => {
        fetchDocuments()
    }, [fetchDocuments])

    const handleDownload = async (doc: Document) => {
        try {
            setProcessingId(doc.id)
            const url = await getDownloadUrl(doc.file_url)
            window.open(url, '_blank')
        } catch (error) {
            console.error('Failed to open document:', error)
        } finally {
            setProcessingId(null)
        }
    }

    const handleDelete = async (doc: Document) => {
        if (!confirm('Are you sure you want to delete this document?')) return

        try {
            setProcessingId(doc.id)
            await deleteDocument(doc)
        } catch (error) {
            console.error('Failed to delete document:', error)
        } finally {
            setProcessingId(null)
        }
    }

    const formatFileSize = (bytes: number | null) => {
        if (!bytes) return '-'
        if (bytes < 1024) return bytes + ' B'
        if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
        return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
    }

    if (!entityId) return null

    return (
        <div className="space-y-4">
            <h3 className="text-lg font-medium">Documents</h3>

            <DocumentUpload onUpload={uploadDocument} />

            {loading && documents.length === 0 ? (
                <div className="flex justify-center p-4">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
            ) : documents.length > 0 ? (
                <div className="space-y-2">
                    {documents.map((doc) => (
                        <div
                            key={doc.id}
                            className="flex items-center justify-between p-3 bg-muted/30 rounded-lg border border-border group hover:bg-muted/50 transition-colors"
                        >
                            <div className="flex items-center gap-3 overflow-hidden">
                                <div className="p-2 bg-background rounded-md border border-border">
                                    <FileIcon className="h-5 w-5 text-blue-500" />
                                </div>
                                <div className="min-w-0">
                                    <p className="font-medium text-sm truncate" title={doc.file_name}>
                                        {doc.file_name}
                                    </p>
                                    <p className="text-xs text-muted-foreground">
                                        {formatFileSize(doc.file_size)} • {new Date(doc.created_at).toLocaleDateString()}
                                    </p>
                                </div>
                            </div>

                            <div className="flex items-center gap-1">
                                <button
                                    onClick={() => handleDownload(doc)}
                                    disabled={!!processingId}
                                    className="p-2 hover:bg-background rounded-md transition-colors text-muted-foreground hover:text-foreground"
                                    title="Download/View"
                                >
                                    {processingId === doc.id ? (
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                    ) : (
                                        <Download className="h-4 w-4" />
                                    )}
                                </button>
                                <button
                                    onClick={() => handleDelete(doc)}
                                    disabled={!!processingId}
                                    className="p-2 hover:bg-destructive/10 rounded-md transition-colors text-muted-foreground hover:text-destructive"
                                    title="Delete"
                                >
                                    <Trash2 className="h-4 w-4" />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="text-center p-4 text-sm text-muted-foreground bg-muted/10 rounded-lg border border-dashed">
                    No documents uploaded yet
                </div>
            )}
        </div>
    )
}
