'use client'

import React, { useState } from 'react'
import SpotterDashboard from '@/components/spotter/SpotterDashboard'
import SpotterSubmissionForm from '@/components/spotter/SpotterSubmissionForm'
import { Eye, PlusCircle, BarChart3 } from 'lucide-react'

export default function SpotterPage() {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'submit'>('dashboard')

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <h1 className="text-xl font-semibold">Alpha Spotter Portal</h1>
            
            {/* Tab Navigation */}
            <div className="flex gap-1 bg-gray-100 p-1 rounded-lg">
              <button
                onClick={() => setActiveTab('dashboard')}
                className={`px-4 py-2 rounded-md flex items-center gap-2 transition-all ${
                  activeTab === 'dashboard'
                    ? 'bg-white text-blue-600 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <BarChart3 className="w-4 h-4" />
                Dashboard
              </button>
              <button
                onClick={() => setActiveTab('submit')}
                className={`px-4 py-2 rounded-md flex items-center gap-2 transition-all ${
                  activeTab === 'submit'
                    ? 'bg-white text-blue-600 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <PlusCircle className="w-4 h-4" />
                Submit Signal
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="py-6">
        {activeTab === 'dashboard' ? (
          <SpotterDashboard />
        ) : (
          <SpotterSubmissionForm />
        )}
      </div>
    </div>
  )
}