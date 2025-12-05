import { useState } from 'react'
import { Plus, LayoutGrid, List } from 'lucide-react'
import { clsx } from 'clsx'
import { KanbanBoard } from '@/components/crm/KanbanBoard'
import { ListView } from '@/components/crm/ListView'
import { OpportunityForm } from '@/components/crm/OpportunityForm'
import { LostReasonModal } from '@/components/crm/LostReasonModal'
import { OpportunityDrawer } from '@/components/opportunity'
import { SlidePanel } from '@/components/shared/SlidePanel'
import { FAB } from '@/components/shared/FAB'
import { useOpportunities, OpportunityWithRelations } from '@/hooks/useOpportunities'

type ViewMode = 'kanban' | 'list'

export default function CRM() {
    const [viewMode, setViewMode] = useState<ViewMode>('kanban')
    const [selectedOpportunity, setSelectedOpportunity] = useState<OpportunityWithRelations | null>(null)
    const [showCreatePanel, setShowCreatePanel] = useState(false)
    const [showEditPanel, setShowEditPanel] = useState(false)
    const [showDrawer, setShowDrawer] = useState(false)
    const [showLostReasonModal, setShowLostReasonModal] = useState(false)

    const {
        opportunities,
        stages,
        opportunitiesByStage,
        loading,
        createOpportunity,
        updateOpportunity,
        moveOpportunity,
        setOpportunities,
    } = useOpportunities()

    // When clicking a card, show the quick preview drawer
    const handleCardClick = (opportunity: OpportunityWithRelations) => {
        setSelectedOpportunity(opportunity)
        setShowDrawer(true)
    }

    const handleDrawerClose = () => {
        setShowDrawer(false)
        setSelectedOpportunity(null)
    }

    const handleCreate = async (data: Parameters<typeof createOpportunity>[0]) => {
        try {
            await createOpportunity(data)
            setShowCreatePanel(false)
        } catch (error) {
            console.error('Error creating opportunity:', error)
            const err = error as { message?: string }
            alert(`Failed to create opportunity: ${err.message || 'Unknown error'}`)
        }
    }

    const handleUpdate = async (data: Parameters<typeof updateOpportunity>[1]) => {
        if (selectedOpportunity) {
            await updateOpportunity(selectedOpportunity.id, data)
            setShowEditPanel(false)
            setSelectedOpportunity(null)
        }
    }

    const handleMarkAsLost = () => {
        // Close drawer and open lost reason modal
        setShowDrawer(false)
        setShowLostReasonModal(true)
    }

    const handleConfirmLost = async (reason: string) => {
        if (selectedOpportunity) {
            const lostStage = stages.find(s => s.name.toLowerCase().includes('lost'))
            if (lostStage) {
                await updateOpportunity(selectedOpportunity.id, {
                    stage_id: lostStage.id,
                    lost_reason: reason,
                })
            }
            setSelectedOpportunity(null)
        }
        setShowLostReasonModal(false)
    }

    return (
        <div className="h-full flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between flex-wrap gap-4 mb-6">
                <div>
                    <h1 className="text-2xl font-semibold">CRM Pipeline</h1>
                    <p className="text-muted-foreground mt-1">
                        Manage your sales opportunities
                    </p>
                </div>

                <div className="flex items-center gap-3">
                    {/* View Toggle */}
                    <div className="flex p-1 bg-muted/50 rounded-lg">
                        <button
                            onClick={() => setViewMode('kanban')}
                            className={clsx(
                                'flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-all',
                                viewMode === 'kanban'
                                    ? 'bg-background text-foreground shadow-soft'
                                    : 'text-muted-foreground hover:text-foreground'
                            )}
                        >
                            <LayoutGrid className="w-4 h-4" />
                            Kanban
                        </button>
                        <button
                            onClick={() => setViewMode('list')}
                            className={clsx(
                                'flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-all',
                                viewMode === 'list'
                                    ? 'bg-background text-foreground shadow-soft'
                                    : 'text-muted-foreground hover:text-foreground'
                            )}
                        >
                            <List className="w-4 h-4" />
                            List
                        </button>
                    </div>

                    <button
                        onClick={() => setShowCreatePanel(true)}
                        className="btn-primary hidden sm:flex"
                    >
                        <Plus className="w-4 h-4" />
                        New Opportunity
                    </button>
                </div>
            </div>

            {/* Content */}
            <div className="flex-1 min-h-0">
                {viewMode === 'kanban' ? (
                    <KanbanBoard
                        stages={stages}
                        opportunitiesByStage={opportunitiesByStage}
                        opportunities={opportunities}
                        loading={loading}
                        onCardClick={handleCardClick}
                        onMoveOpportunity={moveOpportunity}
                        setOpportunities={setOpportunities}
                    />
                ) : (
                    <ListView
                        opportunities={opportunities}
                        loading={loading}
                        onRowClick={handleCardClick}
                    />
                )}
            </div>

            {/* Mobile FAB */}
            <div className="sm:hidden">
                <FAB onClick={() => setShowCreatePanel(true)} label="New Opportunity" />
            </div>


            {/* Create Opportunity SlidePanel */}
            <SlidePanel
                isOpen={showCreatePanel}
                onClose={() => setShowCreatePanel(false)}
                title="New Opportunity"
            >
                <OpportunityForm
                    onSubmit={handleCreate}
                    onCancel={() => setShowCreatePanel(false)}
                />
            </SlidePanel>

            {/* Edit Opportunity SlidePanel */}
            <SlidePanel
                isOpen={showEditPanel}
                onClose={() => {
                    setShowEditPanel(false)
                    setSelectedOpportunity(null)
                }}
                title="Edit Opportunity"
            >
                <OpportunityForm
                    opportunity={selectedOpportunity}
                    onSubmit={handleUpdate}
                    onCancel={() => {
                        setShowEditPanel(false)
                        setSelectedOpportunity(null)
                    }}
                />
            </SlidePanel>

            {/* Lost Reason Modal */}
            <LostReasonModal
                isOpen={showLostReasonModal}
                onClose={() => {
                    setShowLostReasonModal(false)
                    setSelectedOpportunity(null)
                }}
                onConfirm={handleConfirmLost}
                opportunityTitle={selectedOpportunity?.title || ''}
            />

            {/* Quick Preview Drawer */}
            <OpportunityDrawer
                opportunity={selectedOpportunity}
                isOpen={showDrawer}
                onClose={handleDrawerClose}
                onMarkAsLost={handleMarkAsLost}
            />
        </div>
    )
}
