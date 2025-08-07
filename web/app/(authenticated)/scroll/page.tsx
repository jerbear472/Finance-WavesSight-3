'use client';
import { getSafeCategory, getSafeStatus } from '@/lib/safeCategory';

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { 
  TrendingUp, 
  DollarSign, 
  ArrowLeft,
  Link,
  Send,
  Loader2,
  Camera,
  Flame,
  Zap,
  Clock,
  Info,
  Trophy,
  Target,
  Star,
  TrendingDown,
  Award,
  BarChart3,
  Sparkles,
  CheckCircle,
  X,
  ExternalLink
} from 'lucide-react';
import TrendSubmissionFormMerged from '@/components/TrendSubmissionFormMerged';
import TrendScreenshotUpload from '@/components/TrendScreenshotUpload';
import SubmissionHistory from '@/components/SubmissionHistory';
import { SpotterTierDisplay } from '@/components/SpotterTierDisplay';
import { TrendQualityIndicator } from '@/components/TrendQualityIndicator';
import { useAuth } from '@/contexts/AuthContext';
import WaveLogo from '@/components/WaveLogo';
import { formatCurrency } from '@/lib/formatters';
import { supabase } from '@/lib/supabase';
import { 
  TrendSpotterPerformanceService, 
  SpotterPerformanceMetrics,
  TrendQualityMetrics 
} from '@/lib/trendSpotterPerformanceService';

export default function ScrollDashboard() {
  const router = useRouter();
  const { user, updateUserEarnings } = useAuth();
  const performanceService = TrendSpotterPerformanceService.getInstance();
  
  // Form states
  const [trendLink, setTrendLink] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitMessage, setSubmitMessage] = useState<{type: 'success' | 'error', text: string} | null>(null);
  const [loggedTrends, setLoggedTrends] = useState<string[]>([]);
  const [todaysEarnings, setTodaysEarnings] = useState(0);
  const [todaysPendingEarnings, setTodaysPendingEarnings] = useState(0);
  const [showTrendForm, setShowTrendForm] = useState(false);
  const [showScreenshotForm, setShowScreenshotForm] = useState(false);
  const [showPerformanceModal, setShowPerformanceModal] = useState(false);
  const [showPaymentBreakdown, setShowPaymentBreakdown] = useState(false);
  
  // Performance states
  const [spotterMetrics, setSpotterMetrics] = useState<SpotterPerformanceMetrics | null>(null);
  const [qualityMetrics, setQualityMetrics] = useState<TrendQualityMetrics | null>(null);
  const [estimatedPayment, setEstimatedPayment] = useState<any>(null);
  const [loadingMetrics, setLoadingMetrics] = useState(true);

  // Social media platforms
  const socialPlatforms = [
    { name: 'Reddit WSB', url: 'https://www.reddit.com/r/wallstreetbets', icon: '🚀', color: 'from-orange-500 to-red-500' },
    { name: 'Reddit Crypto', url: 'https://www.reddit.com/r/cryptocurrency', icon: '🪙', color: 'from-yellow-500 to-orange-500' },
    { name: 'X (Twitter)', url: 'https://twitter.com/search?q=%24SPY%20OR%20%24BTC&src=typed_query&f=live', icon: '𝕏', color: 'from-gray-600 to-gray-800' },
    { name: 'TikTok Finance', url: 'https://www.tiktok.com/tag/stocktok', icon: '🎵', color: 'from-pink-500 to-purple-500' },
    { name: 'YouTube Finance', url: 'https://www.youtube.com/results?search_query=stock+market+today&sp=CAI%253D', icon: '📺', color: 'from-red-500 to-red-600' }
  ];

  // Load performance metrics on mount
  useEffect(() => {
    if (user) {
      loadPerformanceMetrics();
      // Refresh metrics every 5 minutes
      const interval = setInterval(loadPerformanceMetrics, 5 * 60 * 1000);
      return () => clearInterval(interval);
    }
  }, [user]);

  const loadPerformanceMetrics = async () => {
    if (!user) return;
    
    console.log('Loading performance metrics for user:', user.id);
    setLoadingMetrics(true);
    try {
      const metrics = await performanceService.getSpotterPerformanceMetrics(user.id);
      console.log('Loaded metrics:', metrics);
      setSpotterMetrics(metrics);
      
      // Load today's earnings
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const { data: earnings } = await supabase
        .from('earnings_ledger')
        .select('amount, status')
        .eq('user_id', user.id)
        .eq('type', 'trend_submission')
        .gte('created_at', today.toISOString());
      
      const confirmedEarnings = earnings?.filter(e => e.status === 'confirmed')
        .reduce((sum, e) => sum + parseFloat(e.amount), 0) || 0;
      const pendingEarnings = earnings?.filter(e => e.status === 'pending')
        .reduce((sum, e) => sum + parseFloat(e.amount), 0) || 0;
      
      setTodaysEarnings(confirmedEarnings);
      setTodaysPendingEarnings(pendingEarnings);
    } catch (error) {
      console.error('Error loading metrics:', error);
    } finally {
      setLoadingMetrics(false);
    }
  };


  const normalizeUrl = (url: string) => {
    try {
      const urlObj = new URL(url.trim());
      urlObj.search = '';
      urlObj.hash = '';
      return urlObj.toString().toLowerCase();
    } catch {
      return url.trim().toLowerCase();
    }
  };

  // Calculate quality and payment when form is opened
  const handleFormOpen = async (url: string) => {
    console.log('handleFormOpen called with URL:', url);
    console.log('User in handleFormOpen:', user);
    console.log('SpotterMetrics in handleFormOpen:', spotterMetrics);
    
    if (!user) {
      console.log('No user in handleFormOpen - returning');
      return;
    }
    
    if (!spotterMetrics) {
      console.log('No spotterMetrics in handleFormOpen - continuing anyway');
      // Don't return, let it continue without metrics
    }
    
    try {
      // Calculate estimated quality for preview
      const mockTrendData = { url, platform: 'unknown' };
      console.log('Calculating quality for preview...');
      const quality = performanceService.calculateTrendQuality(mockTrendData);
      console.log('Preview quality:', quality);
      setQualityMetrics(quality);
      
      // Calculate estimated payment
      if (user?.id) {
        console.log('Calculating payment for preview...');
        const payment = await performanceService.calculateTrendPayment(
          user.id,
          mockTrendData,
          quality
        );
        console.log('Preview payment:', payment);
        setEstimatedPayment(payment);
      }
    } catch (err) {
      console.error('Error in handleFormOpen calculations:', err);
      // Don't throw, just log the error and continue
    }
  };

  const handleTrendSubmit = async (trendData: any) => {
    console.log('handleTrendSubmit called with:', trendData);
    console.log('User state:', user);
    console.log('SpotterMetrics state:', spotterMetrics);
    
    try {
      if (!user?.id) {
        console.log('No user ID found');
        setSubmitMessage({ type: 'error', text: 'Please log in to submit trends' });
        setTimeout(() => setSubmitMessage(null), 3000);
        return;
      }
      console.log('User ID:', user.id);

      // Check tier restrictions
      if (spotterMetrics?.currentTier === 'restricted') {
        const tierBenefits = performanceService.getTierBenefits('restricted');
        const { data: todayCount } = await supabase
          .from('trend_submissions')
          .select('id', { count: 'exact' })
          .eq('spotter_id', user.id)
          .gte('created_at', new Date().toISOString().split('T')[0]);
        
        if ((todayCount?.length || 0) >= tierBenefits.dailyTrendLimit) {
          setSubmitMessage({ 
            type: 'error', 
            text: `Daily limit reached (${tierBenefits.dailyTrendLimit} trends for restricted tier)` 
          });
          setTimeout(() => setSubmitMessage(null), 5000);
          return;
        }
      }

      // Calculate quality metrics
      console.log('Calculating quality metrics...');
      let qualityMetrics;
      try {
        qualityMetrics = performanceService.calculateTrendQuality(trendData);
        console.log('Quality metrics:', qualityMetrics);
        setQualityMetrics(qualityMetrics);
      } catch (qError) {
        console.error('Error calculating quality:', qError);
        throw new Error('Failed to calculate trend quality');
      }

      // Calculate payment
      console.log('Calculating payment...');
      let paymentInfo;
      try {
        paymentInfo = await performanceService.calculateTrendPayment(
          user.id,
          trendData,
          qualityMetrics
        );
        console.log('Payment info:', paymentInfo);
        setEstimatedPayment(paymentInfo);
      } catch (pError) {
        console.error('Error calculating payment:', pError);
        throw new Error('Failed to calculate payment');
      }

      // Upload image if present
      let imageUrl = null;
      if (trendData.screenshot && trendData.screenshot instanceof File) {
        const fileExt = trendData.screenshot.name.split('.').pop();
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
        
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('trend-images')
          .upload(fileName, trendData.screenshot);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from('trend-images')
          .getPublicUrl(fileName);
        
        imageUrl = publicUrl;
      }

      // Map category
      const mappedCategory = getSafeCategory(trendData.categories?.[0]);

      // Save trend to database with quality metrics
      const insertObject = {
        spotter_id: user?.id,
        category: mappedCategory,
        description: trendData.explanation || trendData.trendName || 'Untitled Trend',
        screenshot_url: imageUrl || trendData.thumbnail_url || null,
        evidence: {
          url: trendData.url || '',
          title: trendData.trendName || 'Untitled Trend',
          platform: trendData.platform || 'other',
          ageRanges: trendData.ageRanges,
          subcultures: trendData.subcultures,
          region: trendData.region,
          categories: trendData.categories,
          moods: trendData.moods,
          spreadSpeed: trendData.spreadSpeed,
          audioOrCatchphrase: trendData.audioOrCatchphrase,
          motivation: trendData.motivation,
          firstSeen: trendData.firstSeen,
          otherPlatforms: trendData.otherPlatforms,
          brandAdoption: trendData.brandAdoption,
          submitted_by: user?.username || user?.email
        },
        virality_prediction: trendData.spreadSpeed === 'viral' ? 8 : trendData.spreadSpeed === 'picking_up' ? 6 : 5,
        status: getSafeStatus('submitted'),
        quality_score: qualityMetrics.overallQuality,
        has_media: qualityMetrics.hasScreenshot || qualityMetrics.hasVideo,
        metadata_completeness: qualityMetrics.metadataCompleteness,
        validation_count: 0,
        creator_handle: trendData.creator_handle || null,
        creator_name: trendData.creator_name || null,
        post_caption: trendData.post_caption || null,
        likes_count: trendData.likes_count || 0,
        comments_count: trendData.comments_count || 0,
        shares_count: trendData.shares_count || 0,
        views_count: trendData.views_count || 0,
        hashtags: trendData.hashtags || [],
        post_url: trendData.url,
        thumbnail_url: trendData.thumbnail_url || imageUrl || null,
        posted_at: trendData.posted_at || new Date().toISOString(),
        created_at: new Date().toISOString(),
        payment_amount: paymentInfo.totalAmount,
        payment_breakdown: paymentInfo.breakdown
      };

      console.log('Inserting trend submission to database...');
      console.log('Insert object:', JSON.stringify(insertObject, null, 2));
      
      const { data, error } = await supabase
        .from('trend_submissions')
        .insert(insertObject)
        .select()
        .single();

      if (error) {
        console.error('Database insert error:', error);
        console.error('Error details:', {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code
        });
        throw error;
      }
      
      console.log('Trend submission inserted successfully:', data);

      // Update spotter metrics
      await performanceService.updateSpotterMetrics(
        user.id,
        data.id,
        qualityMetrics.overallQuality
      );

      // Create earnings ledger entry
      const { error: earningsError } = await supabase
        .from('earnings_ledger')
        .insert({
          user_id: user.id,
          trend_id: data.id,
          amount: paymentInfo.totalAmount,
          type: 'trend_submission',
          status: 'pending',
          description: `Trend: ${trendData.trendName || 'Untitled'} (${spotterMetrics?.currentTier} tier)`,
          metadata: {
            quality_score: qualityMetrics.overallQuality,
            tier: spotterMetrics?.currentTier,
            payment_breakdown: paymentInfo.breakdown
          },
          created_at: new Date().toISOString()
        });

      if (earningsError) {
        console.error('Error creating earnings entry:', earningsError);
      }

      // Update user's pending earnings
      await supabase
        .from('profiles')
        .update({
          earnings_pending: supabase.raw(`earnings_pending + ${paymentInfo.totalAmount}`)
        })
        .eq('id', user.id);

      // Update local state
      const normalizedUrl = normalizeUrl(trendData.url);
      setLoggedTrends(prev => [...prev, normalizedUrl]);
      setTodaysPendingEarnings(prev => prev + paymentInfo.totalAmount);
      
      setSubmitMessage({ 
        type: 'success', 
        text: `Trend submitted! +${formatCurrency(paymentInfo.totalAmount)} pending (Quality: ${(qualityMetrics.overallQuality * 100).toFixed(0)}%)` 
      });
      
      setTrendLink('');
      setShowPaymentBreakdown(true);
      
      setTimeout(() => {
        setSubmitMessage(null);
        setShowPaymentBreakdown(false);
      }, 5000);

      // Refresh metrics
      loadPerformanceMetrics();

    } catch (error: any) {
      console.error('Error submitting trend:', error);
      console.error('Error details:', {
        message: error?.message,
        code: error?.code,
        details: error?.details,
        hint: error?.hint
      });
      
      // More specific error messages
      let errorMessage = 'Failed to submit trend. Please try again.';
      if (error?.message?.includes('trend-images')) {
        errorMessage = 'Failed to upload image. Please try again.';
      } else if (error?.message?.includes('trend_submissions')) {
        errorMessage = 'Failed to save trend. Check your data and try again.';
      } else if (error?.message?.includes('earnings_ledger')) {
        errorMessage = 'Trend saved but earnings tracking failed.';
      }
      
      setSubmitMessage({ type: 'error', text: errorMessage });
      setTimeout(() => setSubmitMessage(null), 5000);
    }
  };

  const handleQuickSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('=== handleQuickSubmit START ===');
    console.log('URL entered:', trendLink);
    console.log('User:', user);
    console.log('showTrendForm before:', showTrendForm);
    
    if (!trendLink.trim()) {
      console.log('No trend link provided - exiting');
      return;
    }
    
    const normalizedUrl = normalizeUrl(trendLink);
    console.log('Normalized URL:', normalizedUrl);
    console.log('Already logged trends:', loggedTrends);
    
    if (loggedTrends.includes(normalizedUrl)) {
      console.log('URL already logged - showing error');
      setSubmitMessage({ type: 'error', text: 'Already logged!' });
      setTimeout(() => setSubmitMessage(null), 3000);
      return;
    }
    
    console.log('Calling handleFormOpen...');
    try {
      handleFormOpen(trendLink);
      console.log('handleFormOpen completed');
    } catch (err) {
      console.error('Error in handleFormOpen:', err);
    }
    
    console.log('Setting showTrendForm to true...');
    setShowTrendForm(true);
    console.log('showTrendForm after:', true);
    console.log('=== handleQuickSubmit END ===');
  };

  return (
    <div className="min-h-screen bg-gray-950">
      <div className="container mx-auto px-6 py-8 max-w-7xl">
        {/* Clean Header */}
        <div className="mb-8 flex items-center justify-between">
          <button
            onClick={() => router.push('/dashboard')}
            className="p-3 hover:bg-gray-900 rounded-xl transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-gray-400" />
          </button>
          
          <div className="flex items-center gap-3">
            <WaveLogo size={32} animated={true} showTitle={false} />
            <h1 className="text-2xl font-semibold text-white">Trend Spotting</h1>
          </div>

          {/* Performance Tier Badge */}
          {user && !loadingMetrics && spotterMetrics && (
            <SpotterTierDisplay 
              userId={user.id} 
              compact={true}
              onTierChange={() => loadPerformanceMetrics()}
            />
          )}
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Main Submission Area */}
          <div className="lg:col-span-2 space-y-6">
            {/* Submit New Trend - PROMINENT AT TOP */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-gradient-to-br from-blue-600/10 via-purple-600/10 to-indigo-600/10 backdrop-blur-sm rounded-2xl p-6 border border-blue-500/20 shadow-xl relative overflow-hidden"
            >
            <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 to-purple-500/5 rounded-2xl"></div>
            
            <div className="flex items-center justify-between mb-4 relative z-10">
              <div className="flex items-center gap-4">
                <div className="bg-gradient-to-r from-blue-500 to-purple-600 p-3 rounded-xl shadow-lg">
                  <TrendingUp className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-white">Submit New Trend</h3>
                  <p className="text-blue-200/80 font-medium">
                    Earn ${spotterMetrics ? 
                      `${performanceService.getTierBenefits(spotterMetrics.currentTier).basePaymentRange.min.toFixed(2)}-${performanceService.getTierBenefits(spotterMetrics.currentTier).basePaymentRange.max.toFixed(2)}` 
                      : '0.08-0.15'} per quality submission
                  </p>
                </div>
              </div>
              <div className="text-right bg-white/10 backdrop-blur-sm px-4 py-3 rounded-xl border border-white/20">
                <p className="text-sm text-gray-300 font-medium">Today's Trends</p>
                <p className="text-xl font-bold text-white">{loggedTrends.length}</p>
              </div>
            </div>

            {/* Social Media Quick Links */}
            <div className="mb-4 relative z-10">
              <p className="text-xs text-gray-400 uppercase tracking-wider mb-2">Browse Trending Content</p>
              <div className="flex flex-wrap gap-2">
                {socialPlatforms.map((platform) => (
                  <button
                    key={platform.name}
                    onClick={() => window.open(platform.url, platform.name.toLowerCase().replace(' ', '_'), 'width=1200,height=800')}
                    className={`px-3 py-2 rounded-lg bg-gradient-to-r ${platform.color} text-white font-medium text-sm transition-all hover:scale-105 flex items-center gap-2`}
                  >
                    <span className="text-lg">{platform.icon}</span>
                    <span>{platform.name}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Payment Breakdown Preview */}
            {showPaymentBreakdown && estimatedPayment && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="mb-4 p-3 bg-green-500/10 rounded-lg border border-green-500/20"
              >
                <p className="text-xs text-green-400 mb-2">Payment Breakdown:</p>
                {estimatedPayment.breakdown.map((item: string, index: number) => (
                  <p key={index} className="text-xs text-gray-300">{item}</p>
                ))}
              </motion.div>
            )}

            {/* Form */}
            <form onSubmit={handleQuickSubmit} className="space-y-4 relative z-10">
              <div className="relative">
                <input
                  type="url"
                  value={trendLink}
                  onChange={(e) => setTrendLink(e.target.value)}
                  placeholder="Paste trending link here..."
                  className="w-full px-5 py-4 bg-gray-800/50 backdrop-blur-sm border border-gray-600/50 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-400/60 focus:border-blue-400/60 font-medium text-lg shadow-lg transition-all focus:bg-gray-700/50"
                />
                <div className="absolute right-4 top-1/2 transform -translate-y-1/2">
                  <Link className="w-5 h-5 text-gray-400" />
                </div>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <button
                  type="submit"
                  disabled={!trendLink.trim()}
                  className="flex items-center justify-center gap-3 px-5 py-4 bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 hover:from-blue-500 hover:via-purple-500 hover:to-indigo-500 disabled:bg-gray-600 disabled:opacity-50 rounded-xl font-bold text-lg transition-all hover:scale-[1.02] shadow-xl text-white border border-blue-400/40"
                >
                  <Send className="w-5 h-5" />
                  Add Trend Details
                </button>
                <button
                  type="button"
                  onClick={() => setShowScreenshotForm(true)}
                  className="flex items-center justify-center gap-3 px-5 py-4 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 rounded-xl font-bold text-lg transition-all hover:scale-[1.02] shadow-xl text-white border border-emerald-400/40"
                >
                  <Camera className="w-5 h-5" />
                  Upload Screenshot
                </button>
              </div>
            </form>

            {/* Feedback */}
            {submitMessage && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`mt-4 p-3 rounded-xl text-center ${
                  submitMessage.type === 'success'
                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                    : 'bg-red-500/20 text-red-400 border border-red-500/30'
                }`}
              >
                <p className="text-sm font-semibold">{submitMessage.text}</p>
              </motion.div>
            )}
            </motion.div>

            {/* Submission History */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="mt-6"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="bg-purple-500/20 p-2 rounded-lg">
                  <TrendingUp className="w-5 h-5 text-purple-400" />
                </div>
                <h3 className="text-xl font-bold text-white">Your Submission History</h3>
              </div>
              <SubmissionHistory />
            </motion.div>
          </div>

          {/* Right Column - Metrics & Social */}
          <div className="space-y-6">
            {/* Personal Metrics Section */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-gray-900/50 backdrop-blur-sm rounded-2xl p-6 border border-gray-800"
            >
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-purple-400" />
                Your Performance
              </h3>
              
              {/* Earnings */}
              <div className="grid grid-cols-2 gap-3 mb-4">
                <div className="bg-gray-800/50 rounded-xl p-3 border border-gray-700/50">
                  <p className="text-xs text-gray-400 font-medium">Today's Confirmed</p>
                  <p className="text-xl font-bold text-emerald-400">{formatCurrency(todaysEarnings)}</p>
                </div>
                <div className="bg-gray-800/50 rounded-xl p-3 border border-gray-700/50">
                  <p className="text-xs text-gray-400 font-medium">Pending</p>
                  <p className="text-xl font-bold text-yellow-400">{formatCurrency(todaysPendingEarnings)}</p>
                </div>
              </div>
              
              {/* Performance Stats */}
              {spotterMetrics && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 bg-gray-800/30 rounded-lg">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-green-400" />
                      <span className="text-sm text-gray-300">Approval Rate</span>
                    </div>
                    <span className="text-sm font-bold text-white">
                      {(spotterMetrics.trendApprovalRate30d * 100).toFixed(0)}%
                    </span>
                  </div>
                  
                  <div className="flex items-center justify-between p-3 bg-gray-800/30 rounded-lg">
                    <div className="flex items-center gap-2">
                      <TrendingUp className="w-4 h-4 text-purple-400" />
                      <span className="text-sm text-gray-300">Viral Rate</span>
                    </div>
                    <span className="text-sm font-bold text-white">
                      {(spotterMetrics.trendViralRate30d * 100).toFixed(0)}%
                    </span>
                  </div>
                  
                  <div className="flex items-center justify-between p-3 bg-gray-800/30 rounded-lg">
                    <div className="flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-yellow-400" />
                      <span className="text-sm text-gray-300">Quality Score</span>
                    </div>
                    <span className="text-sm font-bold text-white">
                      {(spotterMetrics.submissionQualityScore * 100).toFixed(0)}%
                    </span>
                  </div>
                  
                  <div className="flex items-center justify-between p-3 bg-gray-800/30 rounded-lg">
                    <div className="flex items-center gap-2">
                      <Flame className="w-4 h-4 text-orange-400" />
                      <span className="text-sm text-gray-300">Approved Streak</span>
                    </div>
                    <span className="text-sm font-bold text-white">
                      {spotterMetrics.consecutiveApprovedTrends}
                    </span>
                  </div>
                </div>
              )}
              
              <button
                onClick={() => setShowPerformanceModal(true)}
                className="w-full mt-4 py-2 bg-purple-500/20 hover:bg-purple-500/30 rounded-lg text-purple-400 text-sm font-medium transition-all flex items-center justify-center gap-2"
              >
                View Detailed Stats
                <Info className="w-4 h-4" />
              </button>
            </motion.div>

            {/* Streaks & Bonuses */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-gray-900/50 backdrop-blur-sm rounded-2xl p-6 border border-gray-800"
            >
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <Flame className="w-5 h-5 text-orange-400" />
                Streaks & Bonuses
              </h3>
              
              {/* Current Streak */}
              {spotterMetrics && (
                <div className="mb-4 bg-orange-500/20 rounded-xl p-4 border border-orange-500/30">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Flame className="w-5 h-5 text-orange-400" />
                      <span className="font-semibold text-white">Approved Streak</span>
                    </div>
                    <span className="text-lg font-bold text-orange-400">
                      {spotterMetrics.consecutiveApprovedTrends}
                    </span>
                  </div>
                  <p className="text-sm text-orange-200">Keep submitting quality trends!</p>
                </div>
              )}
              
              {/* Daily Challenge */}
              {spotterMetrics?.dailyChallengeProgress && (
                <div className="bg-purple-500/20 rounded-xl p-4 border border-purple-500/30">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Target className="w-5 h-5 text-purple-400" />
                      <span className="font-semibold text-white">Daily Challenge</span>
                    </div>
                    <span className="text-sm font-bold text-purple-400">
                      +${spotterMetrics.dailyChallengeProgress.reward.toFixed(2)}
                    </span>
                  </div>
                  <p className="text-sm text-purple-200 mb-2">
                    {spotterMetrics.dailyChallengeProgress.description}
                  </p>
                  <div className="w-full bg-gray-700 rounded-full h-2 overflow-hidden">
                    <motion.div
                      className="h-full bg-gradient-to-r from-purple-500 to-pink-500"
                      initial={{ width: 0 }}
                      animate={{ 
                        width: `${(spotterMetrics.dailyChallengeProgress.progress / 
                          spotterMetrics.dailyChallengeProgress.target) * 100}%` 
                      }}
                    />
                  </div>
                </div>
              )}
              
              {/* Bonus Tips */}
              <div className="mt-4 p-3 bg-gray-800/50 rounded-lg">
                <p className="text-xs text-gray-400 mb-2">💡 Pro Tips:</p>
                <ul className="text-xs text-gray-300 space-y-1 list-disc list-inside">
                  <li>Submit trends with screenshots for higher payouts</li>
                  <li>Complete daily challenges for bonus rewards</li>
                  <li>Maintain streak for tier upgrades</li>
                </ul>
              </div>
            </motion.div>
          </div>
        </div>
      </div>

      {/* Trend Submission Form Modal */}
      {showTrendForm && (
        <>
          {console.log('Rendering TrendSubmissionFormMerged, showTrendForm:', showTrendForm)}
          <TrendSubmissionFormMerged
            onClose={() => {
              console.log('Form onClose called');
              setShowTrendForm(false);
              setTrendLink('');
              setQualityMetrics(null);
              setEstimatedPayment(null);
            }}
            onSubmit={handleTrendSubmit}
            initialUrl={trendLink}
          />
        </>
      )}

      {/* Screenshot Upload Modal */}
      {showScreenshotForm && (
        <TrendScreenshotUpload
          onClose={() => setShowScreenshotForm(false)}
          onSubmit={() => {
            // Screenshot submissions get base rate
            const baseAmount = spotterMetrics ? 
              performanceService.getTierBenefits(spotterMetrics.currentTier).basePaymentRange.min : 0.08;
            setTodaysPendingEarnings(prev => prev + baseAmount);
            setSubmitMessage({ type: 'success', text: `Screenshot submitted! +${formatCurrency(baseAmount)}` });
            setTimeout(() => setSubmitMessage(null), 3000);
          }}
        />
      )}

      {/* Performance Modal */}
      <AnimatePresence>
        {showPerformanceModal && spotterMetrics && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4"
            onClick={() => setShowPerformanceModal(false)}
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              className="bg-gray-900 rounded-3xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-white/10"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-white">Performance Overview</h2>
                <button
                  onClick={() => setShowPerformanceModal(false)}
                  className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-gray-400" />
                </button>
              </div>
              
              <SpotterTierDisplay 
                userId={user!.id} 
                showDetails={true}
              />
              
              <button
                onClick={() => setShowPerformanceModal(false)}
                className="w-full mt-6 py-3 rounded-xl bg-gray-800 hover:bg-gray-700 font-semibold transition-all"
              >
                Close
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}