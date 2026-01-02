# RLS Policy Migration Guide

## Overview
This migration replaces all existing RLS policies with optimized versions that prevent timeout and recursion errors.

## How to Apply

### Option 1: Using Supabase Dashboard (Recommended)
1. Go to your Supabase project dashboard
2. Navigate to **SQL Editor**
3. Copy the entire contents of `20250101000000_optimized_rls_policies.sql`
4. Paste into the SQL editor
5. Click **Run** to execute

### Option 2: Using Command Line
```bash
# From project root
psql $DATABASE_URL -f supabase/migrations/20250101000000_optimized_rls_policies.sql
```

### Option 3: Using Supabase CLI
```bash
supabase db push
```

## What This Does

### Step 1: Drops All Existing Policies
Removes all current RLS policies from:
- `contributions`
- `highlights`
- `users`
- `farewells`
- `farewell_members`

### Step 2: Creates Optimized Policies

**Key Improvements:**
- ✅ No recursive queries
- ✅ Simple, indexed lookups
- ✅ Separate policies for read/write
- ✅ Public read for users table (no auth needed)
- ✅ Direct role checks without nesting

**Policy Summary:**

| Table | Policy | Access |
|-------|--------|--------|
| users | Public read | Everyone |
| users | Own update | Self only |
| farewells | Member read | Members only |
| farewells | Admin write | Admins only |
| farewell_members | Farewell read | Members of that farewell |
| farewell_members | Admin write | Admins only |
| contributions | Own read | Self |
| contributions | Admin read | Admins/Treasurers |
| contributions | Own insert | Self (must be member) |
| contributions | Admin write | Admins/Treasurers |
| highlights | Member read | All members |
| highlights | Member insert | All members |
| highlights | Admin write | Admins only |

### Step 3: Creates Performance Indexes
Adds indexes on frequently queried columns for faster lookups.

## Verification

After running the migration, verify policies are active:

```sql
SELECT 
  tablename,
  policyname,
  cmd
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename IN ('contributions', 'highlights', 'users', 'farewells', 'farewell_members')
ORDER BY tablename, policyname;
```

You should see approximately 15-20 policies across all tables.

## Testing

Test that the policies work correctly:

```sql
-- Test 1: Users can view their own contributions
SELECT * FROM contributions WHERE user_id = auth.uid();

-- Test 2: Users can view highlights for their farewells
SELECT * FROM highlights 
WHERE farewell_id IN (
  SELECT farewell_id FROM farewell_members WHERE user_id = auth.uid()
);

-- Test 3: Anyone can view user profiles
SELECT * FROM users LIMIT 10;
```

## Rollback

If you need to rollback (not recommended), you would need to restore from a backup or manually recreate the old policies.

## Expected Results

After applying these policies:
- ✅ No more timeout errors on highlights
- ✅ No more stack depth errors on contributions
- ✅ Faster query performance
- ✅ Proper access control maintained

## Troubleshooting

**If queries still timeout:**
1. Check if indexes were created: `\d+ contributions`
2. Analyze query plans: `EXPLAIN ANALYZE SELECT * FROM contributions ...`
3. Check for connections using other RLS policies: `SELECT * FROM pg_policies;`

**If access is denied:**
1. Verify user is in farewell_members table
2. Check auth.uid() is returning correct value
3. Verify farewell_id matches

## Notes

- These policies are designed to work with the current schema
- They assume `farewell_members` table has `user_id`, `farewell_id`, and `role` columns
- Public read on users table is intentional for profile viewing
- Admin roles include: 'admin', 'teacher', 'organizer'
- Treasurer role can manage contributions but not other admin tasks
