'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import { 
  TrendingUp,
  CheckCircle,
  XCircle,
  AlertCircle,
  DollarSign,
  BarChart3,
  Clock,
  Users,
  Globe,
  ChevronLeft,
  ChevronRight,
  ThumbsUp,
  ThumbsDown,
  MessageSquare,
  ExternalLink,
  Hash,
  Calendar,
  Target
} from 'lucide-react';

interface FinanceTrend {
  id: string;
  trend_name: string;
  platform: string;
  primary_link: string;
  company_mentioned?: string;
  ticker_symbol?: string;
  signal_type: string;
  viral_evidence: string[];
  market_sentiment: string;
  drivers: string[];
  spread_velocity: string;
  investment_timeline: string;
  catalyst_type?: string;
  cross_platform: string[];
  purchase_intent_signals: string[];
  geographic_signal?: string;
  demographics?: string[];
  technical_context?: string;
  calculated_payout: number;
  financial_relevance_score: number;
  quality_score: number;
  created_at: string;
  user_id: string;
  creator_handle?: string;
  creator_name?: string;
  post_caption?: string;
  likes_count?: number;
  comments_count?: number;
  shares_count?: number;
  views_count?: number;
  verification_status: 'pending' | 'verified' | 'rejected';
  user?: {
    username: string;
    avatar_url?: string;
  };
}

interface VerificationData {
  financial_relevance: 'highly_relevant' | 'somewhat_relevant' | 'low_relevance' | 'not_financial';
  viral_evidence_quality: 'strong' | 'some' | 'weak' | 'none';
  signal_quality: 'actionable' | 'interesting' | 'generic' | 'spam';
  notes?: string;
}

// Import constants from submission form
const SIGNAL_TYPES = {
  meme_stock_momentum: { label: '💎 Meme Stock Momentum', payout: 5.00 },
  crypto_pump_signal: { label: '🚀 Crypto Pump Signal', payout: 3.00 },
  earnings_ipo_buzz: { label: '📊 Earnings/IPO Buzz', payout: 2.00 },
  company_going_viral: { label: '🏢 Company Going Viral', payout: 2.00 },
  consumer_product_buzz: { label: '🛍️ Consumer Product Buzz', payout: 1.50 },
  app_tech_adoption: { label: '📱 App/Tech Adoption', payout: 1.50 },
  restaurant_retail_buzz: { label: '🍔 Restaurant/Retail Buzz', payout: 1.00 },
  general_stock_mention: { label: '📈 General Stock Mention', payout: 1.00 }
};

const MARKET_SENTIMENTS = {
  extremely_bullish: { label: '🚀 Extremely Bullish', color: 'text-green-400' },
  bullish: { label: '📈 Bullish', color: 'text-green-300' },
  neutral: { label: '😐 Neutral', color: 'text-wave-400' },
  bearish: { label: '📉 Bearish', color: 'text-red-300' },
  extremely_bearish: { label: '💀 Extremely Bearish', color: 'text-red-400' }
};

const INVESTMENT_TIMELINES = {
  immediate: '⚡ Immediate (0-24 hours)',
  short_term: '📅 Short-term (1-7 days)',
  medium_term: '📊 Medium-term (1-4 weeks)',
  long_term: '📈 Long-term (1-3 months)',
  unknown: '🤷 Unknown/Unclear'
};

interface FinanceTrendVerificationProps {
  trend: FinanceTrend;
  onVerify: (trendId: string, verification: VerificationData) => Promise<void>;
  onSkip?: () => void;
  isLastTrend?: boolean;
}

export default function FinanceTrendVerification({ 
  trend, 
  onVerify, 
  onSkip,
  isLastTrend = false 
}: FinanceTrendVerificationProps) {
  const { showSuccess, showError } = useToast();
  const [loading, setLoading] = useState(false);
  const [verification, setVerification] = useState<VerificationData>({
    financial_relevance: 'somewhat_relevant',
    viral_evidence_quality: 'some',
    signal_quality: 'interesting',
    notes: ''
  });
  
  const handleVerificationSubmit = async (approve: boolean) => {
    if (!approve && !verification.notes) {
      showError('Notes Required', 'Please provide a reason for rejection');
      return;
    }
    
    setLoading(true);
    try {
      // If rejecting, set all to lowest quality
      if (!approve) {
        verification.financial_relevance = 'not_financial';
        verification.viral_evidence_quality = 'none';
        verification.signal_quality = 'spam';
      }
      
      await onVerify(trend.id, verification);
      showSuccess(
        approve ? 'Trend Approved!' : 'Trend Rejected',
        approve ? `$${trend.calculated_payout.toFixed(2)} payout approved` : 'Trend has been rejected'
      );
      
      // Reset form for next trend
      setVerification({
        financial_relevance: 'somewhat_relevant',
        viral_evidence_quality: 'some',
        signal_quality: 'interesting',
        notes: ''
      });
    } catch (error: any) {
      showError('Verification Failed', error.message || 'Please try again');
    } finally {
      setLoading(false);
    }
  };
  
  const getQualityScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-400';
    if (score >= 70) return 'text-yellow-400';
    if (score >= 60) return 'text-orange-400';
    return 'text-red-400';
  };
  
  const getQualityScoreLabel = (score: number) => {
    if (score >= 90) return 'Auto-approve eligible';
    if (score >= 80) return 'Priority verification';
    if (score >= 70) return 'Promoted to verification';
    return 'Standard review';
  };
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-6xl mx-auto"
    >
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Trend Details */}
        <div className="lg:col-span-2 space-y-4">
          {/* Header */}
          <div className="wave-card p-6">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                  <TrendingUp className="w-6 h-6" />
                  {trend.trend_name}
                </h2>
                <div className="flex items-center gap-4 mt-2 text-sm text-wave-400">
                  <span className="flex items-center gap-1">
                    <Calendar className="w-4 h-4" />
                    {new Date(trend.created_at).toLocaleDateString()}
                  </span>
                  <span className="flex items-center gap-1">
                    <Users className="w-4 h-4" />
                    @{trend.user?.username || 'anonymous'}
                  </span>
                </div>
              </div>
              <div className="text-right">
                <div className="text-3xl font-bold text-green-400">
                  ${trend.calculated_payout.toFixed(2)}
                </div>
                <div className="text-sm text-wave-400">Potential payout</div>
              </div>
            </div>
            
            {/* Quality Scores */}
            <div className="grid grid-cols-2 gap-4 p-4 bg-wave-800/30 rounded-xl">
              <div>
                <div className="text-sm text-wave-400 mb-1">Quality Score</div>
                <div className={`text-2xl font-bold ${getQualityScoreColor(trend.quality_score)}`}>
                  {trend.quality_score}/100
                </div>
                <div className="text-xs text-wave-500">{getQualityScoreLabel(trend.quality_score)}</div>
              </div>
              <div>
                <div className="text-sm text-wave-400 mb-1">Financial Relevance</div>
                <div className="text-2xl font-bold text-wave-200">
                  {trend.financial_relevance_score}%
                </div>
              </div>
            </div>
          </div>
          
          {/* Signal Details */}
          <div className="wave-card p-6">
            <h3 className="font-medium text-wave-200 mb-4 flex items-center gap-2">
              <BarChart3 className="w-5 h-5" />
              Financial Signal Details
            </h3>
            
            <div className="space-y-4">
              {/* Signal Type */}
              <div>
                <div className="text-sm text-wave-400 mb-1">Signal Type</div>
                <div className="flex items-center gap-2">
                  <span className="text-wave-200 font-medium">
                    {SIGNAL_TYPES[trend.signal_type as keyof typeof SIGNAL_TYPES]?.label || trend.signal_type}
                  </span>
                  <span className="text-green-400">
                    (${SIGNAL_TYPES[trend.signal_type as keyof typeof SIGNAL_TYPES]?.payout.toFixed(2)} base)
                  </span>
                </div>
              </div>
              
              {/* Market Sentiment */}
              <div>
                <div className="text-sm text-wave-400 mb-1">Market Sentiment</div>
                <div className={`font-medium ${
                  MARKET_SENTIMENTS[trend.market_sentiment as keyof typeof MARKET_SENTIMENTS]?.color || 'text-wave-200'
                }`}>
                  {MARKET_SENTIMENTS[trend.market_sentiment as keyof typeof MARKET_SENTIMENTS]?.label || trend.market_sentiment}
                </div>
              </div>
              
              {/* Investment Timeline */}
              <div>
                <div className="text-sm text-wave-400 mb-1">Investment Timeline</div>
                <div className="text-wave-200">
                  {INVESTMENT_TIMELINES[trend.investment_timeline as keyof typeof INVESTMENT_TIMELINES] || trend.investment_timeline}
                </div>
              </div>
              
              {/* Company/Ticker */}
              {(trend.company_mentioned || trend.ticker_symbol) && (
                <div className="flex gap-4">
                  {trend.company_mentioned && (
                    <div>
                      <div className="text-sm text-wave-400 mb-1">Company</div>
                      <div className="text-wave-200 font-medium">{trend.company_mentioned}</div>
                    </div>
                  )}
                  {trend.ticker_symbol && (
                    <div>
                      <div className="text-sm text-wave-400 mb-1">Ticker</div>
                      <div className="text-wave-200 font-medium flex items-center gap-1">
                        <Hash className="w-4 h-4" />
                        {trend.ticker_symbol}
                      </div>
                    </div>
                  )}
                </div>
              )}
              
              {/* Viral Evidence */}
              {trend.viral_evidence.length > 0 && (
                <div>
                  <div className="text-sm text-wave-400 mb-2">Viral Evidence ({trend.viral_evidence.length})</div>
                  <div className="flex flex-wrap gap-2">
                    {trend.viral_evidence.map((evidence) => (
                      <span key={evidence} className="px-3 py-1 bg-wave-700/50 rounded-full text-xs text-wave-300">
                        {evidence.replace(/_/g, ' ')}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              
              {/* Cross-Platform Spread */}
              {trend.cross_platform.length > 0 && (
                <div>
                  <div className="text-sm text-wave-400 mb-2">Cross-Platform Spread</div>
                  <div className="flex flex-wrap gap-2">
                    {trend.cross_platform.map((platform) => (
                      <span key={platform} className="px-3 py-1 bg-wave-700/50 rounded-full text-xs text-wave-300">
                        {platform.replace(/_/g, ' ')}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
            
            {/* Primary Link */}
            <div className="mt-4 pt-4 border-t border-wave-700/30">
              <a
                href={trend.primary_link}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-wave-400 hover:text-wave-200 transition-colors"
              >
                <ExternalLink className="w-4 h-4" />
                View original post
              </a>
            </div>
          </div>
          
          {/* Social Media Metadata */}
          {(trend.creator_handle || trend.post_caption) && (
            <div className="wave-card p-6">
              <h3 className="font-medium text-wave-200 mb-4">Post Details</h3>
              
              {trend.creator_handle && (
                <div className="mb-3">
                  <div className="text-sm text-wave-400 mb-1">Creator</div>
                  <div className="text-wave-200">
                    @{trend.creator_handle} {trend.creator_name && `(${trend.creator_name})`}
                  </div>
                </div>
              )}
              
              {trend.post_caption && (
                <div className="mb-3">
                  <div className="text-sm text-wave-400 mb-1">Caption</div>
                  <div className="text-wave-200 text-sm">{trend.post_caption}</div>
                </div>
              )}
              
              {/* Engagement Metrics */}
              <div className="grid grid-cols-4 gap-4 mt-4 pt-4 border-t border-wave-700/30">
                {trend.likes_count !== undefined && (
                  <div>
                    <div className="text-sm text-wave-400">Likes</div>
                    <div className="text-wave-200 font-medium">{trend.likes_count.toLocaleString()}</div>
                  </div>
                )}
                {trend.comments_count !== undefined && (
                  <div>
                    <div className="text-sm text-wave-400">Comments</div>
                    <div className="text-wave-200 font-medium">{trend.comments_count.toLocaleString()}</div>
                  </div>
                )}
                {trend.shares_count !== undefined && (
                  <div>
                    <div className="text-sm text-wave-400">Shares</div>
                    <div className="text-wave-200 font-medium">{trend.shares_count.toLocaleString()}</div>
                  </div>
                )}
                {trend.views_count !== undefined && (
                  <div>
                    <div className="text-sm text-wave-400">Views</div>
                    <div className="text-wave-200 font-medium">{trend.views_count.toLocaleString()}</div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
        
        {/* Right Column: Verification Form */}
        <div className="space-y-4">
          <div className="wave-card p-6 sticky top-4">
            <h3 className="font-medium text-wave-200 mb-4 flex items-center gap-2">
              <CheckCircle className="w-5 h-5" />
              Verification Questions
            </h3>
            
            <div className="space-y-4">
              {/* Financial Relevance */}
              <div>
                <label className="block text-sm text-wave-300 mb-2">
                  Financial Relevance
                </label>
                <div className="space-y-2">
                  {[
                    { value: 'highly_relevant', label: 'Highly relevant to markets' },
                    { value: 'somewhat_relevant', label: 'Somewhat relevant' },
                    { value: 'low_relevance', label: 'Low relevance' },
                    { value: 'not_financial', label: 'Not financial' }
                  ].map((option) => (
                    <label key={option.value} className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="financial_relevance"
                        value={option.value}
                        checked={verification.financial_relevance === option.value}
                        onChange={(e) => setVerification(prev => ({ 
                          ...prev, 
                          financial_relevance: e.target.value as any 
                        }))}
                        className="w-4 h-4 text-wave-500 bg-wave-800 border-wave-600"
                      />
                      <span className="text-sm text-wave-200">{option.label}</span>
                    </label>
                  ))}
                </div>
              </div>
              
              {/* Viral Evidence Quality */}
              <div>
                <label className="block text-sm text-wave-300 mb-2">
                  Viral Evidence
                </label>
                <div className="space-y-2">
                  {[
                    { value: 'strong', label: 'Strong evidence provided' },
                    { value: 'some', label: 'Some evidence' },
                    { value: 'weak', label: 'Weak evidence' },
                    { value: 'none', label: 'No real evidence' }
                  ].map((option) => (
                    <label key={option.value} className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="viral_evidence_quality"
                        value={option.value}
                        checked={verification.viral_evidence_quality === option.value}
                        onChange={(e) => setVerification(prev => ({ 
                          ...prev, 
                          viral_evidence_quality: e.target.value as any 
                        }))}
                        className="w-4 h-4 text-wave-500 bg-wave-800 border-wave-600"
                      />
                      <span className="text-sm text-wave-200">{option.label}</span>
                    </label>
                  ))}
                </div>
              </div>
              
              {/* Signal Quality */}
              <div>
                <label className="block text-sm text-wave-300 mb-2">
                  Signal Quality
                </label>
                <div className="space-y-2">
                  {[
                    { value: 'actionable', label: 'Actionable for traders' },
                    { value: 'interesting', label: 'Interesting but not actionable' },
                    { value: 'generic', label: 'Generic/obvious' },
                    { value: 'spam', label: 'Spam/low quality' }
                  ].map((option) => (
                    <label key={option.value} className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="signal_quality"
                        value={option.value}
                        checked={verification.signal_quality === option.value}
                        onChange={(e) => setVerification(prev => ({ 
                          ...prev, 
                          signal_quality: e.target.value as any 
                        }))}
                        className="w-4 h-4 text-wave-500 bg-wave-800 border-wave-600"
                      />
                      <span className="text-sm text-wave-200">{option.label}</span>
                    </label>
                  ))}
                </div>
              </div>
              
              {/* Notes */}
              <div>
                <label className="block text-sm text-wave-300 mb-2">
                  Notes (required for rejection)
                </label>
                <textarea
                  value={verification.notes}
                  onChange={(e) => setVerification(prev => ({ ...prev, notes: e.target.value }))}
                  className="w-full px-3 py-2 rounded-lg bg-wave-800/50 border border-wave-700/30 text-white placeholder-wave-500 focus:outline-none focus:ring-2 focus:border-wave-500 focus:ring-wave-500/20 min-h-[80px]"
                  placeholder="Additional feedback..."
                />
              </div>
              
              {/* Action Buttons */}
              <div className="space-y-3 pt-4">
                <button
                  onClick={() => handleVerificationSubmit(true)}
                  disabled={loading}
                  className="w-full px-4 py-3 rounded-xl bg-gradient-to-r from-green-500 to-green-600 hover:from-green-400 hover:to-green-500 transition-all disabled:opacity-50 flex items-center justify-center gap-2 font-medium"
                >
                  <ThumbsUp className="w-5 h-5" />
                  Approve (${trend.calculated_payout.toFixed(2)})
                </button>
                
                <button
                  onClick={() => handleVerificationSubmit(false)}
                  disabled={loading}
                  className="w-full px-4 py-3 rounded-xl bg-gradient-to-r from-red-500 to-red-600 hover:from-red-400 hover:to-red-500 transition-all disabled:opacity-50 flex items-center justify-center gap-2 font-medium"
                >
                  <ThumbsDown className="w-5 h-5" />
                  Reject
                </button>
                
                {onSkip && (
                  <button
                    onClick={onSkip}
                    disabled={loading}
                    className="w-full px-4 py-3 rounded-xl bg-wave-800/50 hover:bg-wave-700/50 transition-all disabled:opacity-50 text-wave-300"
                  >
                    Skip for Now
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}