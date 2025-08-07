'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import { Copy, Users, DollarSign, TrendingUp, Gift, Check, Share2 } from 'lucide-react'
import { toast } from 'react-hot-toast'

interface ReferralStats {
  totalReferrals: number
  activeReferrals: number
  totalEarnings: number
  pendingEarnings: number
  referralCode: string
  referralLink: string
}

interface Referral {
  id: string
  referred_email: string
  status: 'pending' | 'active' | 'expired'
  signup_bonus_paid: boolean
  total_earnings_paid: number
  created_at: string
  activated_at?: string
}

export default function ReferralSystem() {
  const { user } = useAuth()
  const [stats, setStats] = useState<ReferralStats>({
    totalReferrals: 0,
    activeReferrals: 0,
    totalEarnings: 0,
    pendingEarnings: 0,
    referralCode: '',
    referralLink: ''
  })
  const [referrals, setReferrals] = useState<Referral[]>([])
  const [loading, setLoading] = useState(true)
  const [copied, setCopied] = useState(false)
  const [sharing, setSharing] = useState(false)

  const generateReferralCode = () => {
    // Generate a unique referral code based on user ID
    return `WAVE${user?.id.substring(0, 8).toUpperCase()}`
  }

  const fetchReferralData = async () => {
    if (!user) return

    try {
      // Fetch user's referrals
      const { data: referralData, error: referralError } = await supabase
        .from('referrals')
        .select('*')
        .eq('referrer_id', user.id)
        .order('created_at', { ascending: false })

      if (referralError) throw referralError

      // Fetch referral earnings
      const { data: earningsData, error: earningsError } = await supabase
        .from('referral_earnings')
        .select('referral_bonus_amount')
        .eq('referrer_id', user.id)

      if (earningsError) throw earningsError

      // Calculate stats
      const totalEarnings = earningsData?.reduce((sum, e) => sum + e.referral_bonus_amount, 0) || 0
      const activeRefs = referralData?.filter(r => r.status === 'active') || []
      const pendingEarnings = activeRefs.reduce((sum, r) => {
        // Calculate potential earnings for next 3 months
        if (r.activated_at) {
          const activatedDate = new Date(r.activated_at)
          const monthsSinceActivation = Math.floor((Date.now() - activatedDate.getTime()) / (30 * 24 * 60 * 60 * 1000))
          if (monthsSinceActivation < 3) {
            return sum + (3 - monthsSinceActivation) * 20 // Estimate $20/month per referral
          }
        }
        return sum
      }, 0)

      const referralCode = generateReferralCode()
      const referralLink = `${window.location.origin}/register?ref=${referralCode}`

      setStats({
        totalReferrals: referralData?.length || 0,
        activeReferrals: activeRefs.length,
        totalEarnings,
        pendingEarnings,
        referralCode,
        referralLink
      })
      setReferrals(referralData || [])

    } catch (error) {
      console.error('Error fetching referral data:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchReferralData()
  }, [user])

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      toast.success('Copied to clipboard!')
      setTimeout(() => setCopied(false), 2000)
    } catch (error) {
      toast.error('Failed to copy')
    }
  }

  const shareReferral = async () => {
    if (navigator.share) {
      try {
        setSharing(true)
        await navigator.share({
          title: 'Join WaveSight - Get Paid to Spot Financial Trends',
          text: `I'm earning money spotting financial trends on WaveSight! Join using my referral code ${stats.referralCode} and we both get bonuses!`,
          url: stats.referralLink
        })
      } catch (error) {
        console.log('Share cancelled')
      } finally {
        setSharing(false)
      }
    } else {
      copyToClipboard(stats.referralLink)
    }
  }

  if (loading) {
    return (
      <div className="animate-pulse space-y-4">
        <div className="h-48 bg-gray-200 dark:bg-neutral-700 rounded-xl" />
        <div className="h-96 bg-gray-200 dark:bg-neutral-700 rounded-xl" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Referral Stats Card */}
      <div className="bg-gradient-to-r from-purple-500 to-pink-600 rounded-xl p-6 text-white">
        <h2 className="text-2xl font-bold mb-4">Referral Program</h2>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div>
            <div className="text-3xl font-bold">{stats.totalReferrals}</div>
            <div className="text-sm opacity-90">Total Referrals</div>
          </div>
          <div>
            <div className="text-3xl font-bold">{stats.activeReferrals}</div>
            <div className="text-sm opacity-90">Active Users</div>
          </div>
          <div>
            <div className="text-3xl font-bold">${stats.totalEarnings.toFixed(2)}</div>
            <div className="text-sm opacity-90">Total Earned</div>
          </div>
          <div>
            <div className="text-3xl font-bold">${stats.pendingEarnings.toFixed(2)}</div>
            <div className="text-sm opacity-90">Potential Earnings</div>
          </div>
        </div>

        {/* Referral Code Box */}
        <div className="bg-white/20 backdrop-blur rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">Your Referral Code</span>
            <button
              onClick={() => copyToClipboard(stats.referralCode)}
              className="p-2 hover:bg-white/20 rounded-lg transition-colors"
            >
              {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            </button>
          </div>
          <div className="font-mono text-2xl font-bold">{stats.referralCode}</div>
        </div>
      </div>

      {/* How It Works */}
      <div className="bg-white dark:bg-neutral-800 rounded-xl p-6 border border-gray-200 dark:border-neutral-700">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
          How Referrals Work
        </h3>
        
        <div className="space-y-4">
          <div className="flex gap-4">
            <div className="flex-shrink-0 w-10 h-10 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center">
              <Gift className="w-5 h-5 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <h4 className="font-medium text-gray-900 dark:text-gray-100">$2 Signup Bonus</h4>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Get $2 when your referral completes their first trend submission
              </p>
            </div>
          </div>
          
          <div className="flex gap-4">
            <div className="flex-shrink-0 w-10 h-10 bg-blue-100 dark:bg-blue-900/20 rounded-full flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h4 className="font-medium text-gray-900 dark:text-gray-100">10% Earnings Share</h4>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Earn 10% of your referral's earnings for their first 3 months
              </p>
            </div>
          </div>
          
          <div className="flex gap-4">
            <div className="flex-shrink-0 w-10 h-10 bg-purple-100 dark:bg-purple-900/20 rounded-full flex items-center justify-center">
              <Users className="w-5 h-5 text-purple-600 dark:text-purple-400" />
            </div>
            <div>
              <h4 className="font-medium text-gray-900 dark:text-gray-100">Team Bonuses</h4>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Unlock achievement bonuses as your referral network grows
              </p>
            </div>
          </div>
        </div>

        {/* Share Buttons */}
        <div className="mt-6 flex flex-col sm:flex-row gap-3">
          <button
            onClick={shareReferral}
            disabled={sharing}
            className="flex-1 btn-primary flex items-center justify-center gap-2"
          >
            <Share2 className="w-4 h-4" />
            Share Referral Link
          </button>
          <button
            onClick={() => copyToClipboard(stats.referralLink)}
            className="flex-1 btn-secondary flex items-center justify-center gap-2"
          >
            <Copy className="w-4 h-4" />
            Copy Link
          </button>
        </div>
      </div>

      {/* Referrals List */}
      <div className="bg-white dark:bg-neutral-800 rounded-xl border border-gray-200 dark:border-neutral-700">
        <div className="p-6 border-b border-gray-200 dark:border-neutral-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            Your Referrals
          </h3>
        </div>
        
        {referrals.length > 0 ? (
          <div className="divide-y divide-gray-200 dark:divide-neutral-700">
            {referrals.map((referral) => (
              <div key={referral.id} className="p-6 hover:bg-gray-50 dark:hover:bg-neutral-700/50 transition-colors">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-gray-900 dark:text-gray-100">
                      {referral.referred_email || 'Pending Registration'}
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Invited {new Date(referral.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  
                  <div className="text-right">
                    <div className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                      referral.status === 'active' 
                        ? 'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400'
                        : referral.status === 'pending'
                        ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-400'
                        : 'bg-gray-100 text-gray-700 dark:bg-gray-900/20 dark:text-gray-400'
                    }`}>
                      {referral.status.charAt(0).toUpperCase() + referral.status.slice(1)}
                    </div>
                    {referral.total_earnings_paid > 0 && (
                      <p className="text-sm text-green-600 dark:text-green-400 mt-1">
                        +${referral.total_earnings_paid.toFixed(2)} earned
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-12 text-center">
            <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 dark:text-gray-400">
              No referrals yet. Share your link to start earning!
            </p>
          </div>
        )}
      </div>

      {/* Referral Tips */}
      <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-4 border border-blue-200 dark:border-blue-800">
        <h4 className="font-semibold text-blue-900 dark:text-blue-100 mb-2 flex items-center gap-2">
          <DollarSign className="w-5 h-5" />
          Maximize Your Referral Earnings
        </h4>
        <ul className="space-y-1 text-sm text-blue-800 dark:text-blue-200">
          <li>• Share with friends interested in finance and social media</li>
          <li>• Post in relevant online communities and forums</li>
          <li>• Create content showing your WaveSight earnings</li>
          <li>• Help your referrals get started to activate bonuses faster</li>
        </ul>
      </div>
    </div>
  )
}