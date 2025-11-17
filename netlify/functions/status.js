const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

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
    // Test database with actual counts
    const [livestockCount, flocksCount, healthCount] = await Promise.all([
      pool.query('SELECT COUNT(*) FROM livestock'),
      pool.query('SELECT COUNT(*) FROM flocks'),
      pool.query('SELECT COUNT(*) FROM health_records')
    ]);

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ 
        status: 'OK', 
        message: 'Farm Management API is running',
        database: {
          connected: true,
          livestock: parseInt(livestockCount.rows[0].count),
          flocks: parseInt(flocksCount.rows[0].count),
          health_records: parseInt(healthCount.rows[0].count)
        },
        timestamp: new Date().toISOString(),
        version: '1.0.0'
      })
    };
  } catch (error) {
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ 
        status: 'ERROR', 
        error: 'Database connection failed',
        details: error.message,
        timestamp: new Date().toISOString()
      })
    };
  }
};