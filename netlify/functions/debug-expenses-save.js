// netlify/functions/debug-expenses-save.js
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

exports.handler = async (event, context) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Content-Type': 'application/json'
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  try {
    console.log('=== DEBUG EXPENSES SAVE ===');
    console.log('📋 Method:', event.httpMethod);
    console.log('📍 Path:', event.path);
    console.log('📦 Raw body:', event.body);

    // Parse the request body
    let parsedBody = {};
    try {
      parsedBody = JSON.parse(event.body || '{}');
      console.log('✅ Parsed JSON:', parsedBody);
    } catch (parseError) {
      console.error('❌ JSON Parse Error:', parseError);
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ 
          error: 'Invalid JSON',
          details: parseError.message 
        })
      };
    }

    // Test database connection first
    console.log('🔄 Testing database connection...');
    try {
      const testResult = await pool.query('SELECT NOW() as current_time');
      console.log('✅ Database connected. Current time:', testResult.rows[0].current_time);
    } catch (dbError) {
      console.error('❌ Database connection failed:', dbError);
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ 
          error: 'Database connection failed',
          details: dbError.message 
        })
      };
    }

    // Check if expenses table exists
    console.log('📊 Checking expenses table...');
    try {
      const tableCheck = await pool.query(`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'public' 
          AND table_name = 'expenses'
        );
      `);
      
      const tableExists = tableCheck.rows[0].exists;
      console.log('📊 Expenses table exists?', tableExists);

      if (!tableExists) {
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
        console.log('✅ Expenses table created');
      }
    } catch (tableError) {
      console.error('❌ Table check/creation failed:', tableError);
    }

    // If this is a POST request, try to save data
    if (event.httpMethod === 'POST') {
      console.log('🆕 Attempting to save expense...');
      
      // Extract data from parsed body
      const cropId = parsedBody.crop_id || parsedBody.cropId;
      const description = parsedBody.description;
      const category = parsedBody.category;
      const amount = parsedBody.amount;
      const date = parsedBody.date || parsedBody.expense_date;
      const notes = parsedBody.notes;

      console.log('📝 Parsed fields:', {
        cropId,
        description,
        category,
        amount,
        date,
        notes
      });

      // Validate required fields
      if (!description || !category || !amount) {
        console.error('❌ Missing required fields');
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({ 
            error: 'Missing required fields',
            required: ['description', 'category', 'amount']
          })
        };
      }

      // Validate amount
      const parsedAmount = parseFloat(amount);
      if (isNaN(parsedAmount) || parsedAmount <= 0) {
        console.error('❌ Invalid amount:', amount);
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({ 
            error: 'Amount must be a positive number',
            received: amount
          })
        };
      }

      try {
        // Try to insert the expense
        console.log('💾 Inserting into database...');
        
        const insertQuery = `
          INSERT INTO expenses (crop_id, description, category, amount, date, notes) 
          VALUES ($1, $2, $3, $4, $5, $6) 
          RETURNING *
        `;
        
        const insertValues = [
          cropId || null,
          description.trim(),
          category,
          parsedAmount,
          date || new Date().toISOString().split('T')[0],
          notes || ''
        ];

        console.log('🔍 Insert query:', insertQuery);
        console.log('📊 Insert values:', insertValues);

        const insertResult = await pool.query(insertQuery, insertValues);
        
        console.log('✅ Expense saved successfully!');
        console.log('📄 Saved record:', insertResult.rows[0]);

        // Check if record was actually saved
        console.log('🔍 Verifying save...');
        const verifyResult = await pool.query(
          'SELECT * FROM expenses WHERE id = $1',
          [insertResult.rows[0].id]
        );
        
        console.log('✅ Verification - Found record:', verifyResult.rows.length > 0);

        return {
          statusCode: 201,
          headers,
          body: JSON.stringify({ 
            success: true,
            data: insertResult.rows[0],
            message: 'Expense saved successfully',
            debug: {
              recordId: insertResult.rows[0].id,
              verified: verifyResult.rows.length > 0
            }
          })
        };

      } catch (insertError) {
        console.error('❌ Insert failed:', insertError);
        console.error('❌ Error details:', {
          message: insertError.message,
          code: insertError.code,
          detail: insertError.detail
        });

        return {
          statusCode: 500,
          headers,
          body: JSON.stringify({ 
            error: 'Failed to save expense',
            details: insertError.message,
            code: insertError.code
          })
        };
      }
    }

    // For GET requests, show current expenses
    if (event.httpMethod === 'GET') {
      console.log('📖 Fetching all expenses...');
      
      try {
        const result = await pool.query(`
          SELECT * FROM expenses 
          ORDER BY created_at DESC 
          LIMIT 10
        `);
        
        console.log(`📊 Found ${result.rows.length} expenses`);
        result.rows.forEach((expense, index) => {
          console.log(`💰 Expense ${index + 1}:`, {
            id: expense.id,
            description: expense.description,
            amount: expense.amount,
            date: expense.date,
            crop_id: expense.crop_id
          });
        });

        return {
          statusCode: 200,
          headers,
          body: JSON.stringify({ 
            data: result.rows,
            count: result.rows.length,
            message: 'Expenses retrieved'
          })
        };
      } catch (queryError) {
        console.error('❌ Query failed:', queryError);
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

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ 
        message: 'Debug endpoint ready',
        test: 'Send a POST request with expense data'
      })
    };

  } catch (error) {
    console.error('❌ Unexpected error:', error);
    console.error('❌ Error stack:', error.stack);
    
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ 
        error: 'Unexpected error occurred',
        details: error.message,
        stack: error.stack
      })
    };
  }
};