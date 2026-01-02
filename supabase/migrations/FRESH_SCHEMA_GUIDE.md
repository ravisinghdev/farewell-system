# Complete Database Schema Reset - Quick Start Guide

## ⚠️ CRITICAL WARNING
**This migration will DELETE ALL existing data in your database!**  
Make sure you have a backup before proceeding.

## What This Does
- Drops the entire `public` schema
- Rec recreates 25+ tables from scratch
- Adds optimized RLS policies (NO timeout errors)
- Creates performance indexes
- Sets up triggers and functions
- Enables realtime subscriptions

## How to Apply

### Method 1: Supabase Dashboard (Recommended)

1. **Open Supabase Dashboard**
   - Go to your project
   - Navigate to **SQL Editor**

2. **Copy the SQL**
   - Open `complete_fresh_schema.sql`
   - Copy ALL contents (Ctrl+A, Ctrl+C)

3. **Run the Migration**
   - Paste in SQL Editor
   - Click **Run** button
   - Wait for completion (~30 seconds)

4. **Verify**
   - Check "Table Editor" - you should see all tables
   - No errors in the output

### Method 2: Command Line

```bash
# Using psql
psql $DATABASE_URL -f supabase/migrations/complete_fresh_schema.sql

# Using Supabase CLI
supabase db reset
```

## What's Included

### Tables Created (26 total)
✅ users, farewells, farewell_members  
✅ contributions, farewell_financials, ledger, expenses  
✅ duties, duty_assignments, duty_claims  
✅ announcements, announcement_reads, announcement_reactions  
✅ highlights, highlight_reactions, highlight_comments  
✅ timeline_events  
✅ tasks, task_assignments, task_comments  
✅ chat_channels, chat_members, chat_messages  
✅ albums, media  
✅ notifications, audit_logs  

### RLS Policies (20+ policies)
- ✅ No recursion
- ✅ No complex joins
- ✅ Optimized for performance
- ✅ Proper role-based access control

### Indexes (15+ indexes)
- ✅ farewell_members lookup
- ✅ contributions by user/farewell/status
- ✅ highlights by farewell
- ✅ chat messages by channel
- ✅ And more for fast queries

## After Migration

### 1. Verify Tables
```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;
```
You should see 26 tables.

### 2. Verify RLS Policies
```sql
SELECT tablename, policyname 
FROM pg_policies 
WHERE schemaname = 'public'
ORDER BY tablename;
```
You should see 20+ policies.

### 3. Test Basic Queries
```sql
-- Should work without errors
SELECT * FROM users LIMIT 5;
SELECT * FROM farewells LIMIT 5;
SELECT * FROM contributions LIMIT 5;
```

## Troubleshooting

**If you get "permission denied":**
- You need to be a database owner/admin
- Try using the Supabase dashboard method

**If tables don't appear:**
- Refresh the browser
- Check for SQL errors in the output
- Ensure you ran the COMPLETE script

**If you get "relation already exists":**
- The script should have dropped everything first
- Manually run: `DROP SCHEMA public CASCADE; CREATE SCHEMA public;`
- Then run the migration again

## Rollback

Unfortunately, there's NO rollback for this migration since it drops everything.  
**You must have a backup to restore from!**

To create a backup before running:
```bash
pg_dump $DATABASE_URL > backup_$(date +%Y%m%d).sql
```

## Benefits of This Schema

✅ **No more timeout errors** - Optimized RLS policies  
✅ **Fast queries** - Proper indexes on all tables  
✅ **Clean structure** - Fresh start, no legacy issues  
✅ **Complete system** - All features included  
✅ **Production-ready** - Best practices applied  

## Support

If you encounter any issues:
1. Check the SQL output for specific error messages
2. Verify you have admin/owner privileges
3. Ensure all prerequisite extensions are available
4. Contact support with the exact error message
