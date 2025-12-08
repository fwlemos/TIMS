import { useState, useRef } from 'react'
import { useOpportunityFiles } from '@/hooks/useOpportunityFiles'
import { useUsers } from '@/hooks/useUsers'
import {
    FileText,
    UploadCloud,
    X,
    Download,
    Trash2,
    File as FileIcon,
    Image as ImageIcon,
    FileSpreadsheet,
    Loader2
} from 'lucide-react'
import { clsx } from 'clsx'

interface FilesSectionProps {
    opportunityId: string
    onFileChange?: () => void
}

export function FilesSection({ opportunityId, onFileChange }: FilesSectionProps) {
    const {
        files,
        loading,
        uploading,
        uploadFile,
        deleteFile,
        getDownloadUrl
    } = useOpportunityFiles(opportunityId)
    const { users } = useUsers()
    const [isDragging, setIsDragging] = useState(false)
    const fileInputRef = useRef<HTMLInputElement>(null)
    const [deletingId, setDeletingId] = useState<string | null>(null)

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault()
        setIsDragging(true)
    }

    const handleDragLeave = (e: React.DragEvent) => {
        e.preventDefault()
        setIsDragging(false)
    }

    const handleDrop = async (e: React.DragEvent) => {
        e.preventDefault()
        setIsDragging(false)
        const droppedFiles = Array.from(e.dataTransfer.files)
        if (droppedFiles.length > 0) {
            await handleUpload(droppedFiles[0])
        }
    }

    const handleUpload = async (file: File) => {
        try {
            await uploadFile(file)
            onFileChange?.()
        } catch (error) {
            alert(error instanceof Error ? error.message : 'Upload failed')
        }
    }

    const handleDelete = async (file: any) => {
        if (!confirm('Are you sure you want to delete this file?')) return
        try {
            setDeletingId(file.id)
            await deleteFile(file)
            onFileChange?.()
        } catch (error) {
            alert('Delete failed')
        } finally {
            setDeletingId(null)
        }
    }

    const handleDownload = async (path: string, fileName: string) => {
        try {
            const url = await getDownloadUrl(path)
            const a = document.createElement('a')
            a.href = url
            a.download = fileName
            a.target = '_blank'
            document.body.appendChild(a)
            a.click()
            document.body.removeChild(a)
        } catch (error) {
            alert('Download failed')
        }
    }

    const getFileIcon = (mimeType: string, fileName: string) => {
        if (mimeType.startsWith('image/')) return <ImageIcon className="w-5 h-5 text-purple-500" />
        if (mimeType.includes('pdf')) return <FileText className="w-5 h-5 text-red-500" />
        if (mimeType.includes('sheet') || fileName.endsWith('xls') || fileName.endsWith('xlsx')) return <FileSpreadsheet className="w-5 h-5 text-green-500" />
        if (mimeType.includes('word') || fileName.endsWith('doc') || fileName.endsWith('docx')) return <FileText className="w-5 h-5 text-blue-500" />
        return <FileIcon className="w-5 h-5 text-gray-500" />
    }

    const getUserName = (userId: string | null) => {
        if (!userId) return 'System'
        const user = users.find(u => u.id === userId)
        return user ? (user.name || user.email?.split('@')[0]) : 'Unknown'
    }

    const formatSize = (bytes: number) => {
        if (bytes === 0) return '0 B'
        const k = 1024
        const sizes = ['B', 'KB', 'MB', 'GB']
        const i = Math.floor(Math.log(bytes) / Math.log(k))
        return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i]
    }

    return (
        <div className="bg-card rounded-xl border border-border flex flex-col">
            <div className="p-4 border-b border-border flex items-center justify-between">
                <h3 className="font-semibold text-lg flex items-center gap-2">
                    <FileIcon className="w-5 h-5" />
                    Files
                </h3>
                <span className="text-xs text-muted-foreground">{files.length} files</span>
            </div>

            <div className="p-4 space-y-4">
                {/* Upload Area */}
                <div
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    onClick={() => fileInputRef.current?.click()}
                    className={clsx(
                        'border-2 border-dashed rounded-lg p-6 flex flex-col items-center justify-center cursor-pointer transition-colors',
                        isDragging ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50 hover:bg-muted/50',
                        uploading ? 'opacity-50 pointer-events-none' : ''
                    )}
                >
                    <input
                        type="file"
                        ref={fileInputRef}
                        onChange={(e) => e.target.files?.[0] && handleUpload(e.target.files[0])}
                        className="hidden"
                    />
                    {uploading ? (
                        <>
                            <Loader2 className="w-8 h-8 text-primary animate-spin mb-2" />
                            <p className="text-sm font-medium">Uploading...</p>
                        </>
                    ) : (
                        <>
                            <UploadCloud className="w-8 h-8 text-muted-foreground mb-2" />
                            <p className="text-sm font-medium">Click to upload or drag and drop</p>
                            <p className="text-xs text-muted-foreground mt-1">
                                PDF, DOCX, XLSX, Images (max 10MB)
                            </p>
                        </>
                    )}
                </div>

                {/* File List */}
                {files.length > 0 && (
                    <div className="space-y-2">
                        {files.map((file) => (
                            <div key={file.id} className="flex items-center justify-between p-3 rounded-lg border border-border bg-card hover:bg-muted/30 transition-colors group">
                                <div className="flex items-center gap-3 overflow-hidden">
                                    <div className="p-2 rounded-lg bg-muted flex-shrink-0">
                                        {getFileIcon(file.mime_type || '', file.file_name)}
                                    </div>
                                    <div className="min-w-0">
                                        <p className="text-sm font-medium truncate" title={file.file_name}>
                                            {file.file_name}
                                        </p>
                                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                            <span>{formatSize(file.file_size || 0)}</span>
                                            <span>•</span>
                                            <span>{new Date(file.created_at).toLocaleDateString()}</span>
                                            <span>•</span>
                                            <span>{getUserName(file.uploaded_by)}</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button
                                        onClick={() => handleDownload(file.file_url, file.file_name)}
                                        className="p-2 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                                        title="Download"
                                    >
                                        <Download className="w-4 h-4" />
                                    </button>
                                    <button
                                        onClick={() => handleDelete(file)}
                                        disabled={deletingId === file.id}
                                        className="p-2 rounded-md hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
                                        title="Delete"
                                    >
                                        {deletingId === file.id ? (
                                            <Loader2 className="w-4 h-4 animate-spin" />
                                        ) : (
                                            <Trash2 className="w-4 h-4" />
                                        )}
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    )
}
