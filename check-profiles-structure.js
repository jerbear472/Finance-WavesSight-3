const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase service credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkProfilesTable() {
  console.log('🔍 Checking profiles table structure...\n');
  
  try {
    // Get a sample profile to see the columns
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .limit(1);
    
    if (error) {
      console.error('Error fetching profiles:', error);
      return;
    }
    
    if (data && data.length > 0) {
      console.log('📋 Profiles table columns:');
      console.log('========================');
      const columns = Object.keys(data[0]);
      columns.forEach(col => {
        console.log(`- ${col}`);
      });
      
      console.log('\n✅ Key findings:');
      console.log(`- Has 'is_admin' column: ${columns.includes('is_admin') ? 'YES' : 'NO'}`);
      console.log(`- Has 'role' column: ${columns.includes('role') ? 'NO (this was the issue!)' : 'NO'}`);
      
      if (!columns.includes('is_admin')) {
        console.log('\n⚠️  Warning: No is_admin column found.');
        console.log('You may need to add it with:');
        console.log('ALTER TABLE profiles ADD COLUMN is_admin BOOLEAN DEFAULT false;');
      }
    } else {
      console.log('No profiles found in the table');
    }
    
  } catch (err) {
    console.error('Error:', err);
  }
}

checkProfilesTable();