-- Create finance_trends table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.finance_trends (
    id uuid DEFAULT extensions.uuid_generate_v4() PRIMARY KEY,
    user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    
    -- Basic Info
    trend_name text NOT NULL,
    platform text NOT NULL,
    primary_link text NOT NULL,
    
    -- Financial Signals
    company_mentioned text,
    ticker_symbol text,
    signal_type text NOT NULL,
    viral_evidence text[] DEFAULT '{}',
    market_sentiment text DEFAULT 'neutral',
    drivers text[] DEFAULT '{}',
    spread_velocity text DEFAULT 'just_starting',
    investment_timeline text DEFAULT 'unknown',
    catalyst_type text,
    
    -- Additional Data
    cross_platform text[] DEFAULT '{}',
    purchase_intent_signals text[] DEFAULT '{}',
    geographic_signal text,
    demographics text[] DEFAULT '{}',
    technical_context text,
    
    -- Social Media Metadata
    creator_handle text,
    creator_name text,
    post_caption text,
    likes_count integer DEFAULT 0,
    comments_count integer DEFAULT 0,
    shares_count integer DEFAULT 0,
    views_count integer DEFAULT 0,
    hashtags text[] DEFAULT '{}',
    thumbnail_url text,
    posted_at timestamp with time zone,
    
    -- System Fields
    calculated_payout decimal(10,2) DEFAULT 1.00,
    verification_status text DEFAULT 'pending',
    verified_at timestamp with time zone,
    rejection_reason text,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now())
);

-- Create user_earnings table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.user_earnings (
    id uuid DEFAULT extensions.uuid_generate_v4() PRIMARY KEY,
    user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE UNIQUE NOT NULL,
    pending_earnings decimal(10,2) DEFAULT 0.00,
    available_earnings decimal(10,2) DEFAULT 0.00,
    total_earned decimal(10,2) DEFAULT 0.00,
    total_cashed_out decimal(10,2) DEFAULT 0.00,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now())
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_finance_trends_user_id ON public.finance_trends(user_id);
CREATE INDEX IF NOT EXISTS idx_finance_trends_verification_status ON public.finance_trends(verification_status);
CREATE INDEX IF NOT EXISTS idx_finance_trends_created_at ON public.finance_trends(created_at DESC);

-- Enable RLS
ALTER TABLE public.finance_trends ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_earnings ENABLE ROW LEVEL SECURITY;

-- RLS Policies for finance_trends
CREATE POLICY "Users can view their own finance trends" ON public.finance_trends
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own finance trends" ON public.finance_trends
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all finance trends" ON public.finance_trends
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid()
            AND profiles.is_admin = true
        )
    );

CREATE POLICY "Admins can update finance trends" ON public.finance_trends
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid()
            AND profiles.is_admin = true
        )
    );

-- RLS Policies for user_earnings
CREATE POLICY "Users can view their own earnings" ON public.user_earnings
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "System can manage earnings" ON public.user_earnings
    FOR ALL USING (true);

-- Grant permissions
GRANT USAGE ON SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA public TO postgres, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO postgres, service_role;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO postgres, service_role;

-- Grant specific permissions for authenticated users
GRANT SELECT, INSERT ON public.finance_trends TO authenticated;
GRANT SELECT ON public.user_earnings TO authenticated;

-- Create function to handle updated_at
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers
CREATE TRIGGER set_finance_trends_updated_at
    BEFORE UPDATE ON public.finance_trends
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_user_earnings_updated_at
    BEFORE UPDATE ON public.user_earnings
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();