-- Verify Security Implementation

-- 1. Check if RLS is enabled on all important tables
SELECT 
    schemaname,
    tablename,
    rowsecurity as "RLS Enabled"
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN (
    'profiles',
    'trend_submissions',
    'trend_validations',
    'finance_trends',
    'user_earnings'
)
ORDER BY tablename;

-- 2. Check all policies on trend_validations
SELECT 
    policyname as "Policy Name",
    cmd as "Command",
    permissive as "Permissive",
    roles as "Roles"
FROM pg_policies 
WHERE schemaname = 'public' 
AND tablename = 'trend_validations'
ORDER BY policyname;

-- 3. Check for any duplicate votes (should return 0 rows)
SELECT 
    validator_id,
    trend_id,
    COUNT(*) as vote_count
FROM public.trend_validations
GROUP BY validator_id, trend_id
HAVING COUNT(*) > 1;

-- 4. Check if the summary view was created
SELECT 
    table_schema,
    table_name,
    table_type
FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name = 'trend_validation_summary';

-- 5. Test the can_validate_trend function exists
SELECT 
    routine_name,
    routine_type,
    data_type
FROM information_schema.routines
WHERE routine_schema = 'public'
AND routine_name = 'can_validate_trend';

-- 6. Check indexes on trend_validations
SELECT 
    indexname,
    indexdef
FROM pg_indexes
WHERE schemaname = 'public'
AND tablename = 'trend_validations';

-- 7. Quick count of validations by status
SELECT 
    vote,
    COUNT(*) as count,
    AVG(confidence_score) as avg_confidence
FROM public.trend_validations
GROUP BY vote
ORDER BY count DESC;

-- 8. Check if finance_trends table exists and has RLS
SELECT 
    EXISTS (
        SELECT 1 
        FROM pg_tables 
        WHERE schemaname = 'public' 
        AND tablename = 'finance_trends'
        AND rowsecurity = true
    ) as "Finance Trends Table Secured";

-- If all checks pass, you should see:
-- ✅ RLS enabled on all tables
-- ✅ Multiple policies on trend_validations
-- ✅ No duplicate votes
-- ✅ Summary view exists
-- ✅ Validation function exists
-- ✅ Proper indexes in place