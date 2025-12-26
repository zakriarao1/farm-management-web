const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

// Helper function to clean date values
const cleanDateValue = (dateValue) => {
  if (!dateValue || dateValue === '' || dateValue === 'null' || dateValue === 'undefined') {
    return null;
  }
  
  // If it's already a valid date string, return it
  if (typeof dateValue === 'string' && dateValue.match(/^\d{4}-\d{2}-\d{2}/)) {
    return dateValue;
  }
  
  // Try to parse other date formats
  try {
    const date = new Date(dateValue);
    if (!isNaN(date.getTime())) {
      return date.toISOString().split('T')[0];
    }
  } catch (e) {
    console.warn('⚠️ Could not parse date:', dateValue, e.message);
  }
  
  return null;
};

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
          const result = await pool.query('SELECT * FROM livestock WHERE id = $1', [id]);
          return {
            statusCode: 200,
            headers,
            body: JSON.stringify({ data: result.rows[0] || null })
          };
        } else {
          const result = await pool.query(`
            SELECT l.*, f.name as flock_name 
            FROM livestock l 
            LEFT JOIN flocks f ON l.flock_id = f.id 
            ORDER BY l.created_at DESC
          `);
          return {
            statusCode: 200,
            headers,
            body: JSON.stringify({ data: result.rows })
          };
        }

      case 'POST':
        console.log('🚨 POST Request received');
        
        const requestBody = JSON.parse(event.body || '{}');
        console.log('📦 Request data:', JSON.stringify(requestBody, null, 2));
        
        const { 
          tag_number,
          animal_type,
          breed, gender, date_of_birth, purchase_date, 
          purchase_price, current_weight, status, 
          location, notes, flock_id 
        } = requestBody;

        console.log('🔍 Extracted values:', {
          tag_number,
          animal_type,
          status,
          flock_id,
          date_of_birth,
          purchase_date
        });

        // Validate required fields
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

        if (!status) {
          return { 
            statusCode: 400, 
            headers, 
            body: JSON.stringify({ 
              error: 'Status is required',
              received: requestBody
            }) 
          };
        }

        // ✅ Clean date values
        const cleanedDateOfBirth = cleanDateValue(date_of_birth);
        const cleanedPurchaseDate = purchase_date ? cleanDateValue(purchase_date) : new Date().toISOString().split('T')[0];

        console.log('🗓️ Cleaned dates:', {
          date_of_birth: cleanedDateOfBirth,
          purchase_date: cleanedPurchaseDate
        });

        // ✅ NEW: Check for duplicate tag number in the same flock
        if (tag_number && flock_id) {
          const duplicateCheck = await pool.query(
            'SELECT id, tag_number FROM livestock WHERE tag_number = $1 AND flock_id = $2',
            [tag_number, flock_id]
          );
          
          if (duplicateCheck.rows.length > 0) {
            console.log('❌ Duplicate found:', duplicateCheck.rows[0]);
            return {
              statusCode: 400,
              headers,
              body: JSON.stringify({
                error: `Tag number "${tag_number}" already exists in this flock (Animal ID: ${duplicateCheck.rows[0].id})`,
                duplicateId: duplicateCheck.rows[0].id
              })
            };
          }
        }

        // Insert the animal with cleaned dates
        const insertResult = await pool.query(
          `INSERT INTO livestock (
            tag_number, animal_type, breed, gender, date_of_birth, purchase_date,
            purchase_price, current_weight, status, location, notes, flock_id
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12) 
           RETURNING *`,
          [
            tag_number || null,
            animal_type,
            breed || '', 
            gender || 'UNKNOWN', 
            cleanedDateOfBirth,  // ✅ Use cleaned date
            cleanedPurchaseDate,  // ✅ Use cleaned date
            purchase_price || 0, 
            current_weight || 0, 
            status, 
            location || '', 
            notes || '', 
            flock_id || null
          ]
        );

        console.log('✅ Animal created successfully with ID:', insertResult.rows[0].id);

        return {
          statusCode: 201,
          headers,
          body: JSON.stringify({ 
            data: insertResult.rows[0],
            message: 'Animal created successfully'
          })
        };

      case 'PUT':
        if (!id || isNaN(id)) {
          return { statusCode: 400, headers, body: JSON.stringify({ error: 'Invalid ID' }) };
        }

        const updateData = JSON.parse(event.body);
        
        console.log('✏️ UPDATE Request data:', JSON.stringify(updateData, null, 2));
        
        // ✅ Clean date values for update
        if ('date_of_birth' in updateData) {
          updateData.date_of_birth = cleanDateValue(updateData.date_of_birth);
        }
        if ('purchase_date' in updateData) {
          updateData.purchase_date = cleanDateValue(updateData.purchase_date);
        }

        console.log('🗓️ Cleaned update dates:', {
          date_of_birth: updateData.date_of_birth,
          purchase_date: updateData.purchase_date
        });
        
        // ✅ NEW: Check for duplicate tag number when updating (excluding current animal)
        if (updateData.tag_number && updateData.flock_id) {
          const duplicateCheck = await pool.query(
            'SELECT id, tag_number FROM livestock WHERE tag_number = $1 AND flock_id = $2 AND id != $3',
            [updateData.tag_number, updateData.flock_id, id]
          );
          
          if (duplicateCheck.rows.length > 0) {
            console.log('❌ Duplicate found during update:', duplicateCheck.rows[0]);
            return {
              statusCode: 400,
              headers,
              body: JSON.stringify({
                error: `Tag number "${updateData.tag_number}" already exists in this flock (Animal ID: ${duplicateCheck.rows[0].id})`,
                duplicateId: duplicateCheck.rows[0].id
              })
            };
          }
        }

        const updateFields = [];
        const updateValues = [];
        let paramCount = 1;

        const fieldMap = {
          tag_number: 'tag_number',
          animal_type: 'animal_type',
          breed: 'breed',
          gender: 'gender',
          date_of_birth: 'date_of_birth',
          purchase_date: 'purchase_date',
          purchase_price: 'purchase_price',
          current_weight: 'current_weight',
          status: 'status',
          location: 'location',
          notes: 'notes',
          flock_id: 'flock_id'
        };

        Object.keys(updateData).forEach(key => {
          if (updateData[key] !== undefined && fieldMap[key]) {
            updateFields.push(`${fieldMap[key]} = $${paramCount}`);
            
            // Handle NULL values for various fields
            if ((key === 'tag_number' && (updateData[key] === '' || updateData[key] === null)) ||
                (key === 'date_of_birth' && updateData[key] === null) ||
                (key === 'purchase_date' && updateData[key] === null)) {
              updateValues.push(null);
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
        const updateQuery = `UPDATE livestock SET ${updateFields.join(', ')}, updated_at = CURRENT_TIMESTAMP WHERE id = $${paramCount} RETURNING *`;
        
        console.log('📝 Update query:', updateQuery);
        console.log('🔢 Update values:', updateValues);
        
        const updateResult = await pool.query(updateQuery, updateValues);
        
        if (updateResult.rows.length === 0) {
          return { statusCode: 404, headers, body: JSON.stringify({ error: 'Livestock not found' }) };
        }

        console.log('✅ Animal updated successfully:', updateResult.rows[0].id);

        return {
          statusCode: 200,
          headers,
          body: JSON.stringify({ 
            data: updateResult.rows[0],
            message: 'Animal updated successfully'
          })
        };

      case 'DELETE':
        if (!id || isNaN(id)) {
          return { statusCode: 400, headers, body: JSON.stringify({ error: 'Invalid ID' }) };
        }

        const deleteResult = await pool.query('DELETE FROM livestock WHERE id = $1', [id]);
        
        if (deleteResult.rowCount === 0) {
          return { statusCode: 404, headers, body: JSON.stringify({ error: 'Livestock not found' }) };
        }

        return {
          statusCode: 200,
          headers,
          body: JSON.stringify({ 
            message: 'Livestock deleted successfully',
            deletedId: id
          })
        };

      default:
        return { statusCode: 405, headers, body: JSON.stringify({ error: 'Method not allowed' }) };
    }
  } catch (error) {
    console.error('❌ Livestock API Error:', error);
    
    // ✅ Handle date format errors
    if (error.message && error.message.includes('invalid input syntax for type date')) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ 
          error: 'Invalid date format. Please use YYYY-MM-DD format or leave the date empty.',
          details: error.message
        })
      };
    }
    
    // ✅ Handle duplicate key violation from PostgreSQL
    if (error.code === '23505') {
      let errorMessage = 'Duplicate entry detected. ';
      
      if (error.constraint === 'unique_tag_per_flock') {
        errorMessage = 'This tag number already exists in the selected flock. Please use a unique tag number.';
      } else if (error.detail) {
        errorMessage += error.detail;
      }
      
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ 
          error: errorMessage,
          code: error.code,
          constraint: error.constraint,
          details: error.detail
        })
      };
    }
    
    // ✅ Handle foreign key constraint violations
    if (error.code === '23503') {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ 
          error: 'Invalid reference. The specified flock does not exist.',
          code: error.code,
          details: error.message
        })
      };
    }
    
    // ✅ Handle not null constraint violations
    if (error.code === '23502') {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ 
          error: 'Required field is missing. Please fill all required fields.',
          code: error.code,
          details: error.message
        })
      };
    }
    
    // ✅ Generic error handling
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ 
        error: 'Internal server error',
        message: error.message,
        code: error.code,
        constraint: error.constraint,
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined
      })
    };
  }
};