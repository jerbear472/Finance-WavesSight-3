'use client'

import React, { useState, useEffect } from 'react'
import { useSupabase } from '@/contexts/AuthContext'
import { Spotter, AlphaSignal, SpotterEarning } from '@/types/financial-intelligence'
import { 
  DollarSign, TrendingUp, Award, Clock, CheckCircle, 
  XCircle, AlertCircle, BarChart3, Trophy 
} from 'lucide-react'

interface SpotterStats {
  totalEarnings: number
  pendingEarnings: number
  signalsToday: number
  accuracyRate: number
  currentStreak: number
  topPerformingSignal: AlphaSignal | null
}

export default function SpotterDashboard() {
  const { supabase, user } = useSupabase()
  const [loading, setLoading] = useState(true)
  const [spotter, setSpotter] = useState<Spotter | null>(null)
  const [stats, setStats] = useState<SpotterStats>({
    totalEarnings: 0,
    pendingEarnings: 0,
    signalsToday: 0,
    accuracyRate: 0,
    currentStreak: 0,
    topPerformingSignal: null
  })
  const [recentSignals, setRecentSignals] = useState<AlphaSignal[]>([])
  const [earnings, setEarnings] = useState<SpotterEarning[]>([])

  useEffect(() => {
    if (user) {
      loadSpotterData()
    }
  }, [user])

  const loadSpotterData = async () => {
    try {
      // Get or create spotter profile
      let { data: spotterData, error: spotterError } = await supabase
        .from('spotters')
        .select('*')
        .eq('user_id', user?.id)
        .single()

      if (spotterError && spotterError.code === 'PGRST116') {
        // Create spotter profile
        const { data: newSpotter, error: createError } = await supabase
          .from('spotters')
          .insert({
            user_id: user?.id,
            display_name: user?.email?.split('@')[0]
          })
          .select()
          .single()

        if (createError) throw createError
        spotterData = newSpotter
      }

      setSpotter(spotterData)

      // Load recent signals
      const { data: signals, error: signalsError } = await supabase
        .from('alpha_signals')
        .select('*')
        .eq('spotter_id', spotterData?.id)
        .order('created_at', { ascending: false })
        .limit(10)

      if (signalsError) throw signalsError
      setRecentSignals(signals || [])

      // Load earnings
      const { data: earningsData, error: earningsError } = await supabase
        .from('spotter_earnings')
        .select('*')
        .eq('spotter_id', spotterData?.id)
        .order('created_at', { ascending: false })
        .limit(20)

      if (earningsError) throw earningsError
      setEarnings(earningsData || [])

      // Calculate stats
      const totalEarnings = earningsData?.reduce((sum, e) => sum + (e.paid_out ? e.amount : 0), 0) || 0
      const pendingEarnings = earningsData?.reduce((sum, e) => sum + (!e.paid_out ? e.amount : 0), 0) || 0
      
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      const signalsToday = signals?.filter(s => 
        new Date(s.created_at) >= today
      ).length || 0

      // Get top performing signal
      const topSignal = signals?.reduce((best, signal) => {
        if (!best || signal.total_payout > best.total_payout) return signal
        return best
      }, null as AlphaSignal | null)

      setStats({
        totalEarnings,
        pendingEarnings,
        signalsToday,
        accuracyRate: spotterData?.accuracy_rate || 0,
        currentStreak: 0, // TODO: Calculate from data
        topPerformingSignal: topSignal
      })

    } catch (error) {
      console.error('Error loading spotter data:', error)
    } finally {
      setLoading(false)
    }
  }

  const getTierColor = (tier: string) => {
    switch (tier) {
      case 'bronze': return 'text-orange-600 bg-orange-100'
      case 'silver': return 'text-gray-600 bg-gray-100'
      case 'gold': return 'text-yellow-600 bg-yellow-100'
      case 'platinum': return 'text-purple-600 bg-purple-100'
      default: return 'text-gray-600 bg-gray-100'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'verified': return <CheckCircle className="w-4 h-4 text-green-500" />
      case 'rejected': return <XCircle className="w-4 h-4 text-red-500" />
      case 'pending': return <Clock className="w-4 h-4 text-yellow-500" />
      default: return <AlertCircle className="w-4 h-4 text-gray-500" />
    }
  }

  if (loading) {
    return <div className="p-8 text-center">Loading spotter dashboard...</div>
  }

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Spotter Dashboard</h1>
            <p className="text-gray-600">Welcome back, {spotter?.displayName}</p>
          </div>
          <div className={`px-4 py-2 rounded-full font-medium ${getTierColor(spotter?.currentTier || 'bronze')}`}>
            <Trophy className="w-4 h-4 inline mr-1" />
            {spotter?.currentTier?.toUpperCase()}
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Earnings</p>
              <p className="text-2xl font-bold">${stats.totalEarnings.toFixed(2)}</p>
            </div>
            <DollarSign className="w-8 h-8 text-green-500" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Pending</p>
              <p className="text-2xl font-bold">${stats.pendingEarnings.toFixed(2)}</p>
            </div>
            <Clock className="w-8 h-8 text-yellow-500" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Accuracy</p>
              <p className="text-2xl font-bold">{stats.accuracyRate.toFixed(1)}%</p>
            </div>
            <BarChart3 className="w-8 h-8 text-blue-500" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Signals Today</p>
              <p className="text-2xl font-bold">{stats.signalsToday}</p>
            </div>
            <TrendingUp className="w-8 h-8 text-purple-500" />
          </div>
        </div>
      </div>

      {/* Performance Metrics */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold mb-4">Performance Metrics</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          <div>
            <p className="text-sm text-gray-600">Credibility Score</p>
            <div className="mt-2">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xl font-bold">{spotter?.credibilityScore.toFixed(1)}</span>
                <span className="text-sm text-gray-500">/100</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-blue-600 h-2 rounded-full"
                  style={{ width: `${spotter?.credibilityScore}%` }}
                />
              </div>
            </div>
          </div>

          <div>
            <p className="text-sm text-gray-600">Total Signals</p>
            <p className="text-xl font-bold mt-2">{spotter?.totalSignalsLogged}</p>
          </div>

          <div>
            <p className="text-sm text-gray-600">Accurate Signals</p>
            <p className="text-xl font-bold mt-2">{spotter?.accurateSignals}</p>
          </div>

          <div>
            <p className="text-sm text-gray-600">Current Streak</p>
            <p className="text-xl font-bold mt-2">{stats.currentStreak} days</p>
          </div>
        </div>
      </div>

      {/* Recent Signals */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold mb-4">Recent Signals</h2>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="text-left border-b">
                <th className="pb-3 text-sm font-medium text-gray-600">Date</th>
                <th className="pb-3 text-sm font-medium text-gray-600">Asset</th>
                <th className="pb-3 text-sm font-medium text-gray-600">Platform</th>
                <th className="pb-3 text-sm font-medium text-gray-600">Sentiment</th>
                <th className="pb-3 text-sm font-medium text-gray-600">Status</th>
                <th className="pb-3 text-sm font-medium text-gray-600">AlphaScore</th>
                <th className="pb-3 text-sm font-medium text-gray-600">Payout</th>
              </tr>
            </thead>
            <tbody>
              {recentSignals.map((signal) => (
                <tr key={signal.id} className="border-b hover:bg-gray-50">
                  <td className="py-3 text-sm">
                    {new Date(signal.createdAt).toLocaleDateString()}
                  </td>
                  <td className="py-3">
                    <span className="font-medium">{signal.assetTicker}</span>
                    <span className="text-xs text-gray-500 ml-1">({signal.assetType})</span>
                  </td>
                  <td className="py-3 text-sm capitalize">{signal.platform}</td>
                  <td className="py-3">
                    <span className={`text-sm ${
                      signal.sentiment.includes('bullish') ? 'text-green-600' : 
                      signal.sentiment.includes('bearish') ? 'text-red-600' : 
                      'text-gray-600'
                    }`}>
                      {signal.sentiment.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="py-3">
                    <div className="flex items-center gap-1">
                      {getStatusIcon(signal.status)}
                      <span className="text-sm capitalize">{signal.status}</span>
                    </div>
                  </td>
                  <td className="py-3">
                    {signal.alphaScore ? (
                      <span className="font-medium">{signal.alphaScore.toFixed(1)}</span>
                    ) : (
                      <span className="text-gray-400">-</span>
                    )}
                  </td>
                  <td className="py-3 font-medium">${signal.totalPayout.toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Earnings History */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold mb-4">Recent Earnings</h2>
        <div className="space-y-3">
          {earnings.map((earning) => (
            <div key={earning.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-3">
                <Award className="w-5 h-5 text-blue-500" />
                <div>
                  <p className="font-medium">{earning.description || earning.earningType.replace('_', ' ')}</p>
                  <p className="text-sm text-gray-600">
                    {new Date(earning.createdAt).toLocaleDateString()}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="font-bold">${earning.amount.toFixed(2)}</p>
                {earning.paidOut ? (
                  <span className="text-xs text-green-600">Paid</span>
                ) : (
                  <span className="text-xs text-yellow-600">Pending</span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}