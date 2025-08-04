const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkDatabase() {
  console.log('🔍 Checking Supabase Database...\n');
  console.log(`URL: ${supabaseUrl}\n`);
  
  // List of tables to check
  const tablesToCheck = [
    'profiles',
    'trends',
    'finance_trends',
    'finance_trend_verifications',
    'user_earnings',
    'trend_submissions',
    'trend_validations'
  ];
  
  console.log('📋 Checking for existing tables:');
  console.log('================================');
  
  for (const table of tablesToCheck) {
    try {
      const { data, error } = await supabase
        .from(table)
        .select('id')
        .limit(1);
      
      if (error) {
        console.log(`❌ ${table} - Not found or no access`);
      } else {
        console.log(`✅ ${table} - Exists`);
      }
    } catch (err) {
      console.log(`❌ ${table} - Error checking`);
    }
  }
  
  console.log('\n📊 Finance Trends Schema Status:');
  console.log('================================');
  
  // Check specifically for finance trends tables
  const { data: financeTrends, error: ftError } = await supabase
    .from('finance_trends')
    .select('id')
    .limit(1);
  
  if (ftError) {
    console.log('❌ Finance trends tables NOT installed');
    console.log('📝 You need to run the schema in Supabase SQL Editor');
  } else {
    console.log('✅ Finance trends tables are installed!');
  }
  
  console.log('\n💡 Recommendation:');
  console.log('==================');
  if (ftError) {
    console.log('1. Go to Supabase Dashboard > SQL Editor');
    console.log('2. Copy contents of supabase/create_finance_trends_schema.sql');
    console.log('3. Run the SQL to create the tables');
  } else {
    console.log('Your database is ready to use with the finance trends system!');
  }
}

checkDatabase().catch(console.error);