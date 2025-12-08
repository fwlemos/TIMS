-- Create a specific function to check permissions efficiently
create or replace function public.user_has_permission(
  p_resource public.resource_type,
  p_permission text
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_has_permission boolean;
begin
  -- Check if user exists in user_permissions and has the specific permission set to true
  select 
    case p_permission
      when 'can_view' then can_view
      when 'can_add' then can_add
      when 'can_edit' then can_edit
      when 'can_delete' then can_delete
      when 'can_download' then can_download
      else false
    end into v_has_permission
  from user_permissions
  where user_id = auth.uid()
  and resource = p_resource;

  return coalesce(v_has_permission, false);
end;
$$;

-- Enable RLS on main tables (idempotent)
alter table companies enable row level security;
alter table contacts enable row level security;
alter table products enable row level security;
alter table opportunities enable row level security;
alter table documents enable row level security;
alter table user_permissions enable row level security;

-- Helper to drop existing policies to ensure clean state (optional but safer for "replace")
-- We wrap in do block to suppress errors if they don't exist, though strictly standard SQL doesn't have "drop policy if exists" without table name knowledge.
-- For this migration, we will use 'drop policy if exists' explicitly for likely names or just create new names.
-- To avoid conflicts, I will drop policies with generic names if I can, or just use specific unique names.
-- Since I cannot inspect existing names easily, I will attempt to drop the likely ones from previous migrations.

drop policy if exists "Enable read access for authenticated users" on documents;
drop policy if exists "Enable insert access for authenticated users" on documents;
drop policy if exists "Enable update access for authenticated users" on documents;
drop policy if exists "Enable delete access for authenticated users" on documents;

-- CONTACTS POLICIES
create policy "contacts_view_policy" on contacts for select
  using (user_has_permission('contacts', 'can_view'));

create policy "contacts_insert_policy" on contacts for insert
  with check (user_has_permission('contacts', 'can_add'));

create policy "contacts_update_policy" on contacts for update
  using (user_has_permission('contacts', 'can_edit'));

create policy "contacts_delete_policy" on contacts for delete
  using (user_has_permission('contacts', 'can_delete'));

-- COMPANIES POLICIES
create policy "companies_view_policy" on companies for select
  using (user_has_permission('companies', 'can_view'));

create policy "companies_insert_policy" on companies for insert
  with check (user_has_permission('companies', 'can_add'));

create policy "companies_update_policy" on companies for update
  using (user_has_permission('companies', 'can_edit'));

create policy "companies_delete_policy" on companies for delete
  using (user_has_permission('companies', 'can_delete'));

-- PRODUCTS POLICIES
create policy "products_view_policy" on products for select
  using (user_has_permission('products', 'can_view'));

create policy "products_insert_policy" on products for insert
  with check (user_has_permission('products', 'can_add'));

create policy "products_update_policy" on products for update
  using (user_has_permission('products', 'can_edit'));

create policy "products_delete_policy" on products for delete
  using (user_has_permission('products', 'can_delete'));

-- OPPORTUNITIES POLICIES
create policy "opportunities_view_policy" on opportunities for select
  using (user_has_permission('opportunities', 'can_view'));

create policy "opportunities_insert_policy" on opportunities for insert
  with check (user_has_permission('opportunities', 'can_add'));

create policy "opportunities_update_policy" on opportunities for update
  using (user_has_permission('opportunities', 'can_edit'));

create policy "opportunities_delete_policy" on opportunities for delete
  using (user_has_permission('opportunities', 'can_delete'));

-- DOCUMENTS METADATA POLICIES
create policy "documents_view_policy" on documents for select
  using (user_has_permission('documents', 'can_view'));

create policy "documents_insert_policy" on documents for insert
  with check (user_has_permission('documents', 'can_add'));

create policy "documents_update_policy" on documents for update
  using (user_has_permission('documents', 'can_edit'));

create policy "documents_delete_policy" on documents for delete
  using (user_has_permission('documents', 'can_delete'));

-- USER PERMISSIONS POLICIES (Admin Security)
-- Users can view their own permissions to check access
create policy "user_permissions_view_own" on user_permissions for select
  using (user_id = auth.uid());

-- Only users with 'users' resource permission (Admin) can view ALL, edit, add, delete
create policy "admin_view_permissions" on user_permissions for select
  using (user_has_permission('users', 'can_view'));

create policy "admin_manage_permissions" on user_permissions for all
  using (user_has_permission('users', 'can_edit'));

-- STORAGE OBJECTS POLICIES (Supabase Storage)
-- Access to 'documents' bucket
-- Note: Storage policies must be targeted at storage.objects

drop policy if exists "Enable read access for authenticated users" on storage.objects;
drop policy if exists "Enable insert access for authenticated users" on storage.objects;
drop policy if exists "Enable update access for authenticated users" on storage.objects;
drop policy if exists "Enable delete access for authenticated users" on storage.objects;

create policy "documents_storage_view" on storage.objects for select
  to authenticated
  using (bucket_id = 'documents' AND user_has_permission('documents', 'can_view'));

create policy "documents_storage_insert" on storage.objects for insert
  to authenticated
  with check (bucket_id = 'documents' AND user_has_permission('documents', 'can_add'));

create policy "documents_storage_update" on storage.objects for update
  to authenticated
  using (bucket_id = 'documents' AND user_has_permission('documents', 'can_edit'));

create policy "documents_storage_delete" on storage.objects for delete
  to authenticated
  using (bucket_id = 'documents' AND user_has_permission('documents', 'can_delete'));
