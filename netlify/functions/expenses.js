// netlify/functions/expenses.js
const { Pool } = require('pg');
const path = require('path');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

// Function to update crop total expenses
const updateCropTotalExpenses = async (cropId) => {
  try {
    console.log(`🔄 Calculating total expenses for crop ${cropId}...`);
    
    // Calculate sum of all expenses for this crop
    const result = await pool.query(
      `SELECT COALESCE(SUM(amount), 0) as total FROM expenses WHERE crop_id = $1`,
      [cropId]
    );
    
    const totalExpenses = result.rows[0].total || 0;
    console.log(`💰 Total expenses for crop ${cropId}: ${totalExpenses}`);
    
    // Update the crops table
    await pool.query(
      `UPDATE crops SET total_expenses = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2`,
      [totalExpenses, cropId]
    );
    
    console.log(`✅ Updated crop ${cropId} total_expenses to ${totalExpenses}`);
    
  } catch (error) {
    console.error(`❌ Error updating crop total expenses:`, error);
  }
};

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

exports.handler = async (event, context) => {
  const filename = path.basename(__filename);
  console.log(`🚀 ${filename} called for: ${event.path}`);
  console.log(`🔍 ${filename} - Method: ${event.httpMethod}`);
  
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
    
    console.log(`💰 ${filename} - Processing: ${httpMethod} ${path}`);
    console.log(`📁 ${filename} - Path parts:`, pathParts);

    // 🎯 CRITICAL: Handle /crops/:id/expenses route
    if (path.includes('/crops/') && path.includes('/expenses')) {
      console.log(`🎯 ${filename} - DETECTED /crops/:id/expenses route!`);
      
      const cropIndex = pathParts.indexOf('crops');
      const cropId = pathParts[cropIndex + 1];
      
      console.log(`🌱 ${filename} - Handling expenses for crop ID: ${cropId}`);

      if (!cropId || isNaN(cropId)) {
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({ error: 'Invalid crop ID' })
        };
      }

      switch (httpMethod) {
        case 'GET':
          console.log(`📖 ${filename} - Fetching expenses for crop ID: ${cropId}`);
          
          try {
            const result = await pool.query(
              'SELECT * FROM expenses WHERE crop_id = $1 ORDER BY date DESC, created_at DESC',
              [cropId]
            );
            
            console.log(`✅ ${filename} - Found ${result.rows.length} EXPENSES for crop ${cropId}`);
            
            return {
              statusCode: 200,
              headers,
              body: JSON.stringify({ 
                data: result.rows,
                message: 'Expenses retrieved successfully'
              })
            };
          } catch (queryError) {
            console.error(`❌ ${filename} - Query error:`, queryError);
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
          console.log(`🆕 ${filename} - Creating expense for crop ID: ${cropId}`);
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

            console.log(`✅ ${filename} - Expense created with ID: ${insertResult.rows[0].id}`);

            // 🎯 UPDATE: Update crop total expenses
            await updateCropTotalExpenses(cropId);

            return {
              statusCode: 201,
              headers,
              body: JSON.stringify({ 
                data: insertResult.rows[0],
                message: 'Expense created successfully'
              })
            };
          } catch (dbError) {
            console.error(`❌ ${filename} - Database error:`, dbError);
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

    // Handle /expenses routes
    const id = pathParts.length > 1 && !isNaN(pathParts[pathParts.length - 1]) 
      ? pathParts[pathParts.length - 1] 
      : null;

    console.log(`🔍 ${filename} - Processing expense ID: ${id}`);

    // Main switch for /expenses routes
    switch (httpMethod) {
      case 'GET':
        if (id && !isNaN(id)) {
          // GET /expenses/:id
          console.log(`📖 ${filename} - Fetching expense with ID: ${id}`);
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
            console.error(`❌ ${filename} - Query error:`, queryError);
            return {
              statusCode: 404,
              headers,
              body: JSON.stringify({ error: 'Expense not found' })
            };
          }
        } else {
          // GET /expenses (all expenses) OR /expenses?crop_id=XXX
          console.log(`📊 ${filename} - Fetching expenses`);
          
          try {
            let query = 'SELECT * FROM expenses ORDER BY date DESC, created_at DESC LIMIT 100';
            let params = [];
            
            // Check for crop_id query parameter
            if (queryStringParameters?.crop_id) {
              const cropId = queryStringParameters.crop_id;
              console.log(`🔍 ${filename} - Filtering by crop_id: ${cropId}`);
              query = 'SELECT * FROM expenses WHERE crop_id = $1 ORDER BY date DESC, created_at DESC';
              params = [cropId];
            }
            
            const result = await pool.query(query, params);
            console.log(`✅ ${filename} - Found ${result.rows.length} expenses`);
            
            return {
              statusCode: 200,
              headers,
              body: JSON.stringify({ 
                data: result.rows,
                message: 'Expenses retrieved successfully'
              })
            };
          } catch (queryError) {
            console.error(`❌ ${filename} - Query error:`, queryError);
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
        console.log(`🆕 ${filename} - Creating new expense`);
        let postData;
        try {
          postData = JSON.parse(body || '{}');
          console.log(`📝 ${filename} - Parsed request data:`, postData);
        } catch (parseError) {
          console.error(`❌ ${filename} - JSON parse error:`, parseError);
          return {
            statusCode: 400,
            headers,
            body: JSON.stringify({ error: 'Invalid JSON in request body' })
          };
        }
        
        const cropId = postData.crop_id || postData.cropId;
        const { description, category, amount, date, notes } = postData;
        
        console.log(`🔍 ${filename} - Processed fields:`, {
          cropId,
          description,
          category,
          amount,
          date,
          notes
        });
        
        if (!cropId || !description || !category || !amount) {
          console.error(`❌ ${filename} - Missing required fields:`, { cropId, description, category, amount });
          return {
            statusCode: 400,
            headers,
            body: JSON.stringify({ 
              error: 'Crop ID, description, category, and amount are required',
              received: { cropId, description, category, amount }
            })
          };
        }

        const parsedAmount = parseFloat(amount);
        if (isNaN(parsedAmount) || parsedAmount <= 0) {
          console.error(`❌ ${filename} - Invalid amount:`, amount);
          return {
            statusCode: 400,
            headers,
            body: JSON.stringify({ error: 'Amount must be a valid positive number' })
          };
        }

        try {
          console.log(`💾 ${filename} - Inserting into database...`);
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

          console.log(`✅ ${filename} - Expense created with ID: ${postResult.rows[0].id}`);

          // 🎯 UPDATE: Update crop total expenses
          await updateCropTotalExpenses(cropId);

          return {
            statusCode: 201,
            headers,
            body: JSON.stringify({ 
              data: postResult.rows[0],
              message: 'Expense created successfully'
            })
          };
        } catch (dbError) {
          console.error(`❌ ${filename} - Database error:`, dbError);
          return {
            statusCode: 500,
            headers,
            body: JSON.stringify({ 
              error: 'Failed to create expense',
              details: dbError.message
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

        console.log(`✏️ ${filename} - Updating expense with ID: ${id}`);
        let updateData;
        try {
          updateData = JSON.parse(body || '{}');
          console.log(`📝 ${filename} - Update data:`, updateData);
        } catch (parseError) {
          return {
            statusCode: 400,
            headers,
            body: JSON.stringify({ error: 'Invalid JSON in request body' })
          };
        }
        
        try {
          // First, get the current expense to know the crop_id
          const currentExpense = await pool.query('SELECT crop_id FROM expenses WHERE id = $1', [id]);
          if (currentExpense.rows.length === 0) {
            return { 
              statusCode: 404, 
              headers, 
              body: JSON.stringify({ error: 'Expense not found' }) 
            };
          }
          
          const originalCropId = currentExpense.rows[0].crop_id;
          let newCropId = originalCropId;
          
          // If updating crop_id, use the new one
          if (updateData.crop_id !== undefined) {
            newCropId = updateData.crop_id;
          }

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
          
          console.log(`🔧 ${filename} - Update query: ${updateQuery}`);
          
          const updateResult = await pool.query(updateQuery, updateValues);
          
          if (updateResult.rows.length === 0) {
            return { 
              statusCode: 404, 
              headers, 
              body: JSON.stringify({ error: 'Expense not found' }) 
            };
          }

          console.log(`✅ ${filename} - Expense ${id} updated successfully`);

          // 🎯 UPDATE: Update crop total expenses for both old and new crops if crop_id changed
          await updateCropTotalExpenses(originalCropId);
          if (newCropId !== originalCropId) {
            await updateCropTotalExpenses(newCropId);
          }

          return {
            statusCode: 200,
            headers,
            body: JSON.stringify({ 
              data: updateResult.rows[0],
              message: 'Expense updated successfully'
            })
          };
        } catch (dbError) {
          console.error(`❌ ${filename} - Database error:`, dbError);
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

        console.log(`🗑️ ${filename} - Deleting expense with ID: ${id}`);
        
        try {
          // Get the expense first to know the crop_id
          const getResult = await pool.query('SELECT crop_id FROM expenses WHERE id = $1', [id]);
          
          if (getResult.rowCount === 0) {
            return { 
              statusCode: 404, 
              headers, 
              body: JSON.stringify({ error: 'Expense not found' }) 
            };
          }
          
          const cropId = getResult.rows[0].crop_id;

          const deleteResult = await pool.query('DELETE FROM expenses WHERE id = $1 RETURNING *', [id]);
          
          console.log(`✅ ${filename} - Expense ${id} deleted`);

          // 🎯 UPDATE: Update crop total expenses
          await updateCropTotalExpenses(cropId);

          return {
            statusCode: 200,
            headers,
            body: JSON.stringify({ 
              message: 'Expense deleted successfully',
              deletedExpense: deleteResult.rows[0]
            })
          };
        } catch (dbError) {
          console.error(`❌ ${filename} - Database error during delete:`, dbError);
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
    console.error(`❌ ${path.basename(__filename)} - Expenses API Error:`, error);
    console.error(`❌ ${path.basename(__filename)} - Error stack:`, error.stack);
    
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