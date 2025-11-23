const { Pool } = require('pg');
require('dotenv').config({ path: '.env.local' });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function testClickTracking() {
  const code = 'BOTSTRAP';
  
  console.log('🧪 Testing Click Tracking\n');
  console.log('='.repeat(50));
  
  try {
    // 1. Get current state
    console.log('1️⃣ Fetching current state...');
    let result = await pool.query('SELECT * FROM links WHERE code = $1', [code]);
    const before = result.rows[0];
    console.log('   Current clicks:', before.total_clicks);
    console.log('   Last clicked:', before.last_clicked);
    
    // 2. Simulate a click
    console.log('\n2️⃣ Simulating a click...');
    await pool.query(
      'UPDATE links SET total_clicks = total_clicks + 1, last_clicked = CURRENT_TIMESTAMP WHERE code = $1',
      [code]
    );
    console.log('   ✅ Update query executed');
    
    // 3. Get updated state
    console.log('\n3️⃣ Fetching updated state...');
    result = await pool.query('SELECT * FROM links WHERE code = $1', [code]);
    const after = result.rows[0];
    console.log('   New clicks:', after.total_clicks);
    console.log('   Last clicked:', after.last_clicked);
    
    // 4. Verify
    console.log('\n4️⃣ Verification:');
    if (after.total_clicks === before.total_clicks + 1) {
      console.log('   ✅ Click count increased by 1');
    } else {
      console.log('   ❌ Click count did NOT increase correctly');
    }
    
    if (after.last_clicked !== before.last_clicked) {
      console.log('   ✅ Last clicked timestamp updated');
    } else {
      console.log('   ❌ Last clicked timestamp NOT updated');
    }
    
    console.log('\n' + '='.repeat(50));
    console.log('✅ Test complete!\n');
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await pool.end();
  }
}

testClickTracking();