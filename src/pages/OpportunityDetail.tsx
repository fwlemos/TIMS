import { useParams, Link, useNavigate } from 'react-router-dom'
import { Calendar, Check, ChevronsUpDown, Loader2, ArrowLeft, XCircle, User, UserCircle } from 'lucide-react'
import { useState, useRef, useEffect } from 'react'
import { useOpportunityDetail } from '@/hooks/useOpportunityDetail'
import { StageAccordion, TimelineSection, ActivitiesPanel } from '@/components/opportunity'
import type { StageAccordionHandle } from '@/components/opportunity'
import { OpportunitySummary } from '@/components/opportunity/OpportunitySummary'
import { LostReasonModal } from '@/components/crm/LostReasonModal'
import { MarkAsWonModal } from '@/components/crm/MarkAsWonModal'
import { OpportunityHeader } from '@/components/opportunity/detail/OpportunityHeader'
import { OpportunityRelated } from '@/components/opportunity/detail/OpportunityRelated'
import { useOpportunityActions } from '@/hooks/useOpportunityActions'

export default function OpportunityDetail() {
    const { opportunityId } = useParams<{ opportunityId: string }>()
    const navigate = useNavigate()
    const {
        opportunity,
        stages,
        loading,
        error,
        updateOpportunity,
        updateStage,
        updateContact,
        updateCompany,
        addProduct,
        removeProduct,
    } = useOpportunityDetail(opportunityId)

    const [timelineRefreshTrigger, setTimelineRefreshTrigger] = useState(0)

    // Use the custom hook for actions and complex logic
    const {
        savingField,
        savedField,
        showLostModal,
        setShowLostModal,
        showWonModal,
        setShowWonModal,
        handleFieldChange,
        validateStageAdvance,
        handleMarkAsLost,
        handleMarkAsWon,
        handleStageChange
    } = useOpportunityActions({
        opportunityId: opportunityId!,
        opportunity,
        stages,
        updateOpportunity,
        updateStage,
        onRefreshTimeline: () => setTimelineRefreshTrigger(prev => prev + 1)
    })

    // Ref for stage accordion expand/collapse control
    const stageAccordionRef = useRef<StageAccordionHandle>(null)
    const [allStagesExpanded, setAllStagesExpanded] = useState(false)

    // Layout State: Active Tab (Stages vs Summary) 
    const [activeTab, setActiveTab] = useState<'stages' | 'summary'>('stages')
    const [initialTabSet, setInitialTabSet] = useState(false)

    // Automatically set default tab on load when opportunity is ready
    useEffect(() => {
        if (opportunity && !initialTabSet) {
            const isTerminal = opportunity.stage?.name.toLowerCase().includes('lost') ||
                opportunity.stage?.name.toLowerCase().includes('won')
            setActiveTab(isTerminal ? 'summary' : 'stages')
            setInitialTabSet(true)
        }
    }, [opportunity, initialTabSet])

    // Loading state
    if (loading) {
        return (
            <div className="flex items-center justify-center h-full">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
        )
    }

    // Error state
    if (error || !opportunity) {
        return (
            <div className="flex flex-col items-center justify-center h-full gap-4">
                <p className="text-destructive">
                    {error || 'Opportunity not found'}
                </p>
                <Link to="/crm" className="btn-primary">
                    Back to CRM
                </Link>
            </div>
        )
    }

    // Check if opportunity is in a terminal state
    const isLost = opportunity.stage?.name.toLowerCase().includes('lost') || false
    const isWon = opportunity.stage?.name.toLowerCase().includes('won') || false
    const isTerminal = isLost || isWon

    return (
        <div className="h-full flex flex-col gap-6 overflow-hidden">
            <OpportunityHeader
                opportunity={opportunity}
                stages={stages}
                savingField={savingField}
                savedField={savedField}
                onFieldChange={handleFieldChange}
                onStageChange={handleStageChange}
                validateStageAdvance={validateStageAdvance}
                onMarkAsLost={() => setShowLostModal(true)}
                isTerminal={isTerminal}
                isLost={isLost}
                isWon={isWon}
            />

            {/* Main Content - 3 Column Layout */}
            <div className="flex-1 grid grid-cols-12 gap-6 min-h-0 overflow-hidden">

                {/* 1. LEFT COLUMN: History (Timeline) - Span 3 */}
                <div className="col-span-3 flex flex-col gap-6 overflow-y-auto min-h-0 pr-1">
                    <div className="space-y-6">
                        <TimelineSection
                            opportunityId={opportunity.id}
                            refreshTrigger={timelineRefreshTrigger}
                        />
                    </div>
                </div>

                {/* 2. CENTER COLUMN: Stage Fields & Summary - Span 6 */}
                <div className="col-span-6 flex flex-col gap-4 overflow-y-auto min-h-0 px-1">

                    {/* Tabs Switcher */}
                    <div className="flex p-1 bg-muted rounded-lg w-full">
                        <button
                            onClick={() => setActiveTab('stages')}
                            className={`flex-1 flex items-center justify-center gap-2 py-2 text-sm font-medium rounded-md transition-all ${activeTab === 'stages'
                                ? 'bg-background shadow text-foreground'
                                : 'text-muted-foreground hover:text-foreground'
                                }`}
                        >
                            <Calendar className="w-4 h-4" />
                            Stage Fields
                        </button>
                        <button
                            onClick={() => setActiveTab('summary')}
                            className={`flex-1 flex items-center justify-center gap-2 py-2 text-sm font-medium rounded-md transition-all ${activeTab === 'summary'
                                ? 'bg-background shadow text-foreground'
                                : 'text-muted-foreground hover:text-foreground'
                                }`}
                        >
                            <Check className="w-4 h-4" />
                            Summary
                        </button>
                    </div>

                    {/* Tab Content */}
                    <div className="flex-1 overflow-y-auto">
                        {activeTab === 'stages' ? (
                            <div className="space-y-6">
                                {/* Stage Accordion */}
                                <div className="bg-card rounded-xl border border-border p-6 shadow-sm">
                                    <div className="flex items-center justify-between mb-4">
                                        <h2 className="text-lg font-semibold">Stage Fields</h2>
                                        <button onClick={() => stageAccordionRef.current?.toggleAll()} className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors px-2 py-1 rounded hover:bg-muted">
                                            <ChevronsUpDown className="w-3.5 h-3.5" /> {allStagesExpanded ? 'Collapse All' : 'Expand All'}
                                        </button>
                                    </div>
                                    <StageAccordion
                                        ref={stageAccordionRef}
                                        opportunity={opportunity}
                                        stages={stages}
                                        currentStageId={opportunity.stage_id}
                                        onFieldChange={handleFieldChange}
                                        disabled={isTerminal}
                                        savingField={savingField}
                                        savedField={savedField}
                                        onExpandChange={(allExpanded) => setAllStagesExpanded(allExpanded)}
                                    />
                                </div>

                                <ActivitiesPanel
                                    opportunityId={opportunity.id}
                                    onActivityAdded={() => setTimelineRefreshTrigger(prev => prev + 1)}
                                />
                            </div>
                        ) : (
                            // Summary Tab
                            <div className="bg-card rounded-xl border border-border p-6 shadow-sm min-h-full">
                                <h2 className="text-lg font-semibold mb-6">Opportunity Summary</h2>
                                <OpportunitySummary opportunity={opportunity} />
                            </div>
                        )}
                    </div>
                </div>

                {/* 3. RIGHT COLUMN: Related Entities & Files - Span 3 */}
                <div className="col-span-3 flex flex-col gap-6 overflow-y-auto min-h-0 pl-1 pb-4">
                    <OpportunityRelated
                        opportunity={opportunity}
                        isTerminal={isTerminal}
                        updateContact={updateContact}
                        updateCompany={updateCompany}
                        addProduct={addProduct}
                        removeProduct={removeProduct}
                        updateOpportunity={updateOpportunity}
                    />
                </div>
            </div>

            {/* Modals */}
            <LostReasonModal
                isOpen={showLostModal}
                onClose={() => setShowLostModal(false)}
                onConfirm={handleMarkAsLost}
                opportunityTitle={opportunity.title}
            />
            <MarkAsWonModal
                isOpen={showWonModal}
                onClose={() => setShowWonModal(false)}
                onConfirm={handleMarkAsWon}
                opportunityTitle={opportunity.title}
            />
        </div>
    )
}
