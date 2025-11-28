-- Create table for Letters to Seniors
CREATE TABLE IF NOT EXISTS public.letters (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    farewell_id UUID NOT NULL REFERENCES public.farewells(id) ON DELETE CASCADE,
    sender_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    recipient_id UUID REFERENCES public.users(id) ON DELETE SET NULL, -- NULL means "To all seniors"
    content TEXT NOT NULL,
    is_public BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create table for Feedback & Suggestions
CREATE TABLE IF NOT EXISTS public.feedback (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    farewell_id UUID NOT NULL REFERENCES public.farewells(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('feedback', 'suggestion', 'bug', 'other')),
    status TEXT DEFAULT 'new' CHECK (status IN ('new', 'reviewed', 'implemented', 'rejected')),
    is_anonymous BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.letters ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.feedback ENABLE ROW LEVEL SECURITY;

-- Policies for Letters
CREATE POLICY "Letters are viewable by everyone in the farewell" 
ON public.letters FOR SELECT 
USING (
    farewell_id IN (
        SELECT farewell_id FROM public.farewell_members WHERE user_id = auth.uid()
    )
);

CREATE POLICY "Users can create letters" 
ON public.letters FOR INSERT 
WITH CHECK (
    farewell_id IN (
        SELECT farewell_id FROM public.farewell_members WHERE user_id = auth.uid()
    ) AND
    auth.uid() = sender_id
);

CREATE POLICY "Users can update their own letters" 
ON public.letters FOR UPDATE 
USING (auth.uid() = sender_id);

CREATE POLICY "Users can delete their own letters" 
ON public.letters FOR DELETE 
USING (auth.uid() = sender_id);

-- Policies for Feedback
CREATE POLICY "Feedback is viewable by admins and the creator" 
ON public.feedback FOR SELECT 
USING (
    (auth.uid() = user_id) OR 
    EXISTS (
        SELECT 1 FROM public.farewell_members 
        WHERE farewell_id = feedback.farewell_id 
        AND user_id = auth.uid() 
        AND role::text IN ('admin', 'main_admin')
    )
);

CREATE POLICY "Users can submit feedback" 
ON public.feedback FOR INSERT 
WITH CHECK (
    farewell_id IN (
        SELECT farewell_id FROM public.farewell_members WHERE user_id = auth.uid()
    ) AND
    auth.uid() = user_id
);

-- Grant permissions
GRANT ALL ON public.letters TO authenticated;
GRANT ALL ON public.feedback TO authenticated;
GRANT ALL ON public.letters TO service_role;
GRANT ALL ON public.feedback TO service_role;
