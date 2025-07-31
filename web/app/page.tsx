import Link from 'next/link'
import WaveSightLogo from '@/components/WaveSightLogo'
import Header from '@/components/Header'

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      {/* Hero Section */}
      <section className="flex-1 flex items-center justify-center px-4 py-20 pt-32">
        <div className="text-center max-w-4xl mx-auto animate-fade-in">
          {/* Title */}
          <h1 className="text-5xl md:text-7xl font-light tracking-tight mb-8">
            Wave<span className="text-blue-600 font-normal">Sight</span>
          </h1>
          
          {/* Tagline */}
          <p className="text-xl md:text-2xl text-gray-600 dark:text-gray-400 mb-4">
            Turn Your Financial Social Media Browsing Into Serious Income
          </p>
          
          <p className="text-lg text-gray-500 dark:text-gray-500 mb-8 max-w-2xl mx-auto">
            Get paid $1-10 to spot viral financial movements before they hit the market
          </p>
          
          {/* Earning Highlight Box */}
          <div className="bg-gradient-to-r from-green-50 to-blue-50 dark:from-green-900/20 dark:to-blue-900/20 rounded-2xl p-6 mb-10 max-w-2xl mx-auto border border-green-200 dark:border-green-800">
            <div className="flex flex-col sm:flex-row items-center gap-4">
              <div className="text-4xl">💰</div>
              <div className="text-center sm:text-left">
                <p className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                  Spot the Next GameStop, Tesla Viral Moment, or Crypto Pump
                </p>
                <p className="text-gray-700 dark:text-gray-300">
                  Made $1,200 last month spotting crypto trends • Caught Tesla TikTok buzz 6 hours before stock moved
                </p>
              </div>
            </div>
          </div>
          
          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Link 
              href="/register"
              className="btn-primary px-8 py-4 text-lg hover-lift inline-flex items-center gap-2"
            >
              Start Earning from Finance Trends
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </Link>
            
            <Link 
              href="/login"
              className="btn-secondary px-8 py-4 text-lg"
            >
              Sign In
            </Link>
          </div>
          
          {/* Stats */}
          <div className="flex flex-wrap justify-center items-center gap-8 mt-20 text-sm text-gray-500 dark:text-gray-500">
            <div className="text-center">
              <div className="text-2xl font-semibold text-gray-900 dark:text-gray-100">$2.4M+</div>
              <div>Paid to Spotters</div>
            </div>
            <div className="hidden sm:block w-px h-8 bg-gray-300 dark:bg-gray-700"></div>
            <div className="text-center">
              <div className="text-2xl font-semibold text-gray-900 dark:text-gray-100">87%</div>
              <div>Accuracy Rate</div>
            </div>
            <div className="hidden sm:block w-px h-8 bg-gray-300 dark:bg-gray-700"></div>
            <div className="text-center">
              <div className="text-2xl font-semibold text-gray-900 dark:text-gray-100">6 hrs</div>
              <div>Avg Early Detection</div>
            </div>
          </div>
        </div>
      </section>

      {/* Financial Examples Section */}
      <section className="py-20 bg-gradient-to-b from-white to-gray-50 dark:from-neutral-950 dark:to-neutral-900">
        <div className="container-custom">
          <h2 className="text-3xl md:text-4xl font-light text-center mb-12">
            Real Examples from Our <span className="text-gradient font-normal">Top Earners</span>
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            <div className="bg-white dark:bg-neutral-800 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-neutral-700">
              <div className="flex items-start gap-3 mb-4">
                <span className="text-3xl">🚀</span>
                <div>
                  <h3 className="font-semibold text-lg mb-1">Tesla Cybertruck Viral</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">TikTok videos trending</p>
                </div>
              </div>
              <div className="space-y-2 text-sm">
                <p className="text-gray-700 dark:text-gray-300">Spotted 6 hours before TSLA +4.2%</p>
                <div className="flex justify-between items-center pt-2 border-t border-gray-200 dark:border-neutral-700">
                  <span className="text-gray-600 dark:text-gray-400">Base pay:</span>
                  <span className="font-semibold text-green-600">$5.00</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600 dark:text-gray-400">Performance bonus:</span>
                  <span className="font-semibold text-green-600">+$25.00</span>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-neutral-800 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-neutral-700">
              <div className="flex items-start gap-3 mb-4">
                <span className="text-3xl">💎</span>
                <div>
                  <h3 className="font-semibold text-lg mb-1">$PEPE Pump Signal</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Crypto Twitter buzzing</p>
                </div>
              </div>
              <div className="space-y-2 text-sm">
                <p className="text-gray-700 dark:text-gray-300">24hrs before +127% pump</p>
                <div className="flex justify-between items-center pt-2 border-t border-gray-200 dark:border-neutral-700">
                  <span className="text-gray-600 dark:text-gray-400">Base pay:</span>
                  <span className="font-semibold text-green-600">$3.00</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600 dark:text-gray-400">Performance bonus:</span>
                  <span className="font-semibold text-green-600">+$50.00</span>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-neutral-800 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-neutral-700">
              <div className="flex items-start gap-3 mb-4">
                <span className="text-3xl">🍔</span>
                <div>
                  <h3 className="font-semibold text-lg mb-1">Chipotle Portion Drama</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Reddit/TikTok complaints</p>
                </div>
              </div>
              <div className="space-y-2 text-sm">
                <p className="text-gray-700 dark:text-gray-300">3 days before CMG -8.3%</p>
                <div className="flex justify-between items-center pt-2 border-t border-gray-200 dark:border-neutral-700">
                  <span className="text-gray-600 dark:text-gray-400">Base pay:</span>
                  <span className="font-semibold text-green-600">$7.50</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600 dark:text-gray-400">Performance bonus:</span>
                  <span className="font-semibold text-green-600">+$100.00</span>
                </div>
              </div>
            </div>
          </div>

          <p className="text-center mt-8 text-sm text-gray-600 dark:text-gray-400">
            Average spotter earns <span className="font-semibold text-gray-900 dark:text-gray-100">$1,200/month</span> • Top performers earn <span className="font-semibold text-gray-900 dark:text-gray-100">$5,000+</span>
          </p>
        </div>
      </section>

      {/* Two Modes Section */}
      <section className="py-20 bg-gray-50 dark:bg-neutral-900">
        <div className="container-custom">
          <h2 className="text-3xl md:text-4xl font-light text-center mb-16">
            Two Ways to Use Wave<span className="text-gradient font-normal">Sight</span>
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            <div className="card card-hover">
              <div className="p-6">
                <div className="text-4xl mb-4 text-center">💰</div>
                <h3 className="text-xl font-semibold mb-3 text-center">Financial Trend Spotter</h3>
                <p className="text-gray-600 dark:text-gray-400 text-center mb-4">Earn $1-10 per financial signal</p>
                <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                  <li className="flex items-center">
                    <span className="text-green-500 mr-2">✓</span>
                    Spot viral stock & crypto movements
                  </li>
                  <li className="flex items-center">
                    <span className="text-green-500 mr-2">✓</span>
                    $5 for meme stock momentum
                  </li>
                  <li className="flex items-center">
                    <span className="text-green-500 mr-2">✓</span>
                    $10 for insider/leak rumors
                  </li>
                  <li className="flex items-center">
                    <span className="text-green-500 mr-2">✓</span>
                    +$25-100 bonus if stock moves
                  </li>
                </ul>
              </div>
            </div>
            
            <div className="card card-hover">
              <div className="p-6">
                <div className="text-4xl mb-4 text-center">📊</div>
                <h3 className="text-xl font-semibold mb-3 text-center">Hedge Fund Dashboard</h3>
                <p className="text-gray-600 dark:text-gray-400 text-center mb-4">Real-time financial signals</p>
                <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                  <li className="flex items-center">
                    <span className="text-cyan-500 mr-2">✓</span>
                    Live feed of viral financial movements
                  </li>
                  <li className="flex items-center">
                    <span className="text-cyan-500 mr-2">✓</span>
                    Sentiment analysis & urgency indicators
                  </li>
                  <li className="flex items-center">
                    <span className="text-cyan-500 mr-2">✓</span>
                    Track signal accuracy & performance
                  </li>
                  <li className="flex items-center">
                    <span className="text-cyan-500 mr-2">✓</span>
                    API for algorithmic trading
                  </li>
                </ul>
                <p className="text-xs text-gray-500 dark:text-gray-500 mt-4 text-center">
                  *Professional subscription required
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Simple CTA Section */}
      <section className="py-20">
        <div className="container-custom text-center">
          <h2 className="text-3xl md:text-4xl font-light mb-6">
            Your WSB browsing finally pays off
          </h2>
          <p className="text-lg text-gray-600 dark:text-gray-400 mb-8">
            Join thousands earning real money from spotting financial movements early
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Link 
              href="/register"
              className="btn-primary px-8 py-4 text-lg hover-lift inline-flex items-center gap-2"
            >
              Start Earning Now
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </Link>
            <Link 
              href="/register?enterprise=true"
              className="btn-secondary px-8 py-4 text-lg inline-flex items-center gap-2"
            >
              Hedge Fund Access
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 border-t border-gray-200 dark:border-neutral-800">
        <div className="container-custom">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-2">
              <WaveSightLogo size="sm" showIcon={true} />
              <span className="text-sm text-gray-600 dark:text-gray-400">
                © 2024 All rights reserved.
              </span>
            </div>
            <div className="flex gap-6 text-sm text-gray-600 dark:text-gray-400">
              <Link href="/privacy" className="hover:text-gray-900 dark:hover:text-gray-100 wave-accent">
                Privacy
              </Link>
              <Link href="/terms" className="hover:text-gray-900 dark:hover:text-gray-100 wave-accent">
                Terms
              </Link>
              <Link href="/contact" className="hover:text-gray-900 dark:hover:text-gray-100 wave-accent">
                Contact
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}