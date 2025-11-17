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
    const { livestockId, flockId, startDate, endDate } = queryStringParameters || {};

    switch (httpMethod) {
      case 'GET':
        // Get health records with filtering options
        if (id && !isNaN(id)) {
          const result = await pool.query(`
            SELECT hr.*, 
                   l.tag_number as livestock_tag,
                   l.animal_type as livestock_type,
                   f.name as flock_name
            FROM health_records hr
            LEFT JOIN livestock l ON hr.livestock_id = l.id
            LEFT JOIN flocks f ON l.flock_id = f.id
            WHERE hr.id = $1
          `, [id]);
          
          return {
            statusCode: 200,
            headers,
            body: JSON.stringify({ data: result.rows[0] || null })
          };
        } else {
          let query = `
            SELECT hr.*, 
                   l.tag_number as livestock_tag,
                   l.animal_type as livestock_type,
                   l.breed as livestock_breed,
                   f.name as flock_name
            FROM health_records hr
            LEFT JOIN livestock l ON hr.livestock_id = l.id
            LEFT JOIN flocks f ON l.flock_id = f.id
            WHERE 1=1
          `;
          const params = [];
          let paramCount = 1;

          if (livestockId) {
            query += ` AND hr.livestock_id = $${paramCount}`;
            params.push(livestockId);
            paramCount++;
          }

          if (flockId) {
            query += ` AND l.flock_id = $${paramCount}`;
            params.push(flockId);
            paramCount++;
          }

          if (startDate) {
            query += ` AND hr.record_date >= $${paramCount}`;
            params.push(startDate);
            paramCount++;
          }

          if (endDate) {
            query += ` AND hr.record_date <= $${paramCount}`;
            params.push(endDate);
            paramCount++;
          }

          query += ' ORDER BY hr.record_date DESC, hr.created_at DESC';

          const result = await pool.query(query, params);
          
          return {
            statusCode: 200,
            headers,
            body: JSON.stringify({ data: result.rows })
          };
        }

      case 'POST':
        const { 
          livestock_id, record_date, health_status, diagnosis, 
          treatment, medication, dosage, veterinarian, cost, notes 
        } = JSON.parse(event.body);
        
        // Validate required fields
        if (!livestock_id || !record_date || !health_status) {
          return { 
            statusCode: 400, 
            headers, 
            body: JSON.stringify({ error: 'Livestock ID, record date, and health status are required' }) 
          };
        }

        const insertResult = await pool.query(
          `INSERT INTO health_records (
            livestock_id, record_date, health_status, diagnosis, 
            treatment, medication, dosage, veterinarian, cost, notes
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) 
           RETURNING *`,
          [
            livestock_id, 
            record_date, 
            health_status, 
            diagnosis || '', 
            treatment || '', 
            medication || '', 
            dosage || '', 
            veterinarian || '', 
            cost || 0, 
            notes || ''
          ]
        );

        // Update the livestock's health status if it's different from current
        if (health_status) {
          await pool.query(
            'UPDATE livestock SET health_status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
            [health_status, livestock_id]
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
          livestock_id: 'livestock_id',
          record_date: 'record_date',
          health_status: 'health_status',
          diagnosis: 'diagnosis',
          treatment: 'treatment',
          medication: 'medication',
          dosage: 'dosage',
          veterinarian: 'veterinarian',
          cost: 'cost',
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
        const updateQuery = `UPDATE health_records SET ${updateFields.join(', ')}, updated_at = CURRENT_TIMESTAMP WHERE id = $${paramCount} RETURNING *`;
        
        const updateResult = await pool.query(updateQuery, updateValues);
        
        if (updateResult.rows.length === 0) {
          return { statusCode: 404, headers, body: JSON.stringify({ error: 'Health record not found' }) };
        }

        // Update livestock health status if health_status was modified
        if (updateData.health_status) {
          const record = await pool.query('SELECT livestock_id FROM health_records WHERE id = $1', [id]);
          if (record.rows.length > 0) {
            await pool.query(
              'UPDATE livestock SET health_status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
              [updateData.health_status, record.rows[0].livestock_id]
            );
          }
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

        const deleteResult = await pool.query('DELETE FROM health_records WHERE id = $1', [id]);
        
        if (deleteResult.rowCount === 0) {
          return { statusCode: 404, headers, body: JSON.stringify({ error: 'Health record not found' }) };
        }

        return {
          statusCode: 200,
          headers,
          body: JSON.stringify({ message: 'Health record deleted successfully' })
        };

      default:
        return { statusCode: 405, headers, body: JSON.stringify({ error: 'Method not allowed' }) };
    }
  } catch (error) {
    console.error('Health Records API Error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Internal server error: ' + error.message })
    };
  }
};