'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import FinanceTrendSubmissionForm from '@/components/FinanceTrendSubmissionForm';
import { TrendingUp, DollarSign, Target, Zap } from 'lucide-react';

export default function FinanceSubmitPage() {
  const router = useRouter();
  const { user } = useAuth();
  const { showSuccess, showError } = useToast();
  const [showForm, setShowForm] = useState(false);
  const [showQuickSubmit, setShowQuickSubmit] = useState(false);

  // Mock data - replace with real data from API
  const todayEarnings = 12.50;
  const pendingTrends = 3;

  const handleSubmit = async (data: any) => {
    try {
      const response = await fetch('/api/finance-trends', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });

      if (!response.ok) throw new Error('Failed to submit');
      
      const result = await response.json();
      showSuccess('Trend Submitted!', `Estimated payout: $${result.trend.calculated_payout.toFixed(2)}`);
      
      // Redirect to success page or dashboard
      setTimeout(() => {
        router.push('/dashboard');
      }, 2000);
    } catch (error) {
      showError('Submission Failed', 'Please try again');
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-white mb-4">Please login to submit trends</h2>
          <button 
            onClick={() => router.push('/login')}
            className="px-6 py-3 bg-gradient-to-r from-wave-500 to-wave-600 rounded-xl"
          >
            Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen relative">
      {/* Floating Action Button */}
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        className="fixed bottom-6 right-6 z-40"
      >
        <button
          onClick={() => setShowForm(true)}
          className="group relative bg-gradient-to-r from-green-500 to-green-600 rounded-full p-4 shadow-lg hover:shadow-xl transition-all"
        >
          <Target className="w-6 h-6 text-white" />
          
          {/* Earnings badge */}
          <div className="absolute -top-2 -right-2 bg-wave-900 border border-wave-600 rounded-full px-2 py-1 text-xs">
            <span className="text-green-400 font-medium">${todayEarnings.toFixed(2)}</span>
          </div>
          
          {/* Pending badge */}
          {pendingTrends > 0 && (
            <div className="absolute -bottom-2 -left-2 bg-orange-500 rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold text-white">
              {pendingTrends}
            </div>
          )}
          
          {/* Tooltip */}
          <div className="absolute bottom-full right-0 mb-2 px-3 py-1 bg-wave-800 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
            <span className="text-sm text-wave-200">Spot Trend</span>
          </div>
        </button>
      </motion.div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-white mb-4 flex items-center justify-center gap-3">
              <TrendingUp className="w-10 h-10 text-wave-500" />
              Financial Trend Spotting
            </h1>
            <p className="text-xl text-wave-300">
              Spot market-moving trends before they hit mainstream
            </p>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
            <motion.div
              whileHover={{ scale: 1.05 }}
              className="wave-card p-6 text-center"
            >
              <DollarSign className="w-8 h-8 text-green-400 mx-auto mb-2" />
              <div className="text-2xl font-bold text-white">${todayEarnings.toFixed(2)}</div>
              <div className="text-sm text-wave-400">Earned Today</div>
            </motion.div>

            <motion.div
              whileHover={{ scale: 1.05 }}
              className="wave-card p-6 text-center cursor-pointer"
              onClick={() => router.push('/verify')}
            >
              <Target className="w-8 h-8 text-orange-400 mx-auto mb-2" />
              <div className="text-2xl font-bold text-white">{pendingTrends}</div>
              <div className="text-sm text-wave-400">Pending Verification</div>
            </motion.div>

            <motion.div
              whileHover={{ scale: 1.05 }}
              className="wave-card p-6 text-center"
            >
              <Zap className="w-8 h-8 text-yellow-400 mx-auto mb-2" />
              <div className="text-2xl font-bold text-white">87%</div>
              <div className="text-sm text-wave-400">Accuracy Rate</div>
            </motion.div>
          </div>

          {/* Submit Options */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Quick Submit */}
            <motion.div
              whileHover={{ scale: 1.02 }}
              className="wave-card p-8 cursor-pointer"
              onClick={() => setShowQuickSubmit(true)}
            >
              <div className="text-center">
                <Zap className="w-12 h-12 text-yellow-400 mx-auto mb-4" />
                <h3 className="text-xl font-bold text-white mb-2">Quick Submit</h3>
                <p className="text-wave-300 mb-4">
                  Fast track submission for $0.25
                </p>
                <div className="text-sm text-wave-400">
                  Platform → Link → Signal → Submit
                </div>
              </div>
            </motion.div>

            {/* Full Submit */}
            <motion.div
              whileHover={{ scale: 1.02 }}
              className="wave-card p-8 cursor-pointer border-2 border-wave-500"
              onClick={() => setShowForm(true)}
            >
              <div className="text-center">
                <TrendingUp className="w-12 h-12 text-green-400 mx-auto mb-4" />
                <h3 className="text-xl font-bold text-white mb-2">Full Submission</h3>
                <p className="text-wave-300 mb-4">
                  Detailed form for up to $7.00+
                </p>
                <div className="text-sm text-wave-400">
                  Complete analysis with bonus opportunities
                </div>
              </div>
            </motion.div>
          </div>

          {/* Recent Submissions Preview */}
          <div className="mt-12">
            <h3 className="text-xl font-bold text-white mb-6">Your Recent Submissions</h3>
            <div className="space-y-4">
              {/* Mock recent submissions */}
              <div className="wave-card p-4 flex items-center justify-between">
                <div>
                  <h4 className="font-medium text-white">Tesla Cybertruck delivery surge</h4>
                  <p className="text-sm text-wave-400">TikTok • 2 hours ago</p>
                </div>
                <div className="text-right">
                  <div className="text-green-400 font-medium">$2.35</div>
                  <div className="text-xs text-orange-400">Pending</div>
                </div>
              </div>
              
              <div className="wave-card p-4 flex items-center justify-between">
                <div>
                  <h4 className="font-medium text-white">Solana DeFi protocols trending</h4>
                  <p className="text-sm text-wave-400">Twitter/X • 5 hours ago</p>
                </div>
                <div className="text-right">
                  <div className="text-green-400 font-medium">$3.75</div>
                  <div className="text-xs text-green-400">Approved</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Full Form Modal */}
      {showForm && (
        <FinanceTrendSubmissionForm
          onClose={() => setShowForm(false)}
          onSubmit={handleSubmit}
        />
      )}

      {/* Quick Submit Modal */}
      {showQuickSubmit && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50"
        >
          <motion.div
            initial={{ scale: 0.9 }}
            animate={{ scale: 1 }}
            className="wave-card p-6 max-w-md w-full"
          >
            <h3 className="text-xl font-bold text-white mb-4">Quick Submit</h3>
            <p className="text-wave-300 mb-6">
              Quick submission for immediate $0.25 payout
            </p>
            {/* Add quick submit form here */}
            <button
              onClick={() => setShowQuickSubmit(false)}
              className="w-full px-4 py-2 bg-wave-800/50 rounded-xl hover:bg-wave-700/50 transition-all"
            >
              Close
            </button>
          </motion.div>
        </motion.div>
      )}
    </div>
  );
}