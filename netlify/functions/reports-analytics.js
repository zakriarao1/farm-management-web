const { pool } = require('./db');

exports.handler = async (event, context) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Content-Type': 'application/json'
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  try {
    // Get analytics data
    const cropsCount = await pool.query('SELECT COUNT(*) FROM crops');
    const activeCrops = await pool.query('SELECT COUNT(*) FROM crops WHERE status IN ($1, $2, $3)', ['PLANTED', 'GROWING', 'READY_FOR_HARVEST']);
    const totalExpenses = await pool.query('SELECT COALESCE(SUM(amount), 0) as total FROM expenses');
    const projectedRevenue = await pool.query('SELECT COALESCE(SUM(expected_yield * market_price), 0) as revenue FROM crops WHERE status != $1', ['FAILED']);

    // Get crop distribution
    const cropDistribution = await pool.query(`
      SELECT type, COUNT(*) as count, COALESCE(SUM(area), 0) as total_area 
      FROM crops 
      GROUP BY type
    `);

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        data: {
          summary: {
            total_crops: parseInt(cropsCount.rows[0].count),
            active_crops: parseInt(activeCrops.rows[0].count),
            total_expenses: parseFloat(totalExpenses.rows[0].total),
            projected_revenue: parseFloat(projectedRevenue.rows[0].revenue)
          },
          cropDistribution: cropDistribution.rows
        },
        message: 'Analytics retrieved successfully'
      })
    };

  } catch (error) {
    console.error('Reports API Error:', error);
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