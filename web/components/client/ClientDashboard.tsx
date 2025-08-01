'use client'

import React, { useState, useEffect } from 'react'
import { useSupabase } from '@/contexts/AuthContext'
import { DashboardSignal, SignalFilter, AlphaMetrics } from '@/types/financial-intelligence'
import { 
  TrendingUp, Filter, RefreshCw, Download, Bell, 
  Activity, BarChart3, Clock, DollarSign, Search,
  ChevronUp, ChevronDown, ExternalLink
} from 'lucide-react'

export default function ClientDashboard() {
  const { supabase, user } = useSupabase()
  const [loading, setLoading] = useState(true)
  const [signals, setSignals] = useState<DashboardSignal[]>([])
  const [filteredSignals, setFilteredSignals] = useState<DashboardSignal[]>([])
  const [metrics, setMetrics] = useState<AlphaMetrics>({
    totalSignals: 0,
    verifiedSignals: 0,
    averageAlphaScore: 0,
    topPerformingAssets: [],
    platformDistribution: {},
    sentimentBreakdown: {},
    signalVelocity: []
  })
  const [filter, setFilter] = useState<SignalFilter>({
    minAlphaScore: 70,
    platforms: [],
    assetTypes: [],
    sentiments: [],
    status: ['verified']
  })
  const [searchQuery, setSearchQuery] = useState('')
  const [refreshing, setRefreshing] = useState(false)
  const [autoRefresh, setAutoRefresh] = useState(true)

  useEffect(() => {
    loadDashboardData()
    
    // Auto-refresh every 30 seconds
    if (autoRefresh) {
      const interval = setInterval(loadDashboardData, 30000)
      return () => clearInterval(interval)
    }
  }, [autoRefresh])

  useEffect(() => {
    applyFilters()
  }, [signals, filter, searchQuery])

  const loadDashboardData = async () => {
    try {
      setRefreshing(true)
      
      // Verify client subscription
      const { data: subscription } = await supabase
        .from('client_subscriptions')
        .select('*')
        .eq('organization_id', user?.id)
        .eq('is_active', true)
        .single()

      if (!subscription) {
        console.error('No active subscription found')
        return
      }

      // Load verified signals with all related data
      const { data: signalsData, error } = await supabase
        .from('alpha_signals')
        .select(`
          *,
          spotter:spotters(*),
          verifications:signal_verifications(*),
          alphaScoreComponents:alphascore_components(*),
          archiveData:alpha_archive(*)
        `)
        .eq('status', 'verified')
        .gte('alpha_score', 50)
        .order('created_at', { ascending: false })
        .limit(100)

      if (error) throw error

      setSignals(signalsData || [])
      calculateMetrics(signalsData || [])

    } catch (error) {
      console.error('Error loading dashboard data:', error)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  const calculateMetrics = (signalsData: DashboardSignal[]) => {
    const totalSignals = signalsData.length
    const verifiedSignals = signalsData.filter(s => s.status === 'verified').length
    const avgAlphaScore = signalsData.reduce((sum, s) => sum + (s.alphaScore || 0), 0) / totalSignals || 0

    // Top performing assets
    const assetCounts = signalsData.reduce((acc, signal) => {
      if (signal.assetTicker) {
        acc[signal.assetTicker] = (acc[signal.assetTicker] || 0) + 1
      }
      return acc
    }, {} as Record<string, number>)

    const topAssets = Object.entries(assetCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([ticker, count]) => ({
        ticker,
        signalCount: count,
        averageMovement: 0 // TODO: Calculate from archive data
      }))

    // Platform distribution
    const platformDist = signalsData.reduce((acc, signal) => {
      acc[signal.platform] = (acc[signal.platform] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    // Sentiment breakdown
    const sentimentDist = signalsData.reduce((acc, signal) => {
      acc[signal.sentiment] = (acc[signal.sentiment] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    setMetrics({
      totalSignals,
      verifiedSignals,
      averageAlphaScore: avgAlphaScore,
      topPerformingAssets: topAssets,
      platformDistribution: platformDist,
      sentimentBreakdown: sentimentDist,
      signalVelocity: [] // TODO: Calculate hourly velocity
    })
  }

  const applyFilters = () => {
    let filtered = [...signals]

    // Alpha score filter
    if (filter.minAlphaScore) {
      filtered = filtered.filter(s => (s.alphaScore || 0) >= filter.minAlphaScore!)
    }

    // Platform filter
    if (filter.platforms && filter.platforms.length > 0) {
      filtered = filtered.filter(s => filter.platforms!.includes(s.platform))
    }

    // Asset type filter
    if (filter.assetTypes && filter.assetTypes.length > 0) {
      filtered = filtered.filter(s => s.assetType && filter.assetTypes!.includes(s.assetType))
    }

    // Sentiment filter
    if (filter.sentiments && filter.sentiments.length > 0) {
      filtered = filtered.filter(s => filter.sentiments!.includes(s.sentiment))
    }

    // Search query
    if (searchQuery) {
      filtered = filtered.filter(s => 
        s.assetTicker?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.reasoning.toLowerCase().includes(searchQuery.toLowerCase())
      )
    }

    setFilteredSignals(filtered)
  }

  const exportData = () => {
    const csv = [
      ['Timestamp', 'Asset', 'Type', 'Platform', 'Sentiment', 'AlphaScore', 'Reasoning', 'Source URL'],
      ...filteredSignals.map(s => [
        new Date(s.createdAt).toISOString(),
        s.assetTicker || '',
        s.assetType || '',
        s.platform,
        s.sentiment,
        s.alphaScore?.toFixed(2) || '',
        s.reasoning,
        s.sourceUrl
      ])
    ].map(row => row.join(',')).join('\n')

    const blob = new Blob([csv], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `alpha-signals-${new Date().toISOString().split('T')[0]}.csv`
    a.click()
  }

  const getSentimentColor = (sentiment: string) => {
    if (sentiment.includes('bullish')) return 'text-green-600'
    if (sentiment.includes('bearish')) return 'text-red-600'
    return 'text-gray-600'
  }

  const getAlphaScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600 bg-green-50'
    if (score >= 60) return 'text-yellow-600 bg-yellow-50'
    return 'text-gray-600 bg-gray-50'
  }

  if (loading && !refreshing) {
    return <div className="p-8 text-center">Loading dashboard...</div>
  }

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Alpha Intelligence Dashboard</h1>
          <p className="text-gray-600">Real-time financial signals from social media</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setAutoRefresh(!autoRefresh)}
            className={`px-4 py-2 rounded-lg flex items-center gap-2 ${
              autoRefresh ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
            }`}
          >
            <RefreshCw className={`w-4 h-4 ${autoRefresh ? 'animate-spin' : ''}`} />
            Auto-refresh {autoRefresh ? 'ON' : 'OFF'}
          </button>
          <button
            onClick={exportData}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg flex items-center gap-2 hover:bg-blue-700"
          >
            <Download className="w-4 h-4" />
            Export CSV
          </button>
        </div>
      </div>

      {/* Metrics Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Active Signals</p>
              <p className="text-2xl font-bold">{metrics.totalSignals}</p>
            </div>
            <Activity className="w-8 h-8 text-blue-500" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Avg AlphaScore</p>
              <p className="text-2xl font-bold">{metrics.averageAlphaScore.toFixed(1)}</p>
            </div>
            <BarChart3 className="w-8 h-8 text-green-500" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Top Asset</p>
              <p className="text-2xl font-bold">
                {metrics.topPerformingAssets[0]?.ticker || '-'}
              </p>
            </div>
            <TrendingUp className="w-8 h-8 text-purple-500" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Signals/Hour</p>
              <p className="text-2xl font-bold">
                {(metrics.totalSignals / 24).toFixed(1)}
              </p>
            </div>
            <Clock className="w-8 h-8 text-yellow-500" />
          </div>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="bg-white rounded-lg shadow p-4">
        <div className="flex items-center gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by ticker or keyword..."
                className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <label className="text-sm text-gray-600">Min AlphaScore:</label>
            <input
              type="number"
              value={filter.minAlphaScore}
              onChange={(e) => setFilter({ ...filter, minAlphaScore: parseInt(e.target.value) })}
              className="w-20 px-3 py-2 border rounded-lg"
              min="0"
              max="100"
            />
          </div>

          <button
            onClick={() => loadDashboardData()}
            disabled={refreshing}
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Signals Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Time
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Asset
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Platform
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Sentiment
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  AlphaScore
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Signal
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Source
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredSignals.map((signal) => (
                <tr key={signal.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                    {new Date(signal.createdAt).toLocaleTimeString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">
                        {signal.assetTicker}
                      </div>
                      <div className="text-xs text-gray-500">{signal.assetType}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-sm capitalize">{signal.platform}</span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`text-sm font-medium ${getSentimentColor(signal.sentiment)}`}>
                      {signal.sentiment === 'very_bullish' && <ChevronUp className="w-4 h-4 inline" />}
                      {signal.sentiment === 'very_bearish' && <ChevronDown className="w-4 h-4 inline" />}
                      {signal.sentiment.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                      getAlphaScoreColor(signal.alphaScore || 0)
                    }`}>
                      {signal.alphaScore?.toFixed(0)}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900 max-w-xs truncate">
                    {signal.reasoning}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <a
                      href={signal.sourceUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-800"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Empty State */}
      {filteredSignals.length === 0 && (
        <div className="text-center py-12">
          <Bell className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No signals match your criteria</h3>
          <p className="text-gray-600">Try adjusting your filters or check back later</p>
        </div>
      )}
    </div>
  )
}