-- Create finance trends schema for structured submission form
-- This schema supports the 3-page finance trend submission flow
-- FIXED VERSION: Removed dependency on 'role' column

-- Drop existing tables if they exist (for clean migration)
DROP TABLE IF EXISTS finance_trend_verifications CASCADE;
DROP TABLE IF EXISTS finance_trends CASCADE;
DROP TYPE IF EXISTS signal_type CASCADE;
DROP TYPE IF EXISTS market_sentiment CASCADE;
DROP TYPE IF EXISTS investment_timeline CASCADE;
DROP TYPE IF EXISTS catalyst_type CASCADE;
DROP TYPE IF EXISTS geographic_signal CASCADE;
DROP TYPE IF EXISTS spread_velocity CASCADE;

-- Create ENUM types for structured fields
CREATE TYPE signal_type AS ENUM (
    'meme_stock_momentum',     -- $5.00 base
    'crypto_pump_signal',      -- $3.00 base
    'earnings_ipo_buzz',       -- $2.00 base
    'company_going_viral',     -- $2.00 base
    'consumer_product_buzz',   -- $1.50 base
    'app_tech_adoption',       -- $1.50 base
    'restaurant_retail_buzz',  -- $1.00 base
    'general_stock_mention'    -- $1.00 base
);

CREATE TYPE market_sentiment AS ENUM (
    'extremely_bullish',  -- moon/pump energy
    'bullish',           -- positive/optimistic
    'neutral',           -- mixed
    'bearish',           -- negative/concerned
    'extremely_bearish'  -- crash/dump energy
);

CREATE TYPE investment_timeline AS ENUM (
    'immediate',     -- 0-24 hours
    'short_term',    -- 1-7 days
    'medium_term',   -- 1-4 weeks
    'long_term',     -- 1-3 months
    'unknown'        -- unclear
);

CREATE TYPE catalyst_type AS ENUM (
    'earnings_approaching',
    'news_announcement',
    'product_launch',
    'partnership_rumors',
    'regulatory_decision',
    'technical_breakout',
    'meme_social_momentum',
    'none'
);

CREATE TYPE geographic_signal AS ENUM (
    'global',
    'us_focused',
    'major_cities',
    'college_campuses',
    'suburban',
    'specific_region'
);

CREATE TYPE spread_velocity AS ENUM (
    'just_starting',    -- first posts appearing
    'picking_up',       -- gaining momentum
    'viral',           -- everywhere on platform
    'saturated',       -- brands/media jumping in
    'declining'        -- losing steam
);

-- Main finance trends table
CREATE TABLE finance_trends (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    
    -- Page 1: Basic Trend Info
    trend_name TEXT NOT NULL,
    platform TEXT NOT NULL,
    primary_link TEXT NOT NULL,
    company_mentioned TEXT,
    ticker_symbol TEXT,
    
    -- Page 2: Financial Signals
    signal_type signal_type NOT NULL,
    viral_evidence TEXT[] DEFAULT '{}',
    market_sentiment market_sentiment DEFAULT 'neutral',
    drivers TEXT[] DEFAULT '{}',
    
    -- Page 3: Market Impact
    spread_velocity spread_velocity DEFAULT 'just_starting',
    investment_timeline investment_timeline DEFAULT 'unknown',
    catalyst_type catalyst_type DEFAULT 'none',
    cross_platform TEXT[] DEFAULT '{}',
    purchase_intent_signals TEXT[] DEFAULT '{}',
    
    -- Bonus Fields (Optional)
    geographic_signal geographic_signal,
    demographics TEXT[] DEFAULT '{}',
    technical_context TEXT,
    
    -- Calculated Fields
    base_payout DECIMAL(10,2),
    viral_multiplier DECIMAL(3,2) DEFAULT 1.0,
    bonus_payout DECIMAL(10,2) DEFAULT 0.0,
    calculated_payout DECIMAL(10,2),
    financial_relevance_score INTEGER DEFAULT 0,
    quality_score INTEGER DEFAULT 0,
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    verified_at TIMESTAMP WITH TIME ZONE,
    verification_status TEXT DEFAULT 'pending' CHECK (verification_status IN ('pending', 'verified', 'rejected')),
    rejection_reason TEXT,
    
    -- Additional metadata from social post
    creator_handle TEXT,
    creator_name TEXT,
    post_caption TEXT,
    likes_count INTEGER DEFAULT 0,
    comments_count INTEGER DEFAULT 0,
    shares_count INTEGER DEFAULT 0,
    views_count INTEGER DEFAULT 0,
    hashtags TEXT[] DEFAULT '{}',
    thumbnail_url TEXT,
    posted_at TIMESTAMP WITH TIME ZONE,
    
    -- Search and analytics
    search_vector tsvector GENERATED ALWAYS AS (
        setweight(to_tsvector('english', COALESCE(trend_name, '')), 'A') ||
        setweight(to_tsvector('english', COALESCE(company_mentioned, '')), 'B') ||
        setweight(to_tsvector('english', COALESCE(ticker_symbol, '')), 'B') ||
        setweight(to_tsvector('english', COALESCE(post_caption, '')), 'C')
    ) STORED
);

-- Create indexes for performance
CREATE INDEX idx_finance_trends_user_id ON finance_trends(user_id);
CREATE INDEX idx_finance_trends_signal_type ON finance_trends(signal_type);
CREATE INDEX idx_finance_trends_ticker ON finance_trends(ticker_symbol) WHERE ticker_symbol IS NOT NULL;
CREATE INDEX idx_finance_trends_company ON finance_trends(company_mentioned) WHERE company_mentioned IS NOT NULL;
CREATE INDEX idx_finance_trends_platform ON finance_trends(platform);
CREATE INDEX idx_finance_trends_created_at ON finance_trends(created_at DESC);
CREATE INDEX idx_finance_trends_verification_status ON finance_trends(verification_status);
CREATE INDEX idx_finance_trends_quality_score ON finance_trends(quality_score DESC);
CREATE INDEX idx_finance_trends_search ON finance_trends USING GIN(search_vector);

-- Verification table for quality control
CREATE TABLE finance_trend_verifications (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    trend_id UUID REFERENCES finance_trends(id) ON DELETE CASCADE,
    verifier_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    
    -- Verification questions
    financial_relevance TEXT CHECK (financial_relevance IN ('highly_relevant', 'somewhat_relevant', 'low_relevance', 'not_financial')),
    viral_evidence_quality TEXT CHECK (viral_evidence_quality IN ('strong', 'some', 'weak', 'none')),
    signal_quality TEXT CHECK (signal_quality IN ('actionable', 'interesting', 'generic', 'spam')),
    
    -- Additional feedback
    notes TEXT,
    verified_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(trend_id, verifier_id)
);

-- Function to calculate payout based on signal type
CREATE OR REPLACE FUNCTION calculate_finance_trend_payout(trend finance_trends) 
RETURNS TABLE (
    base_payout DECIMAL(10,2),
    viral_multiplier DECIMAL(3,2),
    bonus_payout DECIMAL(10,2),
    total_payout DECIMAL(10,2)
) AS $$
DECLARE
    v_base_payout DECIMAL(10,2);
    v_viral_multiplier DECIMAL(3,2) := 1.0;
    v_bonus_payout DECIMAL(10,2) := 0.0;
    v_evidence_count INTEGER;
BEGIN
    -- Calculate base payout based on signal type
    v_base_payout := CASE trend.signal_type
        WHEN 'meme_stock_momentum' THEN 5.00
        WHEN 'crypto_pump_signal' THEN 3.00
        WHEN 'earnings_ipo_buzz' THEN 2.00
        WHEN 'company_going_viral' THEN 2.00
        WHEN 'consumer_product_buzz' THEN 1.50
        WHEN 'app_tech_adoption' THEN 1.50
        WHEN 'restaurant_retail_buzz' THEN 1.00
        WHEN 'general_stock_mention' THEN 1.00
        ELSE 1.00
    END;
    
    -- Calculate viral evidence multiplier
    v_evidence_count := array_length(trend.viral_evidence, 1);
    IF v_evidence_count >= 5 THEN
        v_viral_multiplier := 2.0;  -- +100%
    ELSIF v_evidence_count >= 3 THEN
        v_viral_multiplier := 1.5;  -- +50%
    END IF;
    
    -- Special bonus for cross-platform + high engagement
    IF array_length(trend.cross_platform, 1) > 0 AND 'high_engagement' = ANY(trend.viral_evidence) THEN
        v_viral_multiplier := GREATEST(v_viral_multiplier, 1.75);  -- +75%
    END IF;
    
    -- Calculate bonus payouts
    IF trend.geographic_signal IS NOT NULL THEN
        v_bonus_payout := v_bonus_payout + 0.25;
    END IF;
    
    IF array_length(trend.demographics, 1) > 0 THEN
        v_bonus_payout := v_bonus_payout + 0.50;
    END IF;
    
    IF trend.technical_context IS NOT NULL THEN
        v_bonus_payout := v_bonus_payout + 0.75;
    END IF;
    
    -- Special bonus for all three bonus fields
    IF trend.geographic_signal IS NOT NULL 
       AND array_length(trend.demographics, 1) > 0 
       AND trend.technical_context IS NOT NULL THEN
        v_bonus_payout := 2.00;  -- Fixed $2.00 for all three
    END IF;
    
    RETURN QUERY SELECT 
        v_base_payout,
        v_viral_multiplier,
        v_bonus_payout,
        (v_base_payout * v_viral_multiplier) + v_bonus_payout;
END;
$$ LANGUAGE plpgsql;

-- Function to calculate quality score
CREATE OR REPLACE FUNCTION calculate_finance_trend_quality_score(trend finance_trends) 
RETURNS INTEGER AS $$
DECLARE
    v_score INTEGER := 50;  -- Base score
    v_signal_value INTEGER;
    v_evidence_strength INTEGER;
    v_bonus_value INTEGER;
    v_cross_platform_value INTEGER;
BEGIN
    -- Signal type value (10-30 points)
    v_signal_value := CASE trend.signal_type
        WHEN 'meme_stock_momentum' THEN 30
        WHEN 'crypto_pump_signal' THEN 25
        WHEN 'earnings_ipo_buzz' THEN 20
        WHEN 'company_going_viral' THEN 20
        WHEN 'consumer_product_buzz' THEN 15
        WHEN 'app_tech_adoption' THEN 15
        WHEN 'restaurant_retail_buzz' THEN 10
        WHEN 'general_stock_mention' THEN 10
        ELSE 10
    END;
    
    -- Evidence strength (5-25 points)
    v_evidence_strength := LEAST(array_length(trend.viral_evidence, 1) * 5, 25);
    
    -- Bonus fields (5-15 points)
    v_bonus_value := 0;
    IF trend.geographic_signal IS NOT NULL THEN
        v_bonus_value := v_bonus_value + 5;
    END IF;
    IF array_length(trend.demographics, 1) > 0 THEN
        v_bonus_value := v_bonus_value + 5;
    END IF;
    IF trend.technical_context IS NOT NULL THEN
        v_bonus_value := v_bonus_value + 5;
    END IF;
    
    -- Cross-platform (5-10 points)
    v_cross_platform_value := LEAST(array_length(trend.cross_platform, 1) * 2 + 5, 10);
    
    -- Calculate total score
    v_score := v_score + v_signal_value + v_evidence_strength + v_bonus_value + v_cross_platform_value;
    
    RETURN LEAST(v_score, 100);  -- Cap at 100
END;
$$ LANGUAGE plpgsql;

-- Trigger to update calculated fields
CREATE OR REPLACE FUNCTION update_finance_trend_calculations()
RETURNS TRIGGER AS $$
DECLARE
    payout_calc RECORD;
BEGIN
    -- Calculate payout
    SELECT * INTO payout_calc FROM calculate_finance_trend_payout(NEW);
    
    NEW.base_payout := payout_calc.base_payout;
    NEW.viral_multiplier := payout_calc.viral_multiplier;
    NEW.bonus_payout := payout_calc.bonus_payout;
    NEW.calculated_payout := payout_calc.total_payout;
    
    -- Calculate quality score
    NEW.quality_score := calculate_finance_trend_quality_score(NEW);
    
    -- Calculate financial relevance score (simplified for now)
    NEW.financial_relevance_score := CASE
        WHEN NEW.ticker_symbol IS NOT NULL THEN 20
        ELSE 0
    END + CASE
        WHEN NEW.company_mentioned IS NOT NULL THEN 20
        ELSE 0
    END + CASE
        WHEN NEW.signal_type IN ('meme_stock_momentum', 'crypto_pump_signal', 'earnings_ipo_buzz') THEN 30
        WHEN NEW.signal_type IN ('company_going_viral', 'consumer_product_buzz') THEN 20
        ELSE 10
    END + CASE
        WHEN NEW.market_sentiment IN ('extremely_bullish', 'extremely_bearish') THEN 20
        WHEN NEW.market_sentiment IN ('bullish', 'bearish') THEN 10
        ELSE 5
    END + CASE
        WHEN NEW.investment_timeline = 'immediate' THEN 10
        WHEN NEW.investment_timeline = 'short_term' THEN 8
        WHEN NEW.investment_timeline = 'medium_term' THEN 5
        ELSE 2
    END;
    
    -- Update timestamp
    NEW.updated_at := NOW();
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_finance_trend_calculations_trigger
BEFORE INSERT OR UPDATE ON finance_trends
FOR EACH ROW
EXECUTE FUNCTION update_finance_trend_calculations();

-- RLS Policies
ALTER TABLE finance_trends ENABLE ROW LEVEL SECURITY;
ALTER TABLE finance_trend_verifications ENABLE ROW LEVEL SECURITY;

-- Users can create their own finance trends
CREATE POLICY "Users can create finance trends" ON finance_trends
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can view their own finance trends
CREATE POLICY "Users can view own finance trends" ON finance_trends
    FOR SELECT USING (auth.uid() = user_id);

-- Users can update their own pending finance trends
CREATE POLICY "Users can update own pending finance trends" ON finance_trends
    FOR UPDATE USING (auth.uid() = user_id AND verification_status = 'pending');

-- Verified trends are public
CREATE POLICY "Verified finance trends are public" ON finance_trends
    FOR SELECT USING (verification_status = 'verified');

-- Only admins can create verifications (simplified - checks is_admin only)
CREATE POLICY "Admins can create verifications" ON finance_trend_verifications
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() 
            AND is_admin = true
        )
    );

-- Grant permissions
GRANT ALL ON finance_trends TO authenticated;
GRANT ALL ON finance_trend_verifications TO authenticated;
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- Add user_earnings table if it doesn't exist
CREATE TABLE IF NOT EXISTS user_earnings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE UNIQUE,
    available_earnings DECIMAL(10,2) DEFAULT 0.00,
    pending_earnings DECIMAL(10,2) DEFAULT 0.00,
    total_cashed_out DECIMAL(10,2) DEFAULT 0.00,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on user_earnings
ALTER TABLE user_earnings ENABLE ROW LEVEL SECURITY;

-- Users can view their own earnings
CREATE POLICY "Users can view own earnings" ON user_earnings
    FOR SELECT USING (auth.uid() = user_id);

-- Users can update their own earnings (for the system)
CREATE POLICY "Users can update own earnings" ON user_earnings
    FOR UPDATE USING (auth.uid() = user_id);

-- Function to transfer pending to available earnings
CREATE OR REPLACE FUNCTION transfer_pending_to_available(
    p_user_id UUID,
    p_amount DECIMAL(10,2)
) RETURNS void AS $$
BEGIN
    UPDATE user_earnings
    SET 
        pending_earnings = pending_earnings - p_amount,
        available_earnings = available_earnings + p_amount,
        updated_at = NOW()
    WHERE user_id = p_user_id;
END;
$$ LANGUAGE plpgsql;

-- Success message
DO $$
BEGIN
    RAISE NOTICE 'Finance trends schema created successfully!';
END $$;