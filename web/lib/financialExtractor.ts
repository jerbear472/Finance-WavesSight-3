/**
 * Financial Intelligence Extractor
 * Extracts financial signals and metadata from trend submissions
 */

interface FinancialMetadata {
  tickers: string[];
  companies: string[];
  financialRelevanceScore: number;
  marketSentiment: 'very_bullish' | 'bullish' | 'neutral' | 'bearish' | 'very_bearish';
  investmentTiming: 'immediate' | 'short_term' | 'medium_term' | 'long_term';
  signalStrength: number; // 0-100
  riskLevel: 'low' | 'medium' | 'high' | 'extreme';
  potentialImpact: {
    priceMovement: string;
    timeframe: string;
    confidence: number;
  };
}

export class FinancialIntelligenceExtractor {
  // Common stock tickers and crypto symbols
  private static readonly STOCK_TICKERS = [
    'AAPL', 'MSFT', 'GOOGL', 'AMZN', 'TSLA', 'META', 'NVDA', 'JPM', 'V', 'JNJ',
    'WMT', 'PG', 'UNH', 'MA', 'HD', 'DIS', 'PYPL', 'BAC', 'ADBE', 'NFLX',
    'CMCSA', 'PFE', 'INTC', 'CSCO', 'PEP', 'TMO', 'ABT', 'NKE', 'AVGO', 'CVX',
    'GME', 'AMC', 'BB', 'NOK', 'BBBY', 'PLTR', 'SOFI', 'WISH', 'CLOV', 'SPCE'
  ];

  private static readonly CRYPTO_SYMBOLS = [
    'BTC', 'ETH', 'BNB', 'XRP', 'ADA', 'SOL', 'DOGE', 'DOT', 'MATIC', 'SHIB',
    'TRX', 'AVAX', 'DAI', 'WBTC', 'UNI', 'ATOM', 'LTC', 'LINK', 'ETC', 'XLM',
    'PEPE', 'FLOKI', 'SAFEMOON', 'ELON', 'BABYDOGE', 'SHIBAI', 'DOGELON'
  ];

  private static readonly COMPANY_TICKER_MAP: Record<string, string> = {
    'apple': 'AAPL',
    'microsoft': 'MSFT',
    'google': 'GOOGL',
    'alphabet': 'GOOGL',
    'amazon': 'AMZN',
    'tesla': 'TSLA',
    'facebook': 'META',
    'meta': 'META',
    'nvidia': 'NVDA',
    'netflix': 'NFLX',
    'disney': 'DIS',
    'paypal': 'PYPL',
    'gamestop': 'GME',
    'amc': 'AMC',
    'blackberry': 'BB',
    'nokia': 'NOK',
    'palantir': 'PLTR',
    'bitcoin': 'BTC',
    'ethereum': 'ETH',
    'dogecoin': 'DOGE',
    'cardano': 'ADA',
    'solana': 'SOL',
    'ripple': 'XRP'
  };

  private static readonly BULLISH_KEYWORDS = [
    'moon', 'rocket', 'pump', 'squeeze', 'rally', 'breakout', 'bullish', 
    'buy', 'long', 'calls', 'gamma', 'yolo', 'diamond hands', 'to the moon',
    'lfg', 'lets go', 'huge', 'massive', 'explosion', 'viral', 'trending'
  ];

  private static readonly BEARISH_KEYWORDS = [
    'crash', 'dump', 'sell', 'short', 'puts', 'bearish', 'overvalued',
    'bubble', 'collapse', 'plunge', 'tank', 'drop', 'fall', 'decline',
    'red', 'bleeding', 'pain', 'loss', 'disaster', 'bankruptcy'
  ];

  /**
   * Extract financial intelligence from trend data
   */
  static extractFinancialSignals(
    title: string,
    description: string,
    category: string,
    ticker?: string,
    company?: string,
    sentiment?: string,
    urgency?: string
  ): FinancialMetadata {
    const combinedText = `${title} ${description} ${company || ''} ${ticker || ''}`.toLowerCase();
    
    // Extract tickers
    const tickers = this.extractTickers(combinedText, ticker);
    
    // Extract company names and map to tickers
    const companies = this.extractCompanies(combinedText, company);
    
    // Calculate financial relevance score
    const financialRelevanceScore = this.calculateRelevanceScore(
      combinedText,
      category,
      tickers.length > 0 || companies.length > 0
    );
    
    // Determine market sentiment
    const marketSentiment = sentiment as any || this.analyzeSentiment(combinedText);
    
    // Determine investment timing
    const investmentTiming = urgency as any || this.determineUrgency(combinedText);
    
    // Calculate signal strength
    const signalStrength = this.calculateSignalStrength(
      financialRelevanceScore,
      marketSentiment,
      investmentTiming,
      combinedText
    );
    
    // Assess risk level
    const riskLevel = this.assessRiskLevel(signalStrength, marketSentiment, category);
    
    // Predict potential impact
    const potentialImpact = this.predictImpact(
      signalStrength,
      marketSentiment,
      investmentTiming,
      category
    );
    
    return {
      tickers,
      companies,
      financialRelevanceScore,
      marketSentiment,
      investmentTiming,
      signalStrength,
      riskLevel,
      potentialImpact
    };
  }

  /**
   * Extract ticker symbols from text
   */
  private static extractTickers(text: string, explicitTicker?: string): string[] {
    const tickers = new Set<string>();
    
    // Add explicit ticker if provided
    if (explicitTicker) {
      tickers.add(explicitTicker.toUpperCase());
    }
    
    // Look for $TICKER format
    const dollarMatches = text.match(/\$[A-Z]{1,5}/g);
    if (dollarMatches) {
      dollarMatches.forEach(match => {
        const ticker = match.substring(1);
        if (this.STOCK_TICKERS.includes(ticker) || this.CRYPTO_SYMBOLS.includes(ticker)) {
          tickers.add(ticker);
        }
      });
    }
    
    // Look for standalone tickers
    const words = text.toUpperCase().split(/\s+/);
    words.forEach(word => {
      if (this.STOCK_TICKERS.includes(word) || this.CRYPTO_SYMBOLS.includes(word)) {
        tickers.add(word);
      }
    });
    
    return Array.from(tickers);
  }

  /**
   * Extract company names and map to tickers
   */
  private static extractCompanies(text: string, explicitCompany?: string): string[] {
    const companies = new Set<string>();
    
    if (explicitCompany) {
      companies.add(explicitCompany);
    }
    
    // Look for known company names
    Object.keys(this.COMPANY_TICKER_MAP).forEach(company => {
      if (text.includes(company)) {
        companies.add(company.charAt(0).toUpperCase() + company.slice(1));
      }
    });
    
    return Array.from(companies);
  }

  /**
   * Calculate financial relevance score (0-100)
   */
  private static calculateRelevanceScore(
    text: string,
    category: string,
    hasTickersOrCompanies: boolean
  ): number {
    let score = 0;
    
    // Category relevance
    const financialCategories = ['stocks_companies', 'crypto_defi', 'fintech_apps', 'startups_ipos'];
    if (financialCategories.includes(category)) {
      score += 30;
    }
    
    // Ticker/company presence
    if (hasTickersOrCompanies) {
      score += 30;
    }
    
    // Financial keywords
    const financialKeywords = [
      'stock', 'crypto', 'trading', 'invest', 'market', 'price', 'earnings',
      'revenue', 'profit', 'valuation', 'ipo', 'merger', 'acquisition'
    ];
    
    const keywordCount = financialKeywords.filter(kw => text.includes(kw)).length;
    score += Math.min(keywordCount * 5, 20);
    
    // Viral/trend keywords
    const viralKeywords = ['viral', 'trending', 'blowing up', 'everyone', 'massive'];
    const viralCount = viralKeywords.filter(kw => text.includes(kw)).length;
    score += Math.min(viralCount * 5, 20);
    
    return Math.min(score, 100);
  }

  /**
   * Analyze market sentiment from text
   */
  private static analyzeSentiment(text: string): 'very_bullish' | 'bullish' | 'neutral' | 'bearish' | 'very_bearish' {
    let bullishScore = 0;
    let bearishScore = 0;
    
    this.BULLISH_KEYWORDS.forEach(keyword => {
      if (text.includes(keyword)) bullishScore++;
    });
    
    this.BEARISH_KEYWORDS.forEach(keyword => {
      if (text.includes(keyword)) bearishScore++;
    });
    
    const netSentiment = bullishScore - bearishScore;
    
    if (netSentiment >= 3) return 'very_bullish';
    if (netSentiment >= 1) return 'bullish';
    if (netSentiment <= -3) return 'very_bearish';
    if (netSentiment <= -1) return 'bearish';
    return 'neutral';
  }

  /**
   * Determine urgency level from text
   */
  private static determineUrgency(text: string): 'immediate' | 'short_term' | 'medium_term' | 'long_term' {
    const immediateKeywords = ['now', 'today', 'tonight', 'asap', 'urgent', 'breaking'];
    const shortTermKeywords = ['tomorrow', 'week', 'soon', 'coming'];
    const mediumTermKeywords = ['month', 'quarter', 'q1', 'q2', 'q3', 'q4'];
    
    if (immediateKeywords.some(kw => text.includes(kw))) return 'immediate';
    if (shortTermKeywords.some(kw => text.includes(kw))) return 'short_term';
    if (mediumTermKeywords.some(kw => text.includes(kw))) return 'medium_term';
    return 'long_term';
  }

  /**
   * Calculate signal strength (0-100)
   */
  private static calculateSignalStrength(
    relevanceScore: number,
    sentiment: string,
    timing: string,
    text: string
  ): number {
    let strength = relevanceScore * 0.4; // Base on relevance
    
    // Sentiment multiplier
    if (sentiment === 'very_bullish' || sentiment === 'very_bearish') {
      strength *= 1.5;
    } else if (sentiment === 'bullish' || sentiment === 'bearish') {
      strength *= 1.2;
    }
    
    // Timing multiplier
    if (timing === 'immediate') {
      strength *= 1.3;
    } else if (timing === 'short_term') {
      strength *= 1.1;
    }
    
    // Volume indicators
    const volumeKeywords = ['everyone', 'viral', 'millions', 'trending #1', 'all over'];
    const volumeBonus = volumeKeywords.filter(kw => text.includes(kw)).length * 5;
    strength += volumeBonus;
    
    return Math.min(Math.round(strength), 100);
  }

  /**
   * Assess risk level based on signal characteristics
   */
  private static assessRiskLevel(
    signalStrength: number,
    sentiment: string,
    category: string
  ): 'low' | 'medium' | 'high' | 'extreme' {
    // Crypto and meme stocks are inherently riskier
    const riskyCategories = ['crypto_defi', 'stocks_companies'];
    const isRiskyCategory = riskyCategories.includes(category);
    
    // Extreme sentiment increases risk
    const extremeSentiment = sentiment === 'very_bullish' || sentiment === 'very_bearish';
    
    if (signalStrength > 80 && extremeSentiment && isRiskyCategory) {
      return 'extreme';
    } else if (signalStrength > 60 || (extremeSentiment && isRiskyCategory)) {
      return 'high';
    } else if (signalStrength > 40 || isRiskyCategory) {
      return 'medium';
    }
    return 'low';
  }

  /**
   * Predict potential market impact
   */
  private static predictImpact(
    signalStrength: number,
    sentiment: string,
    timing: string,
    category: string
  ): { priceMovement: string; timeframe: string; confidence: number } {
    let movement = '1-3%';
    let timeframe = '1-2 weeks';
    let confidence = 30;
    
    // Adjust based on signal strength
    if (signalStrength > 80) {
      movement = '10%+';
      confidence = 70;
    } else if (signalStrength > 60) {
      movement = '5-10%';
      confidence = 50;
    } else if (signalStrength > 40) {
      movement = '3-5%';
      confidence = 40;
    }
    
    // Adjust timeframe based on urgency
    if (timing === 'immediate') {
      timeframe = '24-48 hours';
      confidence += 10;
    } else if (timing === 'short_term') {
      timeframe = '3-7 days';
    } else if (timing === 'medium_term') {
      timeframe = '2-4 weeks';
      confidence -= 10;
    }
    
    // Crypto moves faster
    if (category === 'crypto_defi') {
      if (movement === '10%+') movement = '20%+';
      else if (movement === '5-10%') movement = '10-20%';
      else if (movement === '3-5%') movement = '5-10%';
    }
    
    // Direction based on sentiment
    if (sentiment === 'bearish' || sentiment === 'very_bearish') {
      movement = '-' + movement;
    } else if (sentiment !== 'bullish' && sentiment !== 'very_bullish') {
      movement = '±' + movement;
    } else {
      movement = '+' + movement;
    }
    
    return {
      priceMovement: movement,
      timeframe,
      confidence: Math.min(confidence, 90)
    };
  }
}