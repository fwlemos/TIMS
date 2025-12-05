-- Create a private bucket for documents
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('documents', 'documents', false, 10485760, null) -- 10MB limit
on conflict (id) do nothing;

-- Policy to allow authenticated users to select from the bucket
create policy "Authenticated users can select documents"
on storage.objects for select
to authenticated
using ( bucket_id = 'documents' );

-- Policy to allow authenticated users to insert into the bucket
create policy "Authenticated users can upload documents"
on storage.objects for insert
to authenticated
with check ( bucket_id = 'documents' );

-- Policy to allow authenticated users to update their own documents (optional, but good for consistency)
create policy "Authenticated users can update documents"
on storage.objects for update
to authenticated
using ( bucket_id = 'documents' );

-- Policy to allow authenticated users to delete documents
create policy "Authenticated users can delete documents"
on storage.objects for delete
to authenticated
using ( bucket_id = 'documents' );

-- Documents Table Policies (if not already present, assuming they might be missing or incomplete based on previous context)
alter table documents enable row level security;

create policy "Enable read access for authenticated users"
on documents for select
to authenticated
using (true);

create policy "Enable insert access for authenticated users"
on documents for insert
to authenticated
with check (true);

create policy "Enable update access for authenticated users"
on documents for update
to authenticated
using (true);

create policy "Enable delete access for authenticated users"
on documents for delete
to authenticated
using (true);
