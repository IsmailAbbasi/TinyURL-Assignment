const { Pool } = require('pg');
require('dotenv').config({ path: '.env.local' });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? {
    rejectUnauthorized: false
  } : false
});

async function testDB() {
  try {
    const result = await pool.query('SELECT * FROM links');
    console.log('Links in database:');
    console.log(result.rows);
    
    if (result.rows.length === 0) {
      console.log('\n❌ No links found! Create a link first.');
    }
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await pool.end();
  }
}

testDB();