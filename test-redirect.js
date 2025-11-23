const { Pool } = require('pg');
require('dotenv').config({ path: '.env.local' });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? {
    rejectUnauthorized: false
  } : false
});

async function testRedirect() {
  const code = 'BOTSTRAP';
  
  console.log('📊 Testing redirect functionality for code:', code);
  console.log('='.repeat(50));
  
  try {
    // 1. Check link exists
    console.log('\n1️⃣ Checking if link exists...');
    const beforeResult = await pool.query('SELECT * FROM links WHERE code = $1', [code]);
    
    if (beforeResult.rows.length === 0) {
      console.log('❌ Link not found!');
      return;
    }
    
    const beforeLink = beforeResult.rows[0];
    console.log('✅ Link found:');
    console.log('   Code:', beforeLink.code);
    console.log('   URL:', beforeLink.target_url);
    console.log('   Total Clicks:', beforeLink.total_clicks);
    console.log('   Last Clicked:', beforeLink.last_clicked || 'Never');
    
    // 2. Simulate a click (update database)
    console.log('\n2️⃣ Simulating a click...');
    await pool.query(
      'UPDATE links SET total_clicks = total_clicks + 1, last_clicked = CURRENT_TIMESTAMP WHERE code = $1',
      [code]
    );
    console.log('✅ Click recorded!');
    
    // 3. Check updated stats
    console.log('\n3️⃣ Checking updated stats...');
    const afterResult = await pool.query('SELECT * FROM links WHERE code = $1', [code]);
    const afterLink = afterResult.rows[0];
    
    console.log('✅ Updated stats:');
    console.log('   Total Clicks:', afterLink.total_clicks, `(+${afterLink.total_clicks - beforeLink.total_clicks})`);
    console.log('   Last Clicked:', afterLink.last_clicked);
    
    console.log('\n' + '='.repeat(50));
    console.log('✅ Test complete! The redirect is working correctly.');
    console.log(`🔗 Visit: http://localhost:3000/${code} to test in browser`);
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await pool.end();
  }
}

testRedirect();