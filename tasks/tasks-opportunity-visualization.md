# Opportunity Visualization Feature - Task List

## Relevant Files

### Database/Backend
- `supabase/migrations/` - New migration for `opportunity_activities` and `lost_reasons` tables
- `src/lib/database.types.ts` - TypeScript types for new tables

### Components - Quick Preview
- `src/components/crm/OpportunityDrawer.tsx` - Quick preview drawer component (NEW)

### Components - Detail Page
- `src/pages/OpportunityDetail.tsx` - Full opportunity detail page (NEW)
- `src/components/opportunity/StageBreadcrumb.tsx` - Stage navigation breadcrumb (NEW)
- `src/components/opportunity/StageColumns.tsx` - Stage-specific field columns (NEW)
- `src/components/opportunity/RelatedEntitiesPanel.tsx` - Sidebar with Contact/Company/Product info (NEW)
- `src/components/opportunity/TimelineSection.tsx` - Timeline/history display (NEW)
- `src/components/opportunity/ActivitiesPanel.tsx` - Activity logging panel (NEW)
- `src/components/opportunity/FilesSection.tsx` - File attachments section (NEW)
- `src/components/opportunity/MarkAsLostModal.tsx` - Lost reason selection modal (NEW)
- `src/components/opportunity/MarkAsWonModal.tsx` - Won confirmation modal (NEW)

### Hooks
- `src/hooks/useOpportunityDetail.ts` - Hook for fetching single opportunity with all relations (NEW)
- `src/hooks/useOpportunityTimeline.ts` - Hook for timeline/history data (NEW)
- `src/hooks/useOpportunityActivities.ts` - Hook for activities CRUD (NEW)
- `src/hooks/useLostReasons.ts` - Hook for lost reasons management (NEW)

### Routing
- `src/App.tsx` - Add new route for `/crm/opportunities/:opportunityId`

### Notes

- Existing `useDocuments.ts` hook can be reused for file attachments
- Timeline may leverage existing `opportunity_history` table with extensions
- Stage field requirements already exist in `stage_field_requirements` table

## Instructions for Completing Tasks

**IMPORTANT:** As you complete each task, you must check it off in this markdown file by changing `- [ ]` to `- [x]`. This helps track progress and ensures you don't skip any steps.

## Tasks

- [x] 0.0 Create feature branch
  - [x] 0.1 Create and checkout branch `feature/opportunity-visualization`

---

- [x] 1.0 Database Schema Setup
  - [x] 1.1 Create migration for `opportunity_activities` table (id, opportunity_id, activity_type, description, activity_date, created_by, created_at)
  - [x] 1.2 Create migration for `lost_reasons` table (id, reason, is_predefined, is_active, created_at)
  - [x] 1.3 Seed predefined lost reasons: Price, Competitor, No Budget, No Response, Project Cancelled, Timeline Mismatch, Technical Requirements Not Met
  - [x] 1.4 Add `won_order_description` and `won_purchase_order_url` columns to `opportunities` table
  - [x] 1.5 Apply RLS policies for new tables (authenticated users access)
  - [x] 1.6 Generate updated TypeScript types with `mcp_generate_typescript_types`

---

- [x] 2.0 Quick Preview Drawer (Replaces Modal)
  - [x] 2.1 Create `OpportunityDrawer.tsx` component with slide-in animation from right
  - [x] 2.2 Display: Opportunity name, Current stage (with color badge), Days since creation
  - [x] 2.3 Display: Contact name, Company name, Product name, Lead Origin, Office
  - [x] 2.4 Add "View Full Details" button that navigates to `/crm/opportunities/:id`
  - [x] 2.5 Add close button (X) and click-outside-to-close behavior
  - [x] 2.6 Make drawer read-only (no editing from drawer)
  - [x] 2.7 Update `CRM.tsx` to use drawer instead of opening edit panel on card click
  - [x] 2.8 Set drawer width to ~400px with dimmed background overlay

---

- [x] 3.0 Opportunity Detail Page - Layout & Navigation
  - [x] 3.1 Create route `/crm/opportunities/:opportunityId` in `App.tsx`
  - [x] 3.2 Create `OpportunityDetail.tsx` page component with responsive layout
  - [x] 3.3 Add page header with opportunity name and "Mark as Lost" button
  - [x] 3.4 Add back button/link to return to CRM Kanban/List view
  - [x] 3.5 Create `StageBreadcrumb.tsx` component showing: Lead Backlog → Qualification → Quotation → Closing → Won
  - [x] 3.6 Highlight current stage in breadcrumb (different background, bold)
  - [x] 3.7 Show completed stages with checkmark indicator
  - [x] 3.8 Show "Days Open" badge in header (days since created_at)
  - [x] 3.9 Create `useOpportunityDetail.ts` hook to fetch opportunity with all relations

---

- [x] 4.0 Stage Fields Column Layout
  - [x] 4.1 Create `StageColumns.tsx` component with horizontal column layout
  - [x] 4.2 Each column labeled with stage name and color indicator
  - [x] 4.3 Current stage column visually highlighted (border/elevation/background)
  - [x] 4.4 Implement Lead Backlog column with: Contact, Product, Lead Origin fields
  - [x] 4.5 Implement Qualification column with placeholder "Fields to be defined"
  - [x] 4.6 Implement Quotation column with placeholder "Fields to be defined"
  - [x] 4.7 Implement Closing column with placeholder "Fields to be defined"
  - [x] 4.8 Implement Won column with: Purchase Order upload OR Order Agreement Description
  - [x] 4.9 Enable editing for current and completed stage fields
  - [x] 4.10 Disable/grey out future stage fields
  - [x] 4.11 Mark required fields with asterisk
  - [x] 4.12 Implement stage advancement via breadcrumb click
  - [x] 4.13 Validate required fields before stage advancement
  - [x] 4.14 Show error message listing missing required fields if validation fails
  - [x] 4.15 Prevent skipping stages (can only advance one at a time)
  - [x] 4.16 Allow moving backward to previous stages

---

- [ ] 5.0 Related Entities Panel (User preferred original implementation - reverted)
  - [ ] 5.1 Create `RelatedEntitiesPanel.tsx` as right sidebar component
  - [ ] 5.2 Display Contact section: name, email, phone + Edit/Remove buttons
  - [ ] 5.3 Display Company section: name, address, phone + Edit/Remove buttons
  - [ ] 5.4 Display Product section: name, NCM, manufacturer + Edit/Remove buttons
  - [ ] 5.5 Display Manufacturer section: name, contract validity + Edit/Remove buttons
  - [ ] 5.6 Implement Edit button to open inline edit form or modal
  - [ ] 5.7 Implement Remove button with confirmation dialog
  - [ ] 5.8 Warn user if removing required entity affects stage requirements
  - [ ] 5.9 Add "Change" option to associate different entity
  - [ ] 5.10 Allow Company and Manufacturer to be optional (null)

---

- [ ] 6.0 Timeline Section
  - [ ] 6.1 Create `TimelineSection.tsx` component
  - [ ] 6.2 Create `useOpportunityTimeline.ts` hook to fetch from `opportunity_history`
  - [ ] 6.3 Display stage changes with from/to stages, timestamp, user
  - [ ] 6.4 Display field edits with field name, old value, new value
  - [ ] 6.5 Display activities (type, description, timestamp)
  - [ ] 6.6 Display file uploads and deletions
  - [ ] 6.7 Display related entity changes (added, removed, edited)
  - [ ] 6.8 Order entries reverse chronologically (newest first)
  - [ ] 6.9 Add filter buttons: All, Stage Changes, Field Edits, Activities, Files
  - [ ] 6.10 Display user avatar/name who performed each action

---

- [ ] 7.0 Activities Panel
  - [ ] 7.1 Create `ActivitiesPanel.tsx` component
  - [ ] 7.2 Create `useOpportunityActivities.ts` hook for CRUD operations
  - [ ] 7.3 Implement activity creation form: type dropdown (Follow Up, Call, Email, Meeting), description, date/time picker
  - [ ] 7.4 Save activities to `opportunity_activities` table
  - [ ] 7.5 Display activities in timeline after creation
  - [ ] 7.6 Allow users to edit their own activities
  - [ ] 7.7 Allow users to delete their own activities (with confirmation)

---

- [ ] 8.0 Files Section
  - [ ] 8.1 Create `FilesSection.tsx` component (reuse `DocumentsList` patterns)
  - [ ] 8.2 Add "Add File" button with drag-and-drop support
  - [ ] 8.3 Display uploaded files: name, type icon, upload date, uploaded by
  - [ ] 8.4 Implement download functionality with signed URLs
  - [ ] 8.5 Implement delete with confirmation dialog
  - [ ] 8.6 Log file uploads/deletions to opportunity_history
  - [ ] 8.7 Validate file types: PDF, DOC, DOCX, XLS, XLSX, PNG, JPG, JPEG
  - [ ] 8.8 Enforce 10MB max file size

---

- [ ] 9.0 Mark as Won/Lost Functionality
  - [ ] 9.1 Create `MarkAsLostModal.tsx` component
  - [ ] 9.2 Implement lost reason dropdown with predefined + custom reasons
  - [ ] 9.3 Show "Other" option with text field for custom description
  - [ ] 9.4 Update opportunity stage to "Lost" on confirmation
  - [ ] 9.5 Log lost action to timeline with reason
  - [ ] 9.6 Hide "Mark as Lost" button when stage is already Won
  - [ ] 9.7 Create `MarkAsWonModal.tsx` component
  - [ ] 9.8 Require either Purchase Order file OR Order Agreement Description
  - [ ] 9.9 Update opportunity stage to "Won" on confirmation
  - [ ] 9.10 Log won action to timeline
  - [ ] 9.11 Keep lost/won opportunities searchable but removed from active pipeline

---

- [ ] 10.0 Lost Reasons Administration
  - [ ] 10.1 Create `useLostReasons.ts` hook for CRUD operations
  - [ ] 10.2 Add Lost Reasons section in Settings page (admin only)
  - [ ] 10.3 Display predefined reasons as non-deletable (can be disabled)
  - [ ] 10.4 Allow admin to add custom lost reasons
  - [ ] 10.5 Allow admin to edit custom lost reasons
  - [ ] 10.6 Allow admin to delete custom lost reasons
  - [ ] 10.7 Implement is_active toggle for predefined reasons

---

- [ ] 11.0 Testing & Final Integration
  - [ ] 11.1 Test drawer opening from Kanban card click
  - [ ] 11.2 Test drawer opening from List view row click
  - [ ] 11.3 Test navigation from drawer to full detail page
  - [ ] 11.4 Test stage advancement with validation
  - [ ] 11.5 Test related entity editing and removal
  - [ ] 11.6 Test timeline filtering
  - [ ] 11.7 Test activity logging
  - [ ] 11.8 Test file upload/download/delete
  - [ ] 11.9 Test Mark as Lost flow
  - [ ] 11.10 Test Mark as Won flow
  - [ ] 11.11 Verify Portuguese translations for new UI elements
  - [ ] 11.12 Run `npm run build` to verify no errors
  - [ ] 11.13 Commit and push to feature branch
