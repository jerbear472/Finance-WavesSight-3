// Financial Intelligence Platform Types

export interface Spotter {
  id: string;
  userId: string;
  displayName: string;
  credibilityScore: number;
  totalSignalsLogged: number;
  accurateSignals: number;
  accuracyRate: number;
  lifetimeEarnings: number;
  currentTier: 'bronze' | 'silver' | 'gold' | 'platinum';
  specializationAreas: string[];
  platformExpertise: Record<string, number>;
  createdAt: string;
  updatedAt: string;
}

export interface AlphaSignal {
  id: string;
  spotterId: string;
  platform: 'tiktok' | 'reddit' | 'discord' | 'twitter' | 'youtube' | 'instagram' | 'other';
  sourceUrl: string;
  assetTicker?: string;
  assetType?: 'stock' | 'crypto' | 'etf' | 'option' | 'commodity';
  sentiment: 'very_bullish' | 'bullish' | 'neutral' | 'bearish' | 'very_bearish';
  reasoning: string;
  screenshotUrl?: string;
  metadata: Record<string, any>;
  viralityMetrics: {
    views?: number;
    likes?: number;
    shares?: number;
    comments?: number;
  };
  signalStrength: number;
  alphaScore?: number;
  status: 'pending' | 'verifying' | 'verified' | 'rejected' | 'expired';
  baseReward: number;
  performanceBonus: number;
  totalPayout: number;
  createdAt: string;
  verifiedAt?: string;
  originTimestamp: string;
}

export interface Verifier {
  id: string;
  userId: string;
  verifierScore: number;
  totalVerifications: number;
  consensusAccuracy: number;
  expertiseAreas: string[];
  verificationStreak: number;
  isActive: boolean;
  createdAt: string;
}

export interface SignalVerification {
  id: string;
  signalId: string;
  verifierId: string;
  verdict: 'confirm' | 'reject' | 'refine';
  confidenceLevel: number;
  refinementNotes?: string;
  suggestedTicker?: string;
  suggestedSentiment?: string;
  verificationMetadata: Record<string, any>;
  rewardEarned: number;
  createdAt: string;
}

export interface AlphaScoreComponents {
  id: string;
  signalId: string;
  spotterCredibilityWeight: number;
  spotterCredibilityScore: number;
  communityVerificationWeight: number;
  communityVerificationScore: number;
  sentimentVelocityWeight: number;
  sentimentVelocityScore: number;
  platformSignalWeight: number;
  platformSignalScore: number;
  historicalSimilarityWeight: number;
  historicalSimilarityScore: number;
  finalAlphaScore: number;
  calculationTimestamp: string;
  calculationMetadata: Record<string, any>;
}

export interface ClientSubscription {
  id: string;
  organizationId: string;
  subscriptionTier: 'starter' | 'professional' | 'enterprise' | 'hedge_fund';
  apiKey: string;
  apiSecret?: string;
  allowedIps: string[];
  rateLimit: number;
  filterPreferences: {
    minAlphaScore?: number;
    platforms?: string[];
    assetTypes?: string[];
    sentiments?: string[];
  };
  webhookUrl?: string;
  isActive: boolean;
  createdAt: string;
  expiresAt?: string;
}

export interface AlphaArchive {
  id: string;
  signalId: string;
  assetTicker: string;
  signalTimestamp: string;
  priceAtSignal?: number;
  price1h?: number;
  price4h?: number;
  price24h?: number;
  price48h?: number;
  price7d?: number;
  movement1h?: number;
  movement4h?: number;
  movement24h?: number;
  movement48h?: number;
  movement7d?: number;
  outcomeClassification?: 'highly_accurate' | 'accurate' | 'partially_accurate' | 'neutral' | 'inaccurate';
  spotterBonusPaid: number;
  marketConditions: Record<string, any>;
  correlatedEvents: any[];
  archivedAt: string;
}

export interface SpotterEarning {
  id: string;
  spotterId: string;
  signalId?: string;
  earningType: 'base_signal' | 'accuracy_bonus' | 'tier_bonus' | 'special_achievement';
  amount: number;
  description?: string;
  paidOut: boolean;
  createdAt: string;
  paidAt?: string;
}

export interface VerifierReward {
  id: string;
  verifierId: string;
  verificationId: string;
  rewardType: 'verification' | 'consensus_bonus' | 'accuracy_bonus';
  amount: number;
  paidOut: boolean;
  createdAt: string;
}

// Dashboard specific types
export interface DashboardSignal extends AlphaSignal {
  spotter?: Spotter;
  verifications?: SignalVerification[];
  alphaScoreComponents?: AlphaScoreComponents;
  archiveData?: AlphaArchive;
}

export interface SignalFilter {
  minAlphaScore?: number;
  maxAlphaScore?: number;
  platforms?: string[];
  assetTypes?: string[];
  sentiments?: string[];
  status?: string[];
  dateRange?: {
    start: string;
    end: string;
  };
  searchQuery?: string;
}

export interface AlphaMetrics {
  totalSignals: number;
  verifiedSignals: number;
  averageAlphaScore: number;
  topPerformingAssets: Array<{
    ticker: string;
    signalCount: number;
    averageMovement: number;
  }>;
  platformDistribution: Record<string, number>;
  sentimentBreakdown: Record<string, number>;
  signalVelocity: Array<{
    timestamp: string;
    count: number;
  }>;
}