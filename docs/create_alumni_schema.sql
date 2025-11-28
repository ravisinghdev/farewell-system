-- Create table for Alumni Messages
CREATE TABLE IF NOT EXISTS public.alumni_messages (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    farewell_id UUID NOT NULL REFERENCES public.farewells(id) ON DELETE CASCADE,
    sender_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    is_public BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.alumni_messages ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Alumni messages are viewable by everyone in the farewell" 
ON public.alumni_messages FOR SELECT 
USING (
    farewell_id IN (
        SELECT farewell_id FROM public.farewell_members WHERE user_id = auth.uid()
    )
);

CREATE POLICY "Users can create alumni messages" 
ON public.alumni_messages FOR INSERT 
WITH CHECK (
    farewell_id IN (
        SELECT farewell_id FROM public.farewell_members WHERE user_id = auth.uid()
    ) AND
    auth.uid() = sender_id
);

CREATE POLICY "Users can update their own alumni messages" 
ON public.alumni_messages FOR UPDATE 
USING (auth.uid() = sender_id);

CREATE POLICY "Users can delete their own alumni messages" 
ON public.alumni_messages FOR DELETE 
USING (auth.uid() = sender_id);

-- Grant permissions
GRANT ALL ON public.alumni_messages TO authenticated;
GRANT ALL ON public.alumni_messages TO service_role;
