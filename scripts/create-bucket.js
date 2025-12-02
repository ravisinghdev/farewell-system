const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const path = require('path');

// Load env vars
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

console.log("URL:", supabaseUrl ? "Found" : "Missing");
console.log("Key:", supabaseKey ? "Found" : "Missing");

if (!supabaseUrl || !supabaseKey) {
    console.error("Missing Supabase credentials");
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey, {
    auth: {
        autoRefreshToken: false,
        persistSession: false,
    },
});

async function createBuckets() {
    const buckets = ["memories", "chat-attachments", "receipts"];

    for (const bucket of buckets) {
        console.log(`Creating '${bucket}' bucket...`);
        const { data, error } = await supabase.storage.createBucket(bucket, {
            public: true,
            fileSizeLimit: 52428800, // 50MB
            allowedMimeTypes: bucket === "receipts" ? ["image/*", "application/pdf"] : ["image/*", "video/*", "application/pdf"],
        });

        if (error) {
            if (error.message.includes("already exists")) {
                console.log(`Bucket '${bucket}' already exists.`);
            } else {
                console.error(`Error creating bucket '${bucket}':`, error);
            }
        } else {
            console.log(`Bucket '${bucket}' created successfully:`, data);
        }
    }
}

createBuckets();
