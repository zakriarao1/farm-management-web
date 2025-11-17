const { pool, testConnection } = require('./db');

exports.handler = async (event, context) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Content-Type': 'application/json'
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  try {
    // Test database connection
    await testConnection();
    
    // Test if crops table exists and has data
    const tablesResult = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_type = 'BASE TABLE'
      ORDER BY table_name
    `);

    const cropsCount = await pool.query('SELECT COUNT(*) as count FROM crops');
    const cropsData = await pool.query('SELECT * FROM crops LIMIT 5');

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        message: 'Database test successful',
        data: {
          connection: 'OK',
          tables: tablesResult.rows.map(row => row.table_name),
          cropsCount: cropsCount.rows[0].count,
          sampleCrops: cropsData.rows
        },
        environment: {
          nodeEnv: process.env.NODE_ENV,
          hasDatabaseUrl: !!process.env.DATABASE_URL
        }
      })
    };

  } catch (error) {
    console.error('❌ Database test failed:', error);
    
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        error: 'Database test failed',
        message: error.message,
        environment: {
          nodeEnv: process.env.NODE_ENV,
          hasDatabaseUrl: !!process.env.DATABASE_URL
        }
      })
    };
  }
};