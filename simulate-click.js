const { Pool } = require('pg');
require('dotenv').config({ path: '.env.local' });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function simulateClick(code) {
  try {
    await pool.query(
      'UPDATE links SET total_clicks = total_clicks + 1, last_clicked = NOW() WHERE code = $1',
      [code]
    );
    console.log(`✅ Simulated click for: ${code}`);
    
    const result = await pool.query('SELECT * FROM links WHERE code = $1', [code]);
    console.log(result.rows[0]);
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await pool.end();
  }
}

// Run with: node simulate-click.js
simulateClick('BOTSTRAP');