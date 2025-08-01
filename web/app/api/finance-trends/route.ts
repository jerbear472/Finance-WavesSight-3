import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export async function POST(request: NextRequest) {
  try {
    // Get the user's session
    const cookieStore = cookies();
    const authToken = cookieStore.get('sb-auth-token')?.value;
    
    if (!authToken) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    // Create Supabase client with service role for admin operations
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    // Verify the user's token
    const { data: { user }, error: authError } = await supabase.auth.getUser(authToken);
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Invalid authentication' },
        { status: 401 }
      );
    }
    
    // Get the trend data from request
    const trendData = await request.json();
    
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
      likes_count: trendData.likes_count || 0,
      comments_count: trendData.comments_count || 0,
      shares_count: trendData.shares_count || 0,
      views_count: trendData.views_count || 0,
      hashtags: trendData.hashtags || [],
      thumbnail_url: trendData.thumbnail_url || null,
      posted_at: trendData.posted_at || null
    };
    
    // Insert the finance trend
    const { data: insertedTrend, error: insertError } = await supabase
      .from('finance_trends')
      .insert(financeTrend)
      .select('*, user:profiles!finance_trends_user_id_fkey(username, avatar_url)')
      .single();
    
    if (insertError) {
      console.error('Error inserting finance trend:', insertError);
      return NextResponse.json(
        { error: 'Failed to submit trend', details: insertError.message },
        { status: 500 }
      );
    }
    
    // Update user earnings (pending verification)
    const { error: earningsError } = await supabase
      .from('user_earnings')
      .upsert({
        user_id: user.id,
        pending_earnings: supabase.raw(`pending_earnings + ${insertedTrend.calculated_payout}`)
      }, {
        onConflict: 'user_id'
      });
    
    if (earningsError) {
      console.error('Error updating user earnings:', earningsError);
    }
    
    return NextResponse.json({
      success: true,
      trend: insertedTrend,
      message: `Trend submitted! Estimated payout: $${insertedTrend.calculated_payout.toFixed(2)}`
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
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    // Build query
    let query = supabase
      .from('finance_trends')
      .select(`
        *,
        user:profiles!finance_trends_user_id_fkey(username, avatar_url),
        verifications:finance_trend_verifications(*)
      `)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);
    
    // Apply filters
    if (status !== 'all') {
      query = query.eq('verification_status', status);
    }
    
    if (userId) {
      query = query.eq('user_id', userId);
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
      trends,
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
    
    // Get the user's session
    const cookieStore = cookies();
    const authToken = cookieStore.get('sb-auth-token')?.value;
    
    if (!authToken) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    // Create Supabase client
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    // Verify the user
    const { data: { user }, error: authError } = await supabase.auth.getUser(authToken);
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Invalid authentication' },
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
    
    // Insert verification record
    const { error: verificationError } = await supabase
      .from('finance_trend_verifications')
      .insert({
        trend_id: trendId,
        verifier_id: user.id,
        ...verification
      });
    
    if (verificationError) {
      console.error('Error inserting verification:', verificationError);
      return NextResponse.json(
        { error: 'Failed to save verification' },
        { status: 500 }
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
    if (isApproved) {
      const { error: earningsError } = await supabase.rpc('transfer_pending_to_available', {
        p_user_id: updatedTrend.user_id,
        p_amount: updatedTrend.calculated_payout
      });
      
      if (earningsError) {
        console.error('Error updating earnings:', earningsError);
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