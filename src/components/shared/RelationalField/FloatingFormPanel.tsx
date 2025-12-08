import { ReactNode, useRef, useEffect, useState, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { X, ChevronLeft } from 'lucide-react'
import { clsx } from 'clsx'

interface FloatingFormPanelProps {
    isOpen: boolean
    onClose: () => void
    triggerRef: React.RefObject<HTMLElement>
    title: string
    children: ReactNode
    width?: number
}

interface Position {
    top: number
    left: number
    placement: 'above' | 'below'
}

export function FloatingFormPanel({
    isOpen,
    onClose,
    triggerRef,
    title,
    children,
    width = 384,
}: FloatingFormPanelProps) {
    const panelRef = useRef<HTMLDivElement>(null)
    const contentRef = useRef<HTMLDivElement>(null)
    const [position, setPosition] = useState<Position | null>(null)
    const [isVisible, setIsVisible] = useState(false)

    // Calculate position based on trigger element and available viewport space
    const calculatePosition = useCallback(() => {
        if (!triggerRef.current || !panelRef.current) return null

        const triggerRect = triggerRef.current.getBoundingClientRect()
        const panelRect = panelRef.current.getBoundingClientRect()
        const viewportHeight = window.innerHeight
        const viewportWidth = window.innerWidth
        const padding = 8 // Padding from viewport edges
        const gap = 8 // Gap between trigger and panel

        // Calculate available space above and below
        const spaceAbove = triggerRect.top
        const spaceBelow = viewportHeight - triggerRect.bottom

        // Determine placement (prefer below, flip to above if not enough space)
        const panelHeight = panelRect.height || 300 // Estimate if not yet measured
        const placement: 'above' | 'below' =
            spaceBelow >= panelHeight + gap || spaceBelow >= spaceAbove
                ? 'below'
                : 'above'

        // Calculate top position (viewport-relative for fixed positioning)
        let top: number
        if (placement === 'below') {
            top = triggerRect.bottom + gap
        } else {
            top = triggerRect.top - panelHeight - gap
        }

        // Ensure panel stays within viewport vertically
        top = Math.max(padding, Math.min(viewportHeight - panelHeight - padding, top))

        // Calculate left position - position one panel width to the left of trigger
        // So the panel's right edge aligns near the trigger's left edge
        let left = triggerRect.left - width - gap

        // If that would push it off-screen left, flip to the right of the trigger
        if (left < padding) {
            left = triggerRect.right + gap
        }

        // Ensure panel stays within viewport horizontally
        const maxLeft = viewportWidth - width - padding
        left = Math.max(padding, Math.min(maxLeft, left))

        return { top, left, placement }
    }, [triggerRef, width])

    // Update position when open or on resize
    useEffect(() => {
        if (!isOpen) {
            setIsVisible(false)
            setPosition(null)
            return
        }

        // Small delay to allow panel to render before measuring
        const timer = setTimeout(() => {
            const pos = calculatePosition()
            if (pos) {
                setPosition(pos)
                setIsVisible(true)
            }
        }, 10)

        const handleResize = () => {
            const pos = calculatePosition()
            if (pos) setPosition(pos)
        }

        window.addEventListener('resize', handleResize)

        return () => {
            clearTimeout(timer)
            window.removeEventListener('resize', handleResize)
        }
    }, [isOpen, calculatePosition])

    // Reposition when content size changes (e.g., nested form expands)
    useEffect(() => {
        if (!isOpen || !contentRef.current) return

        const resizeObserver = new ResizeObserver(() => {
            // Recalculate position when content size changes
            const pos = calculatePosition()
            if (pos) setPosition(pos)
        })

        resizeObserver.observe(contentRef.current)

        return () => resizeObserver.disconnect()
    }, [isOpen, calculatePosition])

    // Handle click outside
    useEffect(() => {
        if (!isOpen) return

        const handleClickOutside = (e: MouseEvent) => {
            if (
                panelRef.current &&
                !panelRef.current.contains(e.target as Node) &&
                triggerRef.current &&
                !triggerRef.current.contains(e.target as Node)
            ) {
                onClose()
            }
        }

        // Delay to prevent immediate close on the click that opened it
        const timer = setTimeout(() => {
            document.addEventListener('mousedown', handleClickOutside)
        }, 100)

        return () => {
            clearTimeout(timer)
            document.removeEventListener('mousedown', handleClickOutside)
        }
    }, [isOpen, onClose, triggerRef])

    // Handle escape key
    useEffect(() => {
        if (!isOpen) return

        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                onClose()
            }
        }

        document.addEventListener('keydown', handleEscape)
        return () => document.removeEventListener('keydown', handleEscape)
    }, [isOpen, onClose])

    if (!isOpen) return null

    const panel = (
        <div
            ref={panelRef}
            className={clsx(
                'fixed z-50 bg-card border-2 border-primary/60 rounded-xl shadow-xl',
                'transition-opacity duration-200',
                isVisible && position ? 'opacity-100' : 'opacity-0 pointer-events-none'
            )}
            style={{
                top: position?.top ?? 0,
                left: position?.left ?? 0,
                width,
            }}
        >
            {/* Header */}
            <div className="flex items-center justify-between p-3 border-b border-border">
                <div className="flex items-center gap-2">
                    <button
                        type="button"
                        onClick={onClose}
                        className="p-1 hover:bg-accent rounded transition-colors"
                        title="Close"
                    >
                        <ChevronLeft className="w-4 h-4" />
                    </button>
                    <h4 className="font-medium text-sm">{title}</h4>
                </div>
                <button
                    type="button"
                    onClick={onClose}
                    className="p-1 hover:bg-accent rounded transition-colors"
                    title="Close"
                >
                    <X className="w-4 h-4" />
                </button>
            </div>

            {/* Content - with ref for resize observation */}
            <div ref={contentRef} className="p-4 max-h-[80vh] overflow-y-auto">
                {children}
            </div>
        </div>
    )

    return createPortal(panel, document.body)
}
