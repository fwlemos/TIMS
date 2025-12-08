## Relevant Files

- `src/constants/` - New directory for centralized constants.
- `src/types/` - Check/update for type definitions.
- `src/pages/Database.tsx` - Major refactoring target.
- `src/pages/OpportunityDetail.tsx` - Major refactoring target.
- `src/components/database/` - New home for split database components.
- `src/components/opportunity/` - New home for split opportunity components.
- `src/lib/errorLogger.ts` - New error handling service.

### Notes

- This refactoring aims to address technical debt identified in the audit without changing external behavior (refactoring).
- Ensure the application remains buildable and runnable after each major task.

## Instructions for Completing Tasks

**IMPORTANT:** As you complete each task, you must check it off in this markdown file by changing `- [ ]` to `- [x]`. This helps track progress and ensures you don't skip any steps.

## Tasks

- [ ] 0.0 Create feature branch
  - [ ] 0.1 Create and checkout a new branch for this feature (e.g., `git checkout -b refactor/comprehensive-audit`)
  - [ ] 0.2 Verify application runs correctly before starting changes (`npm run dev`)

- [ ] 1.0 Foundation & Cleanup
  - [x] 1.1 Update dependencies to latest stable versions (React 19, etc.) and remove deprecated usage
  - [x] 1.2 Remove unused files identified in audit (`src/lib/format.ts`, `src/components/shared/Skeleton.tsx`)
  - [x] 1.3 Clean up `src/components/index.ts` (remove unused exports or use them)
  - [x] 1.4 Move hardcoded domain (`tennessine.com.br`) from `AuthContext.tsx` and `Login.tsx` to `import.meta.env.VITE_ALLOWED_DOMAIN`
  - [x] 1.5 Update `.env.example` with new environment variables

- [x] 2.0 Shared Infrastructure & Constants (DRY Refactoring)
  - [x] 2.1 Create `src/constants/` directory
  - [x] 2.2 Extract `LEAD_ORIGIN_OPTIONS` and related lists to `src/constants/options.ts` and update `OpportunityDetail.tsx`, `StageAccordion.tsx`, `OpportunityForm.tsx`
  - [x] 2.3 Extract form schemas (Company, Contact, Product, Manufacturer) to `src/constants/schemas.ts` or `src/schemas/` to remove duplication across `OpportunityDetail.tsx` and `OpportunityForm.tsx`
  - [x] 2.4 Extract `STAGE_FIELDS` configuration to `src/constants/pipelines.ts` and share between `StageAccordion.tsx` and `StageColumns.tsx`
  - [x] 2.5 Update imports in affected files

- [x] 3.0 Type Safety & Error Handling Improvements
  - [x] 3.1 Create `src/lib/logger.ts` service to centralize error logging (replacing raw `console.error`)
  - [x] 3.2 Replace all 50+ `console.error` usages with `logger.error`
  - [x] 3.3 Add React Error Boundary component `src/components/shared/ErrorBoundary.tsx` and wrap App
  - [x] 3.4 Fix `any` types in `useOpportunities.ts` (specifically `transformOpportunity`)
  - [x] 3.5 Fix `any` types in `useObjectData.ts` and `ObjectForm.tsx`
  - [x] 3.6 Fix `any` types in `ObjectVisualizationPage.tsx`

- [x] 4.0 Refactor "God Component": Database.tsx
  - [x] 4.1 Extract `DatabaseTable` component to handle the common table rendering logic
  - [x] 4.2 Split entity-specific rendering into `src/components/database/views/`:
    - `ContactsView.tsx`
    - `CompaniesView.tsx`
    - `ProductsView.tsx`
    - `ManufacturersView.tsx`
  - [x] 4.3 Refactor `Database.tsx` to be a lightweight container that composes these views
  - [x] 4.4 Ensure all `any` types in Database handlers are replaced with strict types from `database.types.ts`

- [x] 5.0 Refactor "God Component": OpportunityDetail.tsx
  - [x] 5.1 Extract header section to `src/components/opportunity/detail/OpportunityHeader.tsx`
  - [x] 5.2 Extract info/form section to `src/components/opportunity/detail/OpportunityInfo.tsx`
  - [x] 5.3 Extract actions logic (Won/Lost/Move) into custom hook `src/hooks/useOpportunityActions.ts`
  - [x] 5.4 Refactor `OpportunityDetail.tsx` to compose these smaller components

