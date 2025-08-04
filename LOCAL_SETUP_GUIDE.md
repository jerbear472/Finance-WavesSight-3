# Finance WaveSight 3 - Local Setup Guide

## 🚀 Quick Start

1. **Start the application**:
   ```bash
   ./start-local.sh
   ```

2. **Access the application**:
   - Main App: http://localhost:3000
   - Submit Finance Trend: http://localhost:3000/submit
   - Verify Trends (Admin): http://localhost:3000/verify

## 📋 Database Schema Setup

The finance trends schema needs to be applied to your Supabase database. 

### Option 1: Manual Setup (Recommended)
1. Go to your [Supabase Dashboard](https://app.supabase.com)
2. Navigate to SQL Editor
3. Create a new query
4. Copy and paste the contents of `supabase/create_finance_trends_schema.sql`
5. Run the query

### Option 2: Using the Script
```bash
node apply-finance-schema.js
```

## 🔑 Environment Variables

Ensure your `web/.env.local` file contains:
```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## 📱 Key Features

### Finance Trend Submission (/submit)
- 3-page wizard form
- Real-time payout calculation
- Company/ticker autocomplete
- Structured data collection

### Payout Structure
- Meme Stock Momentum: $5.00
- Crypto Pump Signal: $3.00
- Earnings/IPO Buzz: $2.00
- Company Going Viral: $2.00
- Consumer Product Buzz: $1.50
- App/Tech Adoption: $1.50
- Restaurant/Retail: $1.00
- General Stock Mention: $1.00

### Bonus Multipliers
- 3+ viral evidence: +50%
- 5+ viral evidence: +100%
- Geographic data: +$0.25
- Demographics: +$0.50
- Technical context: +$0.75

## 🛠️ Development

### Start Development Server
```bash
cd web && npm run dev
```

### Build for Production
```bash
cd web && npm run build
```

### Common Issues

1. **Port 3000 in use**: The start script will automatically kill the existing process
2. **Database connection**: Ensure your Supabase credentials are correct
3. **Missing dependencies**: Run `npm install` in both root and web directories

## 📊 Testing the Finance Trends System

1. Navigate to http://localhost:3000/submit
2. Fill out the 3-page form:
   - Page 1: Basic trend info
   - Page 2: Financial signals
   - Page 3: Market impact
3. Submit and check the calculated payout
4. Admins can verify at http://localhost:3000/verify

## 🔍 Monitoring

- Check browser console for errors
- Monitor Next.js terminal output
- Review Supabase logs for database issues

---

For more details, see `FINANCE_TRENDS_DOCUMENTATION.md`