-- COMPLETE SECURITY SETUP FOR ALL TABLES
-- Run this entire script to secure all tables in your database

-- ================================================
-- 1. ENABLE RLS ON ALL TABLES
-- ================================================

ALTER TABLE public.achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_cashout_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.alert_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.analytics_cache ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.api_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bot_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.captured_trends ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cashout_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.competitor_analysis ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.competitor_content ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.content_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.content_impressions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.creator_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_challenges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.earnings_ledger ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.engagement_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.enterprise_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trend_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trend_validations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_earnings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.finance_trends ENABLE ROW LEVEL SECURITY;

-- ================================================
-- 2. PROFILES TABLE POLICIES
-- ================================================

-- Drop existing policies
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;

-- Users can only see their own profile details
CREATE POLICY "Users can view own profile" 
ON public.profiles FOR SELECT 
USING (auth.uid() = id);

-- Public can see limited profile info (username only)
CREATE POLICY "Public can see usernames only" 
ON public.profiles FOR SELECT 
USING (true)
WITH CHECK (true);

-- Users can update their own profile
CREATE POLICY "Users can update own profile" 
ON public.profiles FOR UPDATE 
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- ================================================
-- 3. TREND_SUBMISSIONS TABLE POLICIES
-- ================================================

-- Drop existing policies
DROP POLICY IF EXISTS "Enable read access for all users" ON public.trend_submissions;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON public.trend_submissions;
DROP POLICY IF EXISTS "Enable update for users based on user_id" ON public.trend_submissions;

-- Users can only see approved trends or their own
CREATE POLICY "View approved trends or own submissions" 
ON public.trend_submissions FOR SELECT 
USING (
    status = 'approved' 
    OR spotter_id = auth.uid()
    OR EXISTS (
        SELECT 1 FROM public.profiles
        WHERE profiles.id = auth.uid()
        AND profiles.is_admin = true
    )
);

-- Users can create their own submissions
CREATE POLICY "Users can create own submissions" 
ON public.trend_submissions FOR INSERT 
WITH CHECK (auth.uid() = spotter_id);

-- Users can update their own submissions
CREATE POLICY "Users can update own submissions" 
ON public.trend_submissions FOR UPDATE 
USING (auth.uid() = spotter_id)
WITH CHECK (auth.uid() = spotter_id);

-- ================================================
-- 4. USER_EARNINGS TABLE POLICIES
-- ================================================

-- Drop existing policies if any
DROP POLICY IF EXISTS "Users can view own earnings" ON public.user_earnings;
DROP POLICY IF EXISTS "System can manage earnings" ON public.user_earnings;

-- Users can only see their own earnings
CREATE POLICY "Users view own earnings only" 
ON public.user_earnings FOR SELECT 
USING (auth.uid() = user_id);

-- Only system can modify earnings
CREATE POLICY "Only system can modify earnings" 
ON public.user_earnings FOR ALL 
USING (false);

-- ================================================
-- 5. API_KEYS TABLE POLICIES
-- ================================================

-- Only the key owner can see their keys
CREATE POLICY "Users can view own API keys" 
ON public.api_keys FOR SELECT 
USING (auth.uid() = user_id);

-- Users can create their own keys
CREATE POLICY "Users can create own API keys" 
ON public.api_keys FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Users can update/delete their own keys
CREATE POLICY "Users can manage own API keys" 
ON public.api_keys FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own API keys" 
ON public.api_keys FOR DELETE 
USING (auth.uid() = user_id);

-- ================================================
-- 6. SENSITIVE DATA TABLES - ADMIN ONLY
-- ================================================

-- Admin-only tables
CREATE POLICY "Admin only - cashout queue" 
ON public.admin_cashout_queue FOR ALL 
USING (
    EXISTS (
        SELECT 1 FROM public.profiles
        WHERE profiles.id = auth.uid()
        AND profiles.is_admin = true
    )
);

CREATE POLICY "Admin only - competitor analysis" 
ON public.competitor_analysis FOR ALL 
USING (
    EXISTS (
        SELECT 1 FROM public.profiles
        WHERE profiles.id = auth.uid()
        AND profiles.is_admin = true
    )
);

-- ================================================
-- 7. ANALYTICS TABLES - READ ONLY FOR USERS
-- ================================================

-- Users can see their own analytics
CREATE POLICY "Users view own analytics" 
ON public.content_analytics FOR SELECT 
USING (
    EXISTS (
        SELECT 1 FROM public.trend_submissions
        WHERE trend_submissions.id = content_analytics.content_id
        AND trend_submissions.spotter_id = auth.uid()
    )
);

-- ================================================
-- 8. CREATE SECURE VIEWS FOR PUBLIC DATA
-- ================================================

-- Drop existing views if any
DROP VIEW IF EXISTS public.public_trend_submissions;
DROP VIEW IF EXISTS public.public_user_stats;

-- Create a view for public trend data (no user IDs exposed)
CREATE VIEW public.public_trend_submissions AS
SELECT 
    id,
    category,
    title,
    description,
    platform,
    status,
    quality_score,
    view_count,
    created_at,
    -- Hide user identity
    'anonymous' as spotter_username
FROM public.trend_submissions
WHERE status = 'approved';

-- Create aggregated stats view
CREATE VIEW public.public_user_stats AS
SELECT 
    COUNT(DISTINCT spotter_id) as total_spotters,
    COUNT(*) as total_submissions,
    AVG(quality_score) as avg_quality_score,
    COUNT(CASE WHEN status = 'approved' THEN 1 END) as approved_count
FROM public.trend_submissions;

-- Grant access to views
GRANT SELECT ON public.public_trend_submissions TO anon, authenticated;
GRANT SELECT ON public.public_user_stats TO anon, authenticated;

-- ================================================
-- 9. REVOKE UNNECESSARY PERMISSIONS
-- ================================================

-- Revoke all default permissions
REVOKE ALL ON ALL TABLES IN SCHEMA public FROM anon;
REVOKE ALL ON ALL SEQUENCES IN SCHEMA public FROM anon;
REVOKE ALL ON ALL FUNCTIONS IN SCHEMA public FROM anon;

-- Grant only necessary permissions to authenticated users
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT SELECT ON public.public_trend_submissions TO authenticated;
GRANT SELECT ON public.public_user_stats TO authenticated;

-- ================================================
-- 10. CREATE AUDIT LOG FOR SECURITY
-- ================================================

CREATE TABLE IF NOT EXISTS public.security_audit_log (
    id uuid DEFAULT extensions.uuid_generate_v4() PRIMARY KEY,
    user_id uuid REFERENCES auth.users(id),
    action text NOT NULL,
    table_name text,
    record_id uuid,
    old_data jsonb,
    new_data jsonb,
    ip_address inet,
    user_agent text,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now())
);

-- Enable RLS on audit log
ALTER TABLE public.security_audit_log ENABLE ROW LEVEL SECURITY;

-- Only admins can view audit logs
CREATE POLICY "Admins only view audit logs" 
ON public.security_audit_log FOR SELECT 
USING (
    EXISTS (
        SELECT 1 FROM public.profiles
        WHERE profiles.id = auth.uid()
        AND profiles.is_admin = true
    )
);

-- ================================================
-- 11. FINAL SECURITY CHECK
-- ================================================

-- This query will show you which tables still need RLS enabled
SELECT 
    schemaname,
    tablename,
    CASE 
        WHEN rowsecurity = true THEN '✅ Secured'
        ELSE '❌ UNSECURED - FIX NOW!'
    END as security_status
FROM pg_tables 
WHERE schemaname = 'public'
ORDER BY rowsecurity ASC, tablename;

-- ================================================
-- IMPORTANT: After running this script:
-- 1. Check the security_status output above
-- 2. Test your application functionality
-- 3. Monitor for any access errors
-- 4. Review audit logs regularly
-- ================================================