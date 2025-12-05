import { useState } from 'react'
import { Plus, LayoutGrid, List } from 'lucide-react'
import { clsx } from 'clsx'
import { KanbanBoard } from '@/components/crm/KanbanBoard'
import { ListView } from '@/components/crm/ListView'
import { OpportunityForm } from '@/components/crm/OpportunityForm'
import { LostReasonModal } from '@/components/crm/LostReasonModal'
import { SlidePanel } from '@/components/shared/SlidePanel'
import { Modal } from '@/components/shared/Modal'
import { FAB } from '@/components/shared/FAB'
import { useOpportunities, OpportunityWithRelations } from '@/hooks/useOpportunities'

type ViewMode = 'kanban' | 'list'

export default function CRM() {
    const [viewMode, setViewMode] = useState<ViewMode>('kanban')
    const [selectedOpportunity, setSelectedOpportunity] = useState<OpportunityWithRelations | null>(null)
    const [showCreatePanel, setShowCreatePanel] = useState(false)
    const [showEditPanel, setShowEditPanel] = useState(false)
    const [lostOpportunity, setLostOpportunity] = useState<OpportunityWithRelations | null>(null)

    const {
        opportunities,
        stages,
        loading,
        createOpportunity,
        updateOpportunity,
    } = useOpportunities()

    const handleCardClick = (opportunity: OpportunityWithRelations) => {
        setSelectedOpportunity(opportunity)
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

    const handleMarkAsLost = async (reason: string) => {
        if (lostOpportunity) {
            const lostStage = stages.find(s => s.name.toLowerCase().includes('lost'))
            if (lostStage) {
                await updateOpportunity(lostOpportunity.id, {
                    stage_id: lostStage.id,
                    lost_reason: reason,
                })
            }
        }
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
                    <KanbanBoard onCardClick={handleCardClick} />
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

            {/* View Opportunity Modal */}
            <Modal
                isOpen={!!selectedOpportunity && !showEditPanel}
                onClose={() => setSelectedOpportunity(null)}
                title={selectedOpportunity?.title || 'Opportunity'}
                size="lg"
            >
                {selectedOpportunity && (
                    <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="text-sm text-muted-foreground">Contact</label>
                                <p className="font-medium">{selectedOpportunity.contact?.name || '-'}</p>
                            </div>
                            <div>
                                <label className="text-sm text-muted-foreground">Company</label>
                                <p className="font-medium">{selectedOpportunity.company?.name || '-'}</p>
                            </div>
                            <div>
                                <label className="text-sm text-muted-foreground">Product</label>
                                <p className="font-medium">{selectedOpportunity.product?.name || '-'}</p>
                            </div>
                            <div>
                                <label className="text-sm text-muted-foreground">Stage</label>
                                <p className="font-medium">{selectedOpportunity.stage?.name || '-'}</p>
                            </div>
                            <div>
                                <label className="text-sm text-muted-foreground">Lead Origin</label>
                                <p className="font-medium capitalize">{selectedOpportunity.lead_origin?.replace('_', ' ') || '-'}</p>
                            </div>
                            <div>
                                <label className="text-sm text-muted-foreground">Office</label>
                                <p className="font-medium">{selectedOpportunity.office || '-'}</p>
                            </div>
                            {selectedOpportunity.quote_number && (
                                <div>
                                    <label className="text-sm text-muted-foreground">Quote Number</label>
                                    <p className="font-medium">{selectedOpportunity.quote_number}</p>
                                </div>
                            )}
                            {selectedOpportunity.sales_price && (
                                <div>
                                    <label className="text-sm text-muted-foreground">Sales Price</label>
                                    <p className="font-medium text-green-600">
                                        {new Intl.NumberFormat('pt-BR', {
                                            style: 'currency',
                                            currency: selectedOpportunity.currency || 'BRL'
                                        }).format(selectedOpportunity.sales_price)}
                                    </p>
                                </div>
                            )}
                            {selectedOpportunity.lost_reason && (
                                <div className="col-span-2">
                                    <label className="text-sm text-muted-foreground">Lost Reason</label>
                                    <p className="font-medium text-destructive">{selectedOpportunity.lost_reason}</p>
                                </div>
                            )}
                        </div>

                        <div className="flex gap-3 justify-between pt-4 border-t border-border">
                            <button
                                onClick={() => {
                                    setLostOpportunity(selectedOpportunity)
                                    setSelectedOpportunity(null)
                                }}
                                className="btn-outline text-destructive border-destructive/30 hover:bg-destructive/10"
                            >
                                Mark as Lost
                            </button>
                            <div className="flex gap-3">
                                <button
                                    onClick={() => setSelectedOpportunity(null)}
                                    className="btn-outline"
                                >
                                    Close
                                </button>
                                <button
                                    onClick={() => setShowEditPanel(true)}
                                    className="btn-primary"
                                >
                                    Edit
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </Modal>

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
                isOpen={!!lostOpportunity}
                onClose={() => setLostOpportunity(null)}
                onConfirm={handleMarkAsLost}
                opportunityTitle={lostOpportunity?.title || ''}
            />
        </div>
    )
}
