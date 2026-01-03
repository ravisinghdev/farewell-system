const path = require('path');
require('dotenv').config({ path: path.resolve(process.cwd(), '.env') });
const { Client } = require('pg');

const url = process.env.DATABASE_URL;
console.log("URL Status:", url ? "FOUND" : "MISSING");
if (url) {
    try {
        console.log("Host:", new URL(url).hostname);
    } catch (e) { console.log("Invalid URL format"); }
}

const client = new Client({
    connectionString: url,
    ssl: url && !url.includes('localhost') && !url.includes('127.0.0.1') ? { rejectUnauthorized: false } : false
});

async function apply() {
    try {
        await client.connect();
        console.log("Connected to database...");

        console.log("Defining SECURITY DEFINER function to bypass RLS...");
        await client.query(`
            CREATE OR REPLACE FUNCTION public.is_farewell_member(_farewell_id UUID, _user_id UUID)
            RETURNS BOOLEAN
            LANGUAGE plpgsql
            SECURITY DEFINER
            SET search_path = public
            AS $$
            BEGIN
              RETURN EXISTS (
                SELECT 1 FROM public.farewell_members
                WHERE farewell_id = _farewell_id
                AND user_id = _user_id
              );
            END;
            $$;
        `);

        console.log("Replacing recursive policy 'members_farewell_read'...");
        await client.query(`
            DROP POLICY IF EXISTS "members_farewell_read" ON public.farewell_members;
            
            CREATE POLICY "members_farewell_read"
            ON public.farewell_members FOR SELECT
            USING (
                public.is_farewell_member(farewell_id, auth.uid())
            );
        `);

        console.log("Fix applied successfully!");
    } catch (err) {
        console.error("Error applying fix:", err);
    } finally {
        await client.end();
    }
}

apply();
