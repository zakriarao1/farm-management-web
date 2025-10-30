const { pool, parsePath, sendResponse } = require('./db.js');

exports.handler = async (event) => {
  const { httpMethod, path, body } = event;
  const { resource, id } = parsePath(path);
  
  // Handle OPTIONS for CORS
  if (httpMethod === 'OPTIONS') {
    return sendResponse(200, {});
  }
  
  try {
    // GET /flocks - Get all flocks
    if (httpMethod === 'GET' && resource === 'flocks' && !id) {
      return await getAllFlocks();
    }
    
    // GET /flocks/:id - Get specific flock
    if (httpMethod === 'GET' && resource === 'flocks' && id && !path.includes('/stats')) {
      return await getFlockById(id);
    }
    
    // GET /flocks/:id/stats - Get flock statistics
    if (httpMethod === 'GET' && resource === 'flocks' && id && path.includes('/stats')) {
      return await getFlockStats(id);
    }
    
    // POST /flocks - Create new flock
    if (httpMethod === 'POST' && resource === 'flocks' && !id) {
      return await createFlock(body);
    }
    
    // PUT /flocks/:id - Update flock
    if (httpMethod === 'PUT' && resource === 'flocks' && id) {
      return await updateFlock(id, body);
    }
    
    // DELETE /flocks/:id - Delete flock
    if (httpMethod === 'DELETE' && resource === 'flocks' && id) {
      return await deleteFlock(id);
    }
    
    return sendResponse(404, { 
      data: null,
      message: 'Route not found',
      success: false 
    });
    
  } catch (error) {
    console.error('Flock function error:', error);
    return sendResponse(500, { 
      data: null,
      message: 'Internal server error',
      success: false
    });
  }
};

// EXACT replica of your FlockController methods
async function getAllFlocks() {
  try {
    const flocks = await flockRepositoryFindAll();
    
    // ✅ EXACT same response format as your controller
    return sendResponse(200, {
      data: flocks,
      message: 'Flocks retrieved successfully',
      success: true
    });
  } catch (error) {
    console.error('Get flocks error:', error);
    return sendResponse(500, { 
      data: null,
      message: 'Failed to fetch flocks',
      success: false
    });
  }
}

async function getFlockById(id) {
  try {
    const parsedId = parseInt(id);
    if (isNaN(parsedId)) {
      return sendResponse(400, { 
        data: null,
        message: 'Invalid flock ID',
        success: false 
      });
    }
    
    const flock = await flockRepositoryFindById(parsedId);
    
    if (!flock) {
      return sendResponse(404, { 
        data: null,
        message: 'Flock not found',
        success: false 
      });
    }
    
    // ✅ EXACT same response format
    return sendResponse(200, {
      data: flock,
      message: 'Flock retrieved successfully',
      success: true
    });
  } catch (error) {
    console.error('Get flock error:', error);
    return sendResponse(500, { 
      data: null,
      message: 'Failed to fetch flock',
      success: false
    });
  }
}

async function createFlock(body) {
  try {
    const flockData = JSON.parse(body);
    const flock = await flockRepositoryCreate(flockData);
    
    // ✅ EXACT same response format
    return sendResponse(201, {
      data: flock,
      message: 'Flock created successfully',
      success: true
    });
  } catch (error) {
    console.error('Create flock error:', error);
    return sendResponse(500, { 
      data: null,
      message: 'Failed to create flock',
      success: false
    });
  }
}

async function updateFlock(id, body) {
  try {
    const parsedId = parseInt(id);
    if (isNaN(parsedId)) {
      return sendResponse(400, { 
        data: null,
        message: 'Invalid flock ID',
        success: false 
      });
    }
    
    const flockData = JSON.parse(body);
    const flock = await flockRepositoryUpdate(parsedId, flockData);
    
    if (!flock) {
      return sendResponse(404, { 
        data: null,
        message: 'Flock not found',
        success: false 
      });
    }
    
    // ✅ EXACT same response format
    return sendResponse(200, {
      data: flock,
      message: 'Flock updated successfully',
      success: true
    });
  } catch (error) {
    console.error('Update flock error:', error);
    return sendResponse(500, { 
      data: null,
      message: 'Failed to update flock',
      success: false
    });
  }
}

async function deleteFlock(id) {
  try {
    const parsedId = parseInt(id);
    if (isNaN(parsedId)) {
      return sendResponse(400, { 
        data: null,
        message: 'Invalid flock ID',
        success: false 
      });
    }
    
    const deleted = await flockRepositoryDelete(parsedId);
    
    if (!deleted) {
      return sendResponse(404, { 
        data: null,
        message: 'Flock not found',
        success: false 
      });
    }
    
    // ✅ EXACT same response format
    return sendResponse(200, {
      data: { message: 'Flock deleted successfully' },
      message: 'Flock deleted successfully',
      success: true
    });
  } catch (error) {
    console.error('Delete flock error:', error);
    return sendResponse(500, { 
      data: null,
      message: 'Failed to delete flock',
      success: false
    });
  }
}

async function getFlockStats(id) {
  try {
    const parsedId = parseInt(id);
    if (isNaN(parsedId)) {
      return sendResponse(400, { 
        data: null,
        message: 'Invalid flock ID',
        success: false 
      });
    }
    
    const stats = await flockRepositoryGetStats(parsedId);
    
    if (!stats) {
      return sendResponse(404, { 
        data: null,
        message: 'Flock not found',
        success: false 
      });
    }
    
    // ✅ EXACT same response format
    return sendResponse(200, {
      data: stats,
      message: 'Flock stats retrieved successfully',
      success: true
    });
  } catch (error) {
    console.error('Get flock stats error:', error);
    return sendResponse(500, { 
      data: null,
      message: 'Failed to fetch flock stats',
      success: false
    });
  }
}

// ✅ EXACT replica of your FlockRepository queries
async function flockRepositoryFindAll() {
  const result = await pool.query('SELECT * FROM flocks ORDER BY name');
  return result.rows;
}

async function flockRepositoryFindById(id) {
  const result = await pool.query('SELECT * FROM flocks WHERE id = $1', [id]);
  return result.rows[0] || null;
}

async function flockRepositoryCreate(flockData) {
  const { name, description, purchase_date, total_purchase_cost } = flockData;

  const query = `
    INSERT INTO flocks (name, description, purchase_date, total_purchase_cost, created_at, updated_at)
    VALUES ($1, $2, $3, $4, NOW(), NOW())
    RETURNING *
  `;

  const result = await pool.query(query, [
    name,
    description || null,
    purchase_date || null,
    total_purchase_cost || null
  ]);

  return result.rows[0];
}

async function flockRepositoryUpdate(id, flockData) {
  const { name, description, purchase_date, total_purchase_cost } = flockData;

  const query = `
    UPDATE flocks
    SET name = COALESCE($1, name),
        description = COALESCE($2, description),
        purchase_date = COALESCE($3, purchase_date),
        total_purchase_cost = COALESCE($4, total_purchase_cost),
        updated_at = NOW()
    WHERE id = $5
    RETURNING *
  `;

  const result = await pool.query(query, [
    name,
    description,
    purchase_date,
    total_purchase_cost,
    id
  ]);

  return result.rows[0] || null;
}

async function flockRepositoryDelete(id) {
  const result = await pool.query('DELETE FROM flocks WHERE id = $1', [id]);
  return result.rowCount > 0;
}

async function flockRepositoryGetStats(flockId) {
  const query = `
    SELECT
      f.*,
      COUNT(l.id) as animal_count,
      COALESCE(SUM(le.amount), 0) as total_expenses
    FROM flocks f
    LEFT JOIN livestock l ON f.id = l.flock_id
    LEFT JOIN livestock_expenses le ON f.id = le.flock_id
    WHERE f.id = $1
    GROUP BY f.id
  `;

  const result = await pool.query(query, [flockId]);
  return result.rows[0] || null;
}
