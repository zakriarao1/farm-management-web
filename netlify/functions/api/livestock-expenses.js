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
        if (id && !isNaN(id)) {
          const result = await pool.query('SELECT * FROM livestock_expenses WHERE id = $1', [id]);
          return {
            statusCode: 200,
            headers,
            body: JSON.stringify({ data: result.rows[0] || null })
          };
        } else {
          const result = await pool.query('SELECT * FROM livestock_expenses ORDER BY created_at DESC');
          return {
            statusCode: 200,
            headers,
            body: JSON.stringify({ data: result.rows })
          };
        }

      case 'POST':
        const { flock_id, livestock_id, description, category, amount, date, notes } = JSON.parse(event.body);
        
        const insertResult = await pool.query(
          `INSERT INTO livestock_expenses (flock_id, livestock_id, description, category, amount, date, notes) 
           VALUES ($1, $2, $3, $4, $5, $6, $7) 
           RETURNING *`,
          [flock_id, livestock_id, description, category, amount, date, notes]
        );

        return {
          statusCode: 201,
          headers,
          body: JSON.stringify({ data: insertResult.rows[0] })
        };

      case 'PUT':
        if (!id || isNaN(id)) {
          return { statusCode: 400, headers, body: JSON.stringify({ error: 'Invalid ID' }) };
        }

        const updateData = JSON.parse(event.body);
        const updateFields = [];
        const updateValues = [];
        let paramCount = 1;

        const fieldMap = {
          flock_id: 'flock_id',
          livestock_id: 'livestock_id',
          description: 'description',
          category: 'category',
          amount: 'amount',
          date: 'date',
          notes: 'notes'
        };

        Object.keys(updateData).forEach(key => {
          if (updateData[key] !== undefined && fieldMap[key]) {
            updateFields.push(`${fieldMap[key]} = $${paramCount}`);
            updateValues.push(updateData[key]);
            paramCount++;
          }
        });

        if (updateFields.length === 0) {
          return { statusCode: 400, headers, body: JSON.stringify({ error: 'No valid fields to update' }) };
        }

        updateValues.push(id);
        const updateQuery = `UPDATE livestock_expenses SET ${updateFields.join(', ')}, updated_at = CURRENT_TIMESTAMP WHERE id = $${paramCount} RETURNING *`;
        
        const updateResult = await pool.query(updateQuery, updateValues);
        
        if (updateResult.rows.length === 0) {
          return { statusCode: 404, headers, body: JSON.stringify({ error: 'Expense not found' }) };
        }

        return {
          statusCode: 200,
          headers,
          body: JSON.stringify({ data: updateResult.rows[0] })
        };

      case 'DELETE':
        if (!id || isNaN(id)) {
          return { statusCode: 400, headers, body: JSON.stringify({ error: 'Invalid ID' }) };
        }

        const deleteResult = await pool.query('DELETE FROM livestock_expenses WHERE id = $1', [id]);
        
        if (deleteResult.rowCount === 0) {
          return { statusCode: 404, headers, body: JSON.stringify({ error: 'Expense not found' }) };
        }

        return {
          statusCode: 200,
          headers,
          body: JSON.stringify({ message: 'Expense deleted successfully' })
        };

      default:
        return { statusCode: 405, headers, body: JSON.stringify({ error: 'Method not allowed' }) };
    }
  } catch (error) {
    console.error('Livestock Expense API Error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Internal server error' })
    };
  }
};