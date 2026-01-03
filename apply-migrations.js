require('dotenv').config();
const { Client } = require('pg');

const client = new Client({
    connectionString: process.env.DATABASE_URL,
});

async function apply() {
    try {
        await client.connect();
        console.log("Connected to database...");

        // 1. Create timeline_reactions
        console.log("Applying timeline_reactions migration...");
        await client.query(`
      CREATE TABLE IF NOT EXISTS public.timeline_reactions (
          id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
          block_id UUID NOT NULL REFERENCES public.timeline_blocks(id) ON DELETE CASCADE,
          user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
          type TEXT CHECK (type IN ('hype')) DEFAULT 'hype',
          created_at TIMESTAMPTZ DEFAULT NOW(),
          UNIQUE(block_id, user_id, type)
      );

      ALTER TABLE public.timeline_reactions ENABLE ROW LEVEL SECURITY;

      DROP POLICY IF EXISTS "View timeline reactions" ON public.timeline_reactions;
      CREATE POLICY "View timeline reactions" ON public.timeline_reactions FOR SELECT USING (TRUE);

      DROP POLICY IF EXISTS "Add reaction" ON public.timeline_reactions;
      CREATE POLICY "Add reaction" ON public.timeline_reactions FOR INSERT WITH CHECK (auth.uid() = user_id);

      DROP POLICY IF EXISTS "Remove own reaction" ON public.timeline_reactions;
      CREATE POLICY "Remove own reaction" ON public.timeline_reactions FOR DELETE USING (auth.uid() = user_id);

      DO $$ BEGIN
          ALTER PUBLICATION supabase_realtime ADD TABLE public.timeline_reactions;
      EXCEPTION
          WHEN duplicate_object THEN null;
      END $$;
    `);

        // 2. Add manual_start_time
        console.log("Applying manual_start_time column...");
        await client.query(`
      ALTER TABLE public.timeline_blocks ADD COLUMN IF NOT EXISTS manual_start_time TIMESTAMPTZ;
    `);

        console.log("Migrations applied successfully!");
    } catch (err) {
        console.error("Error applying migrations:", err);
    } finally {
        await client.end();
    }
}

apply();
