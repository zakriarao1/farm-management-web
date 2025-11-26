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
    const { httpMethod, path, queryStringParameters } = event;
    const id = path.split('/').pop();
    const { livestock_id, flock_id, start_date, end_date } = queryStringParameters || {};

    console.log('🔍 Health Records API Request:', {
      httpMethod,
      path,
      id,
      queryStringParameters
    });

    switch (httpMethod) {
      case 'GET':
        // Get specific health record by ID
        if (id && !isNaN(id)) {
          console.log('📋 Fetching health record by ID:', id);
          
          const result = await pool.query(`
            SELECT 
              hr.*,
              l.tag_number as livestock_tag,
              l.animal_type as livestock_type,
              l.breed as livestock_breed,
              f.name as flock_name
            FROM health_records hr
            LEFT JOIN livestock l ON hr.livestock_id = l.id
            LEFT JOIN flocks f ON l.flock_id = f.id
            WHERE hr.id = $1
          `, [id]);
          
          if (result.rows.length === 0) {
            return {
              statusCode: 404,
              headers,
              body: JSON.stringify({ error: 'Health record not found' })
            };
          }

          console.log('✅ Found health record:', result.rows[0].id);
          return {
            statusCode: 200,
            headers,
            body: JSON.stringify({ data: result.rows[0] })
          };
        } 
        // Get health records by livestock ID
        else if (livestock_id && !isNaN(livestock_id)) {
          console.log('🐄 Fetching health records for livestock:', livestock_id);
          
          let query = `
            SELECT 
              hr.*,
              l.tag_number as livestock_tag,
              l.animal_type as livestock_type,
              l.breed as livestock_breed,
              f.name as flock_name
            FROM health_records hr
            LEFT JOIN livestock l ON hr.livestock_id = l.id
            LEFT JOIN flocks f ON l.flock_id = f.id
            WHERE hr.livestock_id = $1
          `;
          const params = [livestock_id];
          let paramCount = 2;

          if (start_date) {
            query += ` AND hr.record_date >= $${paramCount}`;
            params.push(start_date);
            paramCount++;
          }

          if (end_date) {
            query += ` AND hr.record_date <= $${paramCount}`;
            params.push(end_date);
            paramCount++;
          }

          query += ' ORDER BY hr.record_date DESC, hr.created_at DESC';

          const result = await pool.query(query, params);
          console.log(`✅ Found ${result.rows.length} health records for livestock ${livestock_id}`);
          
          return {
            statusCode: 200,
            headers,
            body: JSON.stringify({ data: result.rows })
          };
        }
        // Get all health records with optional filters
        else {
          console.log('📋 Fetching all health records with filters:', { flock_id, start_date, end_date });
          
          let query = `
            SELECT 
              hr.*,
              l.tag_number as livestock_tag,
              l.animal_type as livestock_type,
              l.breed as livestock_breed,
              f.name as flock_name
            FROM health_records hr
            LEFT JOIN livestock l ON hr.livestock_id = l.id
            LEFT JOIN flocks f ON l.flock_id = f.id
            WHERE 1=1
          `;
          const params = [];
          let paramCount = 1;

          if (flock_id && !isNaN(flock_id)) {
            query += ` AND l.flock_id = $${paramCount}`;
            params.push(flock_id);
            paramCount++;
          }

          if (start_date) {
            query += ` AND hr.record_date >= $${paramCount}`;
            params.push(start_date);
            paramCount++;
          }

          if (end_date) {
            query += ` AND hr.record_date <= $${paramCount}`;
            params.push(end_date);
            paramCount++;
          }

          query += ' ORDER BY hr.record_date DESC, hr.created_at DESC';

          const result = await pool.query(query, params);
          console.log(`✅ Found ${result.rows.length} total health records`);
          
          return {
            statusCode: 200,
            headers,
            body: JSON.stringify({ data: result.rows })
          };
        }

      case 'POST':
        console.log('🆕 Creating new health record');
        
        const requestBody = JSON.parse(event.body || '{}');
        console.log('📦 Request body:', requestBody);

        const { 
          livestock_id: postLivestockId, 
          record_date, 
          health_status, 
          diagnosis, 
          treatment, 
          medication, 
          dosage, 
          veterinarian, 
          cost, 
          notes 
        } = requestBody;

        // Validate required fields
        if (!postLivestockId) {
          console.error('❌ Missing livestock_id');
          return { 
            statusCode: 400, 
            headers, 
            body: JSON.stringify({ error: 'Livestock ID is required' }) 
          };
        }

        if (!record_date) {
          console.error('❌ Missing record_date');
          return { 
            statusCode: 400, 
            headers, 
            body: JSON.stringify({ error: 'Record date is required' }) 
          };
        }

        if (!health_status) {
          console.error('❌ Missing health_status');
          return { 
            statusCode: 400, 
            headers, 
            body: JSON.stringify({ error: 'Health status is required' }) 
          };
        }

        // Verify livestock exists
        console.log('🔍 Verifying livestock exists:', postLivestockId);
        const livestockCheck = await pool.query(
          'SELECT id, tag_number FROM livestock WHERE id = $1', 
          [postLivestockId]
        );
        
        if (livestockCheck.rows.length === 0) {
          console.error('❌ Livestock not found:', postLivestockId);
          return {
            statusCode: 404,
            headers,
            body: JSON.stringify({ error: 'Livestock not found' })
          };
        }

        console.log('✅ Livestock found:', livestockCheck.rows[0].tag_number);

        // Insert health record
        const insertResult = await pool.query(
          `INSERT INTO health_records (
            livestock_id, record_date, health_status, diagnosis, 
            treatment, medication, dosage, veterinarian, cost, notes
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) 
           RETURNING *`,
          [
            postLivestockId, 
            record_date, 
            health_status, 
            diagnosis || '', 
            treatment || '', 
            medication || '', 
            dosage || '', 
            veterinarian || '', 
            cost || 0, 
            notes || ''
          ]
        );

        const newRecord = insertResult.rows[0];
        console.log('✅ Health record created with ID:', newRecord.id);

        // Update the livestock's current health status
        console.log('🔄 Updating livestock health status to:', health_status);
        await pool.query(
          'UPDATE livestock SET health_status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
          [health_status, postLivestockId]
        );

        return {
          statusCode: 201,
          headers,
          body: JSON.stringify({ 
            data: newRecord,
            message: 'Health record created successfully'
          })
        };

      case 'PUT':
        console.log('✏️ Updating health record:', id);
        
        if (!id || isNaN(id)) {
          console.error('❌ Invalid ID for update:', id);
          return { 
            statusCode: 400, 
            headers, 
            body: JSON.stringify({ error: 'Invalid health record ID' }) 
          };
        }

        const updateData = JSON.parse(event.body || '{}');
        console.log('📦 Update data:', updateData);

        // Check if record exists
        const existingRecord = await pool.query(
          'SELECT * FROM health_records WHERE id = $1', 
          [id]
        );
        
        if (existingRecord.rows.length === 0) {
          console.error('❌ Health record not found for update:', id);
          return { 
            statusCode: 404, 
            headers, 
            body: JSON.stringify({ error: 'Health record not found' }) 
          };
        }

        const updateFields = [];
        const updateValues = [];
        let paramCount = 1;

        const fieldMap = {
          livestock_id: 'livestock_id',
          record_date: 'record_date',
          health_status: 'health_status',
          diagnosis: 'diagnosis',
          treatment: 'treatment',
          medication: 'medication',
          dosage: 'dosage',
          veterinarian: 'veterinarian',
          cost: 'cost',
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
          console.error('❌ No valid fields to update');
          return { 
            statusCode: 400, 
            headers, 
            body: JSON.stringify({ error: 'No valid fields to update' }) 
          };
        }

        updateValues.push(id);
        const updateQuery = `
          UPDATE health_records 
          SET ${updateFields.join(', ')}, updated_at = CURRENT_TIMESTAMP 
          WHERE id = $${paramCount} 
          RETURNING *
        `;
        
        console.log('🔧 Executing update query:', updateQuery);
        console.log('📊 With parameters:', updateValues);

        const updateResult = await pool.query(updateQuery, updateValues);
        const updatedRecord = updateResult.rows[0];
        console.log('✅ Health record updated:', updatedRecord.id);

        // Update livestock health status if health_status was modified
        if (updateData.health_status !== undefined) {
          console.log('🔄 Updating livestock health status to:', updateData.health_status);
          await pool.query(
            'UPDATE livestock SET health_status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
            [updateData.health_status, updatedRecord.livestock_id]
          );
        }

        return {
          statusCode: 200,
          headers,
          body: JSON.stringify({ 
            data: updatedRecord,
            message: 'Health record updated successfully'
          })
        };

      case 'DELETE':
        console.log('🗑️ Deleting health record:', id);
        
        if (!id || isNaN(id)) {
          console.error('❌ Invalid ID for deletion:', id);
          return { 
            statusCode: 400, 
            headers, 
            body: JSON.stringify({ error: 'Invalid health record ID' }) 
          };
        }

        // Check if record exists
        const recordToDelete = await pool.query(
          'SELECT * FROM health_records WHERE id = $1', 
          [id]
        );
        
        if (recordToDelete.rows.length === 0) {
          console.error('❌ Health record not found for deletion:', id);
          return { 
            statusCode: 404, 
            headers, 
            body: JSON.stringify({ error: 'Health record not found' }) 
          };
        }

        const deleteResult = await pool.query(
          'DELETE FROM health_records WHERE id = $1', 
          [id]
        );
        
        console.log('✅ Health record deleted:', id);

        return {
          statusCode: 200,
          headers,
          body: JSON.stringify({ 
            message: 'Health record deleted successfully'
          })
        };

      default:
        console.error('❌ Method not allowed:', httpMethod);
        return { 
          statusCode: 405, 
          headers, 
          body: JSON.stringify({ error: 'Method not allowed' }) 
        };
    }
  } catch (error) {
    console.error('❌ Health Records API Error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ 
        error: 'Internal server error: ' + error.message
      })
    };
  }
};