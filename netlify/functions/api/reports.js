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

  try {
    const { httpMethod, path } = event;
    const { startDate, endDate } = event.queryStringParameters || {};

    if (httpMethod !== 'GET') {
      return { statusCode: 405, headers, body: JSON.stringify({ error: 'Method not allowed' }) };
    }

    if (path.includes('/analytics')) {
      // Get farm analytics
      const totalStats = await pool.query(`
        SELECT 
          COUNT(*) as total_crops,
          COUNT(CASE WHEN status IN ('PLANTED', 'GROWING', 'READY_FOR_HARVEST') THEN 1 END) as active_crops,
          SUM(area) as total_area,
          SUM(total_expenses) as total_expenses,
          SUM(expected_yield * market_price) as projected_revenue
        FROM crops
      `);

      const cropDistribution = await pool.query(`
        SELECT type, COUNT(*) as count, SUM(area) as total_area
        FROM crops 
        GROUP BY type 
        ORDER BY count DESC
      `);

      const statusDistribution = await pool.query(`
        SELECT status, COUNT(*) as count
        FROM crops 
        GROUP BY status 
        ORDER BY count DESC
      `);

      const monthlyExpenses = await pool.query(`
        SELECT 
          TO_CHAR(date, 'YYYY-MM') as month,
          SUM(amount) as total_expenses,
          COUNT(*) as expense_count
        FROM expenses 
        GROUP BY TO_CHAR(date, 'YYYY-MM')
        ORDER BY month DESC
        LIMIT 12
      `);

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          data: {
            summary: totalStats.rows[0],
            cropDistribution: cropDistribution.rows,
            statusDistribution: statusDistribution.rows,
            monthlyExpenses: monthlyExpenses.rows
          }
        })
      };
    }

    if (path.includes('/financial')) {
      // Get financial report
      let dateCondition = '';
      const params = [];

      if (startDate && endDate) {
        dateCondition = 'WHERE e.date BETWEEN $1 AND $2';
        params.push(startDate, endDate);
      }

      const financialReport = await pool.query(`
        SELECT 
          c.name as crop_name,
          c.type as crop_type,
          c.expected_yield,
          c.market_price,
          (c.expected_yield * c.market_price) as projected_revenue,
          c.total_expenses,
          (c.expected_yield * c.market_price - c.total_expenses) as projected_profit,
          COUNT(e.id) as expense_count
        FROM crops c
        LEFT JOIN expenses e ON c.id = e.crop_id
        ${dateCondition}
        GROUP BY c.id, c.name, c.type, c.expected_yield, c.market_price, c.total_expenses
        ORDER BY projected_profit DESC
      `, params);

      const summary = await pool.query(`
        SELECT 
          SUM(c.expected_yield * c.market_price) as total_projected_revenue,
          SUM(c.total_expenses) as total_expenses,
          SUM(c.expected_yield * c.market_price - c.total_expenses) as total_projected_profit,
          COUNT(DISTINCT c.id) as total_crops
        FROM crops c
      `);

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          data: {
            summary: summary.rows[0],
            crops: financialReport.rows
          }
        })
      };
    }

    if (path.includes('/expenses/recent')) {
      // Get recent expenses
      const recentExpenses = await pool.query(`
        SELECT 
          e.*,
          c.name as crop_name,
          c.type as crop_type
        FROM expenses e
        LEFT JOIN crops c ON e.crop_id = c.id
        ORDER BY e.date DESC, e.created_at DESC
        LIMIT 10
      `);

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          data: recentExpenses.rows
        })
      };
    }

    return {
      statusCode: 404,
      headers,
      body: JSON.stringify({ error: 'Report not found' })
    };

  } catch (error) {
    console.error('Reports API Error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Internal server error' })
    };
  }
};