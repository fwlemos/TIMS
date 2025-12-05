import { ReactNode, useEffect, useRef, useState, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { clsx } from 'clsx'
import { X } from 'lucide-react'

interface SlidePanelProps {
    isOpen: boolean
    onClose: () => void
    title?: string
    children: ReactNode
    minWidth?: number
    maxWidth?: number
    defaultWidth?: number
}

export function SlidePanel({
    isOpen,
    onClose,
    title,
    children,
    minWidth = 380,
    maxWidth = 800,
    defaultWidth = 420,
}: SlidePanelProps) {
    const [width, setWidth] = useState(defaultWidth)
    const [isResizing, setIsResizing] = useState(false)
    const panelRef = useRef<HTMLDivElement>(null)

    // Close on Escape key
    useEffect(() => {
        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose()
        }
        if (isOpen) {
            document.addEventListener('keydown', handleEscape)
            document.body.style.overflow = 'hidden'
        }
        return () => {
            document.removeEventListener('keydown', handleEscape)
            document.body.style.overflow = ''
        }
    }, [isOpen, onClose])

    // Handle resize drag
    const handleMouseDown = useCallback((e: React.MouseEvent) => {
        e.preventDefault()
        setIsResizing(true)
    }, [])

    useEffect(() => {
        if (!isResizing) return

        const handleMouseMove = (e: MouseEvent) => {
            const newWidth = window.innerWidth - e.clientX
            setWidth(Math.min(maxWidth, Math.max(minWidth, newWidth)))
        }

        const handleMouseUp = () => {
            setIsResizing(false)
        }

        document.addEventListener('mousemove', handleMouseMove)
        document.addEventListener('mouseup', handleMouseUp)
        document.body.style.cursor = 'ew-resize'
        document.body.style.userSelect = 'none'

        return () => {
            document.removeEventListener('mousemove', handleMouseMove)
            document.removeEventListener('mouseup', handleMouseUp)
            document.body.style.cursor = ''
            document.body.style.userSelect = ''
        }
    }, [isResizing, minWidth, maxWidth])

    if (!isOpen) return null

    const panel = (
        <div className="fixed inset-0 z-50">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/30 animate-fade-in"
                onClick={onClose}
            />

            {/* Panel */}
            <div
                ref={panelRef}
                style={{ width }}
                className={clsx(
                    'absolute top-0 right-0 h-full bg-card shadow-2xl',
                    'flex flex-col transform transition-transform duration-300 ease-out',
                    'animate-slide-in-right'
                )}
            >
                {/* Resize Handle */}
                <div
                    onMouseDown={handleMouseDown}
                    className={clsx(
                        'absolute left-0 top-0 bottom-0 w-1 cursor-ew-resize',
                        'hover:bg-primary/30 transition-colors',
                        isResizing && 'bg-primary/50'
                    )}
                />

                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-border">
                    <h2 className="text-lg font-semibold">{title}</h2>
                    <button
                        onClick={onClose}
                        className="p-2 rounded-lg hover:bg-accent transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6">
                    {children}
                </div>
            </div>
        </div>
    )

    return createPortal(panel, document.body)
}
