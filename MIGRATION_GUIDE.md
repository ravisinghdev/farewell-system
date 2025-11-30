# How to Apply the Announcements Database Migration

Since you don't have the Supabase CLI installed, you can apply the migration directly through the Supabase Dashboard.

## Steps to Apply Migration

### 1. Open Supabase Dashboard
1. Go to [https://supabase.com](https://supabase.com)
2. Log in to your account
3. Select your project

### 2. Open SQL Editor
1. Click on "SQL Editor" in the left sidebar
2. Click "New Query"

### 3. Copy and Run the Migration
1. Open the file: `supabase/migrations/20241130_add_announcements.sql`
2. Copy ALL the SQL content from that file
3. Paste it into the SQL Editor
4. Click "Run" button (or press Ctrl+Enter)

### 4. Verify the Migration
After running, you should see a success message. You can verify by checking:

**Tables Created:**
- `announcements`
- `announcement_reactions`

**To verify, run this query in SQL Editor:**
```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('announcements', 'announcement_reactions');
```

You should see both tables listed.

## Alternative: Quick Copy

Here's the SQL Migration content for easy copying:

\`\`\`sql
[Open the file at: p:/farewell-system/supabase/migrations/20241130_add_announcements.sql]
\`\`\`

## After Migration

Once the migration is complete:
1. Reload your development server (it should hot-reload automatically)
2. Go to the announcements page
3. You should now be able to:
   - Create announcements (if you're an admin)
   - Like/bookmark/share announcements
   - Filter announcements
   - See real-time updates

## Troubleshooting

**If you get errors:**
1. Check if the tables already exist (they might from previous migrations)
2. If tables exist, you can skip the CREATE TABLE statements
3. Make sure you're running the query on the correct project

**To drop existing tables (if needed):**
```sql
DROP TABLE IF EXISTS announcement_reactions CASCADE;
DROP TABLE IF EXISTS announcements CASCADE;
```

Then run the migration again.
