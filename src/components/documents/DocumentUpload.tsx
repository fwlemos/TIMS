import { useRef, useState } from 'react'
import { Upload, Loader2, X } from 'lucide-react'
import { clsx } from 'clsx'

interface DocumentUploadProps {
    onUpload: (file: File) => Promise<void>
    disabled?: boolean
}

export function DocumentUpload({ onUpload, disabled }: DocumentUploadProps) {
    const fileInputRef = useRef<HTMLInputElement>(null)
    const [dragActive, setDragActive] = useState(false)
    const [isUploading, setIsUploading] = useState(false)

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

        setIsUploading(true)
        try {
            await onUpload(file)
            if (fileInputRef.current) {
                fileInputRef.current.value = ''
            }
        } catch (error: any) {
            console.error(error)
            alert('Upload failed: ' + (error.message || 'Unknown error'))
        } finally {
            setIsUploading(false)
        }
    }

    const onButtonClick = () => {
        fileInputRef.current?.click()
    }

    return (
        <div
            className={clsx(
                'relative border-2 border-dashed rounded-lg p-4 text-center transition-colors',
                dragActive ? 'border-primary bg-primary/5' : 'border-border',
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
                            PDF, DOC, Images up to 10MB
                        </p>
                    </>
                )}
            </div>
        </div>
    )
}
