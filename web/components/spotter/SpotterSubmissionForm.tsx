'use client'

import React, { useState } from 'react'
import { useSupabase } from '@/contexts/AuthContext'
import { AlphaSignal } from '@/types/financial-intelligence'
import { Upload, Link, DollarSign, TrendingUp, MessageSquare, AlertCircle } from 'lucide-react'

const PLATFORMS = [
  { value: 'tiktok', label: 'TikTok', color: 'bg-pink-500' },
  { value: 'reddit', label: 'Reddit', color: 'bg-orange-500' },
  { value: 'discord', label: 'Discord', color: 'bg-indigo-500' },
  { value: 'twitter', label: 'Twitter/X', color: 'bg-blue-500' },
  { value: 'youtube', label: 'YouTube', color: 'bg-red-500' },
  { value: 'instagram', label: 'Instagram', color: 'bg-purple-500' },
  { value: 'other', label: 'Other', color: 'bg-gray-500' }
]

const ASSET_TYPES = [
  { value: 'stock', label: 'Stock', icon: '📈' },
  { value: 'crypto', label: 'Crypto', icon: '₿' },
  { value: 'etf', label: 'ETF', icon: '📊' },
  { value: 'option', label: 'Option', icon: '📉' },
  { value: 'commodity', label: 'Commodity', icon: '🛢️' }
]

const SENTIMENTS = [
  { value: 'very_bullish', label: 'Very Bullish', color: 'text-green-600', icon: '🚀' },
  { value: 'bullish', label: 'Bullish', color: 'text-green-500', icon: '📈' },
  { value: 'neutral', label: 'Neutral', color: 'text-gray-500', icon: '➡️' },
  { value: 'bearish', label: 'Bearish', color: 'text-red-500', icon: '📉' },
  { value: 'very_bearish', label: 'Very Bearish', color: 'text-red-600', icon: '💀' }
]

export default function SpotterSubmissionForm() {
  const { supabase, user } = useSupabase()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  
  const [formData, setFormData] = useState({
    platform: '',
    sourceUrl: '',
    assetTicker: '',
    assetType: '',
    sentiment: '',
    reasoning: '',
    screenshotFile: null as File | null,
    viralityMetrics: {
      views: '',
      likes: '',
      shares: '',
      comments: ''
    }
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setSuccess(false)

    try {
      // Upload screenshot if provided
      let screenshotUrl = null
      if (formData.screenshotFile) {
        const fileName = `${user?.id}/${Date.now()}-${formData.screenshotFile.name}`
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('signal-screenshots')
          .upload(fileName, formData.screenshotFile)

        if (uploadError) throw uploadError
        
        const { data: { publicUrl } } = supabase.storage
          .from('signal-screenshots')
          .getPublicUrl(fileName)
        
        screenshotUrl = publicUrl
      }

      // Get spotter profile
      const { data: spotter, error: spotterError } = await supabase
        .from('spotters')
        .select('id')
        .eq('user_id', user?.id)
        .single()

      if (spotterError) {
        // Create spotter profile if doesn't exist
        const { data: newSpotter, error: createError } = await supabase
          .from('spotters')
          .insert({
            user_id: user?.id,
            display_name: user?.email?.split('@')[0]
          })
          .select()
          .single()

        if (createError) throw createError
        spotter.id = newSpotter.id
      }

      // Submit signal
      const { data: signal, error: signalError } = await supabase
        .from('alpha_signals')
        .insert({
          spotter_id: spotter.id,
          platform: formData.platform,
          source_url: formData.sourceUrl,
          asset_ticker: formData.assetTicker.toUpperCase(),
          asset_type: formData.assetType,
          sentiment: formData.sentiment,
          reasoning: formData.reasoning,
          screenshot_url: screenshotUrl,
          virality_metrics: {
            views: parseInt(formData.viralityMetrics.views) || 0,
            likes: parseInt(formData.viralityMetrics.likes) || 0,
            shares: parseInt(formData.viralityMetrics.shares) || 0,
            comments: parseInt(formData.viralityMetrics.comments) || 0
          },
          metadata: {
            user_agent: navigator.userAgent,
            submission_time: new Date().toISOString()
          }
        })
        .select()
        .single()

      if (signalError) throw signalError

      // Update spotter stats
      await supabase
        .from('spotters')
        .update({ 
          total_signals_logged: supabase.sql`total_signals_logged + 1`,
          updated_at: new Date().toISOString()
        })
        .eq('id', spotter.id)

      setSuccess(true)
      // Reset form
      setFormData({
        platform: '',
        sourceUrl: '',
        assetTicker: '',
        assetType: '',
        sentiment: '',
        reasoning: '',
        screenshotFile: null,
        viralityMetrics: {
          views: '',
          likes: '',
          shares: '',
          comments: ''
        }
      })
    } catch (err: any) {
      setError(err.message || 'Failed to submit signal')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto p-6">
      <h2 className="text-2xl font-bold mb-6">Submit Alpha Signal</h2>
      
      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2">
          <AlertCircle className="w-5 h-5 text-red-600" />
          <span className="text-red-800">{error}</span>
        </div>
      )}

      {success && (
        <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg">
          <span className="text-green-800">Signal submitted successfully! 🎉</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Platform Selection */}
        <div>
          <label className="block text-sm font-medium mb-2">Platform</label>
          <div className="grid grid-cols-3 gap-3">
            {PLATFORMS.map(platform => (
              <button
                key={platform.value}
                type="button"
                onClick={() => setFormData({ ...formData, platform: platform.value })}
                className={`p-3 rounded-lg border-2 transition-all ${
                  formData.platform === platform.value
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className={`w-4 h-4 rounded-full ${platform.color} mx-auto mb-1`} />
                <span className="text-sm">{platform.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Source URL */}
        <div>
          <label className="block text-sm font-medium mb-2">
            <Link className="w-4 h-4 inline mr-1" />
            Source URL
          </label>
          <input
            type="url"
            required
            value={formData.sourceUrl}
            onChange={(e) => setFormData({ ...formData, sourceUrl: e.target.value })}
            className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="https://..."
          />
        </div>

        {/* Asset Info */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2">
              <DollarSign className="w-4 h-4 inline mr-1" />
              Asset Ticker
            </label>
            <input
              type="text"
              required
              value={formData.assetTicker}
              onChange={(e) => setFormData({ ...formData, assetTicker: e.target.value })}
              className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="TSLA, BTC, etc."
              maxLength={10}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Asset Type</label>
            <select
              required
              value={formData.assetType}
              onChange={(e) => setFormData({ ...formData, assetType: e.target.value })}
              className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">Select type</option>
              {ASSET_TYPES.map(type => (
                <option key={type.value} value={type.value}>
                  {type.icon} {type.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Sentiment */}
        <div>
          <label className="block text-sm font-medium mb-2">
            <TrendingUp className="w-4 h-4 inline mr-1" />
            Market Sentiment
          </label>
          <div className="grid grid-cols-5 gap-2">
            {SENTIMENTS.map(sentiment => (
              <button
                key={sentiment.value}
                type="button"
                onClick={() => setFormData({ ...formData, sentiment: sentiment.value })}
                className={`p-3 rounded-lg border-2 transition-all text-center ${
                  formData.sentiment === sentiment.value
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="text-2xl mb-1">{sentiment.icon}</div>
                <span className={`text-xs ${sentiment.color}`}>{sentiment.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Reasoning */}
        <div>
          <label className="block text-sm font-medium mb-2">
            <MessageSquare className="w-4 h-4 inline mr-1" />
            Why This is Alpha
          </label>
          <textarea
            required
            value={formData.reasoning}
            onChange={(e) => setFormData({ ...formData, reasoning: e.target.value })}
            className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            rows={4}
            placeholder="Explain why this signal is valuable..."
          />
        </div>

        {/* Virality Metrics */}
        <div>
          <label className="block text-sm font-medium mb-2">Virality Metrics (optional)</label>
          <div className="grid grid-cols-4 gap-3">
            <input
              type="number"
              placeholder="Views"
              value={formData.viralityMetrics.views}
              onChange={(e) => setFormData({
                ...formData,
                viralityMetrics: { ...formData.viralityMetrics, views: e.target.value }
              })}
              className="p-2 border rounded text-sm"
            />
            <input
              type="number"
              placeholder="Likes"
              value={formData.viralityMetrics.likes}
              onChange={(e) => setFormData({
                ...formData,
                viralityMetrics: { ...formData.viralityMetrics, likes: e.target.value }
              })}
              className="p-2 border rounded text-sm"
            />
            <input
              type="number"
              placeholder="Shares"
              value={formData.viralityMetrics.shares}
              onChange={(e) => setFormData({
                ...formData,
                viralityMetrics: { ...formData.viralityMetrics, shares: e.target.value }
              })}
              className="p-2 border rounded text-sm"
            />
            <input
              type="number"
              placeholder="Comments"
              value={formData.viralityMetrics.comments}
              onChange={(e) => setFormData({
                ...formData,
                viralityMetrics: { ...formData.viralityMetrics, comments: e.target.value }
              })}
              className="p-2 border rounded text-sm"
            />
          </div>
        </div>

        {/* Screenshot Upload */}
        <div>
          <label className="block text-sm font-medium mb-2">
            <Upload className="w-4 h-4 inline mr-1" />
            Screenshot (optional)
          </label>
          <input
            type="file"
            accept="image/*"
            onChange={(e) => setFormData({ ...formData, screenshotFile: e.target.files?.[0] || null })}
            className="w-full p-2 border rounded-lg"
          />
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={loading}
          className="w-full py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Submitting...' : 'Submit Alpha Signal'}
        </button>
      </form>

      {/* Reward Info */}
      <div className="mt-6 p-4 bg-blue-50 rounded-lg">
        <h3 className="font-medium mb-2">💰 Reward Structure</h3>
        <ul className="text-sm space-y-1 text-gray-700">
          <li>• Base reward: $1.00 per verified signal</li>
          <li>• Performance bonus: Up to $50 for accurate calls</li>
          <li>• Tier bonuses: Silver +20%, Gold +50%, Platinum +100%</li>
        </ul>
      </div>
    </div>
  )
}