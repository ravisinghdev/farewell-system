const { Client } = require('pg');
const dotenv = require('dotenv');
const path = require('path');

// Load env vars
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const connectionString = process.env.DATABASE_URL || process.env.POSTGRES_URL || process.env.SUPABASE_DB_URL;

console.log("Available Env Keys:", Object.keys(process.env).filter(k => !k.startsWith('npm_') && !k.startsWith('Program') && !k.startsWith('VSCODE')));

if (!connectionString) {
    console.error("Missing DATABASE_URL (or equivalent)");
    process.exit(1);
}

const client = new Client({
    connectionString,
    ssl: {
        rejectUnauthorized: false,
    },
});

async function applyPolicies() {
    try {
        await client.connect();
        console.log("Connected to database");

        const sql = `
      -- Enable RLS on storage.objects if not already enabled (it usually is)
      ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

      -- Drop existing policies to avoid conflicts
      DROP POLICY IF EXISTS "Authenticated users can upload memories" ON storage.objects;
      DROP POLICY IF EXISTS "Public can view memories" ON storage.objects;
      DROP POLICY IF EXISTS "Users can delete their own memories" ON storage.objects;
      DROP POLICY IF EXISTS "Users can update their own memories" ON storage.objects;

      -- Policy: Allow authenticated users to upload to 'memories'
      CREATE POLICY "Authenticated users can upload memories"
      ON storage.objects FOR INSERT
      TO authenticated
      WITH CHECK (bucket_id = 'memories');

      -- Policy: Allow public to view 'memories'
      CREATE POLICY "Public can view memories"
      ON storage.objects FOR SELECT
      TO public
      USING (bucket_id = 'memories');

      -- Policy: Allow users to delete their own uploads
      CREATE POLICY "Users can delete their own memories"
      ON storage.objects FOR DELETE
      TO authenticated
      USING (bucket_id = 'memories' AND auth.uid() = owner);

      -- Policy: Allow users to update their own uploads
      CREATE POLICY "Users can update their own memories"
      ON storage.objects FOR UPDATE
      TO authenticated
      USING (bucket_id = 'memories' AND auth.uid() = owner);
    `;

        await client.query(sql);
        console.log("Storage policies applied successfully");

    } catch (err) {
        console.error("Error applying policies:", err.message);
        if (err.detail) console.error("Detail:", err.detail);
        if (err.hint) console.error("Hint:", err.hint);
    } finally {
        await client.end();
    }
}

applyPolicies();
