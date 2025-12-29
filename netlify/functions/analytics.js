// netlify/functions/analytics.js
const { Pool } = require('pg');
const path = require('path');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

exports.handler = async (event, context) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, x-api-key',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
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
    console.log('📊 Generating farm analytics...');
    
    // Get current date for calculations
    const currentDate = new Date();
    const currentMonth = currentDate.getMonth() + 1;
    const currentYear = currentDate.getFullYear();
    
    // 1. Get total crops count
    const totalCropsResult = await pool.query('SELECT COUNT(*) as total FROM crops');
    const totalCrops = parseInt(totalCropsResult.rows[0].total) || 0;
    
    // 2. Get active crops (not HARVESTED, SOLD, or FAILED)
    const activeCropsResult = await pool.query(
      `SELECT COUNT(*) as total FROM crops 
       WHERE status NOT IN ('HARVESTED', 'SOLD', 'FAILED')`
    );
    const activeCrops = parseInt(activeCropsResult.rows[0].total) || 0;
    
    // 3. Get total expenses from expenses table
    const totalExpensesResult = await pool.query(
      'SELECT COALESCE(SUM(amount), 0) as total FROM expenses'
    );
    const totalExpenses = parseFloat(totalExpensesResult.rows[0].total) || 0;
    
    // 4. Get crop distribution by type
    const cropDistributionResult = await pool.query(`
      SELECT 
        LOWER(name) as crop_type,
        COUNT(*) as count,
        COALESCE(SUM(area), 0) as total_area
      FROM crops 
      GROUP BY LOWER(name)
      ORDER BY count DESC
    `);
    
    const cropDistribution = cropDistributionResult.rows.map(row => ({
      type: row.crop_type.toUpperCase(),
      count: parseInt(row.count),
      total_area: parseFloat(row.total_area)
    }));
    
    // 5. Get status distribution
    const statusDistributionResult = await pool.query(`
      SELECT 
        status,
        COUNT(*) as count
      FROM crops 
      GROUP BY status
      ORDER BY count DESC
    `);
    
    const statusDistribution = statusDistributionResult.rows.map(row => ({
      status: row.status,
      count: parseInt(row.count)
    }));
    
    // 6. Get monthly expenses for the last 6 months
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
    
    const monthlyExpensesResult = await pool.query(`
      SELECT 
        TO_CHAR(date, 'YYYY-MM') as month,
        SUM(amount) as total_expenses,
        COUNT(*) as expense_count
      FROM expenses
      WHERE date >= $1
      GROUP BY TO_CHAR(date, 'YYYY-MM')
      ORDER BY month DESC
      LIMIT 6
    `, [sixMonthsAgo.toISOString().split('T')[0]]);
    
    const monthlyExpenses = monthlyExpensesResult.rows.map(row => ({
      month: row.month,
      total_expenses: parseFloat(row.total_expenses) || 0,
      expense_count: parseInt(row.expense_count) || 0
    })).reverse(); // Oldest first
    
    // 7. Get top crops by expenses
    const topCropsByExpensesResult = await pool.query(`
      SELECT 
        c.name,
        c.type,
        COALESCE(SUM(e.amount), 0) as total_expenses,
        COUNT(e.id) as expense_count
      FROM crops c
      LEFT JOIN expenses e ON c.id = e.crop_id
      GROUP BY c.id, c.name, c.type
      HAVING COALESCE(SUM(e.amount), 0) > 0
      ORDER BY total_expenses DESC
      LIMIT 5
    `);
    
    const topCropsByExpenses = topCropsByExpensesResult.rows.map(row => ({
      name: row.name,
      type: row.type || 'Unknown',
      total_expenses: parseFloat(row.total_expenses) || 0,
      expense_count: parseInt(row.expense_count) || 0
    }));
    
    // 8. Get harvested crops stats
    const harvestedCropsResult = await pool.query(`
      SELECT 
        COUNT(*) as harvested_count,
        COALESCE(AVG(yield), 0) as avg_yield,
        COALESCE(SUM(yield), 0) as total_yield
      FROM crops 
      WHERE status IN ('HARVESTED', 'SOLD') 
        AND yield > 0
    `);
    
    const harvestedData = harvestedCropsResult.rows[0];
    const harvestedCropsCount = parseInt(harvestedData.harvested_count) || 0;
    const avgActualYield = parseFloat(harvestedData.avg_yield) || 0;
    const totalActualYield = parseFloat(harvestedData.total_yield) || 0;
    
    // 9. Get average expected yield for all crops
    const avgExpectedYieldResult = await pool.query(`
      SELECT COALESCE(AVG(yield), 0) as avg_yield 
      FROM crops 
      WHERE yield > 0
    `);
    const avgExpectedYield = parseFloat(avgExpectedYieldResult.rows[0].avg_yield) || 0;
    
    // 10. Calculate projected revenue (very basic calculation)
    // This is a simplified calculation - you might want to improve this
    const projectedRevenueResult = await pool.query(`
      SELECT 
        COALESCE(SUM(
          CASE 
            WHEN c.status = 'SOLD' AND c.market_price > 0 AND c.yield > 0 
              THEN c.yield * c.market_price
            WHEN c.status NOT IN ('HARVESTED', 'SOLD', 'FAILED') AND c.market_price > 0 AND c.yield > 0
              THEN c.yield * c.market_price * 0.7 -- 70% of potential for growing crops
            ELSE 0
          END
        ), 0) as projected_revenue
      FROM crops c
    `);
    
    const projectedRevenue = parseFloat(projectedRevenueResult.rows[0].projected_revenue) || 0;
    
    // Prepare the final analytics data
    const analyticsData = {
      summary: {
        total_crops: totalCrops,
        active_crops: activeCrops,
        total_expenses: totalExpenses,
        projected_revenue: projectedRevenue,
        avg_expected_yield: avgExpectedYield,
        avg_actual_yield: avgActualYield,
        harvested_crops_count: harvestedCropsCount,
        total_actual_yield: totalActualYield
      },
      cropDistribution: cropDistribution,
      statusDistribution: statusDistribution,
      monthlyExpenses: monthlyExpenses,
      topCropsByExpenses: topCropsByExpenses
    };
    
    console.log('✅ Analytics generated successfully');
    console.log('📊 Summary:', {
      totalCrops,
      activeCrops,
      totalExpenses,
      projectedRevenue
    });
    
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        data: analyticsData,
        message: 'Analytics retrieved successfully'
      })
    };
    
  } catch (error) {
    console.error('❌ Error generating analytics:', error);
    console.error('❌ Error stack:', error.stack);
    
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ 
        error: 'Failed to generate analytics',
        details: error.message
      })
    };
  }
};