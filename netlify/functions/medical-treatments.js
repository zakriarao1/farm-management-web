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
    const { httpMethod, path, queryStringParameters, body } = event;
    const pathParts = path.split('/').filter(part => part);
    
    console.log(`💊 Medical Treatments API: ${httpMethod} ${path}`);

    // Handle different routes
    if (path.includes('/livestock/')) {
      const livestockId = pathParts[pathParts.indexOf('livestock') + 1];
      return await handleLivestockTreatments(httpMethod, livestockId, headers);
    }

    if (path.includes('/upcoming')) {
      const days = queryStringParameters?.days || 30;
      return await handleUpcomingTreatments(days, headers);
    }

    // Handle basic CRUD operations
    const id = pathParts.length > 1 && !isNaN(pathParts[pathParts.length - 1]) 
      ? pathParts[pathParts.length - 1] 
      : null;

    switch (httpMethod) {
      case 'GET':
        if (id) {
          return await getTreatmentById(id, headers);
        } else {
          return await getAllTreatments(headers);
        }

      case 'POST':
        return await createTreatment(body, headers);

      case 'PUT':
        if (!id) {
          return { statusCode: 400, headers, body: JSON.stringify({ error: 'Treatment ID required' }) };
        }
        return await updateTreatment(id, body, headers);

      case 'DELETE':
        if (!id) {
          return { statusCode: 400, headers, body: JSON.stringify({ error: 'Treatment ID required' }) };
        }
        return await deleteTreatment(id, headers);

      default:
        return { statusCode: 405, headers, body: JSON.stringify({ error: 'Method not allowed' }) };
    }
  } catch (error) {
    console.error('❌ Medical Treatments API Error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ 
        error: 'Internal server error: ' + error.message
      })
    };
  }
};

// Get all medical treatments
async function getAllTreatments(headers) {
  console.log('📖 Fetching all medical treatments');
  
  const result = await pool.query(`
    SELECT mt.*, 
           l.tag_number as livestock_tag,
           l.animal_type as livestock_type,
           l.breed as livestock_breed,
           f.name as flock_name
    FROM medical_treatments mt
    LEFT JOIN livestock l ON mt.livestock_id = l.id
    LEFT JOIN flocks f ON l.flock_id = f.id
    ORDER BY mt.administered_date DESC, mt.created_at DESC
  `);
  
  console.log(`✅ Found ${result.rows.length} medical treatments`);
  
  return {
    statusCode: 200,
    headers,
    body: JSON.stringify({ 
      data: result.rows,
      message: 'Medical treatments retrieved successfully'
    })
  };
}

// Get treatments by livestock ID
async function handleLivestockTreatments(httpMethod, livestockId, headers) {
  if (httpMethod !== 'GET') {
    return { statusCode: 405, headers, body: JSON.stringify({ error: 'Method not allowed' }) };
  }

  if (!livestockId || isNaN(livestockId)) {
    return { statusCode: 400, headers, body: JSON.stringify({ error: 'Invalid livestock ID' }) };
  }

  console.log(`📖 Fetching medical treatments for livestock ID: ${livestockId}`);
  
  const result = await pool.query(`
    SELECT mt.*, 
           l.tag_number as livestock_tag,
           l.animal_type as livestock_type,
           l.breed as livestock_breed
    FROM medical_treatments mt
    LEFT JOIN livestock l ON mt.livestock_id = l.id
    WHERE mt.livestock_id = $1
    ORDER BY mt.administered_date DESC, mt.created_at DESC
  `, [livestockId]);
  
  console.log(`✅ Found ${result.rows.length} treatments for livestock ${livestockId}`);
  
  return {
    statusCode: 200,
    headers,
    body: JSON.stringify({ 
      data: result.rows,
      message: 'Livestock medical treatments retrieved successfully'
    })
  };
}

// Get upcoming treatments
async function handleUpcomingTreatments(days, headers) {
  console.log(`📅 Fetching upcoming treatments for next ${days} days`);
  
  const result = await pool.query(`
    SELECT mt.*, 
           l.tag_number as livestock_tag,
           l.animal_type as livestock_type,
           l.breed as livestock_breed,
           f.name as flock_name
    FROM medical_treatments mt
    LEFT JOIN livestock l ON mt.livestock_id = l.id
    LEFT JOIN flocks f ON l.flock_id = f.id
    WHERE mt.next_due_date BETWEEN CURRENT_DATE AND CURRENT_DATE + $1::integer
    ORDER BY mt.next_due_date ASC, mt.created_at ASC
  `, [days]);
  
  console.log(`✅ Found ${result.rows.length} upcoming treatments`);
  
  return {
    statusCode: 200,
    headers,
    body: JSON.stringify({ 
      data: result.rows,
      message: 'Upcoming medical treatments retrieved successfully'
    })
  };
}

// Get treatment by ID
async function getTreatmentById(id, headers) {
  console.log(`📖 Fetching medical treatment with ID: ${id}`);
  
  const result = await pool.query(`
    SELECT mt.*, 
           l.tag_number as livestock_tag,
           l.animal_type as livestock_type,
           l.breed as livestock_breed,
           f.name as flock_name
    FROM medical_treatments mt
    LEFT JOIN livestock l ON mt.livestock_id = l.id
    LEFT JOIN flocks f ON l.flock_id = f.id
    WHERE mt.id = $1
  `, [id]);
  
  if (result.rows.length === 0) {
    return {
      statusCode: 404,
      headers,
      body: JSON.stringify({ error: 'Medical treatment not found' })
    };
  }
  
  return {
    statusCode: 200,
    headers,
    body: JSON.stringify({ 
      data: result.rows[0],
      message: 'Medical treatment retrieved successfully'
    })
  };
}

// Create new treatment
async function createTreatment(body, headers) {
  console.log('🆕 Creating new medical treatment');
  
  const requestBody = JSON.parse(body || '{}');
  const { 
    livestock_id, flock_id, treatment_type, medicine_name, dosage,
    administered_date, next_due_date, cost, veterinarian, notes 
  } = requestBody;
  
  console.log('📦 Create treatment data:', requestBody);
  
  // Validate required fields
  if (!livestock_id || !treatment_type || !administered_date) {
    return {
      statusCode: 400,
      headers,
      body: JSON.stringify({ 
        error: 'Livestock ID, treatment type, and administered date are required',
        received: requestBody
      })
    };
  }

  const result = await pool.query(
    `INSERT INTO medical_treatments (
      livestock_id, flock_id, treatment_type, medicine_name, dosage,
      administered_date, next_due_date, cost, veterinarian, notes
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) 
     RETURNING *`,
    [
      livestock_id,
      flock_id || null,
      treatment_type,
      medicine_name || '',
      dosage || '',
      administered_date,
      next_due_date || null,
      cost || 0,
      veterinarian || '',
      notes || ''
    ]
  );

  console.log(`✅ Medical treatment created with ID: ${result.rows[0].id}`);

  return {
    statusCode: 201,
    headers,
    body: JSON.stringify({ 
      data: result.rows[0],
      message: 'Medical treatment created successfully'
    })
  };
}

// Update treatment
async function updateTreatment(id, body, headers) {
  console.log(`✏️ Updating medical treatment with ID: ${id}`);
  
  const updateData = JSON.parse(body || '{}');
  console.log('📦 Update data:', updateData);
  
  const updateFields = [];
  const updateValues = [];
  let paramCount = 1;

  const fieldMap = {
    livestock_id: 'livestock_id',
    flock_id: 'flock_id',
    treatment_type: 'treatment_type',
    medicine_name: 'medicine_name',
    dosage: 'dosage',
    administered_date: 'administered_date',
    next_due_date: 'next_due_date',
    cost: 'cost',
    veterinarian: 'veterinarian',
    notes: 'notes'
  };

  Object.keys(updateData).forEach(key => {
    if (updateData[key] !== undefined && fieldMap[key]) {
      updateFields.push(`${fieldMap[key]} = $${paramCount}`);
      
      // Handle different data types
      if (key === 'cost') {
        updateValues.push(parseFloat(updateData[key]));
      } else if (key === 'notes') {
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
    UPDATE medical_treatments 
    SET ${updateFields.join(', ')}, updated_at = CURRENT_TIMESTAMP 
    WHERE id = $${paramCount} 
    RETURNING *
  `;
  
  console.log(`🔧 Update query:`, updateQuery);
  console.log(`📊 Update values:`, updateValues);
  
  const result = await pool.query(updateQuery, updateValues);
  
  if (result.rows.length === 0) {
    return { 
      statusCode: 404, 
      headers, 
      body: JSON.stringify({ error: 'Medical treatment not found' }) 
    };
  }

  console.log(`✅ Medical treatment ${id} updated successfully`);

  return {
    statusCode: 200,
    headers,
    body: JSON.stringify({ 
      data: result.rows[0],
      message: 'Medical treatment updated successfully'
    })
  };
}

// Delete treatment
async function deleteTreatment(id, headers) {
  console.log(`🗑️ Deleting medical treatment with ID: ${id}`);
  
  const result = await pool.query('DELETE FROM medical_treatments WHERE id = $1 RETURNING *', [id]);
  
  if (result.rows.length === 0) {
    return { 
      statusCode: 404, 
      headers, 
      body: JSON.stringify({ error: 'Medical treatment not found' }) 
    };
  }

  console.log(`✅ Medical treatment ${id} deleted successfully`);

  return {
    statusCode: 200,
    headers,
    body: JSON.stringify({ 
      message: 'Medical treatment deleted successfully',
      deletedTreatment: result.rows[0]
    })
  };
}