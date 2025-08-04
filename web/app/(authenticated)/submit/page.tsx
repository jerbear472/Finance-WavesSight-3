'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  TrendingUp, 
  DollarSign,
  Target,
  ArrowLeft,
  Clock,
  Award,
  BarChart3,
  AlertCircle,
  ChevronRight,
  Info,
  CheckCircle2,
  Timer,
  Shield,
  Rocket,
  Plus
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import { supabase } from '@/lib/supabase';
import FinanceTrendSubmissionForm from '@/components/FinanceTrendSubmissionForm';

interface SubmissionStats {
  todayEarnings: number;
  pendingTrends: number;
  accuracyRate: number;
  totalSubmissions: number;
  dailyLimit: number;
  remainingSubmissions: number;
  weeklyEarnings: number;
  streak: number;
}

interface RecentSubmission {
  id: string;
  trend_name: string;
  platform: string;
  calculated_payout: number;
  verification_status: 'pending' | 'verified' | 'rejected';
  created_at: string;
}

export default function FinanceSubmitPage() {
  const router = useRouter();
  const { user } = useAuth();
  const { showSuccess, showError } = useToast();
  const [showForm, setShowForm] = useState(false);
  // Quick submit removed - const [showQuickSubmit, setShowQuickSubmit] = useState(false);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'payouts'>('overview');
  const [stats, setStats] = useState<SubmissionStats>({
    todayEarnings: 0,
    pendingTrends: 0,
    accuracyRate: 0,
    totalSubmissions: 0,
    dailyLimit: 25,
    remainingSubmissions: 25,
    weeklyEarnings: 0,
    streak: 0
  });
  const [recentSubmissions, setRecentSubmissions] = useState<RecentSubmission[]>([]);
  // Quick submit removed
  // const [quickSubmitData, setQuickSubmitData] = useState({
  //   platform: '',
  //   primary_link: '',
  //   trend_name: ''
  // });

  useEffect(() => {
    if (user) {
      fetchUserStats();
      fetchRecentSubmissions();
    }
  }, [user]);

  const fetchUserStats = async () => {
    try {
      // Fetch user earnings
      const { data: earnings } = await supabase
        .from('user_earnings')
        .select('*')
        .eq('user_id', user?.id)
        .single();

      // Fetch today's submissions
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const { data: todaySubmissions } = await supabase
        .from('finance_trends')
        .select('calculated_payout, verification_status')
        .eq('user_id', user?.id)
        .gte('created_at', today.toISOString());

      // Calculate stats
      const todayEarnings = todaySubmissions
        ?.filter(s => s.verification_status === 'verified')
        .reduce((sum, s) => sum + (s.calculated_payout || 0), 0) || 0;

      const pendingCount = todaySubmissions
        ?.filter(s => s.verification_status === 'pending').length || 0;

      // Get total submissions for accuracy calculation
      const { count: totalCount } = await supabase
        .from('finance_trends')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user?.id);

      const { count: verifiedCount } = await supabase
        .from('finance_trends')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user?.id)
        .eq('verification_status', 'verified');

      const accuracyRate = totalCount ? Math.round((verifiedCount || 0) / totalCount * 100) : 0;

      setStats({
        todayEarnings,
        pendingTrends: pendingCount,
        accuracyRate,
        totalSubmissions: totalCount || 0,
        dailyLimit: 25,
        remainingSubmissions: Math.max(0, 25 - (todaySubmissions?.length || 0)),
        weeklyEarnings: earnings?.available_earnings || 0,
        streak: 0 // TODO: Calculate streak
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchRecentSubmissions = async () => {
    try {
      const { data } = await supabase
        .from('finance_trends')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false })
        .limit(5);

      setRecentSubmissions(data || []);
    } catch (error) {
      console.error('Error fetching submissions:', error);
    }
  };

  const handleSubmit = async (data: any) => {
    try {
      const response = await fetch('/api/finance-trends', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(data)
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to submit');
      }
      
      const result = await response.json();
      showSuccess(
        '🎉 Trend Submitted!', 
        `Estimated payout: $${result.trend.calculated_payout.toFixed(2)}`
      );
      
      // Refresh stats and submissions
      fetchUserStats();
      fetchRecentSubmissions();
      
      setShowForm(false);
    } catch (error: any) {
      showError('Submission Failed', error.message || 'Please try again');
    }
  };

  // Quick submit removed
  // const handleQuickSubmit = async () => {
  //   if (!quickSubmitData.platform || !quickSubmitData.primary_link || !quickSubmitData.trend_name) {
  //     showError('Missing Fields', 'Please fill in all fields');
  //     return;
  //   }

  //   const data = {
  //     ...quickSubmitData,
  //     signal_type: 'general_stock_mention',
  //     viral_evidence: ['high_engagement'],
  //     market_sentiment: 'neutral',
  //     drivers: ['retail_traders'],
  //     spread_velocity: 'picking_up',
  //     investment_timeline: 'short_term'
  //   };
    
  //   await handleSubmit(data);
  //   setShowQuickSubmit(false);
  //   setQuickSubmitData({ platform: '', primary_link: '', trend_name: '' });
  // };

  const getPlatformIcon = (platform: string) => {
    const icons: Record<string, string> = {
      'reddit_wsb': '🟠',
      'reddit_crypto': '🟠',
      'reddit_stocks': '🟠',
      'reddit_other': '🟠',
      'twitter_fintwit': '🐦',
      'twitter_crypto': '🐦',
      'tiktok': '📱',
      'instagram': '📷',
      'youtube': '📺',
      'linkedin': '💼',
      'other': '🌐'
    };
    return icons[platform] || '🌐';
  };

  const formatTimeAgo = (date: string) => {
    const now = new Date();
    const then = new Date(date);
    const diff = now.getTime() - then.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    
    if (hours < 1) return 'Just now';
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    if (days === 1) return 'Yesterday';
    return `${days} days ago`;
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900/20 to-gray-900 flex items-center justify-center p-4">
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center max-w-md"
        >
          <div className="bg-gradient-to-br from-blue-500/20 to-purple-500/20 backdrop-blur-xl rounded-3xl p-12 border border-white/10">
            <TrendingUp className="w-20 h-20 text-blue-400 mx-auto mb-6" />
            <h2 className="text-3xl font-bold text-white mb-4">Start Earning Today</h2>
            <p className="text-gray-300 mb-8">
              Join thousands spotting financial trends and earning rewards
            </p>
            <button 
              onClick={() => router.push('/login')}
              className="w-full px-8 py-4 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl font-semibold text-white hover:from-blue-600 hover:to-purple-700 transition-all transform hover:scale-105 shadow-lg"
            >
              Login to Start Earning
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Professional Floating Action Button */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="fixed bottom-8 right-8 z-40"
      >
        <button
          onClick={() => setShowForm(true)}
          className="group flex items-center gap-2.5 px-5 py-3.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow-lg hover:shadow-xl transition-all duration-200"
        >
          <Plus className="w-5 h-5" />
          <span className="font-medium">Submit New Trend</span>
          
          {/* Stats badge */}
          {stats.todayEarnings > 0 && (
            <div className="flex items-center gap-1 ml-2 px-2.5 py-1 bg-white/20 rounded-full">
              <span className="text-sm font-semibold">${stats.todayEarnings.toFixed(2)}</span>
            </div>
          )}
        </button>
      </motion.div>

      {/* Professional Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => router.push('/dashboard')}
                className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
                <span className="font-medium">Back to Dashboard</span>
              </button>
              <div className="w-px h-6 bg-gray-300" />
              <h1 className="text-xl font-semibold text-gray-900">Financial Trend Submission</h1>
            </div>
            
            <div className="flex items-center gap-6">
              {/* Daily Progress */}
              <div className="flex items-center gap-3">
                <div className="text-right">
                  <p className="text-xs text-gray-500 font-medium">DAILY PROGRESS</p>
                  <p className="text-lg font-semibold text-gray-900">
                    {stats.dailyLimit - stats.remainingSubmissions} of {stats.dailyLimit}
                  </p>
                </div>
                <div className="w-32 h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-blue-600 transition-all duration-300"
                    style={{ width: `${((stats.dailyLimit - stats.remainingSubmissions) / stats.dailyLimit) * 100}%` }}
                  />
                </div>
              </div>
              
              {/* Streak */}
              {stats.streak > 0 && (
                <div className="flex items-center gap-2 px-4 py-2 bg-orange-50 rounded-lg border border-orange-200">
                  <Rocket className="w-4 h-4 text-orange-600" />
                  <span className="text-orange-700 font-medium">{stats.streak} day streak</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-6 py-8 max-w-7xl">
        {/* Professional Hero Section */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 mb-8">
          <div className="max-w-3xl">
            <h2 className="text-3xl font-bold text-gray-900 mb-3">
              Spot Financial Trends. Earn Rewards.
            </h2>
            <p className="text-lg text-gray-600 leading-relaxed">
              Identify emerging market movements across social media platforms. 
              Quality submissions earn up to $10.00 per trend.
            </p>
          </div>
        </div>

        {/* Professional Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          {/* Today's Earnings */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-2 bg-green-100 rounded-lg">
                <DollarSign className="w-6 h-6 text-green-600" />
              </div>
              {stats.todayEarnings > 0 && (
                <TrendingUp className="w-4 h-4 text-green-600" />
              )}
            </div>
            <div className="text-2xl font-bold text-gray-900">${stats.todayEarnings.toFixed(2)}</div>
            <div className="text-sm text-gray-600 font-medium mt-1">Today's Earnings</div>
          </div>

          {/* Pending Review */}
          <button
            onClick={() => router.push('/verify')}
            className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 text-left hover:border-orange-300 hover:shadow-md transition-all group"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="p-2 bg-orange-100 rounded-lg">
                <Clock className="w-6 h-6 text-orange-600" />
              </div>
              <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-orange-600 transition-colors" />
            </div>
            <div className="text-2xl font-bold text-gray-900">{stats.pendingTrends}</div>
            <div className="text-sm text-gray-600 font-medium mt-1">Pending Review</div>
          </button>

          {/* Accuracy Rate */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Award className="w-6 h-6 text-purple-600" />
              </div>
              <Shield className="w-4 h-4 text-purple-600" />
            </div>
            <div className="text-2xl font-bold text-gray-900">{stats.accuracyRate}%</div>
            <div className="text-sm text-gray-600 font-medium mt-1">Accuracy Rate</div>
          </div>

          {/* Weekly Total */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-2 bg-blue-100 rounded-lg">
                <BarChart3 className="w-6 h-6 text-blue-600" />
              </div>
              <Timer className="w-4 h-4 text-blue-600" />
            </div>
            <div className="text-2xl font-bold text-gray-900">${stats.weeklyEarnings.toFixed(2)}</div>
            <div className="text-sm text-gray-600 font-medium mt-1">This Week</div>
          </div>
        </div>

        {/* Submission Options */}
        <div className="max-w-2xl mx-auto mb-8">
          {/* Full Analysis Only */}
          <button
            onClick={() => setShowForm(true)}
            className="w-full bg-blue-50 rounded-lg shadow-sm border-2 border-blue-200 p-8 hover:border-blue-400 hover:shadow-md transition-all text-left group relative"
          >
            <div className="absolute top-4 right-4 bg-blue-600 text-white text-xs font-bold px-3 py-1 rounded-full">
              SUBMIT TREND
            </div>
            
            <div className="flex items-start justify-between mb-6">
              <div className="p-3 bg-blue-100 rounded-lg">
                <TrendingUp className="w-7 h-7 text-blue-600" />
              </div>
              <span className="text-xs font-semibold text-blue-700 bg-blue-100 px-3 py-1.5 rounded-full">
                2-3 MINUTES
              </span>
            </div>
            
            <h3 className="text-xl font-bold text-gray-900 mb-2">Submit Financial Trend</h3>
            <p className="text-gray-600 mb-6">
              Comprehensive trend analysis with evidence and market signals. Quality submissions earn higher payouts.
            </p>
            
            <div className="flex items-center justify-between pt-4 border-t border-blue-100">
              <div>
                <span className="text-sm text-gray-500">Variable payout based on quality</span>
                <div className="text-2xl font-bold text-blue-600">$1.00 - $10.00</div>
              </div>
              <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-blue-600 transition-colors" />
            </div>
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-8">
          <div className="flex border-b border-gray-200">
            <button
              onClick={() => setActiveTab('overview')}
              className={`flex-1 px-6 py-4 text-sm font-medium transition-colors ${
                activeTab === 'overview'
                  ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50/50'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Overview
            </button>
            <button
              onClick={() => setActiveTab('payouts')}
              className={`flex-1 px-6 py-4 text-sm font-medium transition-colors ${
                activeTab === 'payouts'
                  ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50/50'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Payout Structure
            </button>
          </div>
          
          <div className="p-8">
            {activeTab === 'overview' ? (
              <div className="max-w-4xl">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">How It Works</h3>
                <div className="space-y-4">
                  <div className="flex gap-4">
                    <div className="flex-shrink-0 w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-sm font-bold text-blue-600">1</div>
                    <div>
                      <h4 className="font-medium text-gray-900 mb-1">Spot a Financial Trend</h4>
                      <p className="text-gray-600">Find trending stocks, crypto, or financial discussions on social media platforms.</p>
                    </div>
                  </div>
                  <div className="flex gap-4">
                    <div className="flex-shrink-0 w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-sm font-bold text-blue-600">2</div>
                    <div>
                      <h4 className="font-medium text-gray-900 mb-1">Submit Your Analysis</h4>
                      <p className="text-gray-600">Submit comprehensive trend analysis with evidence for payouts up to $10.00.</p>
                    </div>
                  </div>
                  <div className="flex gap-4">
                    <div className="flex-shrink-0 w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-sm font-bold text-blue-600">3</div>
                    <div>
                      <h4 className="font-medium text-gray-900 mb-1">Get Paid</h4>
                      <p className="text-gray-600">Verified trends are paid out daily. Higher quality = higher payouts.</p>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-6">Payout Categories</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {[
                    { 
                      icon: <Target className="w-6 h-6 text-purple-600" />, 
                      label: 'Meme Stock Momentum', 
                      desc: 'WSB activity, squeeze potential, retail frenzy', 
                      payout: '$5.00 - $10.00',
                      bgColor: 'bg-purple-50',
                      iconBg: 'bg-purple-100'
                    },
                    { 
                      icon: <Rocket className="w-6 h-6 text-blue-600" />, 
                      label: 'Crypto Pump Signal', 
                      desc: 'Altcoin momentum, DeFi trends, NFT buzz', 
                      payout: '$3.00 - $6.00',
                      bgColor: 'bg-blue-50',
                      iconBg: 'bg-blue-100'
                    },
                    { 
                      icon: <BarChart3 className="w-6 h-6 text-green-600" />, 
                      label: 'Earnings/IPO Buzz', 
                      desc: 'Pre-earnings sentiment, IPO speculation', 
                      payout: '$2.00 - $4.00',
                      bgColor: 'bg-green-50',
                      iconBg: 'bg-green-100'
                    },
                    { 
                      icon: <TrendingUp className="w-6 h-6 text-orange-600" />, 
                      label: 'Company Going Viral', 
                      desc: 'Brand trending, product launches, PR events', 
                      payout: '$2.00 - $4.00',
                      bgColor: 'bg-orange-50',
                      iconBg: 'bg-orange-100'
                    }
                  ].map((item, index) => (
                    <div
                      key={index}
                      className={`${item.bgColor} rounded-lg p-6 border border-gray-200`}
                    >
                      <div className="flex items-start gap-4">
                        <div className={`p-2 ${item.iconBg} rounded-lg`}>
                          {item.icon}
                        </div>
                        <div className="flex-1">
                          <h4 className="font-semibold text-gray-900">{item.label}</h4>
                          <p className="text-sm text-gray-600 mt-1">{item.desc}</p>
                          <div className="mt-3 text-lg font-bold text-gray-900">{item.payout}</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                
                <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <div className="flex gap-3">
                    <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm text-gray-700">
                        <span className="font-semibold">Bonus Multipliers:</span> High engagement (+50%), 
                        Cross-platform spread (+75%), Technical analysis (+$0.75), Demographics data (+$0.50)
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Recent Submissions */}
        {recentSubmissions.length > 0 && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Your Recent Submissions</h3>
            </div>
            <div className="divide-y divide-gray-200">
              {recentSubmissions.map((submission) => (
                <div
                  key={submission.id}
                  className="px-6 py-4 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4 flex-1">
                      <div className="text-2xl">
                        {getPlatformIcon(submission.platform)}
                      </div>
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-900">
                          {submission.trend_name}
                        </h4>
                        <div className="flex items-center gap-3 mt-1 text-sm text-gray-500">
                          <span>{submission.platform.replace(/_/g, ' ')}</span>
                          <span>•</span>
                          <span>{formatTimeAgo(submission.created_at)}</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="text-right">
                      <div className="text-lg font-semibold text-gray-900">
                        ${submission.calculated_payout.toFixed(2)}
                      </div>
                      <div className={`inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full ${
                        submission.verification_status === 'verified' 
                          ? 'bg-green-100 text-green-700' 
                          : submission.verification_status === 'rejected'
                          ? 'bg-red-100 text-red-700'
                          : 'bg-yellow-100 text-yellow-700'
                      }`}>
                        {submission.verification_status === 'verified' && <CheckCircle2 className="w-3 h-3" />}
                        {submission.verification_status === 'pending' && <Clock className="w-3 h-3" />}
                        {submission.verification_status === 'rejected' && <AlertCircle className="w-3 h-3" />}
                        <span className="capitalize">{submission.verification_status}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Full Form Modal */}
      <AnimatePresence>
        {showForm && (
          <FinanceTrendSubmissionForm
            onClose={() => setShowForm(false)}
            onSubmit={handleSubmit}
          />
        )}
      </AnimatePresence>

      {/* Quick Submit Modal Removed */}
    </div>
  );
}