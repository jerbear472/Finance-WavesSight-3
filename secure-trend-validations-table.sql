-- Secure the trend_validations table with proper RLS policies

-- First, enable RLS on the table
ALTER TABLE public.trend_validations ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any (to start fresh)
DROP POLICY IF EXISTS "Users can view validations for public trends" ON public.trend_validations;
DROP POLICY IF EXISTS "Users can create their own validations" ON public.trend_validations;
DROP POLICY IF EXISTS "Users can update their own validations" ON public.trend_validations;
DROP POLICY IF EXISTS "Admins can view all validations" ON public.trend_validations;

-- Policy 1: Users can only see validations for trends they can access
CREATE POLICY "Users can view validations for accessible trends" 
ON public.trend_validations
FOR SELECT 
USING (
    -- User can see validations if they can see the trend
    EXISTS (
        SELECT 1 FROM public.trend_submissions
        WHERE trend_submissions.id = trend_validations.trend_id
        AND (
            -- Public trends
            trend_submissions.status = 'approved'
            -- Or their own submissions
            OR trend_submissions.spotter_id = auth.uid()
            -- Or they are admin
            OR EXISTS (
                SELECT 1 FROM public.profiles
                WHERE profiles.id = auth.uid()
                AND profiles.is_admin = true
            )
        )
    )
);

-- Policy 2: Users can create validations (one per trend)
CREATE POLICY "Users can create one validation per trend" 
ON public.trend_validations
FOR INSERT 
WITH CHECK (
    -- Must be authenticated
    auth.uid() IS NOT NULL
    -- Must be their own validation
    AND auth.uid() = validator_id
    -- Cannot validate their own trends
    AND NOT EXISTS (
        SELECT 1 FROM public.trend_submissions
        WHERE trend_submissions.id = trend_id
        AND trend_submissions.spotter_id = auth.uid()
    )
    -- Cannot vote twice on the same trend
    AND NOT EXISTS (
        SELECT 1 FROM public.trend_validations tv
        WHERE tv.trend_id = trend_id
        AND tv.validator_id = auth.uid()
    )
);

-- Policy 3: Users can update only their own validations
CREATE POLICY "Users can update their own validations" 
ON public.trend_validations
FOR UPDATE 
USING (auth.uid() = validator_id)
WITH CHECK (auth.uid() = validator_id);

-- Policy 4: Users cannot delete validations (maintain integrity)
-- No DELETE policy = no deletes allowed

-- Policy 5: Admins can view all validations
CREATE POLICY "Admins can view all validations" 
ON public.trend_validations
FOR SELECT 
USING (
    EXISTS (
        SELECT 1 FROM public.profiles
        WHERE profiles.id = auth.uid()
        AND profiles.is_admin = true
    )
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_trend_validations_trend_id ON public.trend_validations(trend_id);
CREATE INDEX IF NOT EXISTS idx_trend_validations_validator_id ON public.trend_validations(validator_id);
CREATE INDEX IF NOT EXISTS idx_trend_validations_created_at ON public.trend_validations(created_at DESC);

-- Create a composite unique index to prevent duplicate votes
CREATE UNIQUE INDEX IF NOT EXISTS idx_trend_validations_unique_vote 
ON public.trend_validations(trend_id, validator_id);

-- Grant appropriate permissions
GRANT SELECT, INSERT, UPDATE ON public.trend_validations TO authenticated;
GRANT ALL ON public.trend_validations TO service_role;

-- Create a view that anonymizes validator information for public consumption
CREATE OR REPLACE VIEW public.trend_validation_summary AS
SELECT 
    trend_id,
    COUNT(*) as total_votes,
    COUNT(CASE WHEN vote = 'verify' THEN 1 END) as verify_votes,
    COUNT(CASE WHEN vote = 'reject' THEN 1 END) as reject_votes,
    AVG(confidence_score) as avg_confidence,
    MAX(created_at) as last_vote_at
FROM public.trend_validations
GROUP BY trend_id;

-- Grant access to the summary view
GRANT SELECT ON public.trend_validation_summary TO authenticated;

-- Add a function to check if a user can validate a trend
CREATE OR REPLACE FUNCTION public.can_validate_trend(p_trend_id uuid)
RETURNS boolean AS $$
BEGIN
    -- Check if user is authenticated
    IF auth.uid() IS NULL THEN
        RETURN false;
    END IF;
    
    -- Check if user owns the trend (can't validate own trends)
    IF EXISTS (
        SELECT 1 FROM public.trend_submissions
        WHERE id = p_trend_id
        AND spotter_id = auth.uid()
    ) THEN
        RETURN false;
    END IF;
    
    -- Check if user has already voted
    IF EXISTS (
        SELECT 1 FROM public.trend_validations
        WHERE trend_id = p_trend_id
        AND validator_id = auth.uid()
    ) THEN
        RETURN false;
    END IF;
    
    -- Check if trend is in a validatable state
    IF NOT EXISTS (
        SELECT 1 FROM public.trend_submissions
        WHERE id = p_trend_id
        AND status IN ('submitted', 'pending')
    ) THEN
        RETURN false;
    END IF;
    
    RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission on the function
GRANT EXECUTE ON FUNCTION public.can_validate_trend TO authenticated;