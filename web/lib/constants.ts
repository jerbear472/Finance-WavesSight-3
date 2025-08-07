/**
 * Centralized constants for earnings and rewards
 */

export const EARNINGS = {
  // Basic Financial Trends
  BASIC_FINANCIAL_TREND: 1.00,     // General stock/company mentions
  
  // High-Value Signals
  MEME_STOCK_MOMENTUM: 5.00,       // Meme stock momentum signals
  CRYPTO_PUMP_SIGNAL: 3.00,         // Crypto pump indicators
  IPO_EARNINGS_SENTIMENT: 2.00,    // IPO/earnings sentiment
  SHORT_SQUEEZE_INDICATOR: 7.50,   // Short squeeze signals
  INSIDER_LEAK_RUMOR: 10.00,       // Insider/leak rumors
  
  // Performance Bonuses
  STOCK_MOVE_5_PERCENT: 25.00,     // Stock moves >5% within 48hrs
  STOCK_MOVE_10_PERCENT: 100.00,   // Stock moves >10% within week
  CRYPTO_PUMP_20_PERCENT: 50.00,   // Crypto pumps >20% within 24hrs
  FIRST_TO_SPOT_BONUS: 5.00,       // First to spot viral financial content
  HEDGE_FUND_ACTION_BONUS: 50.00,  // Hedge fund client acts on signal
  
  // Verification rewards
  VERIFICATION_REWARD: 0.05,        // Amount earned for participating in verification
  
  // Cash out requirements
  MINIMUM_CASHOUT: 5.00,            // Minimum approved earnings required to cash out (lowered for micro-payments)
  
  // Verification requirements
  MIN_VOTES_REQUIRED: 3,            // Minimum votes needed for trend verification
  
  // Processing times
  CASHOUT_PROCESSING_HOURS: '24-48', // Time to process cash out requests
} as const;

// Type for earnings status
export type EarningsStatus = 'pending' | 'approved' | 'paid';

// Earnings status labels and colors
export const EARNINGS_STATUS = {
  pending: {
    label: 'Pending Verification',
    color: 'yellow',
    icon: '🟡',
    description: 'Awaiting verification votes'
  },
  approved: {
    label: 'Approved',
    color: 'green', 
    icon: '🟢',
    description: 'Verified and ready to cash out'
  },
  paid: {
    label: 'Paid Out',
    color: 'blue',
    icon: '🔵',
    description: 'Successfully cashed out'
  }
} as const;

// Financial signal types for payment calculation
export type FinancialSignalType = 
  | 'meme_stock'
  | 'crypto_pump'
  | 'ipo_sentiment'
  | 'short_squeeze'
  | 'insider_rumor'
  | 'basic_trend';

/**
 * Calculate base earnings for a financial trend based on its characteristics
 */
export function calculateTrendEarnings(
  category: string,
  urgency: string,
  sentiment: string,
  keywords: string[]
): { amount: number; type: FinancialSignalType } {
  const lowerKeywords = keywords.map(k => k.toLowerCase()).join(' ');
  
  // Check for high-value signal indicators
  if (lowerKeywords.includes('squeeze') || lowerKeywords.includes('short interest')) {
    return { amount: EARNINGS.SHORT_SQUEEZE_INDICATOR, type: 'short_squeeze' };
  }
  
  if (lowerKeywords.includes('insider') || lowerKeywords.includes('leak') || lowerKeywords.includes('rumor')) {
    return { amount: EARNINGS.INSIDER_LEAK_RUMOR, type: 'insider_rumor' };
  }
  
  if (category === 'stocks_companies' && (lowerKeywords.includes('wsb') || lowerKeywords.includes('wallstreetbets') || sentiment === 'very_bullish')) {
    return { amount: EARNINGS.MEME_STOCK_MOMENTUM, type: 'meme_stock' };
  }
  
  if (category === 'crypto_defi' && urgency === 'immediate') {
    return { amount: EARNINGS.CRYPTO_PUMP_SIGNAL, type: 'crypto_pump' };
  }
  
  if (category === 'startups_ipos' || lowerKeywords.includes('earnings') || lowerKeywords.includes('ipo')) {
    return { amount: EARNINGS.IPO_EARNINGS_SENTIMENT, type: 'ipo_sentiment' };
  }
  
  // Default to basic financial trend
  return { amount: EARNINGS.BASIC_FINANCIAL_TREND, type: 'basic_trend' };
}