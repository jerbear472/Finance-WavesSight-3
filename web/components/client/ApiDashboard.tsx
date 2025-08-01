'use client'

import React, { useState, useEffect } from 'react'
import { useSupabase } from '@/contexts/AuthContext'
import { ClientSubscription } from '@/types/financial-intelligence'
import { 
  Key, Code, Activity, Clock, Shield, Copy, 
  CheckCircle, RefreshCw, Terminal, Globe 
} from 'lucide-react'

export default function ApiDashboard() {
  const { supabase, user } = useSupabase()
  const [loading, setLoading] = useState(true)
  const [subscription, setSubscription] = useState<ClientSubscription | null>(null)
  const [apiUsage, setApiUsage] = useState({
    today: 0,
    thisMonth: 0,
    limit: 0,
    lastRequest: null as Date | null
  })
  const [copied, setCopied] = useState(false)
  const [regenerating, setRegenerating] = useState(false)

  useEffect(() => {
    loadApiData()
  }, [user])

  const loadApiData = async () => {
    try {
      // Get subscription
      const { data: sub, error } = await supabase
        .from('client_subscriptions')
        .select('*')
        .eq('organization_id', user?.id)
        .single()

      if (error) throw error
      setSubscription(sub)

      // Get API usage stats
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      
      const { data: usage } = await supabase
        .from('api_usage')
        .select('*')
        .eq('client_id', sub?.id)
        .gte('request_timestamp', today.toISOString())

      const monthStart = new Date(today.getFullYear(), today.getMonth(), 1)
      const { data: monthUsage } = await supabase
        .from('api_usage')
        .select('*')
        .eq('client_id', sub?.id)
        .gte('request_timestamp', monthStart.toISOString())

      setApiUsage({
        today: usage?.length || 0,
        thisMonth: monthUsage?.length || 0,
        limit: sub?.rateLimit || 1000,
        lastRequest: usage?.length ? new Date(usage[0].request_timestamp) : null
      })

    } catch (error) {
      console.error('Error loading API data:', error)
    } finally {
      setLoading(false)
    }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const regenerateApiKey = async () => {
    setRegenerating(true)
    try {
      const newApiKey = crypto.randomUUID()
      const { error } = await supabase
        .from('client_subscriptions')
        .update({ api_key: newApiKey })
        .eq('id', subscription?.id)

      if (error) throw error
      
      setSubscription({ ...subscription!, apiKey: newApiKey })
    } catch (error) {
      console.error('Error regenerating API key:', error)
    } finally {
      setRegenerating(false)
    }
  }

  if (loading) {
    return <div className="p-8 text-center">Loading API dashboard...</div>
  }

  const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'https://api.wavesight.finance'

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow p-6">
        <h1 className="text-2xl font-bold mb-2">API Access</h1>
        <p className="text-gray-600">
          Integrate real-time alpha signals into your trading systems
        </p>
      </div>

      {/* API Credentials */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Key className="w-5 h-5" />
          API Credentials
        </h2>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">API Key</label>
            <div className="flex items-center gap-2">
              <code className="flex-1 p-3 bg-gray-100 rounded font-mono text-sm">
                {subscription?.apiKey || 'No API key generated'}
              </code>
              <button
                onClick={() => copyToClipboard(subscription?.apiKey || '')}
                className="p-3 bg-gray-200 rounded hover:bg-gray-300"
              >
                {copied ? <CheckCircle className="w-5 h-5 text-green-600" /> : <Copy className="w-5 h-5" />}
              </button>
              <button
                onClick={regenerateApiKey}
                disabled={regenerating}
                className="p-3 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
              >
                <RefreshCw className={`w-5 h-5 ${regenerating ? 'animate-spin' : ''}`} />
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Endpoint</label>
            <code className="block p-3 bg-gray-100 rounded font-mono text-sm">
              {baseUrl}/v1/signals
            </code>
          </div>
        </div>
      </div>

      {/* Usage Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Requests Today</p>
              <p className="text-2xl font-bold">{apiUsage.today}</p>
            </div>
            <Activity className="w-8 h-8 text-blue-500" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">This Month</p>
              <p className="text-2xl font-bold">
                {apiUsage.thisMonth} / {apiUsage.limit}
              </p>
            </div>
            <Clock className="w-8 h-8 text-green-500" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Last Request</p>
              <p className="text-sm font-medium">
                {apiUsage.lastRequest ? apiUsage.lastRequest.toLocaleString() : 'Never'}
              </p>
            </div>
            <Globe className="w-8 h-8 text-purple-500" />
          </div>
        </div>
      </div>

      {/* Code Examples */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Code className="w-5 h-5" />
          Quick Start
        </h2>

        <div className="space-y-6">
          {/* cURL Example */}
          <div>
            <h3 className="font-medium mb-2">cURL</h3>
            <pre className="p-4 bg-gray-900 text-gray-100 rounded-lg overflow-x-auto text-sm">
{`curl -X GET "${baseUrl}/v1/signals" \\
  -H "Authorization: Bearer ${subscription?.apiKey || 'YOUR_API_KEY'}" \\
  -H "Content-Type: application/json"`}
            </pre>
          </div>

          {/* Python Example */}
          <div>
            <h3 className="font-medium mb-2">Python</h3>
            <pre className="p-4 bg-gray-900 text-gray-100 rounded-lg overflow-x-auto text-sm">
{`import requests

api_key = "${subscription?.apiKey || 'YOUR_API_KEY'}"
url = "${baseUrl}/v1/signals"

headers = {
    "Authorization": f"Bearer {api_key}",
    "Content-Type": "application/json"
}

params = {
    "min_alpha_score": 70,
    "limit": 50
}

response = requests.get(url, headers=headers, params=params)
signals = response.json()`}
            </pre>
          </div>

          {/* JavaScript Example */}
          <div>
            <h3 className="font-medium mb-2">JavaScript</h3>
            <pre className="p-4 bg-gray-900 text-gray-100 rounded-lg overflow-x-auto text-sm">
{`const apiKey = '${subscription?.apiKey || 'YOUR_API_KEY'}';
const url = '${baseUrl}/v1/signals';

const response = await fetch(url + '?min_alpha_score=70&limit=50', {
  headers: {
    'Authorization': \`Bearer \${apiKey}\`,
    'Content-Type': 'application/json'
  }
});

const signals = await response.json();`}
            </pre>
          </div>
        </div>
      </div>

      {/* API Documentation */}
      <div className="bg-blue-50 rounded-lg p-6">
        <h3 className="font-semibold mb-3 flex items-center gap-2">
          <Terminal className="w-5 h-5" />
          API Documentation
        </h3>
        <div className="space-y-4 text-sm">
          <div>
            <h4 className="font-medium mb-1">Available Endpoints</h4>
            <ul className="space-y-1 text-gray-700">
              <li>• GET /v1/signals - Retrieve alpha signals</li>
              <li>• GET /v1/signals/:id - Get specific signal details</li>
              <li>• GET /v1/metrics - Get aggregated metrics</li>
              <li>• POST /v1/webhooks - Configure webhook notifications</li>
            </ul>
          </div>
          
          <div>
            <h4 className="font-medium mb-1">Query Parameters</h4>
            <ul className="space-y-1 text-gray-700">
              <li>• min_alpha_score (number): Minimum AlphaScore filter</li>
              <li>• platforms (array): Filter by platforms</li>
              <li>• asset_types (array): Filter by asset types</li>
              <li>• sentiment (string): Filter by market sentiment</li>
              <li>• limit (number): Maximum results to return</li>
              <li>• offset (number): Pagination offset</li>
            </ul>
          </div>

          <div>
            <h4 className="font-medium mb-1">Rate Limits</h4>
            <p className="text-gray-700">
              Your plan allows {subscription?.rateLimit || 1000} requests per month.
              Rate limits reset on the 1st of each month at 00:00 UTC.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}