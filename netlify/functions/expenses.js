// netlify/functions/expenses.js
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

// Function to create expenses table if it doesn't exist
const ensureExpensesTableExists = async () => {
  try {
    const tableCheck = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'expenses'
      );
    `);
    
    if (!tableCheck.rows[0].exists) {
      console.log('💰 Creating expenses table...');
      
      // Create table without foreign key first (safer)
      await pool.query(`
        CREATE TABLE expenses (
          id SERIAL PRIMARY KEY,
          crop_id INTEGER,
          category VARCHAR(100) NOT NULL,
          description TEXT NOT NULL,
          amount DECIMAL(10,2) NOT NULL,
          date DATE NOT NULL DEFAULT CURRENT_DATE,
          notes TEXT,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        )
      `);
      
      console.log('✅ Expenses table created successfully');
    } else {
      console.log('✅ Expenses table already exists');
    }
  } catch (error) {
    console.error('❌ Error ensuring expenses table exists:', error);
  }
};
const path = require('path');
const filename = path.basename(__filename);

console.log(`🚀 ${filename} called for: ${event.path}`);
console.log(`🔍 ${filename} - Request method: ${event.httpMethod}`);

// Add a special marker for /crops/:id/expenses routes
if (event.path.includes('/crops/') && event.path.includes('/expenses')) {
  console.log(`🎯 ${filename} - DETECTED /crops/:id/expenses route!`);
  console.log(`🎯 ${filename} - I will handle this request`);
}
exports.handler = async (event, context) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, x-api-key',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Content-Type': 'application/json'
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  try {
    // Ensure table exists
    await ensureExpensesTableExists();

    const { httpMethod, path, body, queryStringParameters } = event;
    const pathParts = path.split('/').filter(part => part);
    
    console.log(`💰 Expenses API: ${httpMethod} ${path}`);
    console.log(`📁 Path parts:`, pathParts);
    console.log(`📦 Request body:`, body);

    // Handle /crops/:id/expenses route
    if (path.includes('/crops/') && path.includes('/expenses')) {
      const cropIndex = pathParts.indexOf('crops');
      const cropId = pathParts[cropIndex + 1];
      
      console.log(`🌱 Handling crop expenses for crop ID: ${cropId}`);

      if (!cropId || isNaN(cropId)) {
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({ error: 'Invalid crop ID' })
        };
      }

      switch (httpMethod) {
        case 'GET':
          console.log(`📖 Fetching ALL expenses for crop ID: ${cropId}`);
          
          try {
            const result = await pool.query(
              'SELECT * FROM expenses WHERE crop_id = $1 ORDER BY date DESC, created_at DESC',
              [cropId]
            );
            
            console.log(`✅ Query returned ${result.rows.length} expenses for crop ${cropId}`);
            
            return {
              statusCode: 200,
              headers,
              body: JSON.stringify({ 
                data: result.rows,
                message: 'Expenses retrieved successfully'
              })
            };
          } catch (queryError) {
            console.error('❌ Query error:', queryError);
            return {
              statusCode: 200,
              headers,
              body: JSON.stringify({ 
                data: [],
                message: 'No expenses found'
              })
            };
          }
          
        case 'POST':
          // Create expense for specific crop
          console.log(`🆕 Creating expense for crop ID: ${cropId}`);
          let requestBody;
          try {
            requestBody = JSON.parse(body || '{}');
          } catch (parseError) {
            return {
              statusCode: 400,
              headers,
              body: JSON.stringify({ error: 'Invalid JSON in request body' })
            };
          }
          
          const { description, category, amount, date, notes } = requestBody;
          
          // Validate required fields
          if (!description || !category || !amount) {
            return {
              statusCode: 400,
              headers,
              body: JSON.stringify({ error: 'Description, category, and amount are required' })
            };
          }

          // Validate amount is positive
          const parsedAmount = parseFloat(amount);
          if (isNaN(parsedAmount) || parsedAmount <= 0) {
            return {
              statusCode: 400,
              headers,
              body: JSON.stringify({ error: 'Amount must be greater than 0' })
            };
          }

          try {
            const insertResult = await pool.query(
              `INSERT INTO expenses (crop_id, description, category, amount, date, notes) 
               VALUES ($1, $2, $3, $4, $5, $6) 
               RETURNING *`,
              [
                cropId, 
                description.trim(), 
                category, 
                parsedAmount, 
                date || new Date().toISOString().split('T')[0], 
                notes || ''
              ]
            );

            console.log(`✅ Expense created with ID: ${insertResult.rows[0].id}`);

            return {
              statusCode: 201,
              headers,
              body: JSON.stringify({ 
                data: insertResult.rows[0],
                message: 'Expense created successfully'
              })
            };
          } catch (dbError) {
            console.error('❌ Database error:', dbError);
            return {
              statusCode: 500,
              headers,
              body: JSON.stringify({ 
                error: 'Failed to create expense',
                details: dbError.message
              })
            };
          }

        default:
          return { 
            statusCode: 405, 
            headers, 
            body: JSON.stringify({ error: 'Method not allowed' }) 
          };
      }
    }

    // Handle expense by ID (e.g., /expenses/123)
    const id = pathParts.length > 1 && !isNaN(pathParts[pathParts.length - 1]) 
      ? pathParts[pathParts.length - 1] 
      : null;

    console.log(`🔍 Processing expense ID: ${id}`);

    // Main switch for /expenses routes
    switch (httpMethod) {
      case 'GET':
        if (id && !isNaN(id)) {
          // GET /expenses/:id
          console.log(`📖 Fetching expense with ID: ${id}`);
          try {
            const result = await pool.query('SELECT * FROM expenses WHERE id = $1', [id]);
            
            if (result.rows.length === 0) {
              return {
                statusCode: 404,
                headers,
                body: JSON.stringify({ error: 'Expense not found' })
              };
            }
            
            return {
              statusCode: 200,
              headers,
              body: JSON.stringify({ 
                data: result.rows[0],
                message: 'Expense retrieved successfully'
              })
            };
          } catch (queryError) {
            console.error('❌ Query error:', queryError);
            return {
              statusCode: 404,
              headers,
              body: JSON.stringify({ error: 'Expense not found' })
            };
          }
        } else {
          // GET /expenses (all expenses)
          console.log('📊 Fetching all expenses');
          
          try {
            const result = await pool.query(`
              SELECT * FROM expenses 
              ORDER BY date DESC, created_at DESC
              LIMIT 100
            `);
            
            console.log(`✅ Found ${result.rows.length} expenses`);
            
            return {
              statusCode: 200,
              headers,
              body: JSON.stringify({ 
                data: result.rows,
                message: 'Expenses retrieved successfully'
              })
            };
          } catch (queryError) {
            console.error('❌ Query error:', queryError);
            return {
              statusCode: 200,
              headers,
              body: JSON.stringify({ 
                data: [],
                message: 'No expenses found'
              })
            };
          }
        }

      case 'POST':
        // POST /expenses (create new expense)
        console.log('🆕 Creating new expense via POST /expenses');
        let postData;
        try {
          postData = JSON.parse(body || '{}');
          console.log('📝 Parsed request data:', postData);
        } catch (parseError) {
          console.error('❌ JSON parse error:', parseError);
          return {
            statusCode: 400,
            headers,
            body: JSON.stringify({ error: 'Invalid JSON in request body' })
          };
        }
        
        // Handle both camelCase and snake_case
        const cropId = postData.crop_id || postData.cropId;
        const { description, category, amount, date, notes } = postData;
        
        console.log('🔍 Processed fields:', {
          cropId,
          description,
          category,
          amount,
          date,
          notes
        });
        
        // Validate required fields
        if (!cropId || !description || !category || !amount) {
          console.error('❌ Missing required fields:', { cropId, description, category, amount });
          return {
            statusCode: 400,
            headers,
            body: JSON.stringify({ 
              error: 'Crop ID, description, category, and amount are required',
              received: { cropId, description, category, amount }
            })
          };
        }

        // Validate amount is positive
        const parsedAmount = parseFloat(amount);
        if (isNaN(parsedAmount) || parsedAmount <= 0) {
          console.error('❌ Invalid amount:', amount);
          return {
            statusCode: 400,
            headers,
            body: JSON.stringify({ error: 'Amount must be a valid positive number' })
          };
        }

        try {
          console.log('💾 Inserting into database...');
          const postResult = await pool.query(
            `INSERT INTO expenses (crop_id, description, category, amount, date, notes) 
             VALUES ($1, $2, $3, $4, $5, $6) 
             RETURNING *`,
            [
              cropId, 
              description.trim(), 
              category, 
              parsedAmount, 
              date || new Date().toISOString().split('T')[0], 
              notes || ''
            ]
          );

          console.log(`✅ Expense created with ID: ${postResult.rows[0].id}`);
          console.log('📄 Created expense:', postResult.rows[0]);

          return {
            statusCode: 201,
            headers,
            body: JSON.stringify({ 
              data: postResult.rows[0],
              message: 'Expense created successfully'
            })
          };
        } catch (dbError) {
          console.error('❌ Database error:', dbError);
          console.error('❌ Error details:', {
            message: dbError.message,
            code: dbError.code,
            detail: dbError.detail
          });
          return {
            statusCode: 500,
            headers,
            body: JSON.stringify({ 
              error: 'Failed to create expense',
              details: dbError.message,
              code: dbError.code
            })
          };
        }

      case 'PUT':
        if (!id || isNaN(id)) {
          return { 
            statusCode: 400, 
            headers, 
            body: JSON.stringify({ error: 'Invalid expense ID' }) 
          };
        }

        console.log(`✏️ Updating expense with ID: ${id}`);
        let updateData;
        try {
          updateData = JSON.parse(body || '{}');
          console.log('📝 Update data:', updateData);
        } catch (parseError) {
          return {
            statusCode: 400,
            headers,
            body: JSON.stringify({ error: 'Invalid JSON in request body' })
          };
        }
        
        try {
          const updateFields = [];
          const updateValues = [];
          let paramCount = 1;

          const fieldMap = {
            description: 'description',
            category: 'category',
            amount: 'amount',
            date: 'date',
            notes: 'notes',
            crop_id: 'crop_id'
          };

          Object.keys(updateData).forEach(key => {
            if (updateData[key] !== undefined && fieldMap[key]) {
              updateFields.push(`${fieldMap[key]} = $${paramCount}`);
              
              // Handle different data types
              if (key === 'amount') {
                updateValues.push(parseFloat(updateData[key]));
              } else if (key === 'description') {
                updateValues.push(updateData[key].trim());
              } else {
                updateValues.push(updateData[key]);
              }
              
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
            UPDATE expenses 
            SET ${updateFields.join(', ')}, updated_at = CURRENT_TIMESTAMP 
            WHERE id = $${paramCount} 
            RETURNING *
          `;
          
          console.log(`🔧 Update query: ${updateQuery}`);
          console.log(`📊 Update values:`, updateValues);
          
          const updateResult = await pool.query(updateQuery, updateValues);
          
          if (updateResult.rows.length === 0) {
            return { 
              statusCode: 404, 
              headers, 
              body: JSON.stringify({ error: 'Expense not found' }) 
            };
          }

          console.log(`✅ Expense ${id} updated successfully`);

          return {
            statusCode: 200,
            headers,
            body: JSON.stringify({ 
              data: updateResult.rows[0],
              message: 'Expense updated successfully'
            })
          };
        } catch (dbError) {
          console.error('❌ Database error:', dbError);
          return {
            statusCode: 500,
            headers,
            body: JSON.stringify({ 
              error: 'Failed to update expense',
              details: dbError.message
            })
          };
        }

      case 'DELETE':
        if (!id || isNaN(id)) {
          return { 
            statusCode: 400, 
            headers, 
            body: JSON.stringify({ error: 'Invalid expense ID' }) 
          };
        }

        console.log(`🗑️ Deleting expense with ID: ${id}`);
        
        try {
          // Delete the expense
          const deleteResult = await pool.query('DELETE FROM expenses WHERE id = $1 RETURNING *', [id]);
          
          if (deleteResult.rowCount === 0) {
            return { 
              statusCode: 404, 
              headers, 
              body: JSON.stringify({ error: 'Expense not found' }) 
            };
          }

          console.log(`✅ Expense ${id} deleted`);

          return {
            statusCode: 200,
            headers,
            body: JSON.stringify({ 
              message: 'Expense deleted successfully',
              deletedExpense: deleteResult.rows[0]
            })
          };
        } catch (dbError) {
          console.error('❌ Database error during delete:', dbError);
          return {
            statusCode: 500,
            headers,
            body: JSON.stringify({ error: 'Database error during deletion' })
          };
        }

      default:
        return { 
          statusCode: 405, 
          headers, 
          body: JSON.stringify({ error: 'Method not allowed' }) 
        };
    }

  } catch (error) {
    console.error('❌ Expenses API Error:', error);
    console.error('❌ Error stack:', error.stack);
    
    // Return proper error response
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ 
        error: 'Internal server error',
        details: error.message
      })
    };
  }
};