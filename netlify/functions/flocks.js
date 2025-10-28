const { pool } = require('./db.js');

exports.handler = async (event) => {
  const { httpMethod, path } = event;
  
  try {
    // GET /flocks - Get all flocks
    if (httpMethod === 'GET' && path.endsWith('/flocks')) {
      const result = await pool.query('SELECT * FROM flocks ORDER BY created_at DESC');
      return {
        statusCode: 200,
        body: JSON.stringify(result.rows)
      };
    }
    
    // POST /flocks - Create new flock
    if (httpMethod === 'POST' && path.endsWith('/flocks')) {
      const { name, type, description } = JSON.parse(event.body);
      const result = await pool.query(
        'INSERT INTO flocks (name, type, description) VALUES ($1, $2, $3) RETURNING *',
        [name, type, description]
      );
      return {
        statusCode: 201,
        body: JSON.stringify(result.rows[0])
      };
    }
    
    // GET /flocks/:id - Get specific flock
    if (httpMethod === 'GET' && path.includes('/flocks/')) {
      const id = path.split('/').pop();
      const result = await pool.query('SELECT * FROM flocks WHERE id = $1', [id]);
      
      if (result.rows.length === 0) {
        return { statusCode: 404, body: JSON.stringify({ error: 'Flock not found' }) };
      }
      
      return {
        statusCode: 200,
        body: JSON.stringify(result.rows[0])
      };
    }
    
    return { statusCode: 404, body: JSON.stringify({ error: 'Route not found' }) };
    
  } catch (error) {
    console.error('Database error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message })
    };
  }
};