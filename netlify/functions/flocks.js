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
    const { httpMethod, path } = event;
    const id = path.split('/').pop();

    switch (httpMethod) {
      case 'GET':
        if (id && !isNaN(id)) {
          const result = await pool.query('SELECT * FROM flocks WHERE id = $1', [id]);
          return {
            statusCode: 200,
            headers,
            body: JSON.stringify({ data: result.rows[0] || null })
          };
        } else {
          const result = await pool.query('SELECT * FROM flocks ORDER BY created_at DESC');
          return {
            statusCode: 200,
            headers,
            body: JSON.stringify({ data: result.rows })
          };
        }

      case 'POST':
        console.log('🚨 Flocks POST Request received');
        
        const requestBody = JSON.parse(event.body || '{}');
        console.log('📦 Flocks request data:', JSON.stringify(requestBody, null, 2));
        
        const { 
          name, 
          animal_type,
          total_animals, 
          current_animals, 
          total_purchase_cost, 
          description,  // Your table has 'description' not 'notes'
          purchase_date,
          notes  // Handle both 'description' and 'notes' from frontend
        } = requestBody;

        console.log('🔍 Extracted flock values:', {
          name,
          animal_type,
          total_animals,
          current_animals,
          total_purchase_cost,
          description,
          notes
        });

        // Validate required fields
        if (!name) {
          return { 
            statusCode: 400, 
            headers, 
            body: JSON.stringify({ 
              error: 'Flock name is required',
              received: requestBody
            }) 
          };
        }

        if (!animal_type) {
          return { 
            statusCode: 400, 
            headers, 
            body: JSON.stringify({ 
              error: 'Animal type is required',
              received: requestBody
            }) 
          };
        }

        // Use description from frontend, fallback to notes, or empty string
        const finalDescription = description || notes || '';

        const insertResult = await pool.query(
          `INSERT INTO flocks (
            name, animal_type, total_animals, current_animals, 
            total_purchase_cost, description, purchase_date
          ) VALUES ($1, $2, $3, $4, $5, $6, $7) 
           RETURNING *`,
          [
            name,
            animal_type,
            total_animals || 0,
            current_animals || 0,
            total_purchase_cost || 0,
            finalDescription,
            purchase_date || null
          ]
        );

        console.log('✅ Flock created successfully with ID:', insertResult.rows[0].id);

        return {
          statusCode: 201,
          headers,
          body: JSON.stringify({ 
            data: insertResult.rows[0],
            message: 'Flock created successfully'
          })
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
          name: 'name',
          animal_type: 'animal_type',
          total_animals: 'total_animals',
          current_animals: 'current_animals',
          total_purchase_cost: 'total_purchase_cost',
          description: 'description',
          notes: 'description',  // Map 'notes' to 'description' column
          purchase_date: 'purchase_date'
        };

        Object.keys(updateData).forEach(key => {
          if (updateData[key] !== undefined && fieldMap[key]) {
            updateFields.push(`${fieldMap[key]} = $${paramCount}`);
            
            // Handle mapping notes to description
            if (key === 'notes') {
              updateValues.push(updateData[key]);
            } else {
              updateValues.push(updateData[key]);
            }
            
            paramCount++;
          }
        });

        if (updateFields.length === 0) {
          return { statusCode: 400, headers, body: JSON.stringify({ error: 'No valid fields to update' }) };
        }

        updateValues.push(id);
        const updateQuery = `UPDATE flocks SET ${updateFields.join(', ')}, updated_at = CURRENT_TIMESTAMP WHERE id = $${paramCount} RETURNING *`;
        
        console.log('🔧 Executing flock update:', updateQuery);
        console.log('📊 With parameters:', updateValues);

        const updateResult = await pool.query(updateQuery, updateValues);
        
        if (updateResult.rows.length === 0) {
          return { statusCode: 404, headers, body: JSON.stringify({ error: 'Flock not found' }) };
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

        // Check if flock has animals before deleting
        const animalsCheck = await pool.query('SELECT COUNT(*) FROM livestock WHERE flock_id = $1', [id]);
        const animalCount = parseInt(animalsCheck.rows[0].count);
        
        if (animalCount > 0) {
          return { 
            statusCode: 400, 
            headers, 
            body: JSON.stringify({ 
              error: `Cannot delete flock with ${animalCount} animals. Remove animals first.` 
            }) 
          };
        }

        const deleteResult = await pool.query('DELETE FROM flocks WHERE id = $1', [id]);
        
        if (deleteResult.rowCount === 0) {
          return { statusCode: 404, headers, body: JSON.stringify({ error: 'Flock not found' }) };
        }

        return {
          statusCode: 200,
          headers,
          body: JSON.stringify({ message: 'Flock deleted successfully' })
        };

      default:
        return { statusCode: 405, headers, body: JSON.stringify({ error: 'Method not allowed' }) };
    }
  } catch (error) {
    console.error('❌ Flocks API Error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ 
        error: 'Internal server error: ' + error.message
      })
    };
  }
};