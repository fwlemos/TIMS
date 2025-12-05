import { useRef, useState } from 'react'
import { Upload, Loader2 } from 'lucide-react'
import { clsx } from 'clsx'

const ALLOWED_TYPES = {
    pdf: ['application/pdf'],
    doc: ['application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
    image: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
    all: [
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'image/jpeg', 'image/png', 'image/gif', 'image/webp'
    ]
}

type AcceptType = keyof typeof ALLOWED_TYPES

interface DocumentUploadProps {
    onUpload: (file: File) => Promise<void>
    disabled?: boolean
    accept?: AcceptType
    maxSizeMB?: number
}

export function DocumentUpload({
    onUpload,
    disabled,
    accept = 'all',
    maxSizeMB = 10
}: DocumentUploadProps) {
    const fileInputRef = useRef<HTMLInputElement>(null)
    const [dragActive, setDragActive] = useState(false)
    const [isUploading, setIsUploading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const maxSize = maxSizeMB * 1024 * 1024
    const allowedTypes = ALLOWED_TYPES[accept]

    const getAcceptString = () => {
        switch (accept) {
            case 'pdf': return '.pdf'
            case 'doc': return '.doc,.docx'
            case 'image': return '.jpg,.jpeg,.png,.gif,.webp'
            default: return '.pdf,.doc,.docx,.jpg,.jpeg,.png,.gif,.webp'
        }
    }

    const getAcceptLabel = () => {
        switch (accept) {
            case 'pdf': return 'PDF only'
            case 'doc': return 'DOC/DOCX only'
            case 'image': return 'Images only (JPG, PNG, GIF, WebP)'
            default: return 'PDF, DOC, Images'
        }
    }

    const validateFile = (file: File): string | null => {
        // Check file size
        if (file.size > maxSize) {
            return `File too large. Maximum size is ${maxSizeMB}MB.`
        }

        // Check file type
        if (!allowedTypes.includes(file.type)) {
            return `Invalid file type. ${getAcceptLabel()} allowed.`
        }

        return null
    }

    const handleDrag = (e: React.DragEvent) => {
        e.preventDefault()
        e.stopPropagation()
        if (e.type === 'dragenter' || e.type === 'dragover') {
            setDragActive(true)
        } else if (e.type === 'dragleave') {
            setDragActive(false)
        }
    }

    const handleDrop = async (e: React.DragEvent) => {
        e.preventDefault()
        e.stopPropagation()
        setDragActive(false)
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            handleFile(e.dataTransfer.files[0])
        }
    }

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        e.preventDefault()
        if (e.target.files && e.target.files[0]) {
            handleFile(e.target.files[0])
        }
    }

    const handleFile = async (file: File) => {
        if (disabled || isUploading) return

        setError(null)

        // Validate file before upload
        const validationError = validateFile(file)
        if (validationError) {
            setError(validationError)
            return
        }

        setIsUploading(true)
        try {
            await onUpload(file)
            if (fileInputRef.current) {
                fileInputRef.current.value = ''
            }
        } catch (err: unknown) {
            console.error(err)
            const error = err as { message?: string }
            setError('Upload failed: ' + (error.message || 'Unknown error'))
        } finally {
            setIsUploading(false)
        }
    }

    const onButtonClick = () => {
        setError(null)
        fileInputRef.current?.click()
    }

    return (
        <div className="space-y-2">
            <div
                className={clsx(
                    'relative border-2 border-dashed rounded-lg p-4 text-center transition-colors',
                    dragActive ? 'border-primary bg-primary/5' : 'border-border',
                    error && 'border-destructive',
                    (disabled || isUploading) && 'opacity-50 cursor-not-allowed',
                    !disabled && !isUploading && 'cursor-pointer hover:bg-muted/50'
                )}
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
                onClick={!disabled && !isUploading ? onButtonClick : undefined}
            >
                <input
                    ref={fileInputRef}
                    type="file"
                    className="hidden"
                    accept={getAcceptString()}
                    onChange={handleChange}
                    disabled={disabled || isUploading}
                />

                <div className="flex flex-col items-center justify-center gap-2 text-sm text-muted-foreground">
                    {isUploading ? (
                        <>
                            <Loader2 className="h-8 w-8 animate-spin text-primary" />
                            <p>Uploading...</p>
                        </>
                    ) : (
                        <>
                            <Upload className="h-8 w-8 mb-2" />
                            <p className="font-medium text-foreground">
                                Click to upload or drag and drop
                            </p>
                            <p className="text-xs">
                                {getAcceptLabel()} up to {maxSizeMB}MB
                            </p>
                        </>
                    )}
                </div>
            </div>

            {error && (
                <p className="text-sm text-destructive">{error}</p>
            )}
        </div>
    )
}
