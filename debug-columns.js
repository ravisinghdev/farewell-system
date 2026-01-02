
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error("Missing Env Vars");
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function inspect() {
    console.log("Inspecting 'rehearsal_sessions' columns...");

    // Query introspection system
    // We can't do SQL directly, but we can try to select a row, or filter.
    // Actually, we can use RPC if available, but unlikely.
    // We'll rely on error messages or just listing via a hack?
    // No, Supabase JS client doesn't support 'describe'.

    // But we can check 'rehearsal_attendance' too.

    // Try to insert a dummy row with just 'id' and see what fails?
    // No, we want to know what columns EXIST.

    // We can select * from information_schema
    const { data, error } = await supabase
        .from('information_schema.columns')
        .select('column_name, is_nullable, data_type')
        .eq('table_name', 'rehearsal_sessions')
        .eq('table_schema', 'public');

    if (error) {
        // Config might block access to information_schema via API
        console.error("Info Schema Error:", error);

        // Fallback: Use RPC to run SQL?
    } else {
        console.table(data);
    }
}

inspect();
