-- COMPREHENSIVE SECURITY VERIFICATION SCRIPT
-- Run this to verify all tables are properly secured

-- ================================================
-- 1. OVERALL SECURITY STATUS
-- ================================================
SELECT 
    '=== SECURITY OVERVIEW ===' as section,
    COUNT(*) FILTER (WHERE rowsecurity = false) as unsecured_tables,
    COUNT(*) FILTER (WHERE rowsecurity = true) as secured_tables,
    COUNT(*) as total_tables
FROM pg_tables 
WHERE schemaname = 'public';

-- ================================================
-- 2. DETAILED TABLE SECURITY STATUS
-- ================================================
SELECT 
    '=== TABLE BY TABLE STATUS ===' as section;

SELECT 
    tablename,
    CASE 
        WHEN rowsecurity = true THEN '✅ SECURED'
        ELSE '❌ EXPOSED - CRITICAL!'
    END as security_status,
    CASE 
        WHEN tablename IN ('profiles', 'user_earnings', 'api_keys', 'trend_submissions') 
        THEN 'HIGH PRIORITY'
        WHEN tablename IN ('trend_validations', 'finance_trends', 'cashout_requests')
        THEN 'HIGH PRIORITY'
        ELSE 'MEDIUM'
    END as priority
FROM pg_tables 
WHERE schemaname = 'public'
ORDER BY 
    CASE WHEN rowsecurity = false THEN 0 ELSE 1 END,
    CASE 
        WHEN tablename IN ('profiles', 'user_earnings', 'api_keys', 'trend_submissions', 'trend_validations', 'finance_trends') 
        THEN 0 
        ELSE 1 
    END,
    tablename;

-- ================================================
-- 3. CHECK CRITICAL TABLES SPECIFICALLY
-- ================================================
SELECT 
    '=== CRITICAL TABLES CHECK ===' as section;

WITH critical_tables AS (
    SELECT unnest(ARRAY[
        'profiles',
        'trend_submissions',
        'trend_validations',
        'finance_trends',
        'user_earnings',
        'api_keys',
        'cashout_requests',
        'earnings_ledger'
    ]) as tablename
)
SELECT 
    ct.tablename,
    COALESCE(
        CASE 
            WHEN pt.rowsecurity = true THEN '✅ RLS ENABLED'
            ELSE '❌ RLS DISABLED - FIX NOW!'
        END,
        '⚠️  TABLE DOES NOT EXIST'
    ) as status,
    COUNT(pp.policyname) as policy_count
FROM critical_tables ct
LEFT JOIN pg_tables pt ON pt.schemaname = 'public' AND pt.tablename = ct.tablename
LEFT JOIN pg_policies pp ON pp.schemaname = 'public' AND pp.tablename = ct.tablename
GROUP BY ct.tablename, pt.rowsecurity
ORDER BY 
    CASE 
        WHEN pt.rowsecurity IS NULL THEN 0
        WHEN pt.rowsecurity = false THEN 1
        ELSE 2
    END,
    ct.tablename;

-- ================================================
-- 4. CHECK POLICY DETAILS
-- ================================================
SELECT 
    '=== POLICY DETAILS FOR KEY TABLES ===' as section;

SELECT 
    tablename,
    policyname,
    cmd as operation,
    permissive,
    roles
FROM pg_policies 
WHERE schemaname = 'public' 
AND tablename IN ('profiles', 'trend_submissions', 'user_earnings', 'finance_trends')
ORDER BY tablename, policyname;

-- ================================================
-- 5. CHECK FOR DATA EXPOSURE RISKS
-- ================================================
SELECT 
    '=== DATA EXPOSURE RISK CHECK ===' as section;

-- Check if sensitive columns are exposed
SELECT 
    c.table_name,
    c.column_name,
    CASE 
        WHEN t.rowsecurity = false AND c.column_name IN ('user_id', 'email', 'phone', 'api_key', 'secret_key', 'password_hash')
        THEN '🚨 CRITICAL - Sensitive data exposed!'
        WHEN t.rowsecurity = false AND c.column_name LIKE '%_id'
        THEN '⚠️  WARNING - User IDs exposed'
        WHEN t.rowsecurity = true
        THEN '✅ Protected by RLS'
        ELSE '❓ Unknown status'
    END as exposure_risk
FROM information_schema.columns c
JOIN pg_tables t ON t.schemaname = c.table_schema AND t.tablename = c.table_name
WHERE c.table_schema = 'public'
AND (
    c.column_name IN ('user_id', 'email', 'phone', 'api_key', 'secret_key', 'password_hash', 'spotter_id', 'validator_id')
    OR c.column_name LIKE '%_id'
)
ORDER BY 
    CASE 
        WHEN t.rowsecurity = false AND c.column_name IN ('user_id', 'email', 'phone', 'api_key', 'secret_key', 'password_hash')
        THEN 0
        WHEN t.rowsecurity = false
        THEN 1
        ELSE 2
    END,
    c.table_name, c.column_name;

-- ================================================
-- 6. CHECK SECURE VIEWS
-- ================================================
SELECT 
    '=== SECURE PUBLIC VIEWS ===' as section;

SELECT 
    table_name as view_name,
    CASE 
        WHEN table_name IN ('public_trend_submissions', 'public_user_stats', 'trend_validation_summary')
        THEN '✅ Expected secure view'
        ELSE '❓ Custom view'
    END as status
FROM information_schema.views
WHERE table_schema = 'public'
ORDER BY table_name;

-- ================================================
-- 7. QUICK FIX COMMANDS
-- ================================================
SELECT 
    '=== QUICK FIX COMMANDS FOR EXPOSED TABLES ===' as section;

SELECT 
    'ALTER TABLE public.' || tablename || ' ENABLE ROW LEVEL SECURITY;' as fix_command
FROM pg_tables 
WHERE schemaname = 'public'
AND rowsecurity = false
ORDER BY 
    CASE 
        WHEN tablename IN ('profiles', 'user_earnings', 'api_keys', 'trend_submissions', 'trend_validations', 'finance_trends') 
        THEN 0 
        ELSE 1 
    END,
    tablename;

-- ================================================
-- 8. FINAL SUMMARY
-- ================================================
SELECT 
    '=== ACTION REQUIRED ===' as section,
    CASE 
        WHEN COUNT(*) FILTER (WHERE rowsecurity = false) = 0
        THEN '✅ ALL TABLES SECURED! Your database is protected.'
        WHEN COUNT(*) FILTER (WHERE rowsecurity = false AND tablename IN ('profiles', 'user_earnings', 'api_keys')) > 0
        THEN '🚨 CRITICAL: Sensitive tables are exposed! Run secure-all-tables-complete.sql IMMEDIATELY!'
        WHEN COUNT(*) FILTER (WHERE rowsecurity = false) > 0
        THEN '⚠️  WARNING: Some tables are unsecured. Review and apply fixes above.'
        ELSE '❓ Unable to determine security status'
    END as security_assessment,
    COUNT(*) FILTER (WHERE rowsecurity = false) as tables_to_fix
FROM pg_tables 
WHERE schemaname = 'public';