'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import { Upload, FileText, AlertCircle, CheckCircle, XCircle, Loader, Download, Zap } from 'lucide-react'
import { toast } from 'react-hot-toast'

interface BulkTrendItem {
  url: string
  ticker?: string
  category: string
  description: string
  platform?: string
}

interface ParsedTrend extends BulkTrendItem {
  status?: 'pending' | 'success' | 'error'
  error?: string
  estimatedPayout?: number
}

const TEMPLATE_CSV = `url,ticker,category,description,platform
https://tiktok.com/@user/video/123,TSLA,meme_stocks,Tesla Cybertruck viral dance trend,tiktok
https://twitter.com/user/status/456,BTC,crypto,Bitcoin price prediction thread going viral,twitter
https://reddit.com/r/wallstreetbets/post,GME,meme_stocks,New DD on GameStop squeeze potential,reddit`

export default function BulkTrendSubmission() {
  const { user } = useAuth()
  const [file, setFile] = useState<File | null>(null)
  const [trends, setTrends] = useState<ParsedTrend[]>([])
  const [uploading, setUploading] = useState(false)
  const [processing, setProcessing] = useState(false)
  const [bulkSubmissionId, setBulkSubmissionId] = useState<string | null>(null)
  const [stats, setStats] = useState({
    total: 0,
    successful: 0,
    failed: 0,
    estimatedEarnings: 0
  })

  const downloadTemplate = () => {
    const blob = new Blob([TEMPLATE_CSV], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'wavesight_bulk_template.csv'
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    window.URL.revokeObjectURL(url)
  }

  const parseCSV = (content: string): ParsedTrend[] => {
    const lines = content.trim().split('\n')
    const headers = lines[0].toLowerCase().split(',')
    
    return lines.slice(1).map((line, index) => {
      const values = line.split(',').map(v => v.trim())
      const trend: ParsedTrend = {
        url: '',
        category: 'other',
        description: '',
        status: 'pending'
      }
      
      headers.forEach((header, i) => {
        if (values[i]) {
          trend[header as keyof BulkTrendItem] = values[i]
        }
      })
      
      // Validate required fields
      if (!trend.url || !trend.description) {
        trend.status = 'error'
        trend.error = 'Missing required fields'
      }
      
      // Estimate payout (simplified)
      trend.estimatedPayout = 0.10 // Base rate
      
      return trend
    })
  }

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (!selectedFile) return
    
    if (!selectedFile.name.endsWith('.csv')) {
      toast.error('Please upload a CSV file')
      return
    }
    
    setFile(selectedFile)
    setUploading(true)
    
    try {
      const content = await selectedFile.text()
      const parsed = parseCSV(content)
      
      if (parsed.length === 0) {
        toast.error('No valid trends found in the file')
        return
      }
      
      if (parsed.length > 100) {
        toast.error('Maximum 100 trends per bulk submission')
        return
      }
      
      setTrends(parsed)
      setStats({
        total: parsed.length,
        successful: 0,
        failed: parsed.filter(t => t.status === 'error').length,
        estimatedEarnings: parsed.reduce((sum, t) => sum + (t.estimatedPayout || 0), 0)
      })
      
      toast.success(`Loaded ${parsed.length} trends from CSV`)
    } catch (error) {
      console.error('Error parsing CSV:', error)
      toast.error('Error parsing CSV file')
    } finally {
      setUploading(false)
    }
  }

  const processBulkSubmission = async () => {
    if (!user || trends.length === 0) return
    
    setProcessing(true)
    
    try {
      // Create bulk submission record
      const { data: bulkData, error: bulkError } = await supabase
        .from('bulk_submissions')
        .insert({
          user_id: user.id,
          total_trends: trends.filter(t => t.status !== 'error').length,
          status: 'processing'
        })
        .select()
        .single()
      
      if (bulkError) throw bulkError
      
      setBulkSubmissionId(bulkData.id)
      
      // Process each trend
      let successCount = 0
      let failCount = 0
      let totalEarnings = 0
      
      for (let i = 0; i < trends.length; i++) {
        const trend = trends[i]
        if (trend.status === 'error') continue
        
        try {
          // Submit trend
          const { data: trendData, error: trendError } = await supabase
            .from('trend_submissions')
            .insert({
              spotter_id: user.id,
              url: trend.url,
              ticker_symbol: trend.ticker,
              category: trend.category,
              explanation: trend.description,
              platform: trend.platform || 'unknown',
              bulk_submission_id: bulkData.id,
              submission_method: 'bulk',
              quality_score: 0.7, // Default for bulk
              status: 'submitted'
            })
            .select()
            .single()
          
          if (trendError) throw trendError
          
          // Update trend status
          const updatedTrends = [...trends]
          updatedTrends[i] = {
            ...trend,
            status: 'success',
            estimatedPayout: 0.10
          }
          setTrends(updatedTrends)
          
          successCount++
          totalEarnings += 0.10
          
          // Record earnings
          await supabase
            .from('earnings_ledger')
            .insert({
              user_id: user.id,
              trend_id: trendData.id,
              type: 'trend_submission',
              amount: 0.10,
              description: 'Bulk trend submission',
              earning_category: 'submission',
              quality_multiplier: 0.7
            })
          
        } catch (error) {
          console.error('Error submitting trend:', error)
          const updatedTrends = [...trends]
          updatedTrends[i] = {
            ...trend,
            status: 'error',
            error: 'Submission failed'
          }
          setTrends(updatedTrends)
          failCount++
        }
        
        // Update stats
        setStats({
          total: trends.length,
          successful: successCount,
          failed: failCount + stats.failed,
          estimatedEarnings: totalEarnings
        })
      }
      
      // Update bulk submission status
      await supabase
        .from('bulk_submissions')
        .update({
          processed_trends: successCount + failCount,
          successful_trends: successCount,
          failed_trends: failCount,
          status: 'completed',
          completed_at: new Date().toISOString()
        })
        .eq('id', bulkData.id)
      
      if (successCount > 0) {
        toast.success(`Successfully submitted ${successCount} trends!`)
      }
      
    } catch (error) {
      console.error('Error processing bulk submission:', error)
      toast.error('Error processing bulk submission')
    } finally {
      setProcessing(false)
    }
  }

  const reset = () => {
    setFile(null)
    setTrends([])
    setBulkSubmissionId(null)
    setStats({
      total: 0,
      successful: 0,
      failed: 0,
      estimatedEarnings: 0
    })
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-orange-500 to-red-600 rounded-xl p-6 text-white">
        <div className="flex items-center gap-3 mb-2">
          <Zap className="w-8 h-8" />
          <h2 className="text-2xl font-bold">Bulk Trend Submission</h2>
        </div>
        <p className="opacity-90">
          Submit up to 100 trends at once using a CSV file
        </p>
      </div>

      {/* Instructions */}
      <div className="bg-white dark:bg-neutral-800 rounded-xl p-6 border border-gray-200 dark:border-neutral-700">
        <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-4">
          How to Use Bulk Upload
        </h3>
        
        <ol className="space-y-3 text-sm text-gray-600 dark:text-gray-400">
          <li className="flex gap-3">
            <span className="flex-shrink-0 w-6 h-6 bg-blue-100 dark:bg-blue-900/20 rounded-full flex items-center justify-center text-xs font-semibold text-blue-600 dark:text-blue-400">
              1
            </span>
            <div>
              <p className="font-medium text-gray-900 dark:text-gray-100">Download the template</p>
              <p>Use our CSV template to format your trends correctly</p>
            </div>
          </li>
          <li className="flex gap-3">
            <span className="flex-shrink-0 w-6 h-6 bg-blue-100 dark:bg-blue-900/20 rounded-full flex items-center justify-center text-xs font-semibold text-blue-600 dark:text-blue-400">
              2
            </span>
            <div>
              <p className="font-medium text-gray-900 dark:text-gray-100">Fill in your trends</p>
              <p>Add URLs, tickers, categories, and descriptions</p>
            </div>
          </li>
          <li className="flex gap-3">
            <span className="flex-shrink-0 w-6 h-6 bg-blue-100 dark:bg-blue-900/20 rounded-full flex items-center justify-center text-xs font-semibold text-blue-600 dark:text-blue-400">
              3
            </span>
            <div>
              <p className="font-medium text-gray-900 dark:text-gray-100">Upload and submit</p>
              <p>We'll process all trends and show you the results</p>
            </div>
          </li>
        </ol>
        
        <button
          onClick={downloadTemplate}
          className="mt-4 btn-secondary flex items-center gap-2"
        >
          <Download className="w-4 h-4" />
          Download CSV Template
        </button>
      </div>

      {/* Upload Area */}
      {!file && (
        <div className="bg-white dark:bg-neutral-800 rounded-xl p-8 border-2 border-dashed border-gray-300 dark:border-neutral-600 text-center">
          <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">
            Upload CSV File
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
            Maximum 100 trends per upload
          </p>
          <label className="btn-primary cursor-pointer inline-flex items-center gap-2">
            <FileText className="w-4 h-4" />
            Choose File
            <input
              type="file"
              accept=".csv"
              onChange={handleFileUpload}
              className="hidden"
              disabled={uploading}
            />
          </label>
        </div>
      )}

      {/* Results */}
      {trends.length > 0 && (
        <>
          {/* Stats Summary */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white dark:bg-neutral-800 rounded-xl p-4 border border-gray-200 dark:border-neutral-700">
              <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                {stats.total}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Total Trends</div>
            </div>
            <div className="bg-white dark:bg-neutral-800 rounded-xl p-4 border border-gray-200 dark:border-neutral-700">
              <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                {stats.successful}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Successful</div>
            </div>
            <div className="bg-white dark:bg-neutral-800 rounded-xl p-4 border border-gray-200 dark:border-neutral-700">
              <div className="text-2xl font-bold text-red-600 dark:text-red-400">
                {stats.failed}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Failed</div>
            </div>
            <div className="bg-white dark:bg-neutral-800 rounded-xl p-4 border border-gray-200 dark:border-neutral-700">
              <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                ${stats.estimatedEarnings.toFixed(2)}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Est. Earnings</div>
            </div>
          </div>

          {/* Trends List */}
          <div className="bg-white dark:bg-neutral-800 rounded-xl border border-gray-200 dark:border-neutral-700">
            <div className="p-6 border-b border-gray-200 dark:border-neutral-700">
              <h3 className="font-semibold text-gray-900 dark:text-gray-100">
                Trend Preview
              </h3>
            </div>
            
            <div className="max-h-96 overflow-y-auto">
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-neutral-700 sticky top-0">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                      Status
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                      URL
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                      Ticker
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                      Category
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                      Est. Payout
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-neutral-700">
                  {trends.map((trend, index) => (
                    <tr key={index} className="hover:bg-gray-50 dark:hover:bg-neutral-700/50">
                      <td className="px-4 py-3">
                        {trend.status === 'success' && (
                          <CheckCircle className="w-5 h-5 text-green-500" />
                        )}
                        {trend.status === 'error' && (
                          <XCircle className="w-5 h-5 text-red-500" />
                        )}
                        {trend.status === 'pending' && (
                          <AlertCircle className="w-5 h-5 text-gray-400" />
                        )}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900 dark:text-gray-100 truncate max-w-xs">
                        {trend.url}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900 dark:text-gray-100">
                        {trend.ticker || '-'}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900 dark:text-gray-100">
                        {trend.category}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900 dark:text-gray-100">
                        ${trend.estimatedPayout?.toFixed(2) || '0.00'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3">
            <button
              onClick={processBulkSubmission}
              disabled={processing || stats.successful === stats.total}
              className="flex-1 btn-primary flex items-center justify-center gap-2"
            >
              {processing ? (
                <>
                  <Loader className="w-4 h-4 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4" />
                  Submit All Trends
                </>
              )}
            </button>
            <button
              onClick={reset}
              className="btn-secondary"
            >
              Reset
            </button>
          </div>
        </>
      )}
    </div>
  )
}