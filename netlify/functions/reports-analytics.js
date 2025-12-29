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
    
    // 3. Get harvested crops
    const harvestedCropsQuery = startDate && endDate ? 
      `SELECT COUNT(*) as total FROM crops 
       WHERE status = 'HARVESTED'
       AND planting_date BETWEEN $1 AND $2` :
      `SELECT COUNT(*) as total FROM crops 
       WHERE status = 'HARVESTED'`;
    
    const harvestedCropsResult = await pool.query(harvestedCropsQuery, totalCropsParams);
    const harvestedCrops = parseInt(harvestedCropsResult.rows[0].total) || 0;
    
    // 4. Get sold crops
    const soldCropsQuery = startDate && endDate ? 
      `SELECT COUNT(*) as total FROM crops 
       WHERE status = 'SOLD'
       AND planting_date BETWEEN $1 AND $2` :
      `SELECT COUNT(*) as total FROM crops 
       WHERE status = 'SOLD'`;
    
    const soldCropsResult = await pool.query(soldCropsQuery, totalCropsParams);
    const soldCrops = parseInt(soldCropsResult.rows[0].total) || 0;
    
    // 5. Get total expenses (with date filter if provided)
    const expensesQuery = startDate && endDate ? 
      'SELECT COALESCE(SUM(amount), 0) as total FROM expenses WHERE date BETWEEN $1 AND $2' :
      'SELECT COALESCE(SUM(amount), 0) as total FROM expenses';
    
    const expensesParams = startDate && endDate ? [startDate, endDate] : [];
    const totalExpensesResult = await pool.query(expensesQuery, expensesParams);
    const totalExpenses = parseFloat(totalExpensesResult.rows[0].total) || 0;
    
    // 6. Calculate average expense per crop
    const avgExpensePerCrop = totalCrops > 0 ? totalExpenses / totalCrops : 0;
    
    // 7. Get crop distribution by name
    const cropDistributionQuery = startDate && endDate ? 
      `SELECT 
        name as crop_type,
        COUNT(*) as count,
        COALESCE(SUM(area), 0) as total_area,
        COALESCE(SUM(total_expenses), 0) as total_crop_expenses
       FROM crops 
       WHERE planting_date BETWEEN $1 AND $2
       GROUP BY name
       ORDER BY count DESC` :
      `SELECT 
        name as crop_type,
        COUNT(*) as count,
        COALESCE(SUM(area), 0) as total_area,
        COALESCE(SUM(total_expenses), 0) as total_crop_expenses
       FROM crops 
       GROUP BY name
       ORDER BY count DESC`;
    
    const cropDistributionParams = startDate && endDate ? [startDate, endDate] : [];
    const cropDistributionResult = await pool.query(cropDistributionQuery, cropDistributionParams);
    
    const cropDistribution = cropDistributionResult.rows.map(row => ({
      type: row.crop_type,
      count: parseInt(row.count),
      total_area: parseFloat(row.total_area),
      total_expenses: parseFloat(row.total_crop_expenses) || 0
    }));
    
    // 8. Get status distribution
    const statusDistributionQuery = startDate && endDate ? 
      `SELECT 
        status,
        COUNT(*) as count,
        COALESCE(SUM(total_expenses), 0) as total_expenses
       FROM crops 
       WHERE planting_date BETWEEN $1 AND $2
       GROUP BY status
       ORDER BY count DESC` :
      `SELECT 
        status,
        COUNT(*) as count,
        COALESCE(SUM(total_expenses), 0) as total_expenses
       FROM crops 
       GROUP BY status
       ORDER BY count DESC`;
    
    const statusDistributionParams = startDate && endDate ? [startDate, endDate] : [];
    const statusDistributionResult = await pool.query(statusDistributionQuery, statusDistributionParams);
    
    const statusDistribution = statusDistributionResult.rows.map(row => ({
      status: row.status,
      count: parseInt(row.count),
      total_expenses: parseFloat(row.total_expenses) || 0
    }));
    
    // 9. Get monthly expenses for the last 6 months
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
    
    const monthlyExpensesQuery = `
      SELECT 
        TO_CHAR(date, 'YYYY-MM') as month,
        SUM(amount) as total_expenses,
        COUNT(*) as expense_count
      FROM expenses
      WHERE date >= $1
      ${startDate && endDate ? 'AND date BETWEEN $2 AND $3' : ''}
      GROUP BY TO_CHAR(date, 'YYYY-MM')
      ORDER BY month DESC
      LIMIT 6
    `;
    
    const monthlyExpensesParams = startDate && endDate ? 
      [sixMonthsAgo.toISOString().split('T')[0], startDate, endDate] :
      [sixMonthsAgo.toISOString().split('T')[0]];
    
    const monthlyExpensesResult = await pool.query(monthlyExpensesQuery, monthlyExpensesParams);
    
    const monthlyExpenses = monthlyExpensesResult.rows.map(row => ({
      month: row.month,
      total_expenses: parseFloat(row.total_expenses) || 0,
      expense_count: parseInt(row.expense_count) || 0
    })).reverse(); // Oldest first
    
    // 10. Get top crops by expenses (real data from expenses table)
    const topCropsByExpensesQuery = `
      SELECT 
        c.name,
        c.type,
        COALESCE(SUM(e.amount), 0) as total_expenses,
        COUNT(e.id) as expense_count
      FROM crops c
      LEFT JOIN expenses e ON c.id = e.crop_id
      ${startDate && endDate ? 'WHERE c.planting_date BETWEEN $1 AND $2' : ''}
      GROUP BY c.id, c.name, c.type
      HAVING COALESCE(SUM(e.amount), 0) > 0
      ORDER BY total_expenses DESC
      LIMIT 5
    `;
    
    const topCropsParams = startDate && endDate ? [startDate, endDate] : [];
    const topCropsByExpensesResult = await pool.query(topCropsByExpensesQuery, topCropsParams);
    
    const topCropsByExpenses = topCropsByExpensesResult.rows.map(row => ({
      name: row.name,
      type: row.type || 'Unknown',
      total_expenses: parseFloat(row.total_expenses) || 0,
      expense_count: parseInt(row.expense_count) || 0
    }));
    
    // Prepare the final analytics data - ONLY REAL DATA
    const analyticsData = {
      summary: {
        total_crops: totalCrops,
        active_crops: activeCrops,
        total_harvested_crops: harvestedCrops,
        total_sold_crops: soldCrops,
        total_expenses: totalExpenses,
        average_expense_per_crop: avgExpensePerCrop
      },
      cropDistribution: cropDistribution,
      statusDistribution: statusDistribution,
      monthlyExpenses: monthlyExpenses,
      topCropsByExpenses: topCropsByExpenses
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