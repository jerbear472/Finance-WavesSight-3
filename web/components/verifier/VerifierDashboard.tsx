'use client'

import React, { useState, useEffect } from 'react'
import { useSupabase } from '@/contexts/AuthContext'
import { Verifier, SignalVerification, VerifierReward } from '@/types/financial-intelligence'
import { 
  CheckCircle, XCircle, Edit3, TrendingUp, Award, 
  BarChart3, Target, Zap, Calendar, DollarSign 
} from 'lucide-react'

interface VerifierStats {
  totalVerifications: number
  consensusAccuracy: number
  totalEarnings: number
  pendingEarnings: number
  verificationsToday: number
  currentStreak: number
  verdictBreakdown: {
    confirm: number
    reject: number
    refine: number
  }
}

export default function VerifierDashboard() {
  const { supabase, user } = useSupabase()
  const [loading, setLoading] = useState(true)
  const [verifier, setVerifier] = useState<Verifier | null>(null)
  const [stats, setStats] = useState<VerifierStats>({
    totalVerifications: 0,
    consensusAccuracy: 0,
    totalEarnings: 0,
    pendingEarnings: 0,
    verificationsToday: 0,
    currentStreak: 0,
    verdictBreakdown: {
      confirm: 0,
      reject: 0,
      refine: 0
    }
  })
  const [recentVerifications, setRecentVerifications] = useState<SignalVerification[]>([])
  const [rewards, setRewards] = useState<VerifierReward[]>([])

  useEffect(() => {
    if (user) {
      loadVerifierData()
    }
  }, [user])

  const loadVerifierData = async () => {
    try {
      // Get or create verifier profile
      let { data: verifierData, error: verifierError } = await supabase
        .from('verifiers')
        .select('*')
        .eq('user_id', user?.id)
        .single()

      if (verifierError && verifierError.code === 'PGRST116') {
        // Create verifier profile
        const { data: newVerifier, error: createError } = await supabase
          .from('verifiers')
          .insert({
            user_id: user?.id
          })
          .select()
          .single()

        if (createError) throw createError
        verifierData = newVerifier
      }

      setVerifier(verifierData)

      // Load recent verifications
      const { data: verifications, error: verificationsError } = await supabase
        .from('signal_verifications')
        .select('*')
        .eq('verifier_id', verifierData?.id)
        .order('created_at', { ascending: false })
        .limit(20)

      if (verificationsError) throw verificationsError
      setRecentVerifications(verifications || [])

      // Load rewards
      const { data: rewardsData, error: rewardsError } = await supabase
        .from('verifier_rewards')
        .select('*')
        .eq('verifier_id', verifierData?.id)
        .order('created_at', { ascending: false })
        .limit(20)

      if (rewardsError) throw rewardsError
      setRewards(rewardsData || [])

      // Calculate stats
      const totalEarnings = rewardsData?.reduce((sum, r) => sum + (r.paid_out ? r.amount : 0), 0) || 0
      const pendingEarnings = rewardsData?.reduce((sum, r) => sum + (!r.paid_out ? r.amount : 0), 0) || 0
      
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      const verificationsToday = verifications?.filter(v => 
        new Date(v.created_at) >= today
      ).length || 0

      // Calculate verdict breakdown
      const verdictBreakdown = verifications?.reduce((acc, v) => {
        acc[v.verdict] = (acc[v.verdict] || 0) + 1
        return acc
      }, { confirm: 0, reject: 0, refine: 0 }) || { confirm: 0, reject: 0, refine: 0 }

      setStats({
        totalVerifications: verifierData?.total_verifications || 0,
        consensusAccuracy: verifierData?.consensus_accuracy || 0,
        totalEarnings,
        pendingEarnings,
        verificationsToday,
        currentStreak: verifierData?.verification_streak || 0,
        verdictBreakdown
      })

    } catch (error) {
      console.error('Error loading verifier data:', error)
    } finally {
      setLoading(false)
    }
  }

  const getVerdictIcon = (verdict: string) => {
    switch (verdict) {
      case 'confirm': return <CheckCircle className="w-4 h-4 text-green-500" />
      case 'reject': return <XCircle className="w-4 h-4 text-red-500" />
      case 'refine': return <Edit3 className="w-4 h-4 text-yellow-500" />
      default: return null
    }
  }

  if (loading) {
    return <div className="p-8 text-center">Loading verifier dashboard...</div>
  }

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Verifier Dashboard</h1>
            <p className="text-gray-600">Community validation performance</p>
          </div>
          <div className="flex items-center gap-2">
            <Target className="w-5 h-5 text-blue-500" />
            <span className="font-medium">Score: {verifier?.verifierScore.toFixed(1)}/100</span>
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
              <p className="text-sm text-gray-600">Consensus Accuracy</p>
              <p className="text-2xl font-bold">{stats.consensusAccuracy.toFixed(1)}%</p>
            </div>
            <Target className="w-8 h-8 text-blue-500" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Today's Verifications</p>
              <p className="text-2xl font-bold">{stats.verificationsToday}</p>
            </div>
            <CheckCircle className="w-8 h-8 text-purple-500" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Current Streak</p>
              <p className="text-2xl font-bold">{stats.currentStreak} days</p>
            </div>
            <Zap className="w-8 h-8 text-yellow-500" />
          </div>
        </div>
      </div>

      {/* Verdict Breakdown */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold mb-4">Verdict Distribution</h2>
        <div className="grid grid-cols-3 gap-6">
          <div className="text-center">
            <CheckCircle className="w-8 h-8 text-green-500 mx-auto mb-2" />
            <p className="text-2xl font-bold">{stats.verdictBreakdown.confirm}</p>
            <p className="text-sm text-gray-600">Confirmed</p>
          </div>
          <div className="text-center">
            <Edit3 className="w-8 h-8 text-yellow-500 mx-auto mb-2" />
            <p className="text-2xl font-bold">{stats.verdictBreakdown.refine}</p>
            <p className="text-sm text-gray-600">Refined</p>
          </div>
          <div className="text-center">
            <XCircle className="w-8 h-8 text-red-500 mx-auto mb-2" />
            <p className="text-2xl font-bold">{stats.verdictBreakdown.reject}</p>
            <p className="text-sm text-gray-600">Rejected</p>
          </div>
        </div>
      </div>

      {/* Recent Verifications */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold mb-4">Recent Verifications</h2>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="text-left border-b">
                <th className="pb-3 text-sm font-medium text-gray-600">Date</th>
                <th className="pb-3 text-sm font-medium text-gray-600">Signal ID</th>
                <th className="pb-3 text-sm font-medium text-gray-600">Verdict</th>
                <th className="pb-3 text-sm font-medium text-gray-600">Confidence</th>
                <th className="pb-3 text-sm font-medium text-gray-600">Reward</th>
              </tr>
            </thead>
            <tbody>
              {recentVerifications.map((verification) => (
                <tr key={verification.id} className="border-b hover:bg-gray-50">
                  <td className="py-3 text-sm">
                    {new Date(verification.createdAt).toLocaleDateString()}
                  </td>
                  <td className="py-3 text-sm font-mono">
                    {verification.signalId.slice(0, 8)}...
                  </td>
                  <td className="py-3">
                    <div className="flex items-center gap-2">
                      {getVerdictIcon(verification.verdict)}
                      <span className="text-sm capitalize">{verification.verdict}</span>
                    </div>
                  </td>
                  <td className="py-3 text-sm">
                    {verification.confidenceLevel.toFixed(0)}%
                  </td>
                  <td className="py-3 font-medium">${verification.rewardEarned.toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Performance Tips */}
      <div className="bg-blue-50 rounded-lg p-6">
        <h3 className="font-semibold mb-3 flex items-center gap-2">
          <BarChart3 className="w-5 h-5" />
          Performance Tips
        </h3>
        <ul className="space-y-2 text-sm text-gray-700">
          <li>• High consensus accuracy increases your verifier score and future rewards</li>
          <li>• Refine signals with incorrect details to help improve data quality</li>
          <li>• Maintain daily streaks to unlock bonus rewards</li>
          <li>• Focus on your areas of expertise for better accuracy</li>
        </ul>
      </div>
    </div>
  )
}