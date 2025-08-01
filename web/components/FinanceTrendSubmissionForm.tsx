'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import { 
  TrendingUp,
  Link as LinkIcon,
  Tag as TagIcon,
  AlertCircle,
  Check,
  Loader,
  ChevronRight,
  ChevronLeft,
  DollarSign,
  BarChart3,
  Clock,
  Globe,
  Users,
  Target,
  X
} from 'lucide-react';
import StockTickerAutocomplete from './StockTickerAutocomplete';

// Types
interface FinanceTrendData {
  // Page 1: Basic Info
  trend_name: string;
  platform: string;
  primary_link: string;
  company_mentioned?: string;
  ticker_symbol?: string;
  
  // Page 2: Financial Signals
  signal_type: string;
  viral_evidence: string[];
  market_sentiment: string;
  drivers: string[];
  
  // Page 3: Market Impact
  spread_velocity: string;
  investment_timeline: string;
  catalyst_type?: string;
  cross_platform: string[];
  purchase_intent_signals: string[];
  
  // Bonus Fields
  geographic_signal?: string;
  demographics?: string[];
  technical_context?: string;
  
  // Social Media Metadata
  creator_handle?: string;
  creator_name?: string;
  post_caption?: string;
  likes_count?: number;
  comments_count?: number;
  shares_count?: number;
  views_count?: number;
  hashtags?: string[];
  thumbnail_url?: string;
  posted_at?: string;
}

// Configuration
const PLATFORMS = [
  { id: 'reddit_wsb', label: '🟠 Reddit (r/wallstreetbets)', color: 'bg-orange-500' },
  { id: 'reddit_crypto', label: '🟠 Reddit (r/cryptocurrency)', color: 'bg-orange-500' },
  { id: 'reddit_stocks', label: '🟠 Reddit (r/stocks)', color: 'bg-orange-500' },
  { id: 'reddit_other', label: '🟠 Reddit (Other finance sub)', color: 'bg-orange-500' },
  { id: 'twitter_fintwit', label: '🔵 Twitter/X (FinTwit)', color: 'bg-blue-500' },
  { id: 'twitter_crypto', label: '🔵 Twitter/X (Crypto Twitter)', color: 'bg-blue-500' },
  { id: 'tiktok', label: '⚫ TikTok', color: 'bg-black' },
  { id: 'instagram', label: '🟣 Instagram', color: 'bg-purple-500' },
  { id: 'youtube', label: '🔴 YouTube', color: 'bg-red-600' },
  { id: 'linkedin', label: '🔵 LinkedIn', color: 'bg-blue-700' },
  { id: 'other', label: '⚪ Other', color: 'bg-gray-500' }
];

const SIGNAL_TYPES = [
  { id: 'meme_stock_momentum', label: '💎 Meme Stock Momentum', base_payout: 5.00, description: 'WSB-style pump, retail frenzy' },
  { id: 'crypto_pump_signal', label: '🚀 Crypto Pump Signal', base_payout: 3.00, description: 'Altcoin pump, DeFi protocol buzz' },
  { id: 'earnings_ipo_buzz', label: '📊 Earnings/IPO Buzz', base_payout: 2.00, description: 'Earnings whispers, IPO hype' },
  { id: 'company_going_viral', label: '🏢 Company Going Viral', base_payout: 2.00, description: 'Company drama, viral news' },
  { id: 'consumer_product_buzz', label: '🛍️ Consumer Product Buzz', base_payout: 1.50, description: 'Product reviews, trend alerts' },
  { id: 'app_tech_adoption', label: '📱 App/Tech Adoption', base_payout: 1.50, description: 'New platform, tech trend' },
  { id: 'restaurant_retail_buzz', label: '🍔 Restaurant/Retail Buzz', base_payout: 1.00, description: 'Store trends, food viral' },
  { id: 'general_stock_mention', label: '📈 General Stock Mention', base_payout: 1.00, description: 'Stock discussion, general mention' }
];

const VIRAL_EVIDENCE_OPTIONS = [
  { id: 'high_engagement', label: 'High engagement (10K+ likes/upvotes)' },
  { id: 'multiple_posts', label: 'Multiple posts on same topic' },
  { id: 'influencer_posting', label: 'Influencer/whale accounts posting' },
  { id: 'cross_platform', label: 'Cross-platform appearance' },
  { id: 'comment_consensus', label: 'Comments showing consensus' },
  { id: 'trending_hashtag', label: 'Trending hashtag' },
  { id: 'unusual_volume', label: 'Unusual volume of mentions' },
  { id: 'media_coverage', label: 'Media/news starting to cover' }
];

const MARKET_SENTIMENTS = [
  { id: 'extremely_bullish', label: '🚀 Extremely Bullish', description: 'moon/pump energy' },
  { id: 'bullish', label: '📈 Bullish', description: 'positive/optimistic' },
  { id: 'neutral', label: '😐 Neutral/Mixed', description: 'unclear direction' },
  { id: 'bearish', label: '📉 Bearish', description: 'negative/concerned' },
  { id: 'extremely_bearish', label: '💀 Extremely Bearish', description: 'crash/dump energy' }
];

const DRIVERS = [
  { id: 'retail_traders', label: 'Retail traders/WSB' },
  { id: 'crypto_whales', label: 'Crypto whales/influencers' },
  { id: 'finance_pros', label: 'Finance professionals' },
  { id: 'general_consumers', label: 'General consumers' },
  { id: 'institutional', label: 'Institutional accounts' },
  { id: 'celebrities', label: 'Celebrities/mainstream' },
  { id: 'media', label: 'Media coverage' },
  { id: 'insiders', label: 'Company insiders' }
];

const SPREAD_VELOCITIES = [
  { id: 'just_starting', label: '🌱 Just Starting', description: 'first posts appearing' },
  { id: 'picking_up', label: '📈 Picking Up', description: 'gaining momentum' },
  { id: 'viral', label: '🔥 Viral', description: 'everywhere on platform' },
  { id: 'saturated', label: '🏢 Saturated', description: 'brands/media jumping in' },
  { id: 'declining', label: '📉 Declining', description: 'losing steam' }
];

const INVESTMENT_TIMELINES = [
  { id: 'immediate', label: '⚡ Immediate (0-24 hours)' },
  { id: 'short_term', label: '📅 Short-term (1-7 days)' },
  { id: 'medium_term', label: '📊 Medium-term (1-4 weeks)' },
  { id: 'long_term', label: '📈 Long-term (1-3 months)' },
  { id: 'unknown', label: '🤷 Unknown/Unclear' }
];

const CATALYST_TYPES = [
  { id: 'earnings_approaching', label: '📊 Earnings approaching' },
  { id: 'news_announcement', label: '📰 News/announcement expected' },
  { id: 'product_launch', label: '🎯 Product launch/event' },
  { id: 'partnership_rumors', label: '💰 Partnership rumors' },
  { id: 'regulatory_decision', label: '🏛️ Regulatory decision pending' },
  { id: 'technical_breakout', label: '📈 Technical breakout' },
  { id: 'meme_social_momentum', label: '🎪 Meme/social momentum only' }
];

const CROSS_PLATFORMS = [
  { id: 'reddit', label: 'Also on Reddit' },
  { id: 'twitter', label: 'Also on Twitter/X' },
  { id: 'tiktok', label: 'Also on TikTok' },
  { id: 'instagram', label: 'Also on Instagram' },
  { id: 'youtube', label: 'Also on YouTube' },
  { id: 'single_platform', label: 'Just this platform' }
];

const PURCHASE_INTENT_SIGNALS = [
  { id: 'buying_mentions', label: 'Comments about buying/investing' },
  { id: 'sold_out', label: '"Sold out" mentions' },
  { id: 'price_research', label: 'Price research discussions' },
  { id: 'fomo_language', label: 'FOMO language ("need to get in")' },
  { id: 'portfolio_talk', label: 'Portfolio allocation talk' },
  { id: 'no_signals', label: 'No purchase signals visible' }
];

const GEOGRAPHIC_SIGNALS = [
  { id: 'global', label: '🌍 Global trend', bonus: 0.25 },
  { id: 'us_focused', label: '🇺🇸 US-focused', bonus: 0.25 },
  { id: 'major_cities', label: '🌆 Major cities (NYC, LA, SF)', bonus: 0.25 },
  { id: 'college_campuses', label: '🏫 College campuses', bonus: 0.25 },
  { id: 'suburban', label: '🏘️ Suburban communities', bonus: 0.25 },
  { id: 'specific_region', label: '🌐 Specific region', bonus: 0.25 }
];

const DEMOGRAPHICS = [
  { id: 'gen_z', label: 'Gen Z (18-24)' },
  { id: 'millennials', label: 'Millennials (25-40)' },
  { id: 'gen_x', label: 'Gen X (41-56)' },
  { id: 'boomers', label: 'Boomers (57+)' },
  { id: 'finance_pros', label: 'Finance professionals' },
  { id: 'crypto_natives', label: 'Crypto natives' },
  { id: 'traditional_investors', label: 'Traditional investors' },
  { id: 'first_time_traders', label: 'First-time traders' }
];

const TECHNICAL_CONTEXTS = [
  { id: 'resistance_level', label: '📊 Stock at resistance level', bonus: 0.75 },
  { id: 'support_level', label: '📉 Stock at support level', bonus: 0.75 },
  { id: 'breaking_out', label: '🚀 Breaking out of range', bonus: 0.75 },
  { id: 'following_market', label: '📈 Following broader market', bonus: 0.75 },
  { id: 'against_market', label: '💥 Moving against market', bonus: 0.75 },
  { id: 'no_technical', label: '🤷 No technical relevance', bonus: 0 }
];

interface FinanceTrendSubmissionFormProps {
  onClose: () => void;
  onSubmit: (data: FinanceTrendData) => Promise<void>;
  initialUrl?: string;
}

export default function FinanceTrendSubmissionForm({ onClose, onSubmit, initialUrl = '' }: FinanceTrendSubmissionFormProps) {
  const { user } = useAuth();
  const { showError, showSuccess } = useToast();
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [extractingMetadata, setExtractingMetadata] = useState(false);
  
  // Form data
  const [formData, setFormData] = useState<FinanceTrendData>({
    // Page 1
    trend_name: '',
    platform: '',
    primary_link: initialUrl,
    company_mentioned: '',
    ticker_symbol: '',
    
    // Page 2
    signal_type: '',
    viral_evidence: [],
    market_sentiment: 'neutral',
    drivers: [],
    
    // Page 3
    spread_velocity: 'just_starting',
    investment_timeline: 'unknown',
    catalyst_type: '',
    cross_platform: [],
    purchase_intent_signals: [],
    
    // Bonus fields
    geographic_signal: '',
    demographics: [],
    technical_context: '',
    
    // Metadata
    likes_count: 0,
    comments_count: 0,
    shares_count: 0,
    views_count: 0
  });
  
  // Payout calculation
  const [payoutPreview, setPayoutPreview] = useState({
    base: 0,
    multiplier: 1,
    bonus: 0,
    total: 0
  });
  
  // Calculate payout whenever form data changes
  useEffect(() => {
    calculatePayout();
  }, [formData.signal_type, formData.viral_evidence, formData.cross_platform, 
      formData.geographic_signal, formData.demographics, formData.technical_context]);
  
  const calculatePayout = () => {
    // Base payout
    const signalType = SIGNAL_TYPES.find(s => s.id === formData.signal_type);
    const base = signalType?.base_payout || 0;
    
    // Viral evidence multiplier
    let multiplier = 1;
    const evidenceCount = formData.viral_evidence.length;
    if (evidenceCount >= 5) {
      multiplier = 2.0; // +100%
    } else if (evidenceCount >= 3) {
      multiplier = 1.5; // +50%
    }
    
    // Cross-platform + high engagement bonus
    if (formData.cross_platform.length > 0 && formData.viral_evidence.includes('high_engagement')) {
      multiplier = Math.max(multiplier, 1.75); // +75%
    }
    
    // Bonus fields
    let bonus = 0;
    if (formData.geographic_signal) bonus += 0.25;
    if (formData.demographics.length > 0) bonus += 0.50;
    if (formData.technical_context && formData.technical_context !== 'no_technical') bonus += 0.75;
    
    // All three bonus fields = $2.00 total
    if (formData.geographic_signal && formData.demographics.length > 0 && 
        formData.technical_context && formData.technical_context !== 'no_technical') {
      bonus = 2.00;
    }
    
    setPayoutPreview({
      base,
      multiplier,
      bonus,
      total: (base * multiplier) + bonus
    });
  };
  
  const validatePage = (page: number): boolean => {
    switch (page) {
      case 1:
        if (!formData.trend_name || formData.trend_name.length < 3) {
          showError('Invalid Trend Name', 'Please enter a descriptive trend name (min 3 characters)');
          return false;
        }
        if (!formData.platform) {
          showError('Platform Required', 'Please select the platform where you found this trend');
          return false;
        }
        if (!formData.primary_link) {
          showError('Link Required', 'Please provide the link to the viral post/content');
          return false;
        }
        return true;
        
      case 2:
        if (!formData.signal_type) {
          showError('Signal Type Required', 'Please select the type of financial signal');
          return false;
        }
        if (formData.viral_evidence.length === 0) {
          showError('Evidence Required', 'Please select at least one type of viral evidence');
          return false;
        }
        if (formData.drivers.length === 0) {
          showError('Drivers Required', 'Please select who is driving this trend');
          return false;
        }
        return true;
        
      case 3:
        if (!formData.spread_velocity) {
          showError('Spread Velocity Required', 'Please indicate how fast this trend is spreading');
          return false;
        }
        if (!formData.investment_timeline) {
          showError('Timeline Required', 'Please select the investment timeline');
          return false;
        }
        return true;
        
      default:
        return true;
    }
  };
  
  const handleNext = () => {
    if (validatePage(currentPage)) {
      if (currentPage < 3) {
        setCurrentPage(currentPage + 1);
      }
    }
  };
  
  const handlePrev = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };
  
  const handleSubmit = async () => {
    if (!validatePage(3)) return;
    
    setLoading(true);
    try {
      await onSubmit(formData);
      showSuccess('Trend Submitted!', `Estimated payout: $${payoutPreview.total.toFixed(2)}`);
      setTimeout(onClose, 1500);
    } catch (error: any) {
      showError('Submission Failed', error.message || 'Please try again');
    } finally {
      setLoading(false);
    }
  };
  
  // Auto-detect platform from URL
  useEffect(() => {
    if (formData.primary_link) {
      const url = formData.primary_link.toLowerCase();
      if (url.includes('reddit.com/r/wallstreetbets')) {
        setFormData(prev => ({ ...prev, platform: 'reddit_wsb' }));
      } else if (url.includes('reddit.com/r/cryptocurrency')) {
        setFormData(prev => ({ ...prev, platform: 'reddit_crypto' }));
      } else if (url.includes('reddit.com/r/stocks')) {
        setFormData(prev => ({ ...prev, platform: 'reddit_stocks' }));
      } else if (url.includes('reddit.com')) {
        setFormData(prev => ({ ...prev, platform: 'reddit_other' }));
      } else if (url.includes('twitter.com') || url.includes('x.com')) {
        setFormData(prev => ({ ...prev, platform: 'twitter_fintwit' }));
      } else if (url.includes('tiktok.com')) {
        setFormData(prev => ({ ...prev, platform: 'tiktok' }));
      } else if (url.includes('instagram.com')) {
        setFormData(prev => ({ ...prev, platform: 'instagram' }));
      } else if (url.includes('youtube.com') || url.includes('youtu.be')) {
        setFormData(prev => ({ ...prev, platform: 'youtube' }));
      } else if (url.includes('linkedin.com')) {
        setFormData(prev => ({ ...prev, platform: 'linkedin' }));
      }
    }
  }, [formData.primary_link]);
  
  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="wave-card p-6 max-w-4xl w-full max-h-[90vh] overflow-y-auto"
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-white flex items-center gap-2">
              <TrendingUp className="w-6 h-6" />
              Submit Finance Trend
            </h2>
            <p className="text-wave-400 text-sm mt-1">
              Page {currentPage} of 3 • Estimated payout: ${payoutPreview.total.toFixed(2)}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-wave-800/50 rounded-lg transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        
        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex items-center justify-between text-xs text-wave-400 mb-2">
            <span className={currentPage === 1 ? 'text-wave-200' : ''}>Basic Info</span>
            <span className={currentPage === 2 ? 'text-wave-200' : ''}>Financial Signals</span>
            <span className={currentPage === 3 ? 'text-wave-200' : ''}>Market Impact</span>
          </div>
          <div className="h-2 bg-wave-800/30 rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-gradient-to-r from-wave-500 to-wave-600"
              initial={{ width: '33%' }}
              animate={{ width: `${(currentPage / 3) * 100}%` }}
              transition={{ duration: 0.3 }}
            />
          </div>
        </div>
        
        {/* Payout Preview */}
        <AnimatePresence mode="wait">
          {payoutPreview.total > 0 && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="mb-6 p-4 bg-green-500/10 border border-green-500/30 rounded-xl"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <DollarSign className="w-5 h-5 text-green-400" />
                  <span className="text-green-400 font-medium">Estimated Payout</span>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-green-400">${payoutPreview.total.toFixed(2)}</div>
                  <div className="text-xs text-wave-400 space-y-0.5">
                    <div>Base: ${payoutPreview.base.toFixed(2)}</div>
                    {payoutPreview.multiplier > 1 && (
                      <div>Evidence bonus: {((payoutPreview.multiplier - 1) * 100).toFixed(0)}%</div>
                    )}
                    {payoutPreview.bonus > 0 && (
                      <div>Bonus fields: +${payoutPreview.bonus.toFixed(2)}</div>
                    )}
                  </div>
                </div>
              </div>
              <p className="text-xs text-wave-400 mt-2">Pending verification (24 hrs)</p>
            </motion.div>
          )}
        </AnimatePresence>
        
        {/* Form Pages */}
        <AnimatePresence mode="wait">
          {/* Page 1: Basic Trend Info */}
          {currentPage === 1 && (
            <motion.div
              key="page1"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              {/* Trend Name */}
              <div>
                <label className="block text-wave-200 mb-2 font-medium">
                  Trend Name *
                </label>
                <input
                  type="text"
                  value={formData.trend_name}
                  onChange={(e) => setFormData(prev => ({ ...prev, trend_name: e.target.value }))}
                  className="w-full px-4 py-3 rounded-xl bg-wave-800/50 border border-wave-700/30 text-white placeholder-wave-500 focus:outline-none focus:ring-2 focus:border-wave-500 focus:ring-wave-500/20"
                  placeholder="Tesla Cybertruck viral deliveries"
                />
                <p className="text-xs text-wave-400 mt-1">
                  Examples: "Solana DeFi protocols trending", "Lululemon belt bag crossover appeal"
                </p>
              </div>
              
              {/* Platform */}
              <div>
                <label className="block text-wave-200 mb-3 font-medium">
                  Platform *
                </label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  {PLATFORMS.map((platform) => (
                    <button
                      key={platform.id}
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, platform: platform.id }))}
                      className={`
                        p-3 rounded-xl border-2 transition-all text-sm
                        ${formData.platform === platform.id
                          ? 'border-wave-500 bg-wave-600/20'
                          : 'border-wave-700/30 hover:border-wave-600/50'
                        }
                      `}
                    >
                      {platform.label}
                    </button>
                  ))}
                </div>
              </div>
              
              {/* Primary Link */}
              <div>
                <label className="block text-wave-200 mb-2 font-medium">
                  <LinkIcon className="w-4 h-4 inline mr-2" />
                  Primary Link *
                </label>
                <input
                  type="url"
                  value={formData.primary_link}
                  onChange={(e) => setFormData(prev => ({ ...prev, primary_link: e.target.value }))}
                  className="w-full px-4 py-3 rounded-xl bg-wave-800/50 border border-wave-700/30 text-white placeholder-wave-500 focus:outline-none focus:ring-2 focus:border-wave-500 focus:ring-wave-500/20"
                  placeholder="Paste link to viral post/content"
                />
              </div>
              
              {/* Company/Asset with Autocomplete */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-wave-200 mb-2 font-medium">
                    Company/Asset Mentioned *
                  </label>
                  <StockTickerAutocomplete
                    value={formData.company_mentioned || ''}
                    onSelect={(symbol, name) => {
                      setFormData(prev => ({
                        ...prev,
                        company_mentioned: name,
                        ticker_symbol: symbol
                      }));
                    }}
                    placeholder="Search companies, crypto, ETFs..."
                    type="name"
                  />
                </div>
                <div>
                  <label className="block text-wave-200 mb-2 font-medium">
                    Ticker Symbol
                  </label>
                  <StockTickerAutocomplete
                    value={formData.ticker_symbol || ''}
                    onSelect={(symbol, name) => {
                      setFormData(prev => ({
                        ...prev,
                        ticker_symbol: symbol,
                        company_mentioned: name
                      }));
                    }}
                    placeholder="TSLA, BTC, GME..."
                    type="symbol"
                    showTrending={false}
                  />
                </div>
              </div>
            </motion.div>
          )}
          
          {/* Page 2: Financial Signals */}
          {currentPage === 2 && (
            <motion.div
              key="page2"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              {/* Signal Type */}
              <div>
                <label className="block text-wave-200 mb-3 font-medium">
                  Signal Type * (determines base payout)
                </label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {SIGNAL_TYPES.map((signal) => (
                    <button
                      key={signal.id}
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, signal_type: signal.id }))}
                      className={`
                        p-4 rounded-xl border-2 transition-all text-left
                        ${formData.signal_type === signal.id
                          ? 'border-wave-500 bg-wave-600/20'
                          : 'border-wave-700/30 hover:border-wave-600/50'
                        }
                      `}
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="font-medium text-wave-200">{signal.label}</div>
                          <div className="text-xs text-wave-400 mt-1">{signal.description}</div>
                        </div>
                        <div className="text-green-400 font-bold">${signal.base_payout.toFixed(2)}</div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
              
              {/* Viral Evidence */}
              <div>
                <label className="block text-wave-200 mb-3 font-medium">
                  Viral Evidence * (select all that apply)
                </label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {VIRAL_EVIDENCE_OPTIONS.map((evidence) => (
                    <label
                      key={evidence.id}
                      className="flex items-center gap-3 p-3 rounded-lg bg-wave-800/30 hover:bg-wave-800/50 cursor-pointer transition-all"
                    >
                      <input
                        type="checkbox"
                        checked={formData.viral_evidence.includes(evidence.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setFormData(prev => ({
                              ...prev,
                              viral_evidence: [...prev.viral_evidence, evidence.id]
                            }));
                          } else {
                            setFormData(prev => ({
                              ...prev,
                              viral_evidence: prev.viral_evidence.filter(v => v !== evidence.id)
                            }));
                          }
                        }}
                        className="w-4 h-4 rounded border-wave-600 bg-wave-800 text-wave-500 focus:ring-wave-500"
                      />
                      <span className="text-sm text-wave-200">{evidence.label}</span>
                    </label>
                  ))}
                </div>
                {formData.viral_evidence.length >= 3 && (
                  <p className="text-xs text-green-400 mt-2">
                    {formData.viral_evidence.length} evidence types selected • 
                    {formData.viral_evidence.length >= 5 ? ' +100% bonus!' : ' +50% bonus!'}
                  </p>
                )}
              </div>
              
              {/* Market Sentiment */}
              <div>
                <label className="block text-wave-200 mb-3 font-medium">
                  Market Sentiment *
                </label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {MARKET_SENTIMENTS.map((sentiment) => (
                    <button
                      key={sentiment.id}
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, market_sentiment: sentiment.id }))}
                      className={`
                        p-3 rounded-xl border-2 transition-all text-left
                        ${formData.market_sentiment === sentiment.id
                          ? 'border-wave-500 bg-wave-600/20'
                          : 'border-wave-700/30 hover:border-wave-600/50'
                        }
                      `}
                    >
                      <div className="font-medium text-wave-200">{sentiment.label}</div>
                      <div className="text-xs text-wave-400">{sentiment.description}</div>
                    </button>
                  ))}
                </div>
              </div>
              
              {/* Who's Driving It */}
              <div>
                <label className="block text-wave-200 mb-3 font-medium">
                  Who's Driving It? * (select all that apply)
                </label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  {DRIVERS.map((driver) => (
                    <label
                      key={driver.id}
                      className="flex items-center gap-2 p-2 rounded-lg bg-wave-800/30 hover:bg-wave-800/50 cursor-pointer transition-all"
                    >
                      <input
                        type="checkbox"
                        checked={formData.drivers.includes(driver.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setFormData(prev => ({
                              ...prev,
                              drivers: [...prev.drivers, driver.id]
                            }));
                          } else {
                            setFormData(prev => ({
                              ...prev,
                              drivers: prev.drivers.filter(d => d !== driver.id)
                            }));
                          }
                        }}
                        className="w-4 h-4 rounded border-wave-600 bg-wave-800 text-wave-500 focus:ring-wave-500"
                      />
                      <span className="text-sm text-wave-200">{driver.label}</span>
                    </label>
                  ))}
                </div>
              </div>
            </motion.div>
          )}
          
          {/* Page 3: Market Impact */}
          {currentPage === 3 && (
            <motion.div
              key="page3"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              {/* Spread Velocity */}
              <div>
                <label className="block text-wave-200 mb-3 font-medium">
                  Spread Velocity *
                </label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {SPREAD_VELOCITIES.map((velocity) => (
                    <button
                      key={velocity.id}
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, spread_velocity: velocity.id }))}
                      className={`
                        p-3 rounded-xl border-2 transition-all text-left
                        ${formData.spread_velocity === velocity.id
                          ? 'border-wave-500 bg-wave-600/20'
                          : 'border-wave-700/30 hover:border-wave-600/50'
                        }
                      `}
                    >
                      <div className="font-medium text-wave-200">{velocity.label}</div>
                      <div className="text-xs text-wave-400">{velocity.description}</div>
                    </button>
                  ))}
                </div>
              </div>
              
              {/* Investment Timeline */}
              <div>
                <label className="block text-wave-200 mb-3 font-medium">
                  Investment Timeline *
                </label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {INVESTMENT_TIMELINES.map((timeline) => (
                    <button
                      key={timeline.id}
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, investment_timeline: timeline.id }))}
                      className={`
                        p-3 rounded-xl border-2 transition-all
                        ${formData.investment_timeline === timeline.id
                          ? 'border-wave-500 bg-wave-600/20'
                          : 'border-wave-700/30 hover:border-wave-600/50'
                        }
                      `}
                    >
                      <span className="text-sm text-wave-200">{timeline.label}</span>
                    </button>
                  ))}
                </div>
              </div>
              
              {/* Catalyst Type */}
              <div>
                <label className="block text-wave-200 mb-3 font-medium">
                  Catalyst Type (optional)
                </label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {CATALYST_TYPES.map((catalyst) => (
                    <button
                      key={catalyst.id}
                      type="button"
                      onClick={() => setFormData(prev => ({ 
                        ...prev, 
                        catalyst_type: formData.catalyst_type === catalyst.id ? '' : catalyst.id 
                      }))}
                      className={`
                        p-3 rounded-xl border-2 transition-all
                        ${formData.catalyst_type === catalyst.id
                          ? 'border-wave-500 bg-wave-600/20'
                          : 'border-wave-700/30 hover:border-wave-600/50'
                        }
                      `}
                    >
                      <span className="text-sm text-wave-200">{catalyst.label}</span>
                    </button>
                  ))}
                </div>
              </div>
              
              {/* Cross-Platform Spread */}
              <div>
                <label className="block text-wave-200 mb-3 font-medium">
                  Cross-Platform Spread
                </label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  {CROSS_PLATFORMS.map((platform) => (
                    <label
                      key={platform.id}
                      className="flex items-center gap-2 p-2 rounded-lg bg-wave-800/30 hover:bg-wave-800/50 cursor-pointer transition-all"
                    >
                      <input
                        type="checkbox"
                        checked={formData.cross_platform.includes(platform.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setFormData(prev => ({
                              ...prev,
                              cross_platform: [...prev.cross_platform, platform.id]
                            }));
                          } else {
                            setFormData(prev => ({
                              ...prev,
                              cross_platform: prev.cross_platform.filter(p => p !== platform.id)
                            }));
                          }
                        }}
                        className="w-4 h-4 rounded border-wave-600 bg-wave-800 text-wave-500 focus:ring-wave-500"
                      />
                      <span className="text-sm text-wave-200">{platform.label}</span>
                    </label>
                  ))}
                </div>
              </div>
              
              {/* Purchase Intent Signals */}
              <div>
                <label className="block text-wave-200 mb-3 font-medium">
                  Purchase Intent Signals
                </label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {PURCHASE_INTENT_SIGNALS.map((signal) => (
                    <label
                      key={signal.id}
                      className="flex items-center gap-2 p-2 rounded-lg bg-wave-800/30 hover:bg-wave-800/50 cursor-pointer transition-all"
                    >
                      <input
                        type="checkbox"
                        checked={formData.purchase_intent_signals.includes(signal.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setFormData(prev => ({
                              ...prev,
                              purchase_intent_signals: [...prev.purchase_intent_signals, signal.id]
                            }));
                          } else {
                            setFormData(prev => ({
                              ...prev,
                              purchase_intent_signals: prev.purchase_intent_signals.filter(s => s !== signal.id)
                            }));
                          }
                        }}
                        className="w-4 h-4 rounded border-wave-600 bg-wave-800 text-wave-500 focus:ring-wave-500"
                      />
                      <span className="text-sm text-wave-200">{signal.label}</span>
                    </label>
                  ))}
                </div>
              </div>
              
              {/* Bonus Fields */}
              <div className="space-y-4 p-4 bg-wave-800/30 rounded-xl">
                <h3 className="font-medium text-wave-200 flex items-center gap-2">
                  <DollarSign className="w-4 h-4" />
                  Bonus Fields (Optional - Extra Payout)
                </h3>
                
                {/* Geographic Signal */}
                <div>
                  <label className="block text-wave-300 mb-2 text-sm">
                    Geographic Signal (+$0.25)
                  </label>
                  <select
                    value={formData.geographic_signal}
                    onChange={(e) => setFormData(prev => ({ ...prev, geographic_signal: e.target.value }))}
                    className="w-full px-3 py-2 rounded-lg bg-wave-800/50 border border-wave-700/30 text-white focus:outline-none focus:ring-2 focus:border-wave-500 focus:ring-wave-500/20"
                  >
                    <option value="">Select geographic signal...</option>
                    {GEOGRAPHIC_SIGNALS.map(signal => (
                      <option key={signal.id} value={signal.id}>{signal.label}</option>
                    ))}
                  </select>
                </div>
                
                {/* Demographics */}
                <div>
                  <label className="block text-wave-300 mb-2 text-sm">
                    Demographic Insight (+$0.50)
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {DEMOGRAPHICS.map((demo) => (
                      <label
                        key={demo.id}
                        className="flex items-center gap-2 p-2 rounded-lg bg-wave-800/50 hover:bg-wave-700/50 cursor-pointer transition-all text-sm"
                      >
                        <input
                          type="checkbox"
                          checked={formData.demographics?.includes(demo.id) || false}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setFormData(prev => ({
                                ...prev,
                                demographics: [...(prev.demographics || []), demo.id]
                              }));
                            } else {
                              setFormData(prev => ({
                                ...prev,
                                demographics: (prev.demographics || []).filter(d => d !== demo.id)
                              }));
                            }
                          }}
                          className="w-4 h-4 rounded border-wave-600 bg-wave-800 text-wave-500 focus:ring-wave-500"
                        />
                        <span className="text-wave-200">{demo.label}</span>
                      </label>
                    ))}
                  </div>
                </div>
                
                {/* Technical Context */}
                <div>
                  <label className="block text-wave-300 mb-2 text-sm">
                    Technical Context (+$0.75)
                  </label>
                  <select
                    value={formData.technical_context}
                    onChange={(e) => setFormData(prev => ({ ...prev, technical_context: e.target.value }))}
                    className="w-full px-3 py-2 rounded-lg bg-wave-800/50 border border-wave-700/30 text-white focus:outline-none focus:ring-2 focus:border-wave-500 focus:ring-wave-500/20"
                  >
                    <option value="">Select technical context...</option>
                    {TECHNICAL_CONTEXTS.map(context => (
                      <option key={context.id} value={context.id}>{context.label}</option>
                    ))}
                  </select>
                </div>
                
                {/* Bonus summary */}
                {(formData.geographic_signal || (formData.demographics?.length || 0) > 0 || formData.technical_context) && (
                  <div className="pt-2 border-t border-wave-700/30">
                    <p className="text-xs text-green-400">
                      Bonus fields selected: +${payoutPreview.bonus.toFixed(2)}
                      {formData.geographic_signal && formData.demographics?.length && formData.technical_context && 
                        ' (All 3 fields = $2.00 total!)'}
                    </p>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        
        {/* Navigation */}
        <div className="flex justify-between items-center mt-8">
          <button
            onClick={currentPage === 1 ? onClose : handlePrev}
            className="px-6 py-2 rounded-xl bg-wave-800/50 hover:bg-wave-700/50 transition-all flex items-center gap-2"
          >
            <ChevronLeft className="w-4 h-4" />
            {currentPage === 1 ? 'Cancel' : 'Previous'}
          </button>
          
          {currentPage < 3 ? (
            <button
              onClick={handleNext}
              className="px-6 py-2 rounded-xl bg-gradient-to-r from-wave-500 to-wave-600 hover:from-wave-400 hover:to-wave-500 transition-all flex items-center gap-2"
            >
              Next
              <ChevronRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={loading}
              className="px-6 py-2 rounded-xl bg-gradient-to-r from-green-500 to-green-600 hover:from-green-400 hover:to-green-500 transition-all disabled:opacity-50 flex items-center gap-2"
            >
              {loading ? (
                <>
                  <Loader className="w-4 h-4 animate-spin" />
                  Submitting...
                </>
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  Submit for ${payoutPreview.total.toFixed(2)}
                </>
              )}
            </button>
          )}
        </div>
      </motion.div>
    </div>
  );
}