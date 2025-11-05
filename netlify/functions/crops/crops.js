const { pool } = require('../shared/config/database');
const { authenticateToken } = require('../shared/middleware/auth');

exports.handler = async (event, context) => {
  // Handle CORS
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS'
  };

  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: ''
    };
  }

  try {
    // Authenticate request
    const authResult = await authenticateToken(event);
    if (!authResult.authenticated) {
      return {
        statusCode: 401,
        headers,
        body: JSON.stringify({ error: 'Unauthorized' })
      };
    }

    const { path, httpMethod, queryStringParameters, body } = event;
    
    switch (httpMethod) {
      case 'GET':
        if (path.includes('/active')) {
          return getActiveCrops();
        } else if (path.includes('/search')) {
          return searchCrops(queryStringParameters.q);
        } else if (path.includes('/status/')) {
          const status = path.split('/').pop();
          return getCropsByStatus(status);
        } else if (path.includes('/expenses')) {
          const cropId = path.split('/')[2];
          return getCropExpenses(cropId);
        } else if (path.includes('/')) {
          const cropId = path.split('/').pop();
          if (cropId && !isNaN(cropId)) {
            return getCropById(cropId);
          } else {
            return getAllCrops();
          }
        }
        break;

      case 'POST':
        if (path.includes('/expenses')) {
          const cropId = path.split('/')[2];
          return createCropExpense(cropId, JSON.parse(body));
        } else {
          return createCrop(JSON.parse(body));
        }
        break;

      case 'PUT':
        const cropId = path.split('/').pop();
        return updateCrop(cropId, JSON.parse(body));

      case 'DELETE':
        const id = path.split('/').pop();
        return deleteCrop(id);

      default:
        return {
          statusCode: 405,
          headers,
          body: JSON.stringify({ error: 'Method not allowed' })
        };
    }
  } catch (error) {
    console.error('Function error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ 
        error: 'Internal server error',
        message: error.message 
      })
    };
  }
};

async function getAllCrops() {
  const result = await pool.query('SELECT * FROM crops ORDER BY created_at DESC');
  return {
    statusCode: 200,
    headers,
    body: JSON.stringify({
      data: result.rows,
      message: 'Crops retrieved successfully'
    })
  };
}

async function getCropById(id) {
  const result = await pool.query('SELECT * FROM crops WHERE id = $1', [id]);
  
  if (result.rows.length === 0) {
    return {
      statusCode: 404,
      headers,
      body: JSON.stringify({ error: 'Crop not found' })
    };
  }

  return {
    statusCode: 200,
    headers,
    body: JSON.stringify({
      data: result.rows[0],
      message: 'Crop retrieved successfully'
    })
  };
}

async function createCrop(cropData) {
  const {
    name, type, variety, planting_date, expected_harvest_date,
    area, area_unit, expected_yield, yield_unit, market_price,
    total_expenses, status, field_location, notes
  } = cropData;

  const query = `
    INSERT INTO crops (
      name, type, variety, planting_date, expected_harvest_date, 
      area, area_unit, expected_yield, yield_unit, market_price, 
      total_expenses, status, field_location, notes
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
    RETURNING *
  `;

  const values = [
    name, type, variety, planting_date, expected_harvest_date,
    area, area_unit, expected_yield, yield_unit, market_price,
    total_expenses || 0, status, field_location, notes
  ];

  const result = await pool.query(query, values);

  return {
    statusCode: 201,
    headers,
    body: JSON.stringify({
      data: result.rows[0],
      message: 'Crop created successfully'
    })
  };
}

// Add other crop functions similarly...