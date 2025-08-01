-- Financial Intelligence Platform Database Schema
-- Core tables for Spotters, Verifiers, AlphaScore Engine, and Alpha Provenance

-- =====================================================
-- SPOTTER SYSTEM TABLES
-- =====================================================

-- Spotter profiles with credibility tracking
CREATE TABLE IF NOT EXISTS spotters (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    display_name VARCHAR(100),
    credibility_score DECIMAL(5,2) DEFAULT 50.00 CHECK (credibility_score >= 0 AND credibility_score <= 100),
    total_signals_logged INTEGER DEFAULT 0,
    accurate_signals INTEGER DEFAULT 0,
    accuracy_rate DECIMAL(5,2) DEFAULT 0.00,
    lifetime_earnings DECIMAL(10,2) DEFAULT 0.00,
    current_tier VARCHAR(20) DEFAULT 'bronze' CHECK (current_tier IN ('bronze', 'silver', 'gold', 'platinum')),
    specialization_areas JSONB DEFAULT '[]'::jsonb,
    platform_expertise JSONB DEFAULT '{}'::jsonb, -- {"tiktok": 0.8, "reddit": 0.6, etc}
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Financial signals logged by spotters
CREATE TABLE IF NOT EXISTS alpha_signals (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    spotter_id UUID REFERENCES spotters(id) ON DELETE CASCADE,
    platform VARCHAR(50) NOT NULL CHECK (platform IN ('tiktok', 'reddit', 'discord', 'twitter', 'youtube', 'instagram', 'other')),
    source_url TEXT NOT NULL,
    asset_ticker VARCHAR(10),
    asset_type VARCHAR(20) CHECK (asset_type IN ('stock', 'crypto', 'etf', 'option', 'commodity')),
    sentiment VARCHAR(20) NOT NULL CHECK (sentiment IN ('very_bullish', 'bullish', 'neutral', 'bearish', 'very_bearish')),
    reasoning TEXT NOT NULL,
    screenshot_url TEXT,
    metadata JSONB DEFAULT '{}'::jsonb,
    virality_metrics JSONB DEFAULT '{}'::jsonb, -- {"views": 10000, "likes": 500, etc}
    signal_strength DECIMAL(5,2) DEFAULT 0.00,
    alpha_score DECIMAL(5,2), -- Calculated by AlphaScore Engine
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'verifying', 'verified', 'rejected', 'expired')),
    base_reward DECIMAL(10,2) DEFAULT 1.00,
    performance_bonus DECIMAL(10,2) DEFAULT 0.00,
    total_payout DECIMAL(10,2) GENERATED ALWAYS AS (base_reward + performance_bonus) STORED,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    verified_at TIMESTAMP WITH TIME ZONE,
    origin_timestamp TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT TIMEZONE('utc', NOW()) -- When trend was spotted
);

-- =====================================================
-- VERIFIER SYSTEM TABLES
-- =====================================================

-- Verifier profiles and performance
CREATE TABLE IF NOT EXISTS verifiers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    verifier_score DECIMAL(5,2) DEFAULT 50.00 CHECK (verifier_score >= 0 AND verifier_score <= 100),
    total_verifications INTEGER DEFAULT 0,
    consensus_accuracy DECIMAL(5,2) DEFAULT 0.00,
    expertise_areas JSONB DEFAULT '[]'::jsonb,
    verification_streak INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Signal verification votes
CREATE TABLE IF NOT EXISTS signal_verifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    signal_id UUID REFERENCES alpha_signals(id) ON DELETE CASCADE,
    verifier_id UUID REFERENCES verifiers(id) ON DELETE CASCADE,
    verdict VARCHAR(20) NOT NULL CHECK (verdict IN ('confirm', 'reject', 'refine')),
    confidence_level DECIMAL(5,2) CHECK (confidence_level >= 0 AND confidence_level <= 100),
    refinement_notes TEXT,
    suggested_ticker VARCHAR(10),
    suggested_sentiment VARCHAR(20),
    verification_metadata JSONB DEFAULT '{}'::jsonb,
    reward_earned DECIMAL(10,2) DEFAULT 0.10,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    UNIQUE(signal_id, verifier_id)
);

-- =====================================================
-- ALPHASCORE™ ENGINE TABLES
-- =====================================================

-- AlphaScore calculation components
CREATE TABLE IF NOT EXISTS alphascore_components (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    signal_id UUID REFERENCES alpha_signals(id) ON DELETE CASCADE,
    spotter_credibility_weight DECIMAL(5,2) DEFAULT 0.25,
    spotter_credibility_score DECIMAL(5,2),
    community_verification_weight DECIMAL(5,2) DEFAULT 0.20,
    community_verification_score DECIMAL(5,2),
    sentiment_velocity_weight DECIMAL(5,2) DEFAULT 0.25,
    sentiment_velocity_score DECIMAL(5,2),
    platform_signal_weight DECIMAL(5,2) DEFAULT 0.15,
    platform_signal_score DECIMAL(5,2),
    historical_similarity_weight DECIMAL(5,2) DEFAULT 0.15,
    historical_similarity_score DECIMAL(5,2),
    final_alpha_score DECIMAL(5,2) NOT NULL,
    calculation_timestamp TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    calculation_metadata JSONB DEFAULT '{}'::jsonb
);

-- Platform-specific signal weights
CREATE TABLE IF NOT EXISTS platform_weights (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    platform VARCHAR(50) PRIMARY KEY,
    weight_multiplier DECIMAL(5,2) DEFAULT 1.00,
    min_virality_threshold INTEGER DEFAULT 1000,
    trust_factor DECIMAL(5,2) DEFAULT 0.50,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- =====================================================
-- CLIENT DASHBOARD TABLES
-- =====================================================

-- Client subscriptions and access
CREATE TABLE IF NOT EXISTS client_subscriptions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    subscription_tier VARCHAR(50) NOT NULL CHECK (subscription_tier IN ('starter', 'professional', 'enterprise', 'hedge_fund')),
    api_key UUID DEFAULT uuid_generate_v4(),
    api_secret VARCHAR(255),
    allowed_ips JSONB DEFAULT '[]'::jsonb,
    rate_limit INTEGER DEFAULT 1000,
    filter_preferences JSONB DEFAULT '{}'::jsonb,
    webhook_url TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    expires_at TIMESTAMP WITH TIME ZONE
);

-- Client API usage tracking
CREATE TABLE IF NOT EXISTS api_usage (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    client_id UUID REFERENCES client_subscriptions(id) ON DELETE CASCADE,
    endpoint VARCHAR(100) NOT NULL,
    request_timestamp TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    response_time_ms INTEGER,
    status_code INTEGER,
    request_metadata JSONB DEFAULT '{}'::jsonb
);

-- =====================================================
-- ALPHA PROVENANCE ARCHIVE
-- =====================================================

-- Historical archive of all signals and outcomes
CREATE TABLE IF NOT EXISTS alpha_archive (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    signal_id UUID REFERENCES alpha_signals(id) ON DELETE CASCADE,
    asset_ticker VARCHAR(10) NOT NULL,
    signal_timestamp TIMESTAMP WITH TIME ZONE NOT NULL,
    price_at_signal DECIMAL(20,8),
    price_1h DECIMAL(20,8),
    price_4h DECIMAL(20,8),
    price_24h DECIMAL(20,8),
    price_48h DECIMAL(20,8),
    price_7d DECIMAL(20,8),
    movement_1h DECIMAL(8,2),
    movement_4h DECIMAL(8,2),
    movement_24h DECIMAL(8,2),
    movement_48h DECIMAL(8,2),
    movement_7d DECIMAL(8,2),
    outcome_classification VARCHAR(50) CHECK (outcome_classification IN ('highly_accurate', 'accurate', 'partially_accurate', 'neutral', 'inaccurate')),
    spotter_bonus_paid DECIMAL(10,2) DEFAULT 0.00,
    market_conditions JSONB DEFAULT '{}'::jsonb,
    correlated_events JSONB DEFAULT '[]'::jsonb,
    archived_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Signal similarity patterns for ML
CREATE TABLE IF NOT EXISTS signal_patterns (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    pattern_hash VARCHAR(64) UNIQUE NOT NULL,
    pattern_type VARCHAR(50),
    common_attributes JSONB NOT NULL,
    average_outcome DECIMAL(8,2),
    occurrence_count INTEGER DEFAULT 1,
    success_rate DECIMAL(5,2),
    last_seen TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- =====================================================
-- PAYMENT AND REWARDS TABLES
-- =====================================================

-- Spotter earnings ledger
CREATE TABLE IF NOT EXISTS spotter_earnings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    spotter_id UUID REFERENCES spotters(id) ON DELETE CASCADE,
    signal_id UUID REFERENCES alpha_signals(id) ON DELETE CASCADE,
    earning_type VARCHAR(50) CHECK (earning_type IN ('base_signal', 'accuracy_bonus', 'tier_bonus', 'special_achievement')),
    amount DECIMAL(10,2) NOT NULL,
    description TEXT,
    paid_out BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    paid_at TIMESTAMP WITH TIME ZONE
);

-- Verifier rewards
CREATE TABLE IF NOT EXISTS verifier_rewards (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    verifier_id UUID REFERENCES verifiers(id) ON DELETE CASCADE,
    verification_id UUID REFERENCES signal_verifications(id) ON DELETE CASCADE,
    reward_type VARCHAR(50) CHECK (reward_type IN ('verification', 'consensus_bonus', 'accuracy_bonus')),
    amount DECIMAL(10,2) NOT NULL,
    paid_out BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- =====================================================
-- INDEXES FOR PERFORMANCE
-- =====================================================

CREATE INDEX idx_alpha_signals_spotter_id ON alpha_signals(spotter_id);
CREATE INDEX idx_alpha_signals_status ON alpha_signals(status);
CREATE INDEX idx_alpha_signals_asset ON alpha_signals(asset_ticker);
CREATE INDEX idx_alpha_signals_created_at ON alpha_signals(created_at DESC);
CREATE INDEX idx_alpha_signals_alpha_score ON alpha_signals(alpha_score DESC);
CREATE INDEX idx_signal_verifications_signal_id ON signal_verifications(signal_id);
CREATE INDEX idx_alpha_archive_ticker ON alpha_archive(asset_ticker);
CREATE INDEX idx_alpha_archive_timestamp ON alpha_archive(signal_timestamp DESC);
CREATE INDEX idx_alpha_archive_outcome ON alpha_archive(outcome_classification);

-- =====================================================
-- ROW LEVEL SECURITY POLICIES
-- =====================================================

ALTER TABLE spotters ENABLE ROW LEVEL SECURITY;
ALTER TABLE alpha_signals ENABLE ROW LEVEL SECURITY;
ALTER TABLE verifiers ENABLE ROW LEVEL SECURITY;
ALTER TABLE signal_verifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE client_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE alpha_archive ENABLE ROW LEVEL SECURITY;

-- Spotters can view their own profile and signals
CREATE POLICY "Spotters view own data" ON spotters
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Spotters manage own signals" ON alpha_signals
    FOR ALL USING (
        EXISTS (SELECT 1 FROM spotters WHERE spotters.id = alpha_signals.spotter_id AND spotters.user_id = auth.uid())
    );

-- Verifiers can view signals to verify
CREATE POLICY "Verifiers view pending signals" ON alpha_signals
    FOR SELECT USING (
        status IN ('pending', 'verifying') AND
        EXISTS (SELECT 1 FROM verifiers WHERE verifiers.user_id = auth.uid() AND verifiers.is_active = true)
    );

-- Clients can view verified signals based on subscription
CREATE POLICY "Clients view signals" ON alpha_signals
    FOR SELECT USING (
        status = 'verified' AND
        EXISTS (SELECT 1 FROM client_subscriptions WHERE client_subscriptions.organization_id = auth.uid() AND client_subscriptions.is_active = true)
    );

-- =====================================================
-- FUNCTIONS AND TRIGGERS
-- =====================================================

-- Function to calculate AlphaScore
CREATE OR REPLACE FUNCTION calculate_alpha_score(signal_id UUID)
RETURNS DECIMAL AS $$
DECLARE
    v_spotter_credibility DECIMAL;
    v_community_score DECIMAL;
    v_sentiment_velocity DECIMAL;
    v_platform_weight DECIMAL;
    v_historical_similarity DECIMAL;
    v_alpha_score DECIMAL;
BEGIN
    -- Get spotter credibility
    SELECT s.credibility_score INTO v_spotter_credibility
    FROM alpha_signals a
    JOIN spotters s ON a.spotter_id = s.id
    WHERE a.id = signal_id;
    
    -- Calculate community verification score
    SELECT 
        CASE 
            WHEN COUNT(*) = 0 THEN 50.00
            ELSE (SUM(CASE WHEN verdict = 'confirm' THEN 1 ELSE 0 END)::DECIMAL / COUNT(*)::DECIMAL) * 100
        END INTO v_community_score
    FROM signal_verifications
    WHERE signal_verifications.signal_id = signal_id;
    
    -- Get platform weight (simplified for now)
    SELECT COALESCE(pw.weight_multiplier, 1.0) * 50 INTO v_platform_weight
    FROM alpha_signals a
    LEFT JOIN platform_weights pw ON a.platform = pw.platform
    WHERE a.id = signal_id;
    
    -- Sentiment velocity and historical similarity would be calculated here
    v_sentiment_velocity := 50.00; -- Placeholder
    v_historical_similarity := 50.00; -- Placeholder
    
    -- Calculate weighted AlphaScore
    v_alpha_score := (
        (v_spotter_credibility * 0.25) +
        (v_community_score * 0.20) +
        (v_sentiment_velocity * 0.25) +
        (v_platform_weight * 0.15) +
        (v_historical_similarity * 0.15)
    );
    
    -- Update the signal with the calculated score
    UPDATE alpha_signals SET alpha_score = v_alpha_score WHERE id = signal_id;
    
    -- Store calculation components
    INSERT INTO alphascore_components (
        signal_id,
        spotter_credibility_score,
        community_verification_score,
        sentiment_velocity_score,
        platform_signal_score,
        historical_similarity_score,
        final_alpha_score
    ) VALUES (
        signal_id,
        v_spotter_credibility,
        v_community_score,
        v_sentiment_velocity,
        v_platform_weight,
        v_historical_similarity,
        v_alpha_score
    );
    
    RETURN v_alpha_score;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update spotter stats after signal outcome
CREATE OR REPLACE FUNCTION update_spotter_accuracy()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE spotters 
    SET 
        accurate_signals = accurate_signals + CASE 
            WHEN NEW.outcome_classification IN ('highly_accurate', 'accurate') THEN 1 
            ELSE 0 
        END,
        accuracy_rate = (accurate_signals::DECIMAL / NULLIF(total_signals_logged, 0)::DECIMAL) * 100
    WHERE id = (SELECT spotter_id FROM alpha_signals WHERE id = NEW.signal_id);
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_spotter_accuracy_trigger
AFTER INSERT ON alpha_archive
FOR EACH ROW
EXECUTE FUNCTION update_spotter_accuracy();

-- Insert default platform weights
INSERT INTO platform_weights (platform, weight_multiplier, min_virality_threshold, trust_factor) VALUES
('tiktok', 1.50, 10000, 0.70),
('reddit', 1.20, 1000, 0.80),
('discord', 1.30, 100, 0.75),
('twitter', 1.00, 5000, 0.60),
('youtube', 0.90, 50000, 0.65),
('instagram', 0.80, 10000, 0.55),
('other', 0.70, 0, 0.50)
ON CONFLICT (platform) DO NOTHING;