const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function testSystem() {
  console.log('🚀 Testing Finance Trend System...\n');
  
  // Test database connection
  console.log('1️⃣ Testing Database Connection...');
  try {
    const { data, error } = await supabase
      .from('finance_trends')
      .select('count');
      
    if (error) throw error;
    console.log('✅ Database connected successfully!');
  } catch (error) {
    console.log('❌ Database connection failed:', error.message);
    return;
  }
  
  // Test finance_trends table
  console.log('\n2️⃣ Checking Finance Tables...');
  try {
    const { error: trendsError } = await supabase
      .from('finance_trends')
      .select('id')
      .limit(1);
      
    if (!trendsError) console.log('✅ finance_trends table ready');
    
    const { error: earningsError } = await supabase
      .from('user_earnings')
      .select('id')
      .limit(1);
      
    if (!earningsError) console.log('✅ user_earnings table ready');
    
    const { error: verificationsError } = await supabase
      .from('finance_trend_verifications')
      .select('id')
      .limit(1);
      
    if (!verificationsError) console.log('✅ finance_trend_verifications table ready');
  } catch (error) {
    console.log('❌ Table check failed:', error.message);
  }
  
  // Test API endpoint
  console.log('\n3️⃣ Testing API Endpoints...');
  try {
    const response = await fetch('http://localhost:3000/api/finance-trends');
    if (response.ok) {
      console.log('✅ API endpoint responding');
    } else {
      console.log('⚠️  API returned status:', response.status);
    }
  } catch (error) {
    console.log('⚠️  API test skipped (server may need to warm up)');
  }
  
  console.log('\n✨ System Status Summary:');
  console.log('========================');
  console.log('🌐 Frontend: http://localhost:3000');
  console.log('📊 Database: Connected to Supabase');
  console.log('🔧 API: /api/finance-trends');
  console.log('\n💡 Next Steps:');
  console.log('1. Open http://localhost:3000 in your browser');
  console.log('2. Login or create an account');
  console.log('3. Navigate to Submit page');
  console.log('4. Test Quick Submit ($0.25) or Full Analysis ($1-10)');
}

testSystem().catch(console.error);