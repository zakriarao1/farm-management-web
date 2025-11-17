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
    // Test database connection
    await pool.query('SELECT 1');
    
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ 
        status: 'OK', 
        message: 'Farm Management API is running',
        database: 'Neon PostgreSQL',
        timestamp: new Date().toISOString()
      })
    };
  } catch (error) {
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ 
        status: 'ERROR', 
        error: 'Database connection failed',
        timestamp: new Date().toISOString()
      })
    };
  }
};