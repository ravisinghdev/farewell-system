-- Add Call to Action fields to announcements table
ALTER TABLE public.announcements 
ADD COLUMN call_to_action_label TEXT,
ADD COLUMN call_to_action_link TEXT,
ADD COLUMN call_to_action_type TEXT DEFAULT 'primary'; -- primary, secondary, outline, destructive
