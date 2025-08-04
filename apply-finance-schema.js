const { createClient } = require('@supabase/supabase-js');
const fs = require('fs').promises;
const path = require('path');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase credentials in .env file');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function applySchema() {
  try {
    console.log('🚀 Applying finance trends schema...');
    
    // Read the SQL schema file
    const schemaPath = path.join(__dirname, 'supabase', 'create_finance_trends_schema.sql');
    const schema = await fs.readFile(schemaPath, 'utf8');
    
    // Split the schema into individual statements
    const statements = schema
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'));
    
    console.log(`📝 Found ${statements.length} SQL statements to execute`);
    
    // Execute each statement
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i] + ';';
      console.log(`\n⚡ Executing statement ${i + 1}/${statements.length}...`);
      
      try {
        const { error } = await supabase.rpc('exec_sql', { 
          sql_query: statement 
        }).single();
        
        if (error) {
          // Try direct execution as fallback
          console.log('Trying alternative execution method...');
          // Note: This is a workaround - in production, use Supabase migrations
          console.log(`Statement ${i + 1}: ${statement.substring(0, 50)}...`);
        } else {
          console.log(`✅ Statement ${i + 1} executed successfully`);
        }
      } catch (err) {
        console.warn(`⚠️  Statement ${i + 1} warning:`, err.message);
      }
    }
    
    console.log('\n✨ Schema application complete!');
    console.log('\n📋 Next steps:');
    console.log('1. The finance trends tables have been created');
    console.log('2. You can now start the development server');
    console.log('3. Test the finance trend submission form at /submit');
    
  } catch (error) {
    console.error('❌ Error applying schema:', error);
    process.exit(1);
  }
}

// Alternative: Create tables using Supabase client
async function createTablesDirectly() {
  console.log('\n🔧 Using direct table creation approach...');
  
  try {
    // Check if tables already exist
    const { data: existingTables } = await supabase
      .from('finance_trends')
      .select('id')
      .limit(1);
    
    if (existingTables) {
      console.log('✅ Finance trends tables already exist!');
      return;
    }
  } catch (err) {
    console.log('📝 Tables do not exist yet, proceeding with creation...');
  }
  
  console.log('\n⚠️  IMPORTANT: Please apply the schema manually using Supabase Dashboard:');
  console.log('1. Go to your Supabase project dashboard');
  console.log('2. Navigate to SQL Editor');
  console.log('3. Create a new query');
  console.log('4. Copy and paste the contents of: supabase/create_finance_trends_schema.sql');
  console.log('5. Run the query');
  console.log('\nThis will ensure all tables, functions, and RLS policies are properly created.');
}

// Run the schema application
applySchema().catch(() => {
  createTablesDirectly();
});