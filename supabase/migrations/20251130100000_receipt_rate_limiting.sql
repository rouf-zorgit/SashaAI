-- Add receipt upload tracking for rate limiting
CREATE TABLE IF NOT EXISTS receipt_uploads (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    uploaded_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    receipt_url TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for efficient rate limit checks
CREATE INDEX IF NOT EXISTS idx_receipt_uploads_user_date ON receipt_uploads(user_id, uploaded_at);

-- RLS policies
ALTER TABLE receipt_uploads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own upload history"
ON receipt_uploads FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own uploads"
ON receipt_uploads FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);
