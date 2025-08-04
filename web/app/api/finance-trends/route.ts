import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

export async function POST(request: NextRequest) {
  try {
    // Create Supabase client with proper auth handling
    const supabase = createRouteHandlerClient({ cookies });
    
    // Get the authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized - Please log in' },
        { status: 401 }
      );
    }
    
    // Get the trend data from request
    const trendData = await request.json();
    
    // Calculate payout based on quality signals
    let calculatedPayout = 1.00; // Base payout
    
    // Add bonuses based on quality
    if (trendData.viral_evidence?.includes('trending_hashtag')) calculatedPayout += 0.50;
    if (trendData.viral_evidence?.includes('influencer_mention')) calculatedPayout += 1.00;
    if (trendData.cross_platform?.length > 0) calculatedPayout += 0.75 * trendData.cross_platform.length;
    if (trendData.views_count > 1000000) calculatedPayout += 2.00;
    if (trendData.technical_context) calculatedPayout += 0.75;
    if (trendData.demographics?.length > 0) calculatedPayout += 0.50;
    
    // Cap at $10
    calculatedPayout = Math.min(calculatedPayout, 10.00);
    
    // Prepare the data for insertion
    const financeTrend = {
      user_id: user.id,
      trend_name: trendData.trend_name,
      platform: trendData.platform,
      primary_link: trendData.primary_link,
      company_mentioned: trendData.company_mentioned || null,
      ticker_symbol: trendData.ticker_symbol || null,
      signal_type: trendData.signal_type,
      viral_evidence: trendData.viral_evidence || [],
      market_sentiment: trendData.market_sentiment || 'neutral',
      drivers: trendData.drivers || [],
      spread_velocity: trendData.spread_velocity || 'just_starting',
      investment_timeline: trendData.investment_timeline || 'unknown',
      catalyst_type: trendData.catalyst_type || null,
      cross_platform: trendData.cross_platform || [],
      purchase_intent_signals: trendData.purchase_intent_signals || [],
      geographic_signal: trendData.geographic_signal || null,
      demographics: trendData.demographics || [],
      technical_context: trendData.technical_context || null,
      creator_handle: trendData.creator_handle || null,
      creator_name: trendData.creator_name || null,
      post_caption: trendData.post_caption || null,
      likes_count: parseInt(trendData.likes_count) || 0,
      comments_count: parseInt(trendData.comments_count) || 0,
      shares_count: parseInt(trendData.shares_count) || 0,
      views_count: parseInt(trendData.views_count) || 0,
      hashtags: trendData.hashtags || [],
      thumbnail_url: trendData.thumbnail_url || null,
      posted_at: trendData.posted_at || null,
      calculated_payout: calculatedPayout,
      verification_status: 'pending',
      created_at: new Date().toISOString()
    };
    
    // Insert the finance trend
    const { data: insertedTrend, error: insertError } = await supabase
      .from('finance_trends')
      .insert(financeTrend)
      .select()
      .single();
    
    if (insertError) {
      console.error('Error inserting finance trend:', insertError);
      
      // Check for specific errors
      if (insertError.message?.includes('finance_trends')) {
        return NextResponse.json(
          { error: 'Database table not found. Please ensure database is set up correctly.' },
          { status: 500 }
        );
      }
      
      return NextResponse.json(
        { error: 'Failed to submit trend', details: insertError.message },
        { status: 500 }
      );
    }
    
    // Update or create user earnings record
    const { error: earningsError } = await supabase
      .from('user_earnings')
      .upsert({
        user_id: user.id,
        pending_earnings: calculatedPayout,
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'user_id',
        ignoreDuplicates: false
      });
    
    if (earningsError) {
      console.error('Error updating user earnings:', earningsError);
      // Don't fail the whole request if earnings update fails
    }
    
    return NextResponse.json({
      success: true,
      trend: insertedTrend,
      message: `Trend submitted! Estimated payout: $${calculatedPayout.toFixed(2)}`
    });
    
  } catch (error: any) {
    console.error('Error in finance trends API:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') || 'all';
    const userId = searchParams.get('userId');
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = parseInt(searchParams.get('offset') || '0');
    
    // Create Supabase client
    const supabase = createRouteHandlerClient({ cookies });
    
    // Get the authenticated user
    const { data: { user } } = await supabase.auth.getUser();
    
    // Build query
    let query = supabase
      .from('finance_trends')
      .select(`
        *,
        user:profiles!finance_trends_user_id_fkey(username, avatar_url)
      `)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);
    
    // Apply filters
    if (status !== 'all') {
      query = query.eq('verification_status', status);
    }
    
    if (userId) {
      query = query.eq('user_id', userId);
    } else if (user && !userId) {
      // If no specific userId requested, show only the current user's trends
      query = query.eq('user_id', user.id);
    }
    
    const { data: trends, error } = await query;
    
    if (error) {
      console.error('Error fetching finance trends:', error);
      return NextResponse.json(
        { error: 'Failed to fetch trends', details: error.message },
        { status: 500 }
      );
    }
    
    return NextResponse.json({
      trends: trends || [],
      count: trends?.length || 0,
      offset,
      limit
    });
    
  } catch (error: any) {
    console.error('Error in finance trends GET:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}

// Verification endpoint
export async function PATCH(request: NextRequest) {
  try {
    const { trendId, verification } = await request.json();
    
    // Create Supabase client
    const supabase = createRouteHandlerClient({ cookies });
    
    // Get the authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    // Check if user is admin or verifier
    const { data: profile } = await supabase
      .from('profiles')
      .select('is_admin, role')
      .eq('id', user.id)
      .single();
    
    if (!profile?.is_admin && profile?.role !== 'verifier') {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      );
    }
    
    // Determine verification status based on quality
    const isApproved = 
      verification.financial_relevance !== 'not_financial' &&
      verification.viral_evidence_quality !== 'none' &&
      verification.signal_quality !== 'spam';
    
    // Update trend status
    const { data: updatedTrend, error: updateError } = await supabase
      .from('finance_trends')
      .update({
        verification_status: isApproved ? 'verified' : 'rejected',
        verified_at: new Date().toISOString(),
        rejection_reason: isApproved ? null : verification.notes
      })
      .eq('id', trendId)
      .select()
      .single();
    
    if (updateError) {
      console.error('Error updating trend:', updateError);
      return NextResponse.json(
        { error: 'Failed to update trend status' },
        { status: 500 }
      );
    }
    
    // Update user earnings if approved
    if (isApproved && updatedTrend) {
      const { data: earnings } = await supabase
        .from('user_earnings')
        .select('pending_earnings, available_earnings')
        .eq('user_id', updatedTrend.user_id)
        .single();
      
      if (earnings) {
        const newPending = Math.max(0, (earnings.pending_earnings || 0) - updatedTrend.calculated_payout);
        const newAvailable = (earnings.available_earnings || 0) + updatedTrend.calculated_payout;
        
        await supabase
          .from('user_earnings')
          .update({
            pending_earnings: newPending,
            available_earnings: newAvailable,
            updated_at: new Date().toISOString()
          })
          .eq('user_id', updatedTrend.user_id);
      }
    }
    
    return NextResponse.json({
      success: true,
      trend: updatedTrend,
      approved: isApproved
    });
    
  } catch (error: any) {
    console.error('Error in verification:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}