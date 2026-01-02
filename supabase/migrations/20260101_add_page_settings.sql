-- Add page_settings JSONB column to farewells table
ALTER TABLE public.farewells 
ADD COLUMN IF NOT EXISTS page_settings JSONB DEFAULT '{}'::jsonb;

-- Comment on column
COMMENT ON COLUMN public.farewells.page_settings IS 'Stores access control settings for pages: { "/path": { "enabled": boolean, "reason": text, "message": text } }';
