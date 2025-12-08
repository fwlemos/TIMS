# Task: Security Audit Remediation

## Relevant Files

- `supabase/migrations/20251209000000_secure_rls_policies.sql` - New migration to implement granular RLS.
- `src/contexts/AuthContext.tsx` - Authentication logic to receive environment variable hardening.
- `src/hooks/useCurrentUserPermissions.ts` - New hook to fetch and check permissions for the logged-in user.
- `src/pages/Settings.tsx` - Update to protect Admin UI.
- `src/components/shared/PermissionGuard.tsx` - New component to conditionally render elements based on permissions.
- `.env.example` - Documentation for new security flags.

## Instructions for Completing Tasks

**IMPORTANT:** As you complete each task, you must check it off in this markdown file by changing `- [ ]` to `- [x]`. This helps track progress and ensures you don't skip any steps.

Example:
- `- [ ] 1.1 Read file` → `- [x] 1.1 Read file` (after completing)

Update the file after completing each sub-task, not just after completing an entire parent task.

## Tasks

- [x] 0.0 Create feature branch
  - [x] 0.1 Create and checkout a new branch `security/audit-remediation`

- [x] 1.0 Implement Proper Row-Level Security (RLS)
  - [x] 1.1 Create `supabase/migrations/20251209000000_secure_rls_policies.sql`.
  - [x] 1.2 Define (or replace) the `user_has_permission(resource, permission)` Postgres function to check `user_permissions` table.
  - [x] 1.3 Write RLS policies for `contacts` table (Select, Insert, Update, Delete) using `user_has_permission`.
  - [x] 1.4 Write RLS policies for `companies` table using `user_has_permission`.
  - [x] 1.5 Write RLS policies for `opportunities` table using `user_has_permission`.
  - [x] 1.6 Write RLS policies for `products` and `manufacturers` tables using `user_has_permission`.
  - [x] 1.7 Write RLS policies for `documents` table and `storage.objects` to restrict access based on ownership or entity permission.
  - [x] 1.8 Verify the migration file locally (syntax check) and ensure it drops existing overly-permissive policies first.

- [x] 2.0 Secure Application Access & Environment
  - [x] 2.1 Update `.env.example` to add `VITE_ALLOW_ANY_EMAIL` (default false/commented).
  - [x] 2.2 Modify `src/contexts/AuthContext.tsx` to check `import.meta.env.VITE_ALLOW_ANY_EMAIL === 'true'` instead of just `dev` mode for domain restriction bypass.
  - [x] 2.3 Add a console warning in `AuthContext` if domain restriction is bypassed (only in dev).

- [x] 3.0 Implement UI Permission Guards
  - [x] 3.1 Create `src/hooks/useCurrentUserPermissions.ts` to fetch perms for the current authenticated user.
  - [x] 3.2 Create `src/components/shared/PermissionGuard.tsx` wrapper component.
  - [x] 3.3 Update `src/pages/Settings.tsx` to use `PermissionGuard` (or check hook) around the "Permissions" tab. Only users with `users.can_view` (or a dedicated admin flag) should see it.
  - [ ] 3.4 (Optional but recommended) Wrap "Delete" buttons in `GenericTable` or `KanbanBoard` with `PermissionGuard(resource, 'can_delete')`.

- [ ] 4.0 Verification & Final Audit
  - [ ] 4.1 Apply migrations to local/dev Supabase instance.
  - [ ] 4.2 Verify that a restricted user cannot fetch data they don't have access to (test via Supabase client console).
  - [ ] 4.3 Verify that the "Permissions" tab is hidden for non-admin users.
  - [ ] 4.4 Commit all changes and merge plan.
