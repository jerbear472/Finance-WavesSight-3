import { createClient } from '@supabase/supabase-js'
import { AlphaSignal, Spotter, SignalVerification, AlphaScoreComponents } from '@/types/financial-intelligence'

interface ViralityMetrics {
  views?: number
  likes?: number
  shares?: number
  comments?: number
}

interface PlatformWeights {
  [key: string]: {
    multiplier: number
    minViralityThreshold: number
    trustFactor: number
  }
}

export class AlphaScoreEngine {
  private supabase: any
  private platformWeights: PlatformWeights = {
    tiktok: { multiplier: 1.50, minViralityThreshold: 10000, trustFactor: 0.70 },
    reddit: { multiplier: 1.20, minViralityThreshold: 1000, trustFactor: 0.80 },
    discord: { multiplier: 1.30, minViralityThreshold: 100, trustFactor: 0.75 },
    twitter: { multiplier: 1.00, minViralityThreshold: 5000, trustFactor: 0.60 },
    youtube: { multiplier: 0.90, minViralityThreshold: 50000, trustFactor: 0.65 },
    instagram: { multiplier: 0.80, minViralityThreshold: 10000, trustFactor: 0.55 },
    other: { multiplier: 0.70, minViralityThreshold: 0, trustFactor: 0.50 }
  }

  constructor(supabaseUrl: string, supabaseKey: string) {
    this.supabase = createClient(supabaseUrl, supabaseKey)
  }

  async calculateAlphaScore(signalId: string): Promise<number> {
    try {
      // Fetch signal with spotter and verifications
      const { data: signal, error: signalError } = await this.supabase
        .from('alpha_signals')
        .select(`
          *,
          spotter:spotters(*),
          verifications:signal_verifications(*)
        `)
        .eq('id', signalId)
        .single()

      if (signalError) throw signalError

      // Calculate component scores
      const spotterScore = this.calculateSpotterCredibilityScore(signal.spotter)
      const communityScore = this.calculateCommunityVerificationScore(signal.verifications)
      const velocityScore = this.calculateSentimentVelocityScore(signal)
      const platformScore = this.calculatePlatformSignalScore(signal)
      const similarityScore = await this.calculateHistoricalSimilarityScore(signal)

      // Weight the components
      const weights = {
        spotter: 0.25,
        community: 0.20,
        velocity: 0.25,
        platform: 0.15,
        similarity: 0.15
      }

      // Calculate final score
      const alphaScore = 
        (spotterScore * weights.spotter) +
        (communityScore * weights.community) +
        (velocityScore * weights.velocity) +
        (platformScore * weights.platform) +
        (similarityScore * weights.similarity)

      // Store calculation components
      await this.storeAlphaScoreComponents({
        signalId,
        spotterCredibilityScore: spotterScore,
        communityVerificationScore: communityScore,
        sentimentVelocityScore: velocityScore,
        platformSignalScore: platformScore,
        historicalSimilarityScore: similarityScore,
        finalAlphaScore: alphaScore,
        weights
      })

      // Update signal with alpha score
      await this.supabase
        .from('alpha_signals')
        .update({ alpha_score: alphaScore })
        .eq('id', signalId)

      return alphaScore
    } catch (error) {
      console.error('Error calculating alpha score:', error)
      return 0
    }
  }

  private calculateSpotterCredibilityScore(spotter: Spotter): number {
    if (!spotter) return 25

    // Base credibility score
    let score = spotter.credibilityScore

    // Adjust based on track record
    if (spotter.totalSignalsLogged > 0) {
      const accuracyBonus = (spotter.accuracyRate / 100) * 20
      score = Math.min(100, score + accuracyBonus)
    }

    // Tier multipliers
    const tierMultipliers = {
      bronze: 0.8,
      silver: 1.0,
      gold: 1.2,
      platinum: 1.5
    }
    score *= tierMultipliers[spotter.currentTier] || 0.8

    return Math.min(100, score)
  }

  private calculateCommunityVerificationScore(verifications: SignalVerification[]): number {
    if (!verifications || verifications.length === 0) return 50

    let totalScore = 0
    let totalWeight = 0

    verifications.forEach(verification => {
      const weight = verification.confidenceLevel / 100
      const verdictScore = 
        verification.verdict === 'confirm' ? 100 :
        verification.verdict === 'refine' ? 70 :
        0 // reject

      totalScore += verdictScore * weight
      totalWeight += weight
    })

    return totalWeight > 0 ? totalScore / totalWeight : 50
  }

  private calculateSentimentVelocityScore(signal: AlphaSignal): number {
    const metrics = signal.viralityMetrics as ViralityMetrics
    if (!metrics) return 30

    // Calculate engagement rate
    const totalEngagement = (metrics.likes || 0) + (metrics.shares || 0) + (metrics.comments || 0)
    const views = metrics.views || 1
    const engagementRate = (totalEngagement / views) * 100

    // Time decay factor (newer signals score higher)
    const hoursOld = (Date.now() - new Date(signal.originTimestamp).getTime()) / (1000 * 60 * 60)
    const timeFactor = Math.max(0.3, 1 - (hoursOld / 168)) // Decay over 1 week

    // Virality score based on platform thresholds
    const platformData = this.platformWeights[signal.platform] || this.platformWeights.other
    const viralityRatio = views / platformData.minViralityThreshold
    const viralityScore = Math.min(100, viralityRatio * 50)

    // Combine factors
    let score = (engagementRate * 0.4 + viralityScore * 0.6) * timeFactor

    // Boost for extreme sentiments
    if (signal.sentiment === 'very_bullish' || signal.sentiment === 'very_bearish') {
      score *= 1.2
    }

    return Math.min(100, score)
  }

  private calculatePlatformSignalScore(signal: AlphaSignal): number {
    const platformData = this.platformWeights[signal.platform] || this.platformWeights.other
    
    // Base score from platform trust factor
    let score = platformData.trustFactor * 100

    // Apply platform multiplier
    score *= platformData.multiplier

    // Adjust based on content quality indicators
    if (signal.screenshotUrl) score += 10
    if (signal.reasoning && signal.reasoning.length > 100) score += 10
    if (signal.assetTicker) score += 5

    return Math.min(100, score)
  }

  private async calculateHistoricalSimilarityScore(signal: AlphaSignal): Promise<number> {
    try {
      // Look for similar historical signals
      const { data: similarSignals, error } = await this.supabase
        .from('alpha_archive')
        .select('*')
        .eq('asset_ticker', signal.assetTicker)
        .gte('signal_timestamp', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()) // Last 30 days
        .order('signal_timestamp', { ascending: false })
        .limit(10)

      if (error || !similarSignals || similarSignals.length === 0) return 50

      // Calculate average performance of similar signals
      let totalScore = 0
      let count = 0

      similarSignals.forEach(historical => {
        if (historical.outcome_classification) {
          const outcomeScores = {
            'highly_accurate': 100,
            'accurate': 80,
            'partially_accurate': 60,
            'neutral': 40,
            'inaccurate': 20
          }
          totalScore += outcomeScores[historical.outcome_classification] || 40
          count++
        }
      })

      // If we have historical data, use it; otherwise default to 50
      return count > 0 ? totalScore / count : 50
    } catch (error) {
      console.error('Error calculating historical similarity:', error)
      return 50
    }
  }

  private async storeAlphaScoreComponents(components: {
    signalId: string
    spotterCredibilityScore: number
    communityVerificationScore: number
    sentimentVelocityScore: number
    platformSignalScore: number
    historicalSimilarityScore: number
    finalAlphaScore: number
    weights: any
  }) {
    try {
      await this.supabase
        .from('alphascore_components')
        .insert({
          signal_id: components.signalId,
          spotter_credibility_score: components.spotterCredibilityScore,
          community_verification_score: components.communityVerificationScore,
          sentiment_velocity_score: components.sentimentVelocityScore,
          platform_signal_score: components.platformSignalScore,
          historical_similarity_score: components.historicalSimilarityScore,
          final_alpha_score: components.finalAlphaScore,
          spotter_credibility_weight: components.weights.spotter,
          community_verification_weight: components.weights.community,
          sentiment_velocity_weight: components.weights.velocity,
          platform_signal_weight: components.weights.platform,
          historical_similarity_weight: components.weights.similarity,
          calculation_metadata: {
            timestamp: new Date().toISOString(),
            version: '1.0'
          }
        })
    } catch (error) {
      console.error('Error storing alpha score components:', error)
    }
  }

  // Batch processing for multiple signals
  async processSignalBatch(signalIds: string[]): Promise<Map<string, number>> {
    const scores = new Map<string, number>()
    
    // Process in parallel with rate limiting
    const batchSize = 5
    for (let i = 0; i < signalIds.length; i += batchSize) {
      const batch = signalIds.slice(i, i + batchSize)
      const batchScores = await Promise.all(
        batch.map(id => this.calculateAlphaScore(id))
      )
      batch.forEach((id, index) => {
        scores.set(id, batchScores[index])
      })
    }
    
    return scores
  }

  // Real-time score updates when new verifications come in
  async updateScoreWithNewVerification(signalId: string, verificationId: string): Promise<number> {
    // Recalculate the score with the new verification data
    return this.calculateAlphaScore(signalId)
  }
}