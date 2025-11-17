const { pool, testConnection } = require('./db');

exports.handler = async (event, context) => {
  // CORS headers
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, x-api-key',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Content-Type': 'application/json'
  };

  // Handle preflight
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  // Test database connection first
  try {
    await testConnection();
  } catch (error) {
    console.error('❌ Database connection failed:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ 
        error: 'Database connection failed',
        details: process.env.NODE_ENV === 'development' ? error.message : 'Please check your database configuration'
      })
    };
  }

  try {
    const { httpMethod, path } = event;
    const pathParts = path.split('/').filter(part => part);
    const id = pathParts[pathParts.length - 1];

    console.log(`🌱 Crops API: ${httpMethod} ${path}, ID: ${id}`);

    switch (httpMethod) {
      case 'GET':
        if (id && !isNaN(id)) {
          // Get crop by ID
          console.log(`📖 Fetching crop with ID: ${id}`);
          const result = await pool.query('SELECT * FROM crops WHERE id = $1', [id]);
          
          if (result.rows.length === 0) {
            return {
              statusCode: 404,
              headers,
              body: JSON.stringify({ error: 'Crop not found' })
            };
          }
          
          return {
            statusCode: 200,
            headers,
            body: JSON.stringify({ 
              data: result.rows[0],
              message: 'Crop retrieved successfully'
            })
          };
        } else {
          // Get all crops
          console.log('📖 Fetching all crops');
          const result = await pool.query('SELECT * FROM crops ORDER BY created_at DESC');
          return {
            statusCode: 200,
            headers,
            body: JSON.stringify({ 
              data: result.rows,
              message: 'Crops retrieved successfully'
            })
          };
        }

      case 'POST':
        console.log('🆕 Creating new crop');
        const { 
          name, 
          type, 
          variety, 
          plantingDate, 
          expectedHarvestDate, 
          area, 
          areaUnit, 
          expectedYield, 
          yieldUnit, 
          marketPrice, 
          status, 
          fieldLocation, 
          notes 
        } = JSON.parse(event.body || '{}');
        
        // Validate required fields
        if (!name || !type || !plantingDate) {
          return {
            statusCode: 400,
            headers,
            body: JSON.stringify({ error: 'Name, type, and planting date are required' })
          };
        }

        const insertResult = await pool.query(
          `INSERT INTO crops (
            name, type, variety, planting_date, expected_harvest_date, 
            area, area_unit, expected_yield, yield_unit, market_price, 
            status, field_location, notes
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13) 
          RETURNING *`,
          [
            name, type, variety, plantingDate, expectedHarvestDate,
            area || 0, areaUnit || 'ACRES', expectedYield || 0, yieldUnit || 'TONS',
            marketPrice || 0, status || 'PLANNED', fieldLocation, notes
          ]
        );

        return {
          statusCode: 201,
          headers,
          body: JSON.stringify({ 
            data: insertResult.rows[0],
            message: 'Crop created successfully'
          })
        };

      case 'PUT':
        if (!id || isNaN(id)) {
          return { 
            statusCode: 400, 
            headers, 
            body: JSON.stringify({ error: 'Invalid crop ID' }) 
          };
        }

        console.log(`✏️ Updating crop with ID: ${id}`);
        const updateData = JSON.parse(event.body || '{}');
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
          return { 
            statusCode: 400, 
            headers, 
            body: JSON.stringify({ error: 'No valid fields to update' }) 
          };
        }

        updateValues.push(id);
        const updateQuery = `
          UPDATE crops 
          SET ${updateFields.join(', ')}, updated_at = CURRENT_TIMESTAMP 
          WHERE id = $${paramCount} 
          RETURNING *
        `;
        
        const updateResult = await pool.query(updateQuery, updateValues);
        
        if (updateResult.rows.length === 0) {
          return { 
            statusCode: 404, 
            headers, 
            body: JSON.stringify({ error: 'Crop not found' }) 
          };
        }

        return {
          statusCode: 200,
          headers,
          body: JSON.stringify({ 
            data: updateResult.rows[0],
            message: 'Crop updated successfully'
          })
        };

      case 'DELETE':
        if (!id || isNaN(id)) {
          return { 
            statusCode: 400, 
            headers, 
            body: JSON.stringify({ error: 'Invalid crop ID' }) 
          };
        }

        console.log(`🗑️ Deleting crop with ID: ${id}`);
        
        // Check if crop exists first
        const existingCrop = await pool.query('SELECT id FROM crops WHERE id = $1', [id]);
        if (existingCrop.rows.length === 0) {
          return { 
            statusCode: 404, 
            headers, 
            body: JSON.stringify({ error: 'Crop not found' }) 
          };
        }

        // Delete related expenses first (if any)
        await pool.query('DELETE FROM expenses WHERE crop_id = $1', [id]);
        
        // Delete the crop
        const deleteResult = await pool.query('DELETE FROM crops WHERE id = $1', [id]);
        
        if (deleteResult.rowCount === 0) {
          return { 
            statusCode: 404, 
            headers, 
            body: JSON.stringify({ error: 'Crop not found' }) 
          };
        }

        return {
          statusCode: 200,
          headers,
          body: JSON.stringify({ 
            message: 'Crop deleted successfully'
          })
        };

      default:
        return { 
          statusCode: 405, 
          headers, 
          body: JSON.stringify({ error: 'Method not allowed' }) 
        };
    }
  } catch (error) {
    console.error('❌ Crops API Error:', error);
    
    // Provide more specific error messages
    let errorMessage = 'Internal server error';
    if (error.message.includes('connection') || error.message.includes('ECONNREFUSED')) {
      errorMessage = 'Database connection failed';
    } else if (error.message.includes('relation "crops" does not exist')) {
      errorMessage = 'Crops table does not exist. Please run migration.';
    } else if (error.message.includes('violates foreign key constraint')) {
      errorMessage = 'Data integrity error';
    }

    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ 
        error: errorMessage,
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      })
    };
  }
};