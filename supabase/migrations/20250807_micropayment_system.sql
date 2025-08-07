-- Migration: Implement micro-payment system and gamification
-- Date: 2025-08-07

-- 1. Update cashout minimum to $5
UPDATE public.cashout_requests 
SET status = 'cancelled', cancelled_reason = 'System update: minimum lowered to $5'
WHERE status = 'pending' AND amount < 10.00;

-- Update the validation function for new minimum
CREATE OR REPLACE FUNCTION public.validate_cashout_request(
  p_user_id UUID,
  p_amount DECIMAL
)
RETURNS JSONP
AS $$
DECLARE
  v_balance RECORD;
  v_pending_count INTEGER;
BEGIN
  -- Get user balance
  SELECT * INTO v_balance
  FROM public.user_payment_summary
  WHERE user_id = p_user_id;
  
  -- Check minimum amount (lowered to $5)
  IF p_amount < 5.00 THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Minimum cashout amount is $5.00'
    );
  END IF;
  
  -- Check available balance
  IF v_balance.available_balance < p_amount THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Insufficient balance'
    );
  END IF;
  
  -- Check for pending requests
  SELECT COUNT(*) INTO v_pending_count
  FROM public.cashout_requests
  WHERE user_id = p_user_id AND status = 'pending';
  
  IF v_pending_count > 0 THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'You already have a pending cashout request'
    );
  END IF;
  
  RETURN jsonb_build_object('success', true);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Create daily challenges table
CREATE TABLE IF NOT EXISTS public.daily_challenges (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  challenge_date DATE NOT NULL,
  challenge_type TEXT NOT NULL, -- 'submit_x_trends', 'validate_x_trends', 'category_specific', etc
  challenge_data JSONB NOT NULL, -- {target: 5, category: 'crypto', etc}
  difficulty TEXT CHECK (difficulty IN ('easy', 'medium', 'hard')),
  progress INTEGER DEFAULT 0,
  target INTEGER NOT NULL,
  reward_amount DECIMAL(10,2) NOT NULL,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'completed', 'expired')),
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  
  UNIQUE(user_id, challenge_date, challenge_type)
);

-- 3. Create achievements table
CREATE TABLE IF NOT EXISTS public.user_achievements (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  achievement_id TEXT NOT NULL,
  achievement_name TEXT NOT NULL,
  achievement_description TEXT,
  achievement_tier TEXT CHECK (achievement_tier IN ('bronze', 'silver', 'gold', 'platinum')),
  reward_type TEXT CHECK (reward_type IN ('multiplier', 'bonus', 'badge', 'unlock')),
  reward_value JSONB,
  unlocked_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  
  UNIQUE(user_id, achievement_id)
);

-- 4. Create referral system tables
CREATE TABLE IF NOT EXISTS public.referrals (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  referrer_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  referred_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  referral_code TEXT UNIQUE NOT NULL,
  referred_email TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'expired')),
  signup_bonus_paid BOOLEAN DEFAULT false,
  signup_bonus_amount DECIMAL(10,2) DEFAULT 2.00,
  earnings_percentage DECIMAL(3,2) DEFAULT 0.10, -- 10%
  earnings_expiry_date TIMESTAMP WITH TIME ZONE,
  total_earnings_paid DECIMAL(10,2) DEFAULT 0.00,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  activated_at TIMESTAMP WITH TIME ZONE,
  
  UNIQUE(referrer_id, referred_id)
);

CREATE TABLE IF NOT EXISTS public.referral_earnings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  referral_id UUID REFERENCES referrals(id) ON DELETE CASCADE,
  referrer_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  referred_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  referred_earnings_amount DECIMAL(10,2) NOT NULL,
  referral_bonus_amount DECIMAL(10,2) NOT NULL,
  earning_date DATE NOT NULL,
  processed_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 5. Add streak tracking to profiles
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS current_streak INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS longest_streak INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS last_activity_date DATE,
ADD COLUMN IF NOT EXISTS total_challenges_completed INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS achievement_points INTEGER DEFAULT 0;

-- 6. Create market volatility tracking
CREATE TABLE IF NOT EXISTS public.market_conditions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  condition_date DATE NOT NULL,
  volatility_level TEXT CHECK (volatility_level IN ('low', 'normal', 'high')),
  vix_value DECIMAL(5,2),
  crypto_volatility_index DECIMAL(5,2),
  active_categories JSONB, -- {crypto: 1.3, meme_stocks: 1.2, tech: 1.1}
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  
  UNIQUE(condition_date)
);

-- 7. Add bulk submission support
ALTER TABLE public.trend_submissions
ADD COLUMN IF NOT EXISTS bulk_submission_id UUID,
ADD COLUMN IF NOT EXISTS submission_method TEXT DEFAULT 'single' CHECK (submission_method IN ('single', 'bulk', 'mobile', 'extension', 'api'));

CREATE TABLE IF NOT EXISTS public.bulk_submissions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  total_trends INTEGER NOT NULL,
  processed_trends INTEGER DEFAULT 0,
  successful_trends INTEGER DEFAULT 0,
  failed_trends INTEGER DEFAULT 0,
  status TEXT DEFAULT 'processing' CHECK (status IN ('processing', 'completed', 'failed')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  completed_at TIMESTAMP WITH TIME ZONE
);

-- 8. Update earnings ledger for micro-payments
ALTER TABLE public.earnings_ledger
ADD COLUMN IF NOT EXISTS earning_category TEXT CHECK (earning_category IN ('submission', 'validation', 'viral_bonus', 'market_move_bonus', 'challenge', 'referral', 'achievement')),
ADD COLUMN IF NOT EXISTS quality_multiplier DECIMAL(3,2) DEFAULT 1.00,
ADD COLUMN IF NOT EXISTS tier_multiplier DECIMAL(3,2) DEFAULT 1.00,
ADD COLUMN IF NOT EXISTS smart_pricing_data JSONB;

-- 9. Create function to calculate daily earnings estimate
CREATE OR REPLACE FUNCTION public.estimate_daily_earnings(
  p_user_id UUID
)
RETURNS JSONB
AS $$
DECLARE
  v_user_tier TEXT;
  v_avg_quality DECIMAL;
  v_daily_submissions INTEGER;
  v_daily_validations INTEGER;
  v_base_submission_pay DECIMAL;
  v_base_validation_pay DECIMAL;
  v_estimated_total DECIMAL;
BEGIN
  -- Get user tier
  SELECT performance_tier INTO v_user_tier
  FROM profiles
  WHERE id = p_user_id;
  
  -- Get average quality score
  SELECT AVG(quality_score) INTO v_avg_quality
  FROM trend_submissions
  WHERE spotter_id = p_user_id
  AND created_at > now() - INTERVAL '30 days';
  
  -- Get average daily activity
  SELECT 
    COUNT(*) FILTER (WHERE type = 'trend_submission') / 30.0,
    COUNT(*) FILTER (WHERE type = 'validation') / 30.0
  INTO v_daily_submissions, v_daily_validations
  FROM earnings_ledger
  WHERE user_id = p_user_id
  AND created_at > now() - INTERVAL '30 days';
  
  -- Calculate base payments
  v_base_submission_pay := CASE v_user_tier
    WHEN 'elite' THEN 0.15
    WHEN 'verified' THEN 0.10
    WHEN 'learning' THEN 0.07
    ELSE 0.03
  END;
  
  v_base_validation_pay := 0.02 * CASE v_user_tier
    WHEN 'elite' THEN 1.5
    WHEN 'verified' THEN 1.0
    WHEN 'learning' THEN 0.7
    ELSE 0.3
  END;
  
  -- Calculate estimate
  v_estimated_total := 
    (v_daily_submissions * v_base_submission_pay) +
    (v_daily_validations * v_base_validation_pay) +
    1.00; -- Average challenge completion
  
  RETURN jsonb_build_object(
    'daily_estimate', v_estimated_total,
    'monthly_estimate', v_estimated_total * 30,
    'breakdown', jsonb_build_object(
      'submissions', v_daily_submissions * v_base_submission_pay,
      'validations', v_daily_validations * v_base_validation_pay,
      'challenges', 1.00
    )
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 10. Create function to generate daily challenges
CREATE OR REPLACE FUNCTION public.generate_daily_challenges(
  p_user_id UUID
)
RETURNS VOID
AS $$
DECLARE
  v_user_tier TEXT;
  v_challenge_count INTEGER;
BEGIN
  -- Get user tier
  SELECT performance_tier INTO v_user_tier
  FROM profiles
  WHERE id = p_user_id;
  
  -- Determine number of challenges based on tier
  v_challenge_count := CASE v_user_tier
    WHEN 'elite' THEN 3
    WHEN 'verified' THEN 2
    ELSE 1
  END;
  
  -- Generate challenges (example logic)
  -- Easy challenge: Submit X trends
  INSERT INTO daily_challenges (
    user_id, challenge_date, challenge_type, challenge_data,
    difficulty, target, reward_amount
  )
  VALUES (
    p_user_id, CURRENT_DATE, 'submit_trends',
    jsonb_build_object('description', 'Submit 5 quality trends'),
    'easy', 5, 0.50
  )
  ON CONFLICT (user_id, challenge_date, challenge_type) DO NOTHING;
  
  -- Medium challenge: Category specific
  IF v_challenge_count >= 2 THEN
    INSERT INTO daily_challenges (
      user_id, challenge_date, challenge_type, challenge_data,
      difficulty, target, reward_amount
    )
    VALUES (
      p_user_id, CURRENT_DATE, 'category_trends',
      jsonb_build_object('description', 'Submit 3 crypto trends', 'category', 'crypto'),
      'medium', 3, 1.00
    )
    ON CONFLICT (user_id, challenge_date, challenge_type) DO NOTHING;
  END IF;
  
  -- Hard challenge: High quality
  IF v_challenge_count >= 3 THEN
    INSERT INTO daily_challenges (
      user_id, challenge_date, challenge_type, challenge_data,
      difficulty, target, reward_amount
    )
    VALUES (
      p_user_id, CURRENT_DATE, 'quality_trends',
      jsonb_build_object('description', 'Submit 2 trends with 90%+ quality score'),
      'hard', 2, 2.00
    )
    ON CONFLICT (user_id, challenge_date, challenge_type) DO NOTHING;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 11. RLS Policies
ALTER TABLE public.daily_challenges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.referrals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.referral_earnings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.market_conditions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bulk_submissions ENABLE ROW LEVEL SECURITY;

-- Daily challenges policies
CREATE POLICY "Users can view own challenges" ON public.daily_challenges
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "System can create challenges" ON public.daily_challenges
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can update own challenge progress" ON public.daily_challenges
  FOR UPDATE USING (auth.uid() = user_id);

-- Achievements policies
CREATE POLICY "Users can view own achievements" ON public.user_achievements
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "System can create achievements" ON public.user_achievements
  FOR INSERT WITH CHECK (true);

-- Referral policies
CREATE POLICY "Users can view own referrals" ON public.referrals
  FOR SELECT USING (auth.uid() = referrer_id OR auth.uid() = referred_id);

CREATE POLICY "Users can create referrals" ON public.referrals
  FOR INSERT WITH CHECK (auth.uid() = referrer_id);

-- Market conditions (public read)
CREATE POLICY "Anyone can view market conditions" ON public.market_conditions
  FOR SELECT USING (true);

-- 12. Indexes for performance
CREATE INDEX IF NOT EXISTS idx_daily_challenges_user_date ON public.daily_challenges(user_id, challenge_date);
CREATE INDEX IF NOT EXISTS idx_achievements_user ON public.user_achievements(user_id);
CREATE INDEX IF NOT EXISTS idx_referrals_code ON public.referrals(referral_code);
CREATE INDEX IF NOT EXISTS idx_referrals_referrer ON public.referrals(referrer_id);
CREATE INDEX IF NOT EXISTS idx_bulk_submissions_user ON public.bulk_submissions(user_id);

-- 13. Grant permissions
GRANT SELECT, INSERT, UPDATE ON public.daily_challenges TO authenticated;
GRANT SELECT, INSERT ON public.user_achievements TO authenticated;
GRANT SELECT, INSERT ON public.referrals TO authenticated;
GRANT SELECT ON public.market_conditions TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.bulk_submissions TO authenticated;