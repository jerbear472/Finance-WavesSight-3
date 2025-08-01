-- Financial Intelligence Schema Migration
-- Adds financial-specific fields and tables to support market signal tracking

-- Add financial fields to trend_submissions table
ALTER TABLE trend_submissions 
ADD COLUMN IF NOT EXISTS ticker_symbol VARCHAR(10),
ADD COLUMN IF NOT EXISTS company_mentioned VARCHAR(255),
ADD COLUMN IF NOT EXISTS market_sentiment VARCHAR(20) CHECK (market_sentiment IN ('very_bullish', 'bullish', 'neutral', 'bearish', 'very_bearish')),
ADD COLUMN IF NOT EXISTS urgency_level VARCHAR(20) CHECK (urgency_level IN ('immediate', 'short_term', 'medium_term', 'long_term')),
ADD COLUMN IF NOT EXISTS financial_impact TEXT,
ADD COLUMN IF NOT EXISTS financial_relevance_score DECIMAL(5,2) DEFAULT 0.00,
ADD COLUMN IF NOT EXISTS mentioned_tickers JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS investment_timing VARCHAR(50),
ADD COLUMN IF NOT EXISTS signal_type VARCHAR(50);

-- Create financial signals table for extracted intelligence
CREATE TABLE IF NOT EXISTS financial_signals (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    trend_id UUID REFERENCES trend_submissions(id) ON DELETE CASCADE,
    ticker VARCHAR(10) NOT NULL,
    signal_type VARCHAR(50) NOT NULL,
    signal_strength DECIMAL(5,2) NOT NULL CHECK (signal_strength >= 0 AND signal_strength <= 100),
    direction VARCHAR(20) CHECK (direction IN ('bullish', 'bearish', 'neutral')),
    catalyst TEXT,
    time_horizon VARCHAR(20) CHECK (time_horizon IN ('immediate', 'short_term', 'medium_term', 'long_term')),
    risk_level VARCHAR(20) CHECK (risk_level IN ('low', 'medium', 'high', 'extreme')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    UNIQUE(trend_id, ticker)
);

-- Create stock performance tracking table
CREATE TABLE IF NOT EXISTS stock_performance_tracking (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    signal_id UUID REFERENCES financial_signals(id) ON DELETE CASCADE,
    ticker VARCHAR(10) NOT NULL,
    price_at_signal DECIMAL(10,2),
    price_1h DECIMAL(10,2),
    price_4h DECIMAL(10,2),
    price_1d DECIMAL(10,2),
    price_7d DECIMAL(10,2),
    price_30d DECIMAL(10,2),
    percent_change_1h DECIMAL(8,2),
    percent_change_4h DECIMAL(8,2),
    percent_change_1d DECIMAL(8,2),
    percent_change_7d DECIMAL(8,2),
    percent_change_30d DECIMAL(8,2),
    accuracy_score DECIMAL(5,2),
    performance_bonus_paid DECIMAL(10,2) DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Create performance bonus payouts table
CREATE TABLE IF NOT EXISTS performance_bonus_payouts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    trend_id UUID REFERENCES trend_submissions(id) ON DELETE CASCADE,
    signal_id UUID REFERENCES financial_signals(id) ON DELETE CASCADE,
    bonus_type VARCHAR(50) NOT NULL,
    bonus_amount DECIMAL(10,2) NOT NULL,
    stock_movement_percent DECIMAL(8,2),
    time_to_movement_hours INTEGER,
    paid_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    transaction_id VARCHAR(255)
);

-- Create financial categories mapping
CREATE TABLE IF NOT EXISTS financial_category_mappings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    category_id VARCHAR(50) NOT NULL,
    display_name VARCHAR(100) NOT NULL,
    description TEXT,
    base_payment DECIMAL(10,2) NOT NULL DEFAULT 1.00,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Insert financial categories
INSERT INTO financial_category_mappings (category_id, display_name, description, base_payment) VALUES
('stocks_companies', 'Stocks & Public Companies', 'Viral content about public companies, earnings, products', 1.00),
('crypto_defi', 'Cryptocurrency & DeFi', 'Crypto pumps, DeFi protocols, blockchain projects', 3.00),
('startups_ipos', 'Startups & IPOs', 'Startup buzz, IPO rumors, funding news', 2.00),
('fintech_apps', 'Fintech & Trading Apps', 'Trading apps, payment platforms, financial tools', 1.00),
('consumer_retail', 'Consumer Products', 'Public company products, retail trends, brand sentiment', 1.00),
('restaurants_chains', 'Restaurants & Retail Chains', 'Restaurant chains, retail stores, consumer complaints', 1.00),
('gaming_entertainment', 'Gaming & Entertainment Stocks', 'Gaming companies, streaming services, entertainment stocks', 1.00),
('meme_stock', 'Meme Stocks', 'WSB favorites, short squeeze candidates', 5.00),
('insider_rumor', 'Insider/Leak Rumors', 'Potential insider information or leaked news', 10.00)
ON CONFLICT DO NOTHING;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_financial_signals_trend_id ON financial_signals(trend_id);
CREATE INDEX IF NOT EXISTS idx_financial_signals_ticker ON financial_signals(ticker);
CREATE INDEX IF NOT EXISTS idx_financial_signals_signal_type ON financial_signals(signal_type);
CREATE INDEX IF NOT EXISTS idx_stock_performance_signal_id ON stock_performance_tracking(signal_id);
CREATE INDEX IF NOT EXISTS idx_stock_performance_ticker ON stock_performance_tracking(ticker);
CREATE INDEX IF NOT EXISTS idx_performance_bonus_user_id ON performance_bonus_payouts(user_id);
CREATE INDEX IF NOT EXISTS idx_trend_submissions_ticker ON trend_submissions(ticker_symbol);
CREATE INDEX IF NOT EXISTS idx_trend_submissions_sentiment ON trend_submissions(market_sentiment);

-- Create function to calculate financial signal payment
CREATE OR REPLACE FUNCTION calculate_financial_signal_payment(
    p_category VARCHAR,
    p_urgency VARCHAR,
    p_sentiment VARCHAR,
    p_signal_type VARCHAR
) RETURNS DECIMAL AS $$
DECLARE
    base_amount DECIMAL;
BEGIN
    -- Get base payment for category
    SELECT COALESCE(base_payment, 1.00) INTO base_amount
    FROM financial_category_mappings
    WHERE category_id = p_category;
    
    -- Apply multipliers for high-value signals
    IF p_signal_type = 'short_squeeze' THEN
        base_amount := 7.50;
    ELSIF p_signal_type = 'insider_rumor' THEN
        base_amount := 10.00;
    ELSIF p_signal_type = 'meme_stock' AND p_sentiment IN ('very_bullish', 'very_bearish') THEN
        base_amount := 5.00;
    ELSIF p_category = 'crypto_defi' AND p_urgency = 'immediate' THEN
        base_amount := 3.00;
    END IF;
    
    RETURN base_amount;
END;
$$ LANGUAGE plpgsql;

-- Create RLS policies for financial tables
ALTER TABLE financial_signals ENABLE ROW LEVEL SECURITY;
ALTER TABLE stock_performance_tracking ENABLE ROW LEVEL SECURITY;
ALTER TABLE performance_bonus_payouts ENABLE ROW LEVEL SECURITY;

-- Policies for financial_signals (read-only for authenticated users)
CREATE POLICY "Users can view financial signals" ON financial_signals
    FOR SELECT USING (auth.uid() IS NOT NULL);

-- Policies for performance_bonus_payouts (users can see their own)
CREATE POLICY "Users can view their own bonuses" ON performance_bonus_payouts
    FOR SELECT USING (auth.uid() = user_id);

-- Grant permissions
GRANT SELECT ON financial_signals TO authenticated;
GRANT SELECT ON stock_performance_tracking TO authenticated;
GRANT SELECT ON performance_bonus_payouts TO authenticated;
GRANT SELECT ON financial_category_mappings TO authenticated;

-- Add trigger to update financial relevance score
CREATE OR REPLACE FUNCTION update_financial_relevance_score()
RETURNS TRIGGER AS $$
BEGIN
    -- Calculate relevance score based on financial indicators
    NEW.financial_relevance_score := 
        CASE 
            WHEN NEW.ticker_symbol IS NOT NULL THEN 30
            ELSE 0
        END +
        CASE 
            WHEN NEW.company_mentioned IS NOT NULL THEN 20
            ELSE 0
        END +
        CASE 
            WHEN NEW.market_sentiment IN ('very_bullish', 'very_bearish') THEN 20
            WHEN NEW.market_sentiment IN ('bullish', 'bearish') THEN 10
            ELSE 0
        END +
        CASE 
            WHEN NEW.urgency_level = 'immediate' THEN 20
            WHEN NEW.urgency_level = 'short_term' THEN 10
            ELSE 5
        END +
        CASE 
            WHEN NEW.category IN ('stocks_companies', 'crypto_defi', 'startups_ipos') THEN 10
            ELSE 0
        END;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_financial_relevance_score_trigger
BEFORE INSERT OR UPDATE ON trend_submissions
FOR EACH ROW
EXECUTE FUNCTION update_financial_relevance_score();