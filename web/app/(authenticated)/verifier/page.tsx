'use client'

import React, { useState } from 'react'
import VerifierDashboard from '@/components/verifier/VerifierDashboard'
import VerificationFeed from '@/components/verifier/VerificationFeed'
import { CheckSquare, BarChart3 } from 'lucide-react'

export default function VerifierPage() {
  const [activeTab, setActiveTab] = useState<'verify' | 'dashboard'>('verify')

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <h1 className="text-xl font-semibold">Signal Verification Portal</h1>
            
            {/* Tab Navigation */}
            <div className="flex gap-1 bg-gray-100 p-1 rounded-lg">
              <button
                onClick={() => setActiveTab('verify')}
                className={`px-4 py-2 rounded-md flex items-center gap-2 transition-all ${
                  activeTab === 'verify'
                    ? 'bg-white text-blue-600 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <CheckSquare className="w-4 h-4" />
                Verify Signals
              </button>
              <button
                onClick={() => setActiveTab('dashboard')}
                className={`px-4 py-2 rounded-md flex items-center gap-2 transition-all ${
                  activeTab === 'dashboard'
                    ? 'bg-white text-blue-600 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <BarChart3 className="w-4 h-4" />
                My Performance
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="py-6">
        {activeTab === 'verify' ? (
          <VerificationFeed />
        ) : (
          <VerifierDashboard />
        )}
      </div>
    </div>
  )
}