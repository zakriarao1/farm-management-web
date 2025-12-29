// netlify/functions/reports-analytics.js
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
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
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  try {
    console.log('📊 Generating analytics report...');
    
    // Parse query parameters for date filtering
    const { startDate, endDate } = event.queryStringParameters || {};
    
    // 1. Get total crops count
    const totalCropsQuery = startDate && endDate ? 
      'SELECT COUNT(*) as total FROM crops WHERE planting_date BETWEEN $1 AND $2' :
      'SELECT COUNT(*) as total FROM crops';
    
    const totalCropsParams = startDate && endDate ? [startDate, endDate] : [];
    const totalCropsResult = await pool.query(totalCropsQuery, totalCropsParams);
    const totalCrops = parseInt(totalCropsResult.rows[0].total) || 0;
    
    // 2. Get active crops (not HARVESTED, SOLD, or FAILED)
    const activeCropsQuery = startDate && endDate ? 
      `SELECT COUNT(*) as total FROM crops 
       WHERE status NOT IN ('HARVESTED', 'SOLD', 'FAILED')
       AND planting_date BETWEEN $1 AND $2` :
      `SELECT COUNT(*) as total FROM crops 
       WHERE status NOT IN ('HARVESTED', 'SOLD', 'FAILED')`;
    
    const activeCropsParams = startDate && endDate ? [startDate, endDate] : [];
    const activeCropsResult = await pool.query(activeCropsQuery, activeCropsParams);
    const activeCrops = parseInt(activeCropsResult.rows[0].total) || 0;
    
    // 3. Get total expenses (with date filter if provided)
    const expensesQuery = startDate && endDate ? 
      'SELECT COALESCE(SUM(amount), 0) as total FROM expenses WHERE date BETWEEN $1 AND $2' :
      'SELECT COALESCE(SUM(amount), 0) as total FROM expenses';
    
    const expensesParams = startDate && endDate ? [startDate, endDate] : [];
    const totalExpensesResult = await pool.query(expensesQuery, expensesParams);
    const totalExpenses = parseFloat(totalExpensesResult.rows[0].total) || 0;
    
    // 4. Get crop distribution by name
    const cropDistributionQuery = startDate && endDate ? 
      `SELECT 
        name as crop_type,
        COUNT(*) as count,
        COALESCE(SUM(area), 0) as total_area
       FROM crops 
       WHERE planting_date BETWEEN $1 AND $2
       GROUP BY name
       ORDER BY count DESC` :
      `SELECT 
        name as crop_type,
        COUNT(*) as count,
        COALESCE(SUM(area), 0) as total_area
       FROM crops 
       GROUP BY name
       ORDER BY count DESC`;
    
    const cropDistributionParams = startDate && endDate ? [startDate, endDate] : [];
    const cropDistributionResult = await pool.query(cropDistributionQuery, cropDistributionParams);
    
    const cropDistribution = cropDistributionResult.rows.map(row => ({
      type: row.crop_type,
      count: parseInt(row.count),
      total_area: parseFloat(row.total_area)
    }));
    
    // 5. Get status distribution
    const statusDistributionQuery = startDate && endDate ? 
      `SELECT 
        status,
        COUNT(*) as count
       FROM crops 
       WHERE planting_date BETWEEN $1 AND $2
       GROUP BY status
       ORDER BY count DESC` :
      `SELECT 
        status,
        COUNT(*) as count
       FROM crops 
       GROUP BY status
       ORDER BY count DESC`;
    
    const statusDistributionParams = startDate && endDate ? [startDate, endDate] : [];
    const statusDistributionResult = await pool.query(statusDistributionQuery, statusDistributionParams);
    
    const statusDistribution = statusDistributionResult.rows.map(row => ({
      status: row.status,
      count: parseInt(row.count)
    }));
    
    // Prepare the final analytics data
    const analyticsData = {
      summary: {
        total_crops: totalCrops,
        active_crops: activeCrops,
        total_expenses: totalExpenses,
        projected_revenue: 0, // You'll need to calculate this based on your business logic
        avg_expected_yield: 0,
        avg_actual_yield: 0,
        harvested_crops_count: 0,
        total_actual_yield: 0
      },
      cropDistribution: cropDistribution,
      statusDistribution: statusDistribution,
      monthlyExpenses: [], // You'll need to implement this
      topCropsByExpenses: [] // You'll need to implement this
    };
    
    console.log('✅ Analytics report generated successfully');
    
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        data: analyticsData,
        message: 'Analytics report retrieved successfully'
      })
    };
    
  } catch (error) {
    console.error('❌ Error generating analytics report:', error);
    
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ 
        error: 'Failed to generate analytics report',
        details: error.message
      })
    };
  }
};