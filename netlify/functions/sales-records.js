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
    const { httpMethod, path, queryStringParameters } = event;
    const id = path.split('/').pop();
    const { flockId, livestockId, startDate, endDate } = queryStringParameters || {};

    switch (httpMethod) {
      case 'GET':
        // Get sales with filtering options
        if (id && !isNaN(id)) {
          const result = await pool.query(`
            SELECT sr.*, 
                   f.name as flock_name,
                   l.tag_number as livestock_tag,
                   l.animal_type as livestock_type
            FROM sales_records sr
            LEFT JOIN flocks f ON sr.flock_id = f.id
            LEFT JOIN livestock l ON sr.livestock_id = l.id
            WHERE sr.id = $1
          `, [id]);
          
          return {
            statusCode: 200,
            headers,
            body: JSON.stringify({ data: result.rows[0] || null })
          };
        } else {
          let query = `
            SELECT sr.*, 
                   f.name as flock_name,
                   l.tag_number as livestock_tag,
                   l.animal_type as livestock_type
            FROM sales_records sr
            LEFT JOIN flocks f ON sr.flock_id = f.id
            LEFT JOIN livestock l ON sr.livestock_id = l.id
            WHERE 1=1
          `;
          const params = [];
          let paramCount = 1;

          if (flockId) {
            query += ` AND sr.flock_id = $${paramCount}`;
            params.push(flockId);
            paramCount++;
          }

          if (livestockId) {
            query += ` AND sr.livestock_id = $${paramCount}`;
            params.push(livestockId);
            paramCount++;
          }

          if (startDate) {
            query += ` AND sr.sale_date >= $${paramCount}`;
            params.push(startDate);
            paramCount++;
          }

          if (endDate) {
            query += ` AND sr.sale_date <= $${paramCount}`;
            params.push(endDate);
            paramCount++;
          }

          query += ' ORDER BY sr.sale_date DESC, sr.created_at DESC';

          const result = await pool.query(query, params);
          
          return {
            statusCode: 200,
            headers,
            body: JSON.stringify({ data: result.rows })
          };
        }

      case 'POST':
        const { 
          sale_type, flock_id, livestock_id, sale_date, description, 
          quantity, unit_price, total_amount, customer_name, 
          customer_contact, payment_method, notes 
        } = JSON.parse(event.body);
        
        // Validate required fields
        if (!sale_type || !sale_date || !description || !quantity || !unit_price || !payment_method) {
          return { 
            statusCode: 400, 
            headers, 
            body: JSON.stringify({ error: 'Required fields missing' }) 
          };
        }

        // For animal sales, validate livestock_id
        if (sale_type === 'animal' && !livestock_id) {
          return { 
            statusCode: 400, 
            headers, 
            body: JSON.stringify({ error: 'Livestock ID is required for animal sales' }) 
          };
        }

        const calculatedTotal = quantity * unit_price;

        const insertResult = await pool.query(
          `INSERT INTO sales_records (
            sale_type, flock_id, livestock_id, sale_date, description, 
            quantity, unit_price, total_amount, customer_name, 
            customer_contact, payment_method, notes
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12) 
           RETURNING *`,
          [
            sale_type, 
            flock_id || null, 
            livestock_id || null, 
            sale_date, 
            description, 
            quantity, 
            unit_price, 
            calculatedTotal, 
            customer_name || '', 
            customer_contact || '', 
            payment_method, 
            notes || ''
          ]
        );

        // If this is an animal sale, update the livestock status to SOLD
        if (sale_type === 'animal' && livestock_id) {
          await pool.query(
            'UPDATE livestock SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
            ['SOLD', livestock_id]
          );
        }

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
          sale_type: 'sale_type',
          flock_id: 'flock_id',
          livestock_id: 'livestock_id',
          sale_date: 'sale_date',
          description: 'description',
          quantity: 'quantity',
          unit_price: 'unit_price',
          total_amount: 'total_amount',
          customer_name: 'customer_name',
          customer_contact: 'customer_contact',
          payment_method: 'payment_method',
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

        // Recalculate total if quantity or unit_price are updated
        if (updateData.quantity !== undefined || updateData.unit_price !== undefined) {
          const currentData = await pool.query('SELECT quantity, unit_price FROM sales_records WHERE id = $1', [id]);
          const currentRecord = currentData.rows[0];
          
          const newQuantity = updateData.quantity !== undefined ? updateData.quantity : currentRecord.quantity;
          const newUnitPrice = updateData.unit_price !== undefined ? updateData.unit_price : currentRecord.unit_price;
          const newTotal = newQuantity * newUnitPrice;
          
          updateFields.push('total_amount = $' + paramCount);
          updateValues.push(newTotal);
          paramCount++;
        }

        updateValues.push(id);
        const updateQuery = `UPDATE sales_records SET ${updateFields.join(', ')}, updated_at = CURRENT_TIMESTAMP WHERE id = $${paramCount} RETURNING *`;
        
        const updateResult = await pool.query(updateQuery, updateValues);
        
        if (updateResult.rows.length === 0) {
          return { statusCode: 404, headers, body: JSON.stringify({ error: 'Sales record not found' }) };
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

        // Get the record first to check if it's an animal sale
        const recordResult = await pool.query('SELECT sale_type, livestock_id FROM sales_records WHERE id = $1', [id]);
        if (recordResult.rows.length === 0) {
          return { statusCode: 404, headers, body: JSON.stringify({ error: 'Sales record not found' }) };
        }

        const record = recordResult.rows[0];

        // If this was an animal sale, revert the livestock status
        if (record.sale_type === 'animal' && record.livestock_id) {
          await pool.query(
            'UPDATE livestock SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
            ['HEALTHY', record.livestock_id]
          );
        }

        const deleteResult = await pool.query('DELETE FROM sales_records WHERE id = $1', [id]);
        
        if (deleteResult.rowCount === 0) {
          return { statusCode: 404, headers, body: JSON.stringify({ error: 'Sales record not found' }) };
        }

        return {
          statusCode: 200,
          headers,
          body: JSON.stringify({ message: 'Sales record deleted successfully' })
        };

      default:
        return { statusCode: 405, headers, body: JSON.stringify({ error: 'Method not allowed' }) };
    }
  } catch (error) {
    console.error('Sales Records API Error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Internal server error: ' + error.message })
    };
  }
};