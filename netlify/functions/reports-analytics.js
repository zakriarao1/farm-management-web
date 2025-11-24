// netlify/functions/reports-analytics.js

const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

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

  if (event.httpMethod !== 'GET') {
    return { statusCode: 405, headers, body: JSON.stringify({ error: 'Method not allowed' }) };
  }

  try {
    console.log('Fetching analytics data...');

    // Get basic crop statistics
    const cropsCount = await pool.query('SELECT COUNT(*) FROM crops');
    const activeCrops = await pool.query(
      'SELECT COUNT(*) FROM crops WHERE status IN ($1, $2, $3)', 
      ['PLANTED', 'GROWING', 'READY_FOR_HARVEST']
    );
    
    const totalExpensesResult = await pool.query('SELECT COALESCE(SUM(amount), 0) as total FROM expenses');
    const projectedRevenueResult = await pool.query(
      'SELECT COALESCE(SUM(expected_yield * market_price), 0) as revenue FROM crops WHERE status != $1', 
      ['FAILED']
    );

    // Get crop distribution
    const cropDistribution = await pool.query(`
      SELECT 
        name as type, 
        COUNT(*) as count, 
        COALESCE(SUM(area), 0) as total_area 
      FROM crops 
      GROUP BY name
      ORDER BY count DESC
    `);

    // Get status distribution
    const statusDistribution = await pool.query(`
      SELECT status, COUNT(*) as count
      FROM crops 
      GROUP BY status 
      ORDER BY count DESC
    `);

    // Get monthly expenses
    const monthlyExpenses = await pool.query(`
      SELECT 
        TO_CHAR(date, 'YYYY-MM') as month,
        COALESCE(SUM(amount), 0) as total_expenses,
        COUNT(*) as expense_count
      FROM expenses 
      GROUP BY TO_CHAR(date, 'YYYY-MM')
      ORDER BY month DESC
      LIMIT 6
    `);

    const analyticsData = {
      summary: {
        total_crops: parseInt(cropsCount.rows[0].count) || 0,
        active_crops: parseInt(activeCrops.rows[0].count) || 0,
        total_expenses: parseFloat(totalExpensesResult.rows[0].total) || 0,
        projected_revenue: parseFloat(projectedRevenueResult.rows[0].revenue) || 0
      },
      cropDistribution: cropDistribution.rows.map(row => ({
        type: row.type,
        count: parseInt(row.count),
        total_area: parseFloat(row.total_area)
      })),
      statusDistribution: statusDistribution.rows.map(row => ({
        status: row.status,
        count: parseInt(row.count)
      })),
      monthlyExpenses: monthlyExpenses.rows.map(row => ({
        month: row.month,
        total_expenses: parseFloat(row.total_expenses),
        expense_count: parseInt(row.expense_count)
      }))
    };

    console.log('Analytics data fetched successfully');

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        data: analyticsData,
        message: 'Analytics retrieved successfully'
      })
    };

  } catch (error) {
    console.error('Analytics API Error:', error);
    
    // Return fallback data instead of error
    const fallbackData = {
      summary: {
        total_crops: 0,
        active_crops: 0,
        total_expenses: 0,
        projected_revenue: 0
      },
      cropDistribution: [],
      statusDistribution: [],
      monthlyExpenses: []
    };

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        data: fallbackData,
        message: 'Using fallback analytics data due to server error'
      })
    };
  }
};