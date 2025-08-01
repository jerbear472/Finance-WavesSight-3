# Finance Trends Submission System Documentation

## Overview
The structured finance trend submission system provides a comprehensive 3-page form for users to submit financial trends with automatic payout calculation and quality scoring.

## Components Created

### 1. Database Schema (`/supabase/create_finance_trends_schema.sql`)
- **finance_trends** table with structured fields
- **finance_trend_verifications** table for quality control
- Automatic payout calculation functions
- Quality scoring algorithm
- RLS policies for security

### 2. Frontend Components

#### FinanceTrendSubmissionForm (`/web/components/FinanceTrendSubmissionForm.tsx`)
A 3-page submission form with:
- **Page 1**: Basic trend info (name, platform, link, company/ticker)
- **Page 2**: Financial signals (signal type, evidence, sentiment, drivers)
- **Page 3**: Market impact (velocity, timeline, cross-platform, bonus fields)

Features:
- Real-time payout calculation
- Progress tracking
- Form validation
- Auto-save draft

#### StockTickerAutocomplete (`/web/components/StockTickerAutocomplete.tsx`)
Smart autocomplete for company names and ticker symbols:
- 100+ popular stocks, crypto, and ETFs
- Search by symbol or company name
- Trending suggestions
- Type indicators (stock/crypto/ETF)

#### FinanceTrendVerification (`/web/components/FinanceTrendVerification.tsx`)
Verification interface for admins/verifiers:
- Quality assessment questions
- Approve/reject functionality
- Detailed trend analysis view
- Payout confirmation

### 3. API Endpoint (`/web/app/api/finance-trends/route.ts`)
REST API with:
- POST: Submit new finance trend
- GET: Fetch trends with filters
- PATCH: Verify/reject trends

## Usage Instructions

### For Developers

1. **Apply Database Schema**:
```bash
# Run the SQL file to create tables and functions
psql -U your_user -d your_database -f supabase/create_finance_trends_schema.sql
```

2. **Import Components**:
```tsx
import FinanceTrendSubmissionForm from '@/components/FinanceTrendSubmissionForm';

// In your page component
const handleSubmit = async (data) => {
  const response = await fetch('/api/finance-trends', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  // Handle response
};

<FinanceTrendSubmissionForm 
  onSubmit={handleSubmit}
  onClose={() => setShowForm(false)}
/>
```

3. **Add Verification Page**:
```tsx
import FinanceTrendVerification from '@/components/FinanceTrendVerification';

// Fetch pending trends and display verification component
```

### Payout Structure

#### Base Payouts by Signal Type:
- 💎 Meme Stock Momentum: $5.00
- 🚀 Crypto Pump Signal: $3.00
- 📊 Earnings/IPO Buzz: $2.00
- 🏢 Company Going Viral: $2.00
- 🛍️ Consumer Product Buzz: $1.50
- 📱 App/Tech Adoption: $1.50
- 🍔 Restaurant/Retail Buzz: $1.00
- 📈 General Stock Mention: $1.00

#### Viral Evidence Multipliers:
- 3+ evidence types: +50% payout
- 5+ evidence types: +100% payout
- Cross-platform + high engagement: +75% payout

#### Bonus Fields:
- Geographic data: +$0.25
- Demographic insight: +$0.50
- Technical context: +$0.75
- All three bonus fields: +$2.00 total

### Quality Score Calculation

Base score: 50 points
- Signal type value: 10-30 points
- Evidence strength: 5-25 points
- Bonus fields: 5-15 points
- Cross-platform: 5-10 points

Score thresholds:
- 90+ points: Auto-approved for trusted users
- 80+ points: Priority verification
- 70+ points: Promoted to verification

## Configuration

### Environment Variables
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_service_key
```

### Customization

1. **Add New Signal Types**: Update `SIGNAL_TYPES` in FinanceTrendSubmissionForm
2. **Modify Payouts**: Update base payouts in the schema and component
3. **Add Platforms**: Update `PLATFORMS` array
4. **Extend Stock Data**: Add entries to `/web/lib/stockTickerData.ts`

## Security Considerations

- RLS policies enforce user ownership
- Verification requires admin/verifier role
- Service role key only used server-side
- Input validation on both client and server

## Future Enhancements

1. **Analytics Dashboard**: Track trend performance and accuracy
2. **ML Integration**: Auto-categorization and quality prediction
3. **Bulk Verification**: Process multiple trends at once
4. **API Integration**: Connect to real-time market data
5. **Mobile App**: Native submission interface

## Support

For issues or questions:
- Check the component PropTypes for available options
- Review the database schema for field constraints
- Ensure proper authentication is configured

---

This system provides a scalable, data-driven approach to capturing and monetizing financial trend intelligence while maintaining quality through structured submission and verification processes.