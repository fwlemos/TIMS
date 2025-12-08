CREATE TABLE IF NOT EXISTS public.activity_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    object_type TEXT NOT NULL,
    object_id UUID NOT NULL,
    action TEXT NOT NULL,
    changed_fields JSONB,
    performed_by UUID NULL REFERENCES auth.users(id),
    performed_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;

-- Policy: Allow read for authenticated users
CREATE POLICY "Enable read access for authenticated users"
    ON public.activity_logs
    FOR SELECT
    TO authenticated
    USING (true);

-- Policy: Allow insert for authenticated users
CREATE POLICY "Enable insert for authenticated users"
    ON public.activity_logs
    FOR INSERT
    TO authenticated
    WITH CHECK (true);
