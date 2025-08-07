'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { 
  TrendingUp, 
  DollarSign, 
  ArrowLeft,
  Link,
  Send,
  Camera,
  CheckCircle,
  X
} from 'lucide-react';
import TrendSubmissionFormMerged from '@/components/TrendSubmissionFormMerged';
import TrendScreenshotUpload from '@/components/TrendScreenshotUpload';
import { SpotterTierDisplay } from '@/components/SpotterTierDisplay';
import { useAuth } from '@/contexts/AuthContext';
import WaveLogo from '@/components/WaveLogo';
import { formatCurrency } from '@/lib/formatters';
import { supabase } from '@/lib/supabase';
import { TrendSpotterPerformanceService } from '@/lib/trendSpotterPerformanceService';

export default function SimplifiedScrollDashboard() {
  const router = useRouter();
  const { user } = useAuth();
  const performanceService = TrendSpotterPerformanceService.getInstance();
  
  // States
  const [trendLink, setTrendLink] = useState('');
  const [submitMessage, setSubmitMessage] = useState<{type: 'success' | 'error', text: string} | null>(null);
  const [todaysEarnings, setTodaysEarnings] = useState(0);
  const [todaysPendingEarnings, setTodaysPendingEarnings] = useState(0);
  const [todaysTrends, setTodaysTrends] = useState(0);
  const [showTrendForm, setShowTrendForm] = useState(false);
  const [showScreenshotForm, setShowScreenshotForm] = useState(false);
  const [spotterMetrics, setSpotterMetrics] = useState<any>(null);

  // Quick access platforms
  const platforms = [
    { name: 'Reddit', url: 'https://www.reddit.com/r/wallstreetbets', color: 'bg-orange-500' },
    { name: 'X/Twitter', url: 'https://twitter.com', color: 'bg-gray-700' },
    { name: 'TikTok', url: 'https://www.tiktok.com', color: 'bg-purple-600' },
  ];

  // Load metrics
  useEffect(() => {
    if (user) {
      loadMetrics();
    }
  }, [user]);

  const loadMetrics = async () => {
    if (!user) return;
    
    try {
      // Load performance metrics
      const metrics = await performanceService.getSpotterPerformanceMetrics(user.id);
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
      
      const confirmed = earnings?.filter(e => e.status === 'confirmed')
        .reduce((sum, e) => sum + parseFloat(e.amount), 0) || 0;
      const pending = earnings?.filter(e => e.status === 'pending')
        .reduce((sum, e) => sum + parseFloat(e.amount), 0) || 0;
      
      setTodaysEarnings(confirmed);
      setTodaysPendingEarnings(pending);
      
      // Count today's trends
      const { data: trends } = await supabase
        .from('trend_submissions')
        .select('id', { count: 'exact' })
        .eq('spotter_id', user.id)
        .gte('created_at', today.toISOString());
      
      setTodaysTrends(trends?.length || 0);
    } catch (error) {
      console.error('Error loading metrics:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!trendLink.trim()) return;
    setShowTrendForm(true);
  };

  const handleTrendSubmit = async (trendData: any) => {
    try {
      // Submit trend logic here (simplified)
      await loadMetrics();
      setSubmitMessage({ type: 'success', text: 'Trend submitted successfully!' });
      setTrendLink('');
      setShowTrendForm(false);
      setTimeout(() => setSubmitMessage(null), 3000);
    } catch (error) {
      setSubmitMessage({ type: 'error', text: 'Failed to submit trend' });
      setTimeout(() => setSubmitMessage(null), 3000);
    }
  };

  return (
    <div className="min-h-screen bg-gray-950">
      <div className="max-w-5xl mx-auto px-6 py-8">
        {/* Clean Header */}
        <div className="flex items-center justify-between mb-12">
          <button
            onClick={() => router.push('/dashboard')}
            className="p-3 hover:bg-gray-800 rounded-xl transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-gray-400" />
          </button>
          
          <div className="flex items-center gap-3">
            <WaveLogo size={32} animated={true} showTitle={false} />
            <h1 className="text-2xl font-semibold text-white">Trend Spotting</h1>
          </div>

          {user && spotterMetrics && (
            <SpotterTierDisplay 
              userId={user.id} 
              compact={true}
            />
          )}
        </div>

        {/* Main Content */}
        <div className="space-y-8">
          {/* Today's Stats - Clean Cards */}
          <div className="grid grid-cols-3 gap-6">
            <div className="bg-gray-900 rounded-2xl p-6 border border-gray-800">
              <p className="text-sm text-gray-400 mb-2">Confirmed</p>
              <p className="text-3xl font-bold text-white">{formatCurrency(todaysEarnings)}</p>
            </div>
            <div className="bg-gray-900 rounded-2xl p-6 border border-gray-800">
              <p className="text-sm text-gray-400 mb-2">Pending</p>
              <p className="text-3xl font-bold text-yellow-400">{formatCurrency(todaysPendingEarnings)}</p>
            </div>
            <div className="bg-gray-900 rounded-2xl p-6 border border-gray-800">
              <p className="text-sm text-gray-400 mb-2">Trends Today</p>
              <p className="text-3xl font-bold text-blue-400">{todaysTrends}</p>
            </div>
          </div>

          {/* Submit Section - Simplified */}
          <div className="bg-gray-900 rounded-2xl p-8 border border-gray-800">
            <h2 className="text-xl font-semibold text-white mb-6">Submit New Trend</h2>
            
            {/* Quick Links */}
            <div className="flex gap-3 mb-6">
              {platforms.map((platform) => (
                <button
                  key={platform.name}
                  onClick={() => window.open(platform.url, '_blank')}
                  className={`px-4 py-2 rounded-lg ${platform.color} text-white text-sm font-medium hover:opacity-90 transition-opacity`}
                >
                  {platform.name}
                </button>
              ))}
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              <input
                type="url"
                value={trendLink}
                onChange={(e) => setTrendLink(e.target.value)}
                placeholder="Paste trending link here..."
                className="w-full px-5 py-4 bg-gray-800 border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              />
              
              <div className="flex gap-4">
                <button
                  type="submit"
                  disabled={!trendLink.trim()}
                  className="flex-1 py-4 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-700 disabled:opacity-50 rounded-xl font-medium text-white transition-colors flex items-center justify-center gap-2"
                >
                  <Send className="w-5 h-5" />
                  Add Details
                </button>
                <button
                  type="button"
                  onClick={() => setShowScreenshotForm(true)}
                  className="flex-1 py-4 bg-gray-800 hover:bg-gray-700 rounded-xl font-medium text-white transition-colors flex items-center justify-center gap-2"
                >
                  <Camera className="w-5 h-5" />
                  Upload Screenshot
                </button>
              </div>
            </form>

            {/* Message */}
            {submitMessage && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`mt-4 p-4 rounded-lg ${
                  submitMessage.type === 'success'
                    ? 'bg-green-900/50 text-green-400 border border-green-800'
                    : 'bg-red-900/50 text-red-400 border border-red-800'
                }`}
              >
                {submitMessage.text}
              </motion.div>
            )}
          </div>

          {/* Performance Summary - Clean */}
          {spotterMetrics && (
            <div className="bg-gray-900 rounded-2xl p-8 border border-gray-800">
              <h3 className="text-lg font-semibold text-white mb-6">Your Performance</h3>
              
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-gray-400">Approval Rate</span>
                    <span className="text-white font-medium">
                      {(spotterMetrics.trendApprovalRate30d * 100).toFixed(0)}%
                    </span>
                  </div>
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-gray-400">Quality Score</span>
                    <span className="text-white font-medium">
                      {(spotterMetrics.submissionQualityScore * 100).toFixed(0)}%
                    </span>
                  </div>
                </div>
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-gray-400">Viral Rate</span>
                    <span className="text-white font-medium">
                      {(spotterMetrics.trendViralRate30d * 100).toFixed(0)}%
                    </span>
                  </div>
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-gray-400">Streak</span>
                    <span className="text-white font-medium">
                      {spotterMetrics.consecutiveApprovedTrends} days
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modals */}
      {showTrendForm && (
        <TrendSubmissionFormMerged
          onClose={() => {
            setShowTrendForm(false);
            setTrendLink('');
          }}
          onSubmit={handleTrendSubmit}
          initialUrl={trendLink}
        />
      )}

      {showScreenshotForm && (
        <TrendScreenshotUpload
          onClose={() => setShowScreenshotForm(false)}
          onSubmit={() => {
            setSubmitMessage({ type: 'success', text: 'Screenshot submitted!' });
            setTimeout(() => setSubmitMessage(null), 3000);
            loadMetrics();
          }}
        />
      )}
    </div>
  );
}