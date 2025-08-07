'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import { Trophy, Lock, Star, Zap, Target, TrendingUp, Award, Medal } from 'lucide-react'

interface Achievement {
  id: string
  name: string
  description: string
  tier: 'bronze' | 'silver' | 'gold' | 'platinum'
  icon: string
  unlocked: boolean
  unlockedAt?: string
  progress?: number
  target?: number
  reward?: {
    type: 'multiplier' | 'bonus' | 'badge' | 'unlock'
    value: number | string
  }
}

const achievementDefinitions: Achievement[] = [
  // Submission Achievements
  {
    id: 'first_trend',
    name: 'First Steps',
    description: 'Submit your first trend',
    tier: 'bronze',
    icon: '🎯',
    unlocked: false,
    target: 1,
    reward: { type: 'bonus', value: 0.50 }
  },
  {
    id: 'trend_10',
    name: 'Trend Hunter',
    description: 'Submit 10 approved trends',
    tier: 'bronze',
    icon: '🔍',
    unlocked: false,
    target: 10,
    reward: { type: 'bonus', value: 2.00 }
  },
  {
    id: 'trend_100',
    name: 'Trend Master',
    description: 'Submit 100 approved trends',
    tier: 'silver',
    icon: '👑',
    unlocked: false,
    target: 100,
    reward: { type: 'multiplier', value: 0.1 }
  },
  {
    id: 'trend_1000',
    name: 'Trend Legend',
    description: 'Submit 1000 approved trends',
    tier: 'gold',
    icon: '🏆',
    unlocked: false,
    target: 1000,
    reward: { type: 'multiplier', value: 0.2 }
  },
  
  // Quality Achievements
  {
    id: 'quality_streak_5',
    name: 'Quality Focused',
    description: '5 trends in a row with 80%+ quality',
    tier: 'bronze',
    icon: '⭐',
    unlocked: false,
    target: 5,
    reward: { type: 'bonus', value: 1.00 }
  },
  {
    id: 'perfect_trend',
    name: 'Perfectionist',
    description: 'Submit a trend with 100% quality score',
    tier: 'silver',
    icon: '💎',
    unlocked: false,
    reward: { type: 'badge', value: '💎' }
  },
  
  // Viral Achievements
  {
    id: 'first_viral',
    name: 'Viral Hunter',
    description: 'Have a trend go viral',
    tier: 'silver',
    icon: '🦠',
    unlocked: false,
    reward: { type: 'bonus', value: 5.00 }
  },
  {
    id: 'viral_5',
    name: 'Viral Expert',
    description: '5 trends go viral',
    tier: 'gold',
    icon: '🚀',
    unlocked: false,
    target: 5,
    reward: { type: 'multiplier', value: 0.15 }
  },
  
  // Market Move Achievements
  {
    id: 'market_mover',
    name: 'Market Mover',
    description: 'Spot a trend that moves markets 2%+',
    tier: 'gold',
    icon: '📈',
    unlocked: false,
    reward: { type: 'bonus', value: 25.00 }
  },
  {
    id: 'market_prophet',
    name: 'Market Prophet',
    description: '5 trends that move markets',
    tier: 'platinum',
    icon: '🔮',
    unlocked: false,
    target: 5,
    reward: { type: 'multiplier', value: 0.3 }
  },
  
  // Category Expertise
  {
    id: 'crypto_expert',
    name: 'Crypto Expert',
    description: 'Submit 50 crypto trends',
    tier: 'silver',
    icon: '₿',
    unlocked: false,
    target: 50,
    reward: { type: 'multiplier', value: 0.1 }
  },
  {
    id: 'category_master',
    name: 'Category Master',
    description: 'Reach expert level in 3 categories',
    tier: 'gold',
    icon: '🎓',
    unlocked: false,
    target: 3,
    reward: { type: 'multiplier', value: 0.2 }
  },
  
  // Engagement Achievements
  {
    id: 'daily_warrior',
    name: 'Daily Warrior',
    description: 'Complete all daily challenges for 7 days',
    tier: 'silver',
    icon: '⚔️',
    unlocked: false,
    target: 7,
    reward: { type: 'bonus', value: 10.00 }
  },
  {
    id: 'streak_30',
    name: 'Unstoppable',
    description: 'Maintain a 30-day activity streak',
    tier: 'gold',
    icon: '🔥',
    unlocked: false,
    target: 30,
    reward: { type: 'multiplier', value: 0.25 }
  },
  
  // Referral Achievements
  {
    id: 'first_referral',
    name: 'Recruiter',
    description: 'Refer your first active user',
    tier: 'bronze',
    icon: '🤝',
    unlocked: false,
    reward: { type: 'bonus', value: 5.00 }
  },
  {
    id: 'team_builder',
    name: 'Team Builder',
    description: 'Refer 10 active users',
    tier: 'gold',
    icon: '👥',
    unlocked: false,
    target: 10,
    reward: { type: 'multiplier', value: 0.2 }
  }
]

const tierColors = {
  bronze: 'from-orange-400 to-orange-600',
  silver: 'from-gray-400 to-gray-600',
  gold: 'from-yellow-400 to-yellow-600',
  platinum: 'from-purple-400 to-purple-600'
}

const tierBorders = {
  bronze: 'border-orange-300 dark:border-orange-700',
  silver: 'border-gray-300 dark:border-gray-700',
  gold: 'border-yellow-300 dark:border-yellow-700',
  platinum: 'border-purple-300 dark:border-purple-700'
}

export default function AchievementSystem() {
  const { user } = useAuth()
  const [achievements, setAchievements] = useState<Achievement[]>(achievementDefinitions)
  const [loading, setLoading] = useState(true)
  const [totalPoints, setTotalPoints] = useState(0)
  const [unlockedCount, setUnlockedCount] = useState(0)

  const fetchUserAchievements = async () => {
    if (!user) return

    try {
      const { data, error } = await supabase
        .from('user_achievements')
        .select('*')
        .eq('user_id', user.id)

      if (error) throw error

      // Merge unlocked achievements with definitions
      const unlockedIds = new Set(data?.map(a => a.achievement_id) || [])
      const merged = achievementDefinitions.map(def => ({
        ...def,
        unlocked: unlockedIds.has(def.id),
        unlockedAt: data?.find(a => a.achievement_id === def.id)?.unlocked_at
      }))

      setAchievements(merged)
      setUnlockedCount(merged.filter(a => a.unlocked).length)
      
      // Calculate total points (each achievement worth points based on tier)
      const points = merged.reduce((total, achievement) => {
        if (!achievement.unlocked) return total
        const tierPoints = { bronze: 10, silver: 25, gold: 50, platinum: 100 }
        return total + (tierPoints[achievement.tier] || 0)
      }, 0)
      setTotalPoints(points)

    } catch (error) {
      console.error('Error fetching achievements:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchUserAchievements()
  }, [user])

  const groupedAchievements = achievements.reduce((acc, achievement) => {
    const category = achievement.id.split('_')[0]
    if (!acc[category]) acc[category] = []
    acc[category].push(achievement)
    return acc
  }, {} as Record<string, Achievement[]>)

  const categoryNames = {
    first: 'Getting Started',
    trend: 'Trend Submissions',
    quality: 'Quality Standards',
    viral: 'Viral Trends',
    market: 'Market Impact',
    crypto: 'Category Expertise',
    category: 'Category Mastery',
    daily: 'Daily Challenges',
    streak: 'Consistency',
    team: 'Community Building'
  }

  if (loading) {
    return (
      <div className="animate-pulse space-y-4">
        <div className="h-32 bg-gray-200 dark:bg-neutral-700 rounded-xl" />
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-40 bg-gray-200 dark:bg-neutral-700 rounded-xl" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Achievement Summary */}
      <div className="bg-gradient-to-r from-purple-500 to-pink-600 rounded-xl p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold mb-1">Achievements</h2>
            <p className="opacity-90">
              Unlock achievements to earn rewards and multipliers!
            </p>
          </div>
          <div className="text-right">
            <div className="text-3xl font-bold">{totalPoints}</div>
            <div className="text-sm opacity-90">Achievement Points</div>
          </div>
        </div>
        
        <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold">{unlockedCount}</div>
            <div className="text-xs opacity-90">Unlocked</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold">{achievements.length - unlockedCount}</div>
            <div className="text-xs opacity-90">Locked</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold">
              {Math.round((unlockedCount / achievements.length) * 100)}%
            </div>
            <div className="text-xs opacity-90">Complete</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold">
              {achievements.filter(a => a.unlocked && a.tier === 'gold').length}
            </div>
            <div className="text-xs opacity-90">Gold+</div>
          </div>
        </div>
      </div>

      {/* Achievement Categories */}
      {Object.entries(groupedAchievements).map(([category, categoryAchievements]) => (
        <div key={category} className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            {categoryNames[category as keyof typeof categoryNames] || category}
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {categoryAchievements.map((achievement) => (
              <div
                key={achievement.id}
                className={`relative overflow-hidden rounded-xl border-2 transition-all ${
                  achievement.unlocked
                    ? `${tierBorders[achievement.tier]} bg-gradient-to-br ${tierColors[achievement.tier]} bg-opacity-10`
                    : 'border-gray-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 opacity-75'
                }`}
              >
                <div className="p-6">
                  <div className="flex items-start justify-between mb-3">
                    <div className="text-4xl">{achievement.icon}</div>
                    {achievement.unlocked ? (
                      <Trophy className={`w-6 h-6 text-${achievement.tier === 'gold' ? 'yellow' : achievement.tier}-500`} />
                    ) : (
                      <Lock className="w-5 h-5 text-gray-400" />
                    )}
                  </div>
                  
                  <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-1">
                    {achievement.name}
                  </h4>
                  
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                    {achievement.description}
                  </p>
                  
                  {/* Progress Bar */}
                  {achievement.target && !achievement.unlocked && (
                    <div className="mb-3">
                      <div className="flex justify-between text-xs text-gray-500 mb-1">
                        <span>Progress</span>
                        <span>{achievement.progress || 0}/{achievement.target}</span>
                      </div>
                      <div className="w-full bg-gray-200 dark:bg-neutral-700 rounded-full h-2">
                        <div 
                          className="h-full bg-gradient-to-r from-blue-500 to-purple-500 rounded-full"
                          style={{ width: `${((achievement.progress || 0) / achievement.target) * 100}%` }}
                        />
                      </div>
                    </div>
                  )}
                  
                  {/* Reward */}
                  {achievement.reward && (
                    <div className={`text-sm ${achievement.unlocked ? 'text-green-600 dark:text-green-400' : 'text-gray-500'}`}>
                      <span className="font-medium">Reward:</span>{' '}
                      {achievement.reward.type === 'bonus' && `$${achievement.reward.value} bonus`}
                      {achievement.reward.type === 'multiplier' && `+${(achievement.reward.value as number * 100).toFixed(0)}% earnings`}
                      {achievement.reward.type === 'badge' && `${achievement.reward.value} badge`}
                      {achievement.reward.type === 'unlock' && achievement.reward.value}
                    </div>
                  )}
                  
                  {/* Unlock Date */}
                  {achievement.unlocked && achievement.unlockedAt && (
                    <div className="text-xs text-gray-500 mt-2">
                      Unlocked {new Date(achievement.unlockedAt).toLocaleDateString()}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}