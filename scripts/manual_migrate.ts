import fs from "node:fs";
import path from "node:path";
import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

// Load env
const envLocalPath = path.resolve(process.cwd(), ".env.local");
const envPath = path.resolve(process.cwd(), ".env");

dotenv.config({ path: fs.existsSync(envLocalPath) ? envLocalPath : envPath });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing Supabase credentials");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const sql = `
-- Drop old support_tickets if exists
DROP TABLE IF EXISTS public.support_tickets CASCADE;
DROP TABLE IF EXISTS public.support_messages CASCADE;
DROP TABLE IF EXISTS public.about_sections CASCADE;

-- Create support_tickets
CREATE TABLE public.support_tickets (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  farewell_id UUID NOT NULL REFERENCES public.farewells(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  subject TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('general', 'technical', 'logistics', 'other')),
  status TEXT NOT NULL CHECK (status IN ('open', 'in_progress', 'resolved', 'closed')) DEFAULT 'open',
  priority TEXT NOT NULL CHECK (priority IN ('low', 'medium', 'high')) DEFAULT 'medium',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create support_messages
CREATE TABLE public.support_messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  ticket_id UUID NOT NULL REFERENCES public.support_tickets(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  message TEXT NOT NULL,
  is_staff_reply BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create about_sections
CREATE TABLE public.about_sections (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  farewell_id UUID NOT NULL REFERENCES public.farewells(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  order_index INTEGER DEFAULT 0,
  image_url TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS
ALTER TABLE public.support_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.support_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.about_sections ENABLE ROW LEVEL SECURITY;

-- Policies for support_tickets
CREATE POLICY "Users can view own tickets" ON public.support_tickets
  FOR SELECT USING (auth.uid() = user_id OR EXISTS (
    SELECT 1 FROM public.farewell_members fm
    WHERE fm.farewell_id = support_tickets.farewell_id
    AND fm.user_id = auth.uid()
    AND fm.role IN ('admin', 'main_admin', 'parallel_admin')
  ));

CREATE POLICY "Users can create tickets" ON public.support_tickets
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own tickets" ON public.support_tickets
  FOR UPDATE USING (auth.uid() = user_id OR EXISTS (
    SELECT 1 FROM public.farewell_members fm
    WHERE fm.farewell_id = support_tickets.farewell_id
    AND fm.user_id = auth.uid()
    AND fm.role IN ('admin', 'main_admin', 'parallel_admin')
  ));

-- Policies for support_messages
CREATE POLICY "Users can view messages for accessible tickets" ON public.support_messages
  FOR SELECT USING (EXISTS (
    SELECT 1 FROM public.support_tickets st
    WHERE st.id = support_messages.ticket_id
    AND (st.user_id = auth.uid() OR EXISTS (
      SELECT 1 FROM public.farewell_members fm
      WHERE fm.farewell_id = st.farewell_id
      AND fm.user_id = auth.uid()
      AND fm.role IN ('admin', 'main_admin', 'parallel_admin')
    ))
  ));

CREATE POLICY "Users can create messages for accessible tickets" ON public.support_messages
  FOR INSERT WITH CHECK (EXISTS (
    SELECT 1 FROM public.support_tickets st
    WHERE st.id = support_messages.ticket_id
    AND (st.user_id = auth.uid() OR EXISTS (
      SELECT 1 FROM public.farewell_members fm
      WHERE fm.farewell_id = st.farewell_id
      AND fm.user_id = auth.uid()
      AND fm.role IN ('admin', 'main_admin', 'parallel_admin')
    ))
  ));

-- Policies for about_sections
CREATE POLICY "Everyone can view about sections" ON public.about_sections
  FOR SELECT USING (true);

CREATE POLICY "Admins can manage about sections" ON public.about_sections
  FOR ALL USING (EXISTS (
    SELECT 1 FROM public.farewell_members fm
    WHERE fm.farewell_id = about_sections.farewell_id
    AND fm.user_id = auth.uid()
    AND fm.role IN ('admin', 'main_admin', 'parallel_admin')
  ));

-- Realtime
-- Already enabled for all tables
`;

async function run() {
  console.log("Running migration...");

  // NOTE: supabase-js client doesn't support raw SQL execution except via RPC if enabled.
  // BUT we can use the 'postgres' package if installed, or we can try to use a dummy table op
  // Actually, standard supabase-js cannot run DDL.
  // We must use the CLI or a postgres client.
  // Since CLI is stuck, and I can't easily install new packages without user permission...
  // I will try to use the CLI one last time with a trick: 'supabase db reset' is too destructive.
  // I will rely on the user to run the migration or finding a workaround.
  // Wait, I can try 'npx supabase db push --force' if available? No.
  // Let's print instructions to user if this fails.

  console.log(
    "Cannot run DDL via JS client directly without pg driver. Skipping manual run script."
  );
}

run();
