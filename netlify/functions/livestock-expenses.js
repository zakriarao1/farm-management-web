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
    const { httpMethod, path, body } = event;
    const id = path.split('/').pop();

    console.log(`💰 Livestock Expenses API: ${httpMethod} ${path}`);

    switch (httpMethod) {
      case 'GET':
        if (id && !isNaN(id)) {
          // Get single expense by ID
          console.log(`📖 Fetching livestock expense with ID: ${id}`);
          const result = await pool.query(`
            SELECT le.*, 
                   f.name as flock_name,
                   l.tag_number as livestock_tag
            FROM livestock_expenses le
            LEFT JOIN flocks f ON le.flock_id = f.id
            LEFT JOIN livestock l ON le.livestock_id = l.id
            WHERE le.id = $1
          `, [id]);
          
          if (result.rows.length === 0) {
            return {
              statusCode: 404,
              headers,
              body: JSON.stringify({ error: 'Livestock expense not found' })
            };
          }
          
          return {
            statusCode: 200,
            headers,
            body: JSON.stringify({ 
              data: result.rows[0],
              message: 'Livestock expense retrieved successfully'
            })
          };
        } else {
          // Get all expenses
          console.log('📖 Fetching all livestock expenses');
          const result = await pool.query(`
            SELECT le.*, 
                   f.name as flock_name,
                   f.animal_type as flock_type,
                   l.tag_number as livestock_tag,
                   l.animal_type as livestock_type
            FROM livestock_expenses le
            LEFT JOIN flocks f ON le.flock_id = f.id
            LEFT JOIN livestock l ON le.livestock_id = l.id
            ORDER BY le.created_at DESC
          `);
          
          console.log(`✅ Found ${result.rows.length} livestock expenses`);
          
          return {
            statusCode: 200,
            headers,
            body: JSON.stringify({ 
              data: result.rows,
              message: 'Livestock expenses retrieved successfully'
            })
          };
        }

      case 'POST':
        console.log('🆕 Creating new livestock expense');
        const postData = JSON.parse(body || '{}');
        const { flock_id, livestock_id, description, category, amount, date, notes } = postData;
        
        console.log('📦 Create livestock expense data:', postData);
        
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
        if (parseFloat(amount) <= 0) {
          return {
            statusCode: 400,
            headers,
            body: JSON.stringify({ error: 'Amount must be greater than 0' })
          };
        }

        const postResult = await pool.query(
          `INSERT INTO livestock_expenses (flock_id, livestock_id, description, category, amount, date, notes) 
           VALUES ($1, $2, $3, $4, $5, $6, $7) 
           RETURNING *`,
          [
            flock_id || null, 
            livestock_id || null, 
            description.trim(), 
            category, 
            parseFloat(amount), 
            date || new Date().toISOString().split('T')[0], 
            notes || ''
          ]
        );

        console.log(`✅ Livestock expense created with ID: ${postResult.rows[0].id}`);

        return {
          statusCode: 201,
          headers,
          body: JSON.stringify({ 
            data: postResult.rows[0],
            message: 'Livestock expense created successfully'
          })
        };

      case 'PUT':
        if (!id || isNaN(id)) {
          return { 
            statusCode: 400, 
            headers, 
            body: JSON.stringify({ error: 'Invalid livestock expense ID' }) 
          };
        }

        console.log(`✏️ Updating livestock expense with ID: ${id}`);
        const updateData = JSON.parse(body || '{}');
        console.log('📦 Update data:', updateData);
        
        const updateFields = [];
        const updateValues = [];
        let paramCount = 1;

        const fieldMap = {
          flock_id: 'flock_id',
          livestock_id: 'livestock_id',
          description: 'description',
          category: 'category',
          amount: 'amount',
          date: 'date',
          notes: 'notes'
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
          UPDATE livestock_expenses 
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
            body: JSON.stringify({ error: 'Livestock expense not found' }) 
          };
        }

        console.log(`✅ Livestock expense ${id} updated successfully`);

        return {
          statusCode: 200,
          headers,
          body: JSON.stringify({ 
            data: updateResult.rows[0],
            message: 'Livestock expense updated successfully'
          })
        };

      case 'DELETE':
        if (!id || isNaN(id)) {
          return { 
            statusCode: 400, 
            headers, 
            body: JSON.stringify({ error: 'Invalid livestock expense ID' }) 
          };
        }

        console.log(`🗑️ Deleting livestock expense with ID: ${id}`);
        
        const deleteResult = await pool.query('DELETE FROM livestock_expenses WHERE id = $1 RETURNING *', [id]);
        
        if (deleteResult.rows.length === 0) {
          return { 
            statusCode: 404, 
            headers, 
            body: JSON.stringify({ error: 'Livestock expense not found' }) 
          };
        }

        console.log(`✅ Livestock expense ${id} deleted successfully`);

        return {
          statusCode: 200,
          headers,
          body: JSON.stringify({ 
            message: 'Livestock expense deleted successfully',
            deletedExpense: deleteResult.rows[0]
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
    console.error('❌ Livestock Expenses API Error:', error);
    
    let errorMessage = 'Internal server error';
    if (error.message.includes('connection') || error.message.includes('ECONNREFUSED')) {
      errorMessage = 'Database connection failed';
    } else if (error.message.includes('violates foreign key constraint')) {
      errorMessage = 'Invalid flock or livestock ID provided';
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