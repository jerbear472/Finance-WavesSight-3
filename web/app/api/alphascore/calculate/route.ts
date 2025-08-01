import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { AlphaScoreEngine } from '@/services/AlphaScoreEngine'

export async function POST(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    
    // Check authentication
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { signalId, signalIds } = await request.json()

    if (!signalId && !signalIds) {
      return NextResponse.json({ error: 'Signal ID(s) required' }, { status: 400 })
    }

    // Initialize AlphaScore Engine
    const engine = new AlphaScoreEngine(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // Process single signal or batch
    if (signalId) {
      const score = await engine.calculateAlphaScore(signalId)
      return NextResponse.json({ signalId, alphaScore: score })
    } else {
      const scores = await engine.processSignalBatch(signalIds)
      const results = Array.from(scores.entries()).map(([id, score]) => ({
        signalId: id,
        alphaScore: score
      }))
      return NextResponse.json({ results })
    }
  } catch (error) {
    console.error('Error in alphascore calculation:', error)
    return NextResponse.json(
      { error: 'Failed to calculate alpha score' },
      { status: 500 }
    )
  }
}

// Webhook endpoint for automatic score calculation
export async function PUT(request: NextRequest) {
  try {
    const { signalId, event } = await request.json()

    // Verify webhook secret
    const webhookSecret = request.headers.get('x-webhook-secret')
    if (webhookSecret !== process.env.ALPHASCORE_WEBHOOK_SECRET) {
      return NextResponse.json({ error: 'Invalid webhook secret' }, { status: 401 })
    }

    const engine = new AlphaScoreEngine(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    let score: number

    switch (event) {
      case 'signal.created':
        // Calculate initial score after signal creation
        score = await engine.calculateAlphaScore(signalId)
        break
      
      case 'verification.created':
        // Update score after new verification
        score = await engine.updateScoreWithNewVerification(signalId, request.body.verificationId)
        break
      
      default:
        return NextResponse.json({ error: 'Unknown event type' }, { status: 400 })
    }

    return NextResponse.json({ signalId, alphaScore: score, event })
  } catch (error) {
    console.error('Error in alphascore webhook:', error)
    return NextResponse.json(
      { error: 'Failed to process webhook' },
      { status: 500 }
    )
  }
}