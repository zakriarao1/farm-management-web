const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

exports.handler = async (event, context) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Content-Type': 'application/json'
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  try {
    const { httpMethod, path } = event;
    const id = path.split('/').pop();

    switch (httpMethod) {
      case 'GET':
        if (path.includes('/crops/') && path.includes('/expenses')) {
          // Get expenses for specific crop
          const cropId = path.split('/')[4];
          const result = await pool.query(
            'SELECT * FROM expenses WHERE crop_id = $1 ORDER BY created_at DESC',
            [cropId]
          );
          return {
            statusCode: 200,
            headers,
            body: JSON.stringify({ data: result.rows })
          };
        } else if (id && !isNaN(id)) {
          // Get expense by ID
          const result = await pool.query('SELECT * FROM expenses WHERE id = $1', [id]);
          return {
            statusCode: 200,
            headers,
            body: JSON.stringify({ data: result.rows[0] || null })
          };
        } else {
          // Get all expenses
          const result = await pool.query('SELECT * FROM expenses ORDER BY created_at DESC');
          return {
            statusCode: 200,
            headers,
            body: JSON.stringify({ data: result.rows })
          };
        }

      case 'POST':
        const { cropId, description, category, amount, date, notes } = JSON.parse(event.body);
        
        const insertResult = await pool.query(
          `INSERT INTO expenses (crop_id, description, category, amount, date, notes) 
           VALUES ($1, $2, $3, $4, $5, $6) 
           RETURNING *`,
          [cropId, description, category, amount, date, notes]
        );

        // Update crop total expenses
        await pool.query(
          'UPDATE crops SET total_expenses = (SELECT COALESCE(SUM(amount), 0) FROM expenses WHERE crop_id = $1) WHERE id = $1',
          [cropId]
        );

        return {
          statusCode: 201,
          headers,
          body: JSON.stringify({ data: insertResult.rows[0] })
        };

      case 'DELETE':
        if (!id || isNaN(id)) {
          return { statusCode: 400, headers, body: JSON.stringify({ error: 'Invalid ID' }) };
        }

        // Get crop_id before deleting to update total
        const expense = await pool.query('SELECT crop_id FROM expenses WHERE id = $1', [id]);
        
        if (expense.rows.length === 0) {
          return { statusCode: 404, headers, body: JSON.stringify({ error: 'Expense not found' }) };
        }

        const cropIdToUpdate = expense.rows[0].crop_id;
        
        await pool.query('DELETE FROM expenses WHERE id = $1', [id]);
        
        // Update crop total expenses
        await pool.query(
          'UPDATE crops SET total_expenses = (SELECT COALESCE(SUM(amount), 0) FROM expenses WHERE crop_id = $1) WHERE id = $1',
          [cropIdToUpdate]
        );

        return {
          statusCode: 200,
          headers,
          body: JSON.stringify({ message: 'Expense deleted successfully' })
        };

      default:
        return { statusCode: 405, headers, body: JSON.stringify({ error: 'Method not allowed' }) };
    }
  } catch (error) {
    console.error('API Error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Internal server error' })
    };
  }
};