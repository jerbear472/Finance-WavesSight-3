'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import { CheckCircle2, Clock, Trophy, Zap, Target, TrendingUp } from 'lucide-react'

interface Challenge {
  id: string
  challenge_type: string
  challenge_data: {
    description: string
    category?: string
  }
  difficulty: 'easy' | 'medium' | 'hard'
  progress: number
  target: number
  reward_amount: number
  status: 'active' | 'completed' | 'expired'
  completed_at?: string
}

interface ChallengeCardProps {
  challenge: Challenge
  onProgressUpdate: () => void
}

const ChallengeCard = ({ challenge, onProgressUpdate }: ChallengeCardProps) => {
  const progressPercentage = (challenge.progress / challenge.target) * 100
  const isCompleted = challenge.status === 'completed'
  
  const difficultyColors = {
    easy: 'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400',
    medium: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-400',
    hard: 'bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400'
  }
  
  const difficultyIcons = {
    easy: <Target className="w-4 h-4" />,
    medium: <Zap className="w-4 h-4" />,
    hard: <Trophy className="w-4 h-4" />
  }
  
  return (
    <div className={`relative overflow-hidden rounded-xl border transition-all ${
      isCompleted 
        ? 'bg-green-50 dark:bg-green-900/10 border-green-200 dark:border-green-800' 
        : 'bg-white dark:bg-neutral-800 border-gray-200 dark:border-neutral-700'
    }`}>
      {/* Progress Bar Background */}
      <div 
        className={`absolute inset-0 transition-all duration-500 ${
          isCompleted ? 'bg-green-100 dark:bg-green-900/20' : 'bg-blue-50 dark:bg-blue-900/10'
        }`}
        style={{ width: `${progressPercentage}%` }}
      />
      
      <div className="relative p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${difficultyColors[challenge.difficulty]}`}>
                {difficultyIcons[challenge.difficulty]}
                {challenge.difficulty.charAt(0).toUpperCase() + challenge.difficulty.slice(1)}
              </span>
              <span className="text-lg font-bold text-green-600 dark:text-green-400">
                ${challenge.reward_amount.toFixed(2)}
              </span>
            </div>
            
            <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-1">
              {challenge.challenge_data.description}
            </h3>
            
            {challenge.challenge_data.category && (
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Category: {challenge.challenge_data.category}
              </p>
            )}
          </div>
          
          {isCompleted && (
            <CheckCircle2 className="w-6 h-6 text-green-500 flex-shrink-0" />
          )}
        </div>
        
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-gray-600 dark:text-gray-400">Progress</span>
            <span className="font-medium">
              {challenge.progress}/{challenge.target}
            </span>
          </div>
          
          <div className="w-full bg-gray-200 dark:bg-neutral-700 rounded-full h-2">
            <div 
              className={`h-full rounded-full transition-all duration-500 ${
                isCompleted 
                  ? 'bg-green-500' 
                  : progressPercentage >= 50 
                    ? 'bg-blue-500' 
                    : 'bg-gray-400'
              }`}
              style={{ width: `${Math.min(progressPercentage, 100)}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  )
}

export default function DailyChallenges() {
  const { user } = useAuth()
  const [challenges, setChallenges] = useState<Challenge[]>([])
  const [loading, setLoading] = useState(true)
  const [totalRewards, setTotalRewards] = useState(0)
  const [completedCount, setCompletedCount] = useState(0)

  const fetchChallenges = async () => {
    if (!user) return

    try {
      const { data, error } = await supabase
        .from('daily_challenges')
        .select('*')
        .eq('user_id', user.id)
        .eq('challenge_date', new Date().toISOString().split('T')[0])
        .order('difficulty', { ascending: true })

      if (error) throw error
      
      const challengesData = data || []
      setChallenges(challengesData)
      
      // Calculate totals
      const completed = challengesData.filter(c => c.status === 'completed')
      setCompletedCount(completed.length)
      setTotalRewards(completed.reduce((sum, c) => sum + c.reward_amount, 0))
    } catch (error) {
      console.error('Error fetching challenges:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchChallenges()
    
    // Set up real-time subscription
    const subscription = supabase
      .channel('daily_challenges_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'daily_challenges',
          filter: `user_id=eq.${user?.id}`
        },
        fetchChallenges
      )
      .subscribe()

    return () => {
      subscription.unsubscribe()
    }
  }, [user])

  if (loading) {
    return (
      <div className="animate-pulse space-y-4">
        <div className="h-32 bg-gray-200 dark:bg-neutral-700 rounded-xl" />
        <div className="h-32 bg-gray-200 dark:bg-neutral-700 rounded-xl" />
      </div>
    )
  }

  if (challenges.length === 0) {
    return (
      <div className="text-center py-12 bg-gray-50 dark:bg-neutral-800 rounded-xl">
        <Clock className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
          No Challenges Today
        </h3>
        <p className="text-gray-600 dark:text-gray-400">
          Check back tomorrow for new challenges!
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Summary Card */}
      <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold mb-1">Daily Challenges</h2>
            <p className="opacity-90">
              Complete challenges to earn extra rewards!
            </p>
          </div>
          <div className="text-right">
            <div className="text-3xl font-bold">${totalRewards.toFixed(2)}</div>
            <div className="text-sm opacity-90">
              {completedCount}/{challenges.length} completed
            </div>
          </div>
        </div>
        
        {/* Streak indicator */}
        <div className="mt-4 flex items-center gap-2">
          <TrendingUp className="w-5 h-5" />
          <span className="text-sm">
            Keep completing challenges to build your streak!
          </span>
        </div>
      </div>

      {/* Challenge Cards */}
      <div className="grid gap-4">
        {challenges.map((challenge) => (
          <ChallengeCard
            key={challenge.id}
            challenge={challenge}
            onProgressUpdate={fetchChallenges}
          />
        ))}
      </div>

      {/* Tips */}
      <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-4 border border-blue-200 dark:border-blue-800">
        <h4 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">
          💡 Pro Tips
        </h4>
        <ul className="space-y-1 text-sm text-blue-800 dark:text-blue-200">
          <li>• Complete all daily challenges to maximize earnings</li>
          <li>• Higher difficulty challenges offer better rewards</li>
          <li>• Challenges reset daily at midnight EST</li>
          <li>• Elite tier users get access to more challenges</li>
        </ul>
      </div>
    </div>
  )
}