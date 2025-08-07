'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Check, X, TrendingUp, BarChart3, Zap, Shield, Users, HeadphonesIcon, ChevronRight } from 'lucide-react'
import Header from '@/components/Header'

const plans = [
  {
    name: 'Trend Spotter',
    subtitle: 'For individual earners',
    price: 'Free',
    period: '',
    description: 'Start earning money by spotting financial trends',
    highlighted: false,
    cta: 'Start Earning',
    href: '/register',
    features: [
      { text: 'Submit unlimited trends', included: true },
      { text: '$0.05-0.20 per quality submission', included: true },
      { text: '$5+ viral trend bonuses', included: true },
      { text: '$25+ market move bonuses', included: true },
      { text: 'Daily challenges & rewards', included: true },
      { text: 'Referral program (10% earnings)', included: true },
      { text: 'Weekly payouts via Venmo', included: true },
      { text: 'Basic trend analytics', included: true },
      { text: 'API access', included: false },
      { text: 'Real-time alerts', included: false },
      { text: 'Advanced analytics', included: false },
      { text: 'Dedicated support', included: false }
    ]
  },
  {
    name: 'Professional',
    subtitle: 'For traders & analysts',
    price: '$299',
    period: '/month',
    description: 'Access real-time financial trend data and alerts',
    highlighted: true,
    cta: 'Start Free Trial',
    href: '/register?plan=professional',
    features: [
      { text: 'Everything in Trend Spotter', included: true },
      { text: 'Real-time trend feed', included: true },
      { text: 'Sentiment analysis dashboard', included: true },
      { text: 'Custom alerts & notifications', included: true },
      { text: 'Export data (CSV/JSON)', included: true },
      { text: 'API access (1,000 calls/day)', included: true },
      { text: 'Historical trend data (30 days)', included: true },
      { text: 'Priority email support', included: true },
      { text: 'Webhook integrations', included: false },
      { text: 'Custom ML models', included: false },
      { text: 'White-label options', included: false },
      { text: 'SLA guarantee', included: false }
    ]
  },
  {
    name: 'Enterprise',
    subtitle: 'For hedge funds & institutions',
    price: '$999',
    period: '/month',
    description: 'Advanced analytics and unlimited API access',
    highlighted: false,
    cta: 'Contact Sales',
    href: '/contact?plan=enterprise',
    features: [
      { text: 'Everything in Professional', included: true },
      { text: 'Unlimited API access', included: true },
      { text: 'Custom ML trend prediction', included: true },
      { text: 'White-label dashboard', included: true },
      { text: 'Webhook integrations', included: true },
      { text: 'Historical data (all-time)', included: true },
      { text: 'Custom data pipelines', included: true },
      { text: 'Dedicated account manager', included: true },
      { text: '99.9% uptime SLA', included: true },
      { text: 'On-premise deployment option', included: true },
      { text: 'Custom integrations', included: true },
      { text: '24/7 phone support', included: true }
    ]
  }
]

const comparisonFeatures = [
  { 
    category: 'Trend Spotting',
    features: [
      { name: 'Submit financial trends', spotter: true, professional: true, enterprise: true },
      { name: 'Earn per submission', spotter: '$0.05-0.20', professional: '$0.05-0.20', enterprise: '$0.05-0.20' },
      { name: 'Viral bonuses', spotter: '$5+', professional: '$5+', enterprise: '$5+' },
      { name: 'Market move bonuses', spotter: '$25+', professional: '$25+', enterprise: '$25+' },
      { name: 'Daily submission limit', spotter: '50-100', professional: 'Unlimited', enterprise: 'Unlimited' }
    ]
  },
  {
    category: 'Data Access',
    features: [
      { name: 'Real-time trend feed', spotter: false, professional: true, enterprise: true },
      { name: 'Historical data', spotter: '7 days', professional: '30 days', enterprise: 'All-time' },
      { name: 'API access', spotter: false, professional: '1K/day', enterprise: 'Unlimited' },
      { name: 'Export capabilities', spotter: false, professional: 'CSV/JSON', enterprise: 'All formats' },
      { name: 'Webhook support', spotter: false, professional: false, enterprise: true }
    ]
  },
  {
    category: 'Analytics',
    features: [
      { name: 'Basic trend analytics', spotter: true, professional: true, enterprise: true },
      { name: 'Sentiment analysis', spotter: false, professional: true, enterprise: true },
      { name: 'ML predictions', spotter: false, professional: false, enterprise: true },
      { name: 'Custom dashboards', spotter: false, professional: false, enterprise: true },
      { name: 'Industry comparisons', spotter: false, professional: true, enterprise: true }
    ]
  },
  {
    category: 'Support',
    features: [
      { name: 'Community support', spotter: true, professional: true, enterprise: true },
      { name: 'Email support', spotter: false, professional: 'Priority', enterprise: 'Priority' },
      { name: 'Phone support', spotter: false, professional: false, enterprise: '24/7' },
      { name: 'Dedicated manager', spotter: false, professional: false, enterprise: true },
      { name: 'SLA guarantee', spotter: false, professional: false, enterprise: '99.9%' }
    ]
  }
]

export default function PricingPage() {
  const router = useRouter()
  const [billingPeriod, setBillingPeriod] = useState<'monthly' | 'annual'>('monthly')

  const getPrice = (basePrice: string, period: string) => {
    if (basePrice === 'Free') return basePrice
    if (billingPeriod === 'annual' && period === '/month') {
      const monthly = parseInt(basePrice.replace('$', ''))
      const annual = Math.floor(monthly * 10) // 2 months free
      return `$${annual}`
    }
    return basePrice
  }

  const getPeriod = (period: string) => {
    if (!period) return ''
    if (billingPeriod === 'annual') return '/year'
    return period
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white dark:from-neutral-950 dark:to-neutral-900">
      <Header />
      
      {/* Hero Section */}
      <section className="pt-32 pb-16 px-4">
        <div className="container-custom text-center">
          <h1 className="text-4xl md:text-6xl font-light mb-6">
            Choose Your <span className="text-gradient font-normal">Plan</span>
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-400 max-w-3xl mx-auto mb-8">
            Whether you're earning by spotting trends or need enterprise-grade financial intelligence, 
            we have the right plan for you.
          </p>
          
          {/* Billing Toggle */}
          <div className="flex items-center justify-center gap-4 mb-12">
            <span className={`text-sm font-medium ${billingPeriod === 'monthly' ? 'text-gray-900 dark:text-gray-100' : 'text-gray-500'}`}>
              Monthly
            </span>
            <button
              onClick={() => setBillingPeriod(billingPeriod === 'monthly' ? 'annual' : 'monthly')}
              className="relative w-14 h-7 bg-gray-200 dark:bg-neutral-700 rounded-full transition-colors"
            >
              <div className={`absolute top-1 left-1 w-5 h-5 bg-white rounded-full shadow-md transition-transform ${
                billingPeriod === 'annual' ? 'translate-x-7' : ''
              }`} />
            </button>
            <span className={`text-sm font-medium ${billingPeriod === 'annual' ? 'text-gray-900 dark:text-gray-100' : 'text-gray-500'}`}>
              Annual
              <span className="ml-2 text-xs text-green-600 dark:text-green-400 font-semibold">
                Save 17%
              </span>
            </span>
          </div>
        </div>
      </section>

      {/* Pricing Cards */}
      <section className="pb-16 px-4">
        <div className="container-custom">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {plans.map((plan) => (
              <div
                key={plan.name}
                className={`relative rounded-2xl transition-all ${
                  plan.highlighted
                    ? 'bg-gradient-to-b from-blue-500 to-purple-600 p-[2px]'
                    : 'bg-gray-200 dark:bg-neutral-800 p-[1px]'
                }`}
              >
                {plan.highlighted && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-gradient-to-r from-blue-500 to-purple-600 text-white text-sm font-semibold px-4 py-1 rounded-full">
                    MOST POPULAR
                  </div>
                )}
                
                <div className="bg-white dark:bg-neutral-900 rounded-2xl p-8 h-full">
                  <div className="mb-8">
                    <h3 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
                      {plan.name}
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400 text-sm mb-4">
                      {plan.subtitle}
                    </p>
                    <div className="flex items-baseline gap-1">
                      <span className="text-4xl font-bold text-gray-900 dark:text-gray-100">
                        {getPrice(plan.price, plan.period)}
                      </span>
                      <span className="text-gray-600 dark:text-gray-400">
                        {getPeriod(plan.period)}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                      {plan.description}
                    </p>
                  </div>
                  
                  <button
                    onClick={() => router.push(plan.href)}
                    className={`w-full py-3 px-6 rounded-xl font-semibold transition-all mb-8 ${
                      plan.highlighted
                        ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white hover:from-blue-600 hover:to-purple-700'
                        : 'bg-gray-100 dark:bg-neutral-800 text-gray-900 dark:text-gray-100 hover:bg-gray-200 dark:hover:bg-neutral-700'
                    }`}
                  >
                    {plan.cta}
                  </button>
                  
                  <div className="space-y-3">
                    {plan.features.map((feature, index) => (
                      <div key={index} className="flex items-start gap-3">
                        {feature.included ? (
                          <Check className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                        ) : (
                          <X className="w-5 h-5 text-gray-300 dark:text-gray-600 flex-shrink-0 mt-0.5" />
                        )}
                        <span className={`text-sm ${
                          feature.included 
                            ? 'text-gray-700 dark:text-gray-300' 
                            : 'text-gray-400 dark:text-gray-600'
                        }`}>
                          {feature.text}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Detailed Comparison Table */}
      <section className="py-16 bg-gray-50 dark:bg-neutral-900/50">
        <div className="container-custom">
          <h2 className="text-3xl font-light text-center mb-12">
            Detailed Feature <span className="text-gradient font-normal">Comparison</span>
          </h2>
          
          <div className="overflow-x-auto">
            <table className="w-full max-w-4xl mx-auto">
              <thead>
                <tr className="border-b border-gray-200 dark:border-neutral-700">
                  <th className="text-left py-4 px-4 text-gray-900 dark:text-gray-100 font-semibold">
                    Features
                  </th>
                  <th className="text-center py-4 px-4 text-gray-900 dark:text-gray-100 font-semibold">
                    Trend Spotter
                  </th>
                  <th className="text-center py-4 px-4 text-gray-900 dark:text-gray-100 font-semibold">
                    Professional
                  </th>
                  <th className="text-center py-4 px-4 text-gray-900 dark:text-gray-100 font-semibold">
                    Enterprise
                  </th>
                </tr>
              </thead>
              <tbody>
                {comparisonFeatures.map((category) => (
                  <>
                    <tr key={category.category} className="bg-gray-100 dark:bg-neutral-800">
                      <td colSpan={4} className="py-3 px-4 text-sm font-semibold text-gray-700 dark:text-gray-300">
                        {category.category}
                      </td>
                    </tr>
                    {category.features.map((feature) => (
                      <tr key={feature.name} className="border-b border-gray-100 dark:border-neutral-800">
                        <td className="py-3 px-4 text-sm text-gray-600 dark:text-gray-400">
                          {feature.name}
                        </td>
                        <td className="py-3 px-4 text-center">
                          {typeof feature.spotter === 'boolean' ? (
                            feature.spotter ? (
                              <Check className="w-5 h-5 text-green-500 mx-auto" />
                            ) : (
                              <X className="w-5 h-5 text-gray-300 dark:text-gray-600 mx-auto" />
                            )
                          ) : (
                            <span className="text-sm text-gray-700 dark:text-gray-300">
                              {feature.spotter}
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-center">
                          {typeof feature.professional === 'boolean' ? (
                            feature.professional ? (
                              <Check className="w-5 h-5 text-green-500 mx-auto" />
                            ) : (
                              <X className="w-5 h-5 text-gray-300 dark:text-gray-600 mx-auto" />
                            )
                          ) : (
                            <span className="text-sm text-gray-700 dark:text-gray-300">
                              {feature.professional}
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-center">
                          {typeof feature.enterprise === 'boolean' ? (
                            feature.enterprise ? (
                              <Check className="w-5 h-5 text-green-500 mx-auto" />
                            ) : (
                              <X className="w-5 h-5 text-gray-300 dark:text-gray-600 mx-auto" />
                            )
                          ) : (
                            <span className="text-sm text-gray-700 dark:text-gray-300">
                              {feature.enterprise}
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16">
        <div className="container-custom text-center">
          <h2 className="text-3xl font-light mb-6">
            Ready to get started?
          </h2>
          <p className="text-lg text-gray-600 dark:text-gray-400 mb-8 max-w-2xl mx-auto">
            Join thousands earning money by spotting financial trends or upgrade to access professional-grade market intelligence.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={() => router.push('/register')}
              className="btn-primary px-8 py-4 text-lg hover-lift inline-flex items-center gap-2"
            >
              Start Earning Free
              <ChevronRight className="w-5 h-5" />
            </button>
            <button
              onClick={() => router.push('/contact')}
              className="btn-secondary px-8 py-4 text-lg inline-flex items-center gap-2"
            >
              <HeadphonesIcon className="w-5 h-5" />
              Talk to Sales
            </button>
          </div>
        </div>
      </section>
    </div>
  )
}