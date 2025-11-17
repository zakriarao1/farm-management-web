const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

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
    const { httpMethod, path, body } = event;
    const pathParts = path.split('/').filter(part => part);
    
    console.log(`💰 Expenses API: ${httpMethod} ${path}`);
    console.log(`📁 Path parts:`, pathParts);

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
  
  // First, count total expenses for this crop
  const countResult = await pool.query(
    'SELECT COUNT(*) as total_count FROM expenses WHERE crop_id = $1',
    [cropId]
  );
  console.log(`🔢 Database has ${countResult.rows[0].total_count} expenses for crop ${cropId}`);
  
  // Then get all expenses
  const result = await pool.query(
    'SELECT * FROM expenses WHERE crop_id = $1 ORDER BY date DESC, created_at DESC',
    [cropId]
  );
  
  console.log(`✅ Query returned ${result.rows.length} expenses for crop ${cropId}`);
  
  // Log all expenses to verify they're correct
  result.rows.forEach((expense, index) => {
    console.log(`💰 Expense ${index + 1}:`, {
      id: expense.id,
      crop_id: expense.crop_id,
      description: expense.description,
      amount: expense.amount,
      category: expense.category
    });
  });
  
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
          const requestBody = JSON.parse(body || '{}');
          const { description, category, amount, date, notes } = requestBody;
          
          console.log('📦 Request body:', requestBody);
          
          // Validate required fields
          if (!description || !category || !amount) {
            return {
              statusCode: 400,
              headers,
              body: JSON.stringify({ error: 'Description, category, and amount are required' })
            };
          }

          // Validate amount is positive
          if (parseFloat(amount) <= 0) {
            return {
              statusCode: 400,
              headers,
              body: JSON.stringify({ error: 'Amount must be greater than 0' })
            };
          }

          const insertResult = await pool.query(
            `INSERT INTO expenses (crop_id, description, category, amount, date, notes) 
             VALUES ($1, $2, $3, $4, $5, $6) 
             RETURNING *`,
            [
              cropId, 
              description.trim(), 
              category, 
              parseFloat(amount), 
              date || new Date().toISOString().split('T')[0], 
              notes || ''
            ]
          );

          // Update crop total expenses
          await pool.query(
            'UPDATE crops SET total_expenses = (SELECT COALESCE(SUM(amount), 0) FROM expenses WHERE crop_id = $1) WHERE id = $1',
            [cropId]
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
          // Get all expenses
          console.log('📖 Fetching all expenses');
          const result = await pool.query(`
            SELECT e.*, c.name as crop_name 
            FROM expenses e 
            LEFT JOIN crops c ON e.crop_id = c.id 
            ORDER BY e.created_at DESC
          `);
          
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
        const postData = JSON.parse(body || '{}');
        const { cropId, description, category, amount, date, notes } = postData;
        
        console.log('📦 Create expense data:', postData);
        
        // Validate required fields
        if (!cropId || !description || !category || !amount) {
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
        if (parseFloat(amount) <= 0) {
          return {
            statusCode: 400,
            headers,
            body: JSON.stringify({ error: 'Amount must be greater than 0' })
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
            parseFloat(amount), 
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
        const updateData = JSON.parse(body || '{}');
        console.log('📦 Update data:', updateData);
        
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

        // Update crop total expenses if amount changed or crop_id changed
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
          // Get crop_id before deleting to update total
          const expenseResult = await pool.query('SELECT crop_id FROM expenses WHERE id = $1', [id]);
          
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
          
          if (deleteResult.rows.length === 0) {
            return { 
              statusCode: 404, 
              headers, 
              body: JSON.stringify({ error: 'Expense not found' }) 
            };
          }
          
          // Update crop total expenses
          await pool.query(
            'UPDATE crops SET total_expenses = (SELECT COALESCE(SUM(amount), 0) FROM expenses WHERE crop_id = $1) WHERE id = $1',
            [cropIdToUpdate]
          );

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
    
    let errorMessage = 'Internal server error';
    if (error.message.includes('connection') || error.message.includes('ECONNREFUSED')) {
      errorMessage = 'Database connection failed';
    } else if (error.message.includes('relation "expenses" does not exist')) {
      errorMessage = 'Expenses table does not exist. Please run migration.';
    } else if (error.message.includes('violates foreign key constraint')) {
      errorMessage = 'Invalid crop ID provided';
    } else if (error.message.includes('JSON')) {
      errorMessage = 'Invalid JSON in request body';
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