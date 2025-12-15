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
      
      await pool.query(`
        CREATE TABLE expenses (
          id SERIAL PRIMARY KEY,
          crop_id INTEGER REFERENCES crops(id) ON DELETE CASCADE,
          category VARCHAR(100) NOT NULL,
          description TEXT NOT NULL,
          amount DECIMAL(10,2) NOT NULL,
          date DATE NOT NULL DEFAULT CURRENT_DATE,
          notes TEXT,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        )
      `);
      
      // Create indexes
      await pool.query(`
        CREATE INDEX idx_expenses_crop ON expenses(crop_id);
        CREATE INDEX idx_expenses_date ON expenses(date);
        CREATE INDEX idx_expenses_category ON expenses(category);
      `);
      
      console.log('✅ Expenses table created successfully');
    } else {
      console.log('✅ Expenses table already exists');
    }
  } catch (error) {
    console.error('❌ Error ensuring expenses table exists:', error);
    throw error;
  }
};

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
    // Ensure table exists before processing any request
    await ensureExpensesTableExists();

    const { httpMethod, path, body, queryStringParameters } = event;
    const pathParts = path.split('/').filter(part => part);
    
    console.log(`💰 Expenses API: ${httpMethod} ${path}`);
    console.log(`📁 Path parts:`, pathParts);
    console.log(`🔍 Query parameters:`, queryStringParameters);

    // Handle /crops/:id/expenses route FIRST
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
          
          // Get all expenses for this crop
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
          
        case 'POST':
          // Create expense for specific crop
          console.log(`🆕 Creating expense for crop ID: ${cropId}`);
          
          let requestBody;
          try {
            requestBody = JSON.parse(body || '{}');
            console.log('📦 Request body:', requestBody);
          } catch (parseError) {
            console.error('❌ JSON Parse Error:', parseError);
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
              body: JSON.stringify({ 
                error: 'Description, category, and amount are required',
                received: { description, category, amount }
              })
            };
          }

          // Validate amount is positive
          const parsedAmount = parseFloat(amount);
          if (isNaN(parsedAmount) || parsedAmount <= 0) {
            return {
              statusCode: 400,
              headers,
              body: JSON.stringify({ error: 'Amount must be a valid positive number' })
            };
          }

          // Use cropId from URL path
          const crop_id = cropId;
          
          const insertResult = await pool.query(
            `INSERT INTO expenses (crop_id, description, category, amount, date, notes) 
             VALUES ($1, $2, $3, $4, $5, $6) 
             RETURNING *`,
            [
              crop_id, 
              description.trim(), 
              category, 
              parsedAmount, 
              date || new Date().toISOString().split('T')[0], 
              notes || ''
            ]
          );

          // Update crop total expenses
          await pool.query(
            'UPDATE crops SET total_expenses = (SELECT COALESCE(SUM(amount), 0) FROM expenses WHERE crop_id = $1) WHERE id = $1',
            [crop_id]
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

        default:
          return { 
            statusCode: 405, 
            headers, 
            body: JSON.stringify({ error: 'Method not allowed' }) 
          };
      }
    }

    // Handle regular /expenses routes
    const id = pathParts.length > 1 && !isNaN(pathParts[pathParts.length - 1]) 
      ? pathParts[pathParts.length - 1] 
      : null;

    console.log(`🔍 Processing expense ID: ${id}`);

    switch (httpMethod) {
      case 'GET':
        if (id && !isNaN(id)) {
          // Get expense by ID
          console.log(`📖 Fetching expense with ID: ${id}`);
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
        } else {
          // Get all expenses with optional filters
          console.log('📖 Fetching all expenses');
          let query = `
            SELECT e.*, c.name as crop_name 
            FROM expenses e 
            LEFT JOIN crops c ON e.crop_id = c.id 
            WHERE 1=1
          `;
          
          const params = [];
          let paramCount = 1;

          // Apply filters from query parameters
          if (queryStringParameters) {
            if (queryStringParameters.cropId) {
              query += ` AND e.crop_id = $${paramCount}`;
              params.push(queryStringParameters.cropId);
              paramCount++;
            }
            
            if (queryStringParameters.startDate) {
              query += ` AND e.date >= $${paramCount}`;
              params.push(queryStringParameters.startDate);
              paramCount++;
            }
            
            if (queryStringParameters.endDate) {
              query += ` AND e.date <= $${paramCount}`;
              params.push(queryStringParameters.endDate);
              paramCount++;
            }
            
            if (queryStringParameters.category) {
              query += ` AND e.category = $${paramCount}`;
              params.push(queryStringParameters.category);
              paramCount++;
            }
          }

          query += ' ORDER BY e.date DESC, e.created_at DESC';

          // Apply limit if provided
          if (queryStringParameters?.limit && !isNaN(queryStringParameters.limit)) {
            query += ` LIMIT $${paramCount}`;
            params.push(parseInt(queryStringParameters.limit));
          }

          console.log(`🔍 Query: ${query}`);
          console.log(`📊 Parameters:`, params);

          const result = await pool.query(query, params);
          
          return {
            statusCode: 200,
            headers,
            body: JSON.stringify({ 
              data: result.rows,
              message: 'Expenses retrieved successfully'
            })
          };
        }

      case 'POST':
        // Create new expense (general endpoint)
        console.log('🆕 Creating new expense');
        
        let postData;
        try {
          postData = JSON.parse(body || '{}');
          console.log('📦 Create expense data:', postData);
        } catch (parseError) {
          console.error('❌ JSON Parse Error:', parseError);
          return {
            statusCode: 400,
            headers,
            body: JSON.stringify({ error: 'Invalid JSON in request body' })
          };
        }
        
        // Handle both camelCase and snake_case for crop ID
        const cropId = postData.crop_id || postData.cropId || postData.cropID;
        const { description, category, amount, date, notes } = postData;
        
        console.log('🌱 Parsed cropId:', cropId);
        
        // Validate required fields
        if (!cropId || !description || !category || !amount) {
          return {
            statusCode: 400,
            headers,
            body: JSON.stringify({ 
              error: 'Crop ID, description, category, and amount are required',
              received: { 
                cropId, 
                description, 
                category, 
                amount,
                rawData: postData 
              }
            })
          };
        }

        // Validate amount is positive
        const parsedAmount = parseFloat(amount);
        if (isNaN(parsedAmount) || parsedAmount <= 0) {
          return {
            statusCode: 400,
            headers,
            body: JSON.stringify({ error: 'Amount must be a valid positive number' })
          };
        }

        // Validate crop exists
        const cropCheck = await pool.query('SELECT id FROM crops WHERE id = $1', [cropId]);
        if (cropCheck.rows.length === 0) {
          return {
            statusCode: 404,
            headers,
            body: JSON.stringify({ error: 'Crop not found' })
          };
        }

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

        // Update crop total expenses
        await pool.query(
          'UPDATE crops SET total_expenses = (SELECT COALESCE(SUM(amount), 0) FROM expenses WHERE crop_id = $1) WHERE id = $1',
          [cropId]
        );

        console.log(`✅ Expense created with ID: ${postResult.rows[0].id}`);

        return {
          statusCode: 201,
          headers,
          body: JSON.stringify({ 
            data: postResult.rows[0],
            message: 'Expense created successfully'
          })
        };

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
          console.log('📦 Update data:', updateData);
        } catch (parseError) {
          console.error('❌ JSON Parse Error:', parseError);
          return {
            statusCode: 400,
            headers,
            body: JSON.stringify({ error: 'Invalid JSON in request body' })
          };
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
            
            // Handle different data types
            if (key === 'amount') {
              const parsedAmount = parseFloat(updateData[key]);
              if (isNaN(parsedAmount) || parsedAmount < 0) {
                throw new Error('Amount must be a valid positive number');
              }
              updateValues.push(parsedAmount);
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
        
        console.log(`🔧 Update query:`, updateQuery);
        console.log(`📊 Update values:`, updateValues);
        
        const updateResult = await pool.query(updateQuery, updateValues);
        
        if (updateResult.rows.length === 0) {
          return { 
            statusCode: 404, 
            headers, 
            body: JSON.stringify({ error: 'Expense not found' }) 
          };
        }

        // Update crop total expenses
        const updatedExpense = updateResult.rows[0];
        await pool.query(
          'UPDATE crops SET total_expenses = (SELECT COALESCE(SUM(amount), 0) FROM expenses WHERE crop_id = $1) WHERE id = $1',
          [updatedExpense.crop_id]
        );

        console.log(`✅ Expense ${id} updated successfully`);

        return {
          statusCode: 200,
          headers,
          body: JSON.stringify({ 
            data: updatedExpense,
            message: 'Expense updated successfully'
          })
        };

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
          // Get expense details before deleting to update crop total
          const expenseResult = await pool.query('SELECT crop_id, amount FROM expenses WHERE id = $1', [id]);
          
          if (expenseResult.rows.length === 0) {
            console.log(`❌ Expense ${id} not found in database`);
            return { 
              statusCode: 404, 
              headers, 
              body: JSON.stringify({ error: 'Expense not found' }) 
            };
          }

          const cropIdToUpdate = expenseResult.rows[0].crop_id;
          
          // Delete the expense
          const deleteResult = await pool.query('DELETE FROM expenses WHERE id = $1 RETURNING *', [id]);
          
          if (deleteResult.rowCount === 0) {
            return { 
              statusCode: 404, 
              headers, 
              body: JSON.stringify({ error: 'Expense not found' }) 
            };
          }
          
          // Update crop total expenses
          if (cropIdToUpdate) {
            await pool.query(
              'UPDATE crops SET total_expenses = (SELECT COALESCE(SUM(amount), 0) FROM expenses WHERE crop_id = $1) WHERE id = $1',
              [cropIdToUpdate]
            );
          }

          console.log(`✅ Expense ${id} deleted, updated crop ${cropIdToUpdate} totals`);

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
            body: JSON.stringify({ 
              error: 'Database error during deletion',
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
  } catch (error) {
    console.error('❌ Expenses API Error:', error);
    console.error('❌ Error stack:', error.stack);
    
    let errorMessage = 'Internal server error';
    let statusCode = 500;
    
    if (error.message.includes('connection') || error.message.includes('ECONNREFUSED')) {
      errorMessage = 'Database connection failed';
    } else if (error.message.includes('relation "expenses" does not exist')) {
      errorMessage = 'Expenses table does not exist';
    } else if (error.message.includes('violates foreign key constraint')) {
      errorMessage = 'Invalid crop ID provided';
      statusCode = 400;
    } else if (error.message.includes('JSON')) {
      errorMessage = 'Invalid JSON in request body';
      statusCode = 400;
    } else if (error.message.includes('positive number')) {
      errorMessage = error.message;
      statusCode = 400;
    }

    return {
      statusCode,
      headers,
      body: JSON.stringify({ 
        error: errorMessage,
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      })
    };
  }
};