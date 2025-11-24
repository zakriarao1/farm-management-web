const { Pool } = require('pg');

console.log('🌱 Crops function loaded');

// Create database pool directly for better reliability
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
  max: 5,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
});

// Test connection function
const testConnection = async () => {
  try {
    console.log('🔍 Testing database connection...');
    const client = await pool.connect();
    const result = await client.query('SELECT NOW() as current_time');
    console.log('✅ Database connection successful');
    client.release();
    return true;
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
    throw error;
  }
};

// Ensure crops table exists
const ensureCropsTable = async () => {
  try {
    console.log('📋 Checking crops table...');
    await pool.query('SELECT 1 FROM crops LIMIT 1');
    console.log('✅ Crops table exists');
    return true;
  } catch (error) {
    if (error.message.includes('relation "crops" does not exist')) {
      console.log('🔄 Creating crops table...');
      try {
        await pool.query(`
          CREATE TABLE crops (
            id SERIAL PRIMARY KEY,
            name VARCHAR(255) NOT NULL,
            planting_date DATE NOT NULL,
            harvest_date DATE,
            area DECIMAL(10,2) DEFAULT 0,
            area_unit VARCHAR(20) DEFAULT 'ACRES',
            yield DECIMAL(10,2) DEFAULT 0,
            yield_unit VARCHAR(20) DEFAULT 'TONS',
            market_price DECIMAL(10,2) DEFAULT 0,
            total_expenses DECIMAL(10,2) DEFAULT 0,
            status VARCHAR(50) DEFAULT 'PLANNED',
            notes TEXT,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
          )
        `);
        console.log('✅ Crops table created successfully');
        
        // Add sample data
        await pool.query(`
          INSERT INTO crops (name, planting_date, area, status) VALUES
          ('Wheat Field', '2024-01-15', 5.0, 'GROWING'),
          ('Corn Field', '2024-01-20', 3.5, 'PLANTED')
          ON CONFLICT DO NOTHING
        `);
        console.log('✅ Sample crops data added');
        
        return true;
      } catch (createError) {
        console.error('❌ Failed to create crops table:', createError);
        throw createError;
      }
    }
    throw error;
  }
};

exports.handler = async (event, context) => {
  console.log('🚀 Crops function started:', event.httpMethod, event.path);
  
  // CORS headers
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, x-api-key',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Content-Type': 'application/json'
  };

  // Handle preflight
  if (event.httpMethod === 'OPTIONS') {
    console.log('✅ Handled OPTIONS preflight');
    return { statusCode: 200, headers, body: '' };
  }

  try {
    // Test database connection
    console.log('🔍 Testing database connection...');
    await testConnection();
    console.log('✅ Database connection successful');

    // Ensure crops table exists
    console.log('🔍 Ensuring crops table exists...');
    await ensureCropsTable();
    console.log('✅ Crops table ready');

    const { httpMethod, path, body } = event;
    const pathParts = path.split('/').filter(part => part);
    const id = pathParts[pathParts.length - 1];

    console.log(`🌱 Processing: ${httpMethod} ${path}, ID: ${id}`);

    switch (httpMethod) {
      case 'GET':
        if (id && !isNaN(id)) {
          // Get crop by ID
          console.log(`📖 Fetching crop with ID: ${id}`);
          const result = await pool.query('SELECT * FROM crops WHERE id = $1', [id]);
          
          if (result.rows.length === 0) {
            console.log('❌ Crop not found:', id);
            return {
              statusCode: 404,
              headers,
              body: JSON.stringify({ error: 'Crop not found' })
            };
          }
          
          console.log('✅ Crop retrieved successfully');
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
          console.log(`✅ Retrieved ${result.rows.length} crops`);
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
        
        if (!body) {
          return {
            statusCode: 400,
            headers,
            body: JSON.stringify({ error: 'Request body is required' })
          };
        }

        let postData;
        try {
          postData = JSON.parse(body);
        } catch (parseError) {
          console.error('❌ Failed to parse JSON:', parseError);
          return {
            statusCode: 400,
            headers,
            body: JSON.stringify({ error: 'Invalid JSON in request body' })
          };
        }

        const { 
          name, 
          plantingDate, 
          area, 
          areaUnit, 
          status, 
          notes,
          harvestDate,
          yield: yieldAmount,
          yieldUnit,
          marketPrice,
          totalExpenses
        } = postData;
        
        console.log('📦 Received crop data:', {
          name,
          plantingDate,
          area,
          areaUnit,
          status,
          notes: notes ? `${notes.substring(0, 50)}...` : 'None'
        });

        // Validate required fields
        if (!name || !plantingDate) {
          console.error('❌ Missing required fields:', { name, plantingDate });
          return {
            statusCode: 400,
            headers,
            body: JSON.stringify({ 
              error: 'Name and planting date are required',
              received: { name, plantingDate }
            })
          };
        }

        const insertResult = await pool.query(
          `INSERT INTO crops (
            name, planting_date, area, area_unit, status, notes,
            harvest_date, yield, yield_unit, market_price, total_expenses
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) 
          RETURNING *`,
          [
            name, 
            plantingDate, 
            area || 0, 
            areaUnit || 'ACRES', 
            status || 'PLANNED', 
            notes || '',
            harvestDate || null, 
            yieldAmount || 0,
            yieldUnit || 'TONS', 
            marketPrice || 0, 
            totalExpenses || 0
          ]
        );

        console.log('✅ Crop created successfully with ID:', insertResult.rows[0].id);

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
        
        if (!body) {
          return {
            statusCode: 400,
            headers,
            body: JSON.stringify({ error: 'Request body is required for update' })
          };
        }

        let updateData;
        try {
          updateData = JSON.parse(body);
        } catch (parseError) {
          return {
            statusCode: 400,
            headers,
            body: JSON.stringify({ error: 'Invalid JSON in request body' })
          };
        }

        console.log('📦 Update data:', updateData);

        const updateFields = [];
        const updateValues = [];
        let paramCount = 1;

        // Convert camelCase to snake_case for database
        const fieldMap = {
          name: 'name',
          plantingDate: 'planting_date',
          harvestDate: 'harvest_date',
          area: 'area',
          areaUnit: 'area_unit',
          yield: 'yield',
          yieldUnit: 'yield_unit',
          marketPrice: 'market_price',
          totalExpenses: 'total_expenses',
          status: 'status',
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
        
        console.log('🔧 Executing update query:', updateQuery);
        console.log('📊 With values:', updateValues);

        const updateResult = await pool.query(updateQuery, updateValues);
        
        if (updateResult.rows.length === 0) {
          console.log('❌ Crop not found for update:', id);
          return { 
            statusCode: 404, 
            headers, 
            body: JSON.stringify({ error: 'Crop not found' }) 
          };
        }

        console.log('✅ Crop updated successfully');
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
        const existingCrop = await pool.query('SELECT id, name FROM crops WHERE id = $1', [id]);
        if (existingCrop.rows.length === 0) {
          console.log('❌ Crop not found for deletion:', id);
          return { 
            statusCode: 404, 
            headers, 
            body: JSON.stringify({ error: 'Crop not found' }) 
          };
        }

        console.log('📋 Found crop to delete:', existingCrop.rows[0].name);

        // Delete related expenses first (if any)
        try {
          await pool.query('DELETE FROM expenses WHERE crop_id = $1', [id]);
          console.log('✅ Related expenses deleted (if any)');
        } catch (expenseError) {
          console.log('ℹ️ No expenses table or no related expenses');
        }
        
        // Delete the crop
        const deleteResult = await pool.query('DELETE FROM crops WHERE id = $1', [id]);
        
        if (deleteResult.rowCount === 0) {
          console.log('❌ Failed to delete crop:', id);
          return { 
            statusCode: 404, 
            headers, 
            body: JSON.stringify({ error: 'Crop not found' }) 
          };
        }

        console.log('✅ Crop deleted successfully');
        return {
          statusCode: 200,
          headers,
          body: JSON.stringify({ 
            message: 'Crop deleted successfully'
          })
        };

      default:
        console.log('❌ Method not allowed:', httpMethod);
        return { 
          statusCode: 405, 
          headers, 
          body: JSON.stringify({ error: 'Method not allowed' }) 
        };
    }

  } catch (error) {
    console.error('❌ Crops API Error:', error);
    
    // Provide specific error messages
    let errorMessage = 'Internal server error';
    let statusCode = 500;

    if (error.message.includes('connection') || error.message.includes('ECONNREFUSED')) {
      errorMessage = 'Database connection failed';
    } else if (error.message.includes('relation "crops" does not exist')) {
      errorMessage = 'Crops table does not exist';
    } else if (error.message.includes('violates foreign key constraint')) {
      errorMessage = 'Data integrity error';
      statusCode = 400;
    } else if (error.message.includes('invalid input syntax')) {
      errorMessage = 'Invalid data format';
      statusCode = 400;
    }

    return {
      statusCode,
      headers,
      body: JSON.stringify({ 
        error: errorMessage,
        details: process.env.NODE_ENV === 'development' ? error.message : undefined,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
      })
    };
  } finally {
    // Note: Don't close the pool here as it's shared across requests
    console.log('🏁 Crops function completed');
  }
};