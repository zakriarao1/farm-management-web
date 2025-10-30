const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

exports.handler = async (event, context) => {
  // CORS headers
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Content-Type': 'application/json'
  };

  // Handle preflight
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  try {
    const { httpMethod, path } = event;
    const id = path.split('/').pop();

    switch (httpMethod) {
      case 'GET':
        if (id && !isNaN(id)) {
          // Get crop by ID
          const result = await pool.query('SELECT * FROM crops WHERE id = $1', [id]);
          return {
            statusCode: 200,
            headers,
            body: JSON.stringify({ data: result.rows[0] || null })
          };
        } else {
          // Get all crops
          const result = await pool.query('SELECT * FROM crops ORDER BY created_at DESC');
          return {
            statusCode: 200,
            headers,
            body: JSON.stringify({ data: result.rows })
          };
        }

      case 'POST':
        const { name, type, variety, plantingDate, expectedHarvestDate, area, areaUnit, expectedYield, yieldUnit, marketPrice, status, fieldLocation, notes } = JSON.parse(event.body);
        
        const insertResult = await pool.query(
          `INSERT INTO crops (name, type, variety, planting_date, expected_harvest_date, area, area_unit, expected_yield, yield_unit, market_price, status, field_location, notes) 
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13) 
           RETURNING *`,
          [name, type, variety, plantingDate, expectedHarvestDate, area, areaUnit, expectedYield, yieldUnit, marketPrice, status, fieldLocation, notes]
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

        // Convert camelCase to snake_case for database
        const fieldMap = {
          name: 'name',
          type: 'type',
          variety: 'variety',
          plantingDate: 'planting_date',
          expectedHarvestDate: 'expected_harvest_date',
          actualHarvestDate: 'actual_harvest_date',
          area: 'area',
          areaUnit: 'area_unit',
          expectedYield: 'expected_yield',
          actualYield: 'actual_yield',
          yieldUnit: 'yield_unit',
          marketPrice: 'market_price',
          totalExpenses: 'total_expenses',
          status: 'status',
          fieldLocation: 'field_location',
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
        const updateQuery = `UPDATE crops SET ${updateFields.join(', ')}, updated_at = CURRENT_TIMESTAMP WHERE id = $${paramCount} RETURNING *`;
        
        const updateResult = await pool.query(updateQuery, updateValues);
        
        if (updateResult.rows.length === 0) {
          return { statusCode: 404, headers, body: JSON.stringify({ error: 'Crop not found' }) };
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

        await pool.query('DELETE FROM expenses WHERE crop_id = $1', [id]);
        const deleteResult = await pool.query('DELETE FROM crops WHERE id = $1', [id]);
        
        if (deleteResult.rowCount === 0) {
          return { statusCode: 404, headers, body: JSON.stringify({ error: 'Crop not found' }) };
        }

        return {
          statusCode: 200,
          headers,
          body: JSON.stringify({ message: 'Crop deleted successfully' })
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