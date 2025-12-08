## Relevant Files

- `src/pages/ObjectVisualizationPage.tsx` - Main container page for the visualization feature.
- `src/components/layout/ObjectLayout.tsx` - Reusable 3-column layout component.
- `src/components/features/ObjectForm.tsx` - Dynamic form component that handles view/edit modes.
- `src/config/objectRegistry.ts` - Configuration registry for different object types (fields, validation).
- `src/components/features/ActivityTimeline.tsx` - Component for displaying the history/audit log.
- `src/components/features/RelatedOpportunities.tsx` - Component for displaying linked opportunities.
- `src/hooks/useObjectData.ts` - Hook to handle fetching and updating object data.
- `supabase/migrations/20251208092000_create_activity_logs.sql` - Migration for the audit log table.

### Notes

- Follow the existing design patterns used in `OpportunityDetail.tsx`.
- Ensure RLS policies are applied to the new `activity_logs` table.
- Use the existing `RelationalField` component for object relationships within the form.

## Instructions for Completing Tasks

**IMPORTANT:** As you complete each task, you must check it off in this markdown file by changing `- [ ]` to `- [x]`. This helps track progress and ensures you don't skip any steps.

## Tasks

- [x] 0.0 Create feature branch
  - [x] 0.1 Create and checkout a new branch `feature/object-visualization`

- [x] 1.0 Implement Layout and Routing
  - [x] 1.1 Create `ObjectLayout.tsx` with responsive 3-column structure (Left: Timeline, Center: Form, Right: Opportunities).
  - [x] 1.2 Create `ObjectVisualizationPage.tsx` as the main route handler, accepting `:objectType` and `:id` params.
  - [x] 1.3 Update `App.tsx` (or router config) to add the route `/database/:objectType/:id`.
  - [x] 1.4 Add navigation handlers (e.g., clicking a row in Database table navigates to this page).

- [x] 2.0 Implement Object Form (Center Column) with Editing
  - [x] 2.1 Create `objectRegistry.ts` to define field configurations (labels, types, validation) for Client, Company, Product, Manufacturer.
  - [x] 2.2 Create `ObjectForm.tsx` component that dynamically renders fields based on the registry.
  - [x] 2.3 Implement "View" mode (read-only) and "Edit" mode toggle.
  - [x] 2.4 Create `useObjectData` hook to fetch entity data from Supabase based on type and ID.
  - [x] 2.5 Implement `handleSubmit` in `ObjectForm` to update the record in Supabase.
  - [x] 2.6 Integrate `RelationalField` in the form for handling related entities (e.g., Company for a Contact).

- [x] 3.0 Implement Activity Timeline (Left Column)
  - [x] 3.1 Create SQL migration for `activity_logs` table (object_type, object_id, action, changed_fields, performed_by).
  - [x] 3.2 Create backend trigger or application logic to insert into `activity_logs` on entity updates.
  - [x] 3.3 Create `TimelineEntry` component with "Collapsed" and "Expanded" states (showing diffs).
  - [x] 3.4 Create `ActivityTimeline` component to fetch and render the log list (with realtime subscription).

- [x] 4.0 Implement Related Opportunities (Right Column)
  - [x] 4.1 Create `OpportunityMiniCard` component (Name, Stage, Value, Close Date).
  - [x] 4.2 Create `RelatedOpportunities` component to query opportunities where the current object is referenced.
  - [x] 4.3 Implement navigation from MiniCard to Opportunity Detail page.

- [x] 5.0 Implement Actions and Quick Create
  - [x] 5.1 Implement Header Actions: "Duplicate" (copy data to new form) and "Delete" (modal confirmation).
  - [x] 5.2 Reuse `SlidePanel` + `OpportunityForm` for creating related opportunities.
  - [x] 5.3 Integrate Quick Create actions into the layout/header.

## Status: ✅ ALL TASKS COMPLETE
