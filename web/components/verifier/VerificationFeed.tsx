'use client'

import React, { useState, useEffect } from 'react'
import { useSupabase } from '@/contexts/AuthContext'
import { AlphaSignal, Spotter } from '@/types/financial-intelligence'
import { 
  CheckCircle, XCircle, Edit3, Clock, TrendingUp, 
  ExternalLink, MessageSquare, ThumbsUp, ThumbsDown, 
  SkipForward, AlertTriangle
} from 'lucide-react'

interface SignalWithSpotter extends AlphaSignal {
  spotter: Spotter
}

export default function VerificationFeed() {
  const { supabase, user } = useSupabase()
  const [loading, setLoading] = useState(true)
  const [currentSignal, setCurrentSignal] = useState<SignalWithSpotter | null>(null)
  const [signals, setSignals] = useState<SignalWithSpotter[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [verifying, setVerifying] = useState(false)
  const [refinementMode, setRefinementMode] = useState(false)
  const [refinementData, setRefinementData] = useState({
    ticker: '',
    sentiment: '',
    notes: ''
  })

  useEffect(() => {
    loadPendingSignals()
  }, [])

  useEffect(() => {
    if (signals.length > 0 && currentIndex < signals.length) {
      setCurrentSignal(signals[currentIndex])
      setRefinementData({
        ticker: signals[currentIndex].assetTicker || '',
        sentiment: signals[currentIndex].sentiment || '',
        notes: ''
      })
    }
  }, [signals, currentIndex])

  const loadPendingSignals = async () => {
    try {
      // Get or create verifier profile
      let { data: verifier } = await supabase
        .from('verifiers')
        .select('id')
        .eq('user_id', user?.id)
        .single()

      if (!verifier) {
        const { data: newVerifier } = await supabase
          .from('verifiers')
          .insert({ user_id: user?.id })
          .select()
          .single()
        verifier = newVerifier
      }

      // Load pending signals with spotter info
      const { data, error } = await supabase
        .from('alpha_signals')
        .select(`
          *,
          spotter:spotters(*)
        `)
        .in('status', ['pending', 'verifying'])
        .order('created_at', { ascending: true })
        .limit(20)

      if (error) throw error
      setSignals(data || [])
    } catch (error) {
      console.error('Error loading signals:', error)
    } finally {
      setLoading(false)
    }
  }

  const submitVerification = async (verdict: 'confirm' | 'reject' | 'refine') => {
    if (!currentSignal || verifying) return
    
    setVerifying(true)
    try {
      // Get verifier ID
      const { data: verifier } = await supabase
        .from('verifiers')
        .select('id')
        .eq('user_id', user?.id)
        .single()

      if (!verifier) throw new Error('Verifier profile not found')

      // Submit verification
      const verificationData = {
        signal_id: currentSignal.id,
        verifier_id: verifier.id,
        verdict,
        confidence_level: verdict === 'confirm' ? 80 : verdict === 'reject' ? 90 : 60,
        ...(verdict === 'refine' && {
          refinement_notes: refinementData.notes,
          suggested_ticker: refinementData.ticker,
          suggested_sentiment: refinementData.sentiment
        }),
        verification_metadata: {
          time_to_verify: Date.now() - new Date(currentSignal.createdAt).getTime(),
          platform: navigator.platform
        }
      }

      const { error } = await supabase
        .from('signal_verifications')
        .insert(verificationData)

      if (error) throw error

      // Update verifier stats
      await supabase
        .from('verifiers')
        .update({ 
          total_verifications: supabase.sql`total_verifications + 1`,
          verification_streak: supabase.sql`verification_streak + 1`
        })
        .eq('id', verifier.id)

      // Move to next signal
      if (currentIndex < signals.length - 1) {
        setCurrentIndex(currentIndex + 1)
      } else {
        // Reload more signals
        await loadPendingSignals()
        setCurrentIndex(0)
      }
      
      setRefinementMode(false)
    } catch (error) {
      console.error('Error submitting verification:', error)
    } finally {
      setVerifying(false)
    }
  }

  const skipSignal = () => {
    if (currentIndex < signals.length - 1) {
      setCurrentIndex(currentIndex + 1)
    } else {
      setCurrentIndex(0)
    }
    setRefinementMode(false)
  }

  if (loading) {
    return <div className="p-8 text-center">Loading verification feed...</div>
  }

  if (!currentSignal) {
    return (
      <div className="max-w-2xl mx-auto p-8 text-center">
        <AlertTriangle className="w-12 h-12 text-yellow-500 mx-auto mb-4" />
        <h3 className="text-lg font-medium mb-2">No Signals to Verify</h3>
        <p className="text-gray-600">Check back later for new signals to verify</p>
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto p-6">
      {/* Progress Bar */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-gray-600">Signal {currentIndex + 1} of {signals.length}</span>
          <button
            onClick={skipSignal}
            className="text-sm text-gray-500 hover:text-gray-700 flex items-center gap-1"
          >
            Skip <SkipForward className="w-4 h-4" />
          </button>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div 
            className="bg-blue-600 h-2 rounded-full transition-all"
            style={{ width: `${((currentIndex + 1) / signals.length) * 100}%` }}
          />
        </div>
      </div>

      {/* Signal Card */}
      <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h3 className="text-xl font-bold">{currentSignal.assetTicker}</h3>
              <span className="text-sm bg-gray-100 px-2 py-1 rounded">
                {currentSignal.assetType}
              </span>
            </div>
            <p className="text-sm text-gray-600">
              Spotted by {currentSignal.spotter.displayName} • 
              Credibility: {currentSignal.spotter.credibilityScore.toFixed(1)}%
            </p>
          </div>
          <a
            href={currentSignal.sourceUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 hover:text-blue-700"
          >
            <ExternalLink className="w-5 h-5" />
          </a>
        </div>

        {/* Platform & Sentiment */}
        <div className="flex items-center gap-4 mb-4">
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600">Platform:</span>
            <span className="font-medium capitalize">{currentSignal.platform}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600">Sentiment:</span>
            <span className={`font-medium ${
              currentSignal.sentiment.includes('bullish') ? 'text-green-600' : 
              currentSignal.sentiment.includes('bearish') ? 'text-red-600' : 
              'text-gray-600'
            }`}>
              {currentSignal.sentiment.replace('_', ' ')}
            </span>
          </div>
        </div>

        {/* Reasoning */}
        <div className="mb-4">
          <h4 className="text-sm font-medium text-gray-700 mb-2">
            <MessageSquare className="w-4 h-4 inline mr-1" />
            Spotter's Reasoning
          </h4>
          <p className="text-gray-800 bg-gray-50 p-3 rounded">{currentSignal.reasoning}</p>
        </div>

        {/* Virality Metrics */}
        {currentSignal.viralityMetrics && Object.keys(currentSignal.viralityMetrics).length > 0 && (
          <div className="mb-4">
            <h4 className="text-sm font-medium text-gray-700 mb-2">Virality Metrics</h4>
            <div className="grid grid-cols-4 gap-3">
              {Object.entries(currentSignal.viralityMetrics).map(([key, value]) => (
                <div key={key} className="text-center">
                  <p className="text-xs text-gray-600 capitalize">{key}</p>
                  <p className="font-medium">{typeof value === 'number' ? value.toLocaleString() : value}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Screenshot */}
        {currentSignal.screenshotUrl && (
          <div className="mb-4">
            <img 
              src={currentSignal.screenshotUrl} 
              alt="Signal screenshot"
              className="w-full rounded border"
            />
          </div>
        )}

        {/* Timestamp */}
        <p className="text-xs text-gray-500">
          <Clock className="w-3 h-3 inline mr-1" />
          Spotted {new Date(currentSignal.originTimestamp).toLocaleString()}
        </p>
      </div>

      {/* Refinement Mode */}
      {refinementMode && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
          <h4 className="font-medium mb-3">Refine Signal Details</h4>
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium mb-1">Correct Ticker</label>
              <input
                type="text"
                value={refinementData.ticker}
                onChange={(e) => setRefinementData({ ...refinementData, ticker: e.target.value })}
                className="w-full p-2 border rounded"
                placeholder="e.g., TSLA, BTC"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Correct Sentiment</label>
              <select
                value={refinementData.sentiment}
                onChange={(e) => setRefinementData({ ...refinementData, sentiment: e.target.value })}
                className="w-full p-2 border rounded"
              >
                <option value="very_bullish">Very Bullish</option>
                <option value="bullish">Bullish</option>
                <option value="neutral">Neutral</option>
                <option value="bearish">Bearish</option>
                <option value="very_bearish">Very Bearish</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Notes</label>
              <textarea
                value={refinementData.notes}
                onChange={(e) => setRefinementData({ ...refinementData, notes: e.target.value })}
                className="w-full p-2 border rounded"
                rows={2}
                placeholder="Explain refinements..."
              />
            </div>
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex gap-3">
        {!refinementMode ? (
          <>
            <button
              onClick={() => submitVerification('confirm')}
              disabled={verifying}
              className="flex-1 py-3 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              <ThumbsUp className="w-5 h-5" />
              Confirm
            </button>
            <button
              onClick={() => setRefinementMode(true)}
              disabled={verifying}
              className="flex-1 py-3 bg-yellow-600 text-white rounded-lg font-medium hover:bg-yellow-700 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              <Edit3 className="w-5 h-5" />
              Refine
            </button>
            <button
              onClick={() => submitVerification('reject')}
              disabled={verifying}
              className="flex-1 py-3 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              <ThumbsDown className="w-5 h-5" />
              Reject
            </button>
          </>
        ) : (
          <>
            <button
              onClick={() => submitVerification('refine')}
              disabled={verifying}
              className="flex-1 py-3 bg-yellow-600 text-white rounded-lg font-medium hover:bg-yellow-700 disabled:opacity-50"
            >
              Submit Refinement
            </button>
            <button
              onClick={() => setRefinementMode(false)}
              disabled={verifying}
              className="flex-1 py-3 bg-gray-600 text-white rounded-lg font-medium hover:bg-gray-700 disabled:opacity-50"
            >
              Cancel
            </button>
          </>
        )}
      </div>

      {/* Reward Info */}
      <div className="mt-4 text-center text-sm text-gray-600">
        Earn $0.10 per verification + bonuses for consensus accuracy
      </div>
    </div>
  )
}