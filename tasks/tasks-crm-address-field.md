## Relevant Files

- `src/types/database.ts` - Schema definitions for Companies and Contacts.
- `src/components/shared/AddressField.tsx` - New reusable address component.
- `src/hooks/useGooglePlaces.ts` - New hook for Google Maps API integration.
- `src/components/database/CompanyForm.tsx` - Updates for address fields.
- `src/components/database/ContactForm.tsx` - Updates for "Individual Client" logic.
- `src/components/opportunity/detail/OpportunityQuotation.tsx` - Address display and validation logic.

### Notes

- Unit tests should typically be placed alongside the code files they are testing (e.g., `MyComponent.tsx` and `MyComponent.test.tsx` in the same directory).
- Use `npx jest [optional/path/to/test/file]` to run tests. Running without a path executes all tests found by the Jest configuration.

## Instructions for Completing Tasks

**IMPORTANT:** As you complete each task, you must check it off in this markdown file by changing `- [ ]` to `- [x]`. This helps track progress and ensures you don't skip any steps.

Example:
- `- [ ] 1.1 Read file` → `- [x] 1.1 Read file` (after completing)

Update the file after completing each sub-task, not just after completing an entire parent task.

## Tasks

- [ ] 0.0 Create feature branch
  - [ ] 0.1 Create and checkout a new branch `feature/crm-address-quotation`

- [ ] 1.0 Database Schema & TypeScript Interfaces
  - [ ] 1.1 Create Supabase migration: Add address columns to `companies` and `contacts` (street, complement, neighborhood, city, state, country, zip, formatted, place_id).
  - [ ] 1.2 Create Supabase migration: Add `is_individual` boolean to `contacts`.
  - [ ] 1.3 Create Supabase migration: Add indexes for filterable fields (city, state, country) and `is_individual`.
  - [ ] 1.4 Update TS Types: Update global database types or interfaces to reflect new columns.

- [ ] 2.0 Infrastructure: Google Maps Integration & Address Component
  - [ ] 2.1 Configure Environment: Ensure `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` is set.
  - [ ] 2.2 Create `useGooglePlaces` hook: Handle script loading, Autocomplete session tokens, and result parsing.
  - [ ] 2.3 Create `AddressField` component: Implement generic component with `view` (read-only) and `edit` (autocomplete) modes.
  - [ ] 2.4 Implement debouncing for API calls in `AddressField`.

- [ ] 3.0 Company Module Updates (Address Fields & Filtering)
  - [ ] 3.1 Update `CompanyForm.tsx`: Embed `AddressField` for creating/editing companies.
  - [ ] 3.2 Update `CompaniesView.tsx` (List): Add multi-select filters for City, State, and Country.
  - [ ] 3.3 Verify persistence: Ensure address data saves correctly to `companies` table.

- [ ] 4.0 Contact Module Updates (Individual Client Logic)
  - [ ] 4.1 Update `ContactForm.tsx`: Add `is_individual` checkbox.
  - [ ] 4.2 Update `ContactForm.tsx`: Conditionally show `AddressField` (if individual) vs Company Select (if not).
  - [ ] 4.3 Update `ContactForm.tsx`: Make Company field optional when `is_individual` is true.
  - [ ] 4.4 Verify persistence: Ensure `is_individual` and address data save correctly to `contacts` table.

- [ ] 5.0 Opportunity & Quotation Workflow Implementation
  - [ ] 5.1 Helper Logic: Implement `resolveOpportunityAddress` function (Strategy checks Contact `is_individual` flag).
  - [ ] 5.2 Update `OpportunityQuotation` component: Display resolved address in the accordion.
  - [ ] 5.3 Implement "Edit Address" flow: Allow inline editing that updates the *source* entity (Company or Contact).
  - [ ] 5.4 Stage Validation: Add check to `Opportunity` transition logic—block move to "Closing" if address is missing.
  - [ ] 5.5 Verify complete flow: Create Opportunity -> Quotation -> Check Auto-populate -> Edit -> Verify Save -> Move to Closing.
