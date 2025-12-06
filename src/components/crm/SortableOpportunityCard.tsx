import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { useRef } from 'react'
import { OpportunityCard } from './OpportunityCard'
import type { OpportunityWithRelations } from '@/hooks/useOpportunities'

interface SortableOpportunityCardProps {
    opportunity: OpportunityWithRelations
    onClick: () => void
}

export function SortableOpportunityCard({ opportunity, onClick }: SortableOpportunityCardProps) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ id: opportunity.id })

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
    }

    // Track if a drag actually started
    const isDraggingRef = useRef(false)
    const mouseDownPosRef = useRef<{ x: number; y: number } | null>(null)

    const handlePointerDown = (e: React.PointerEvent) => {
        mouseDownPosRef.current = { x: e.clientX, y: e.clientY }
        isDraggingRef.current = false
        // Call the original listener
        listeners?.onPointerDown?.(e as unknown as PointerEvent)
    }

    const handlePointerMove = (e: React.PointerEvent) => {
        if (mouseDownPosRef.current) {
            const deltaX = Math.abs(e.clientX - mouseDownPosRef.current.x)
            const deltaY = Math.abs(e.clientY - mouseDownPosRef.current.y)
            if (deltaX > 5 || deltaY > 5) {
                isDraggingRef.current = true
            }
        }
    }

    const handlePointerUp = () => {
        // If pointer didn't move much, it's a click
        if (!isDraggingRef.current && mouseDownPosRef.current) {
            onClick()
        }
        mouseDownPosRef.current = null
        isDraggingRef.current = false
    }

    return (
        <div
            ref={setNodeRef}
            style={style}
            {...attributes}
            {...listeners}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
        >
            <OpportunityCard
                opportunity={opportunity}
                onClick={() => { }} // Handled by parent
                isDragging={isDragging}
            />
        </div>
    )
}
