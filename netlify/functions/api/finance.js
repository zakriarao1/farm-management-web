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
    const { httpMethod, queryStringParameters } = event;
    const { startDate, endDate, period = 'monthly' } = queryStringParameters || {};

    if (httpMethod !== 'GET') {
      return { statusCode: 405, headers, body: JSON.stringify({ error: 'Method not allowed' }) };
    }

    if (event.path.includes('/profit-loss')) {
      // Profit and loss report
      const revenueData = await pool.query(`
        SELECT 
          SUM(actual_yield * market_price) as total_revenue,
          COUNT(*) as sold_crops_count
        FROM crops 
        WHERE status = 'HARVESTED' 
        AND actual_yield IS NOT NULL 
        AND market_price > 0
        AND ($1::date IS NULL OR planting_date >= $1)
        AND ($2::date IS NULL OR planting_date <= $2)
      `, [startDate || null, endDate || null]);

      const expenseData = await pool.query(`
        SELECT 
          SUM(amount) as total_expenses,
          COUNT(*) as expense_count
        FROM expenses 
        WHERE ($1::date IS NULL OR date >= $1)
        AND ($2::date IS NULL OR date <= $2)
      `, [startDate || null, endDate || null]);

      const roiByCrop = await pool.query(`
        SELECT 
          c.name,
          c.type,
          c.actual_yield * c.market_price as revenue,
          c.total_expenses,
          CASE 
            WHEN c.total_expenses > 0 THEN 
              ((c.actual_yield * c.market_price - c.total_expenses) / c.total_expenses) * 100
            ELSE 0 
          END as roi_percentage
        FROM crops c
        WHERE c.status = 'HARVESTED' 
        AND c.actual_yield IS NOT NULL
        AND c.market_price > 0
        AND c.total_expenses > 0
        ORDER BY roi_percentage DESC
      `);

      const totalRevenue = parseFloat(revenueData.rows[0].total_revenue) || 0;
      const totalExpenses = parseFloat(expenseData.rows[0].total_expenses) || 0;
      const netProfit = totalRevenue - totalExpenses;
      const roi = totalExpenses > 0 ? (netProfit / totalExpenses) * 100 : 0;

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          data: {
            summary: {
              totalRevenue,
              totalExpenses,
              netProfit,
              roi: parseFloat(roi.toFixed(2)),
              soldCropsCount: parseInt(revenueData.rows[0].sold_crops_count),
              expenseCount: parseInt(expenseData.rows[0].expense_count)
            },
            roiByCrop: roiByCrop.rows,
            timeframe: {
              startDate: startDate || 'All time',
              endDate: endDate || 'Present'
            }
          }
        })
      };
    }

    if (event.path.includes('/roi-analysis')) {
      // ROI analysis
      let groupByClause = '';
      switch (period) {
        case 'weekly':
          groupByClause = 'TO_CHAR(c.planting_date, \'IYYY-IW\')';
          break;
        case 'monthly':
          groupByClause = 'TO_CHAR(c.planting_date, \'YYYY-MM\')';
          break;
        case 'quarterly':
          groupByClause = 'CONCAT(EXTRACT(YEAR FROM c.planting_date), \'-Q\', EXTRACT(QUARTER FROM c.planting_date))';
          break;
        default:
          groupByClause = 'TO_CHAR(c.planting_date, \'YYYY-MM\')';
      }

      const roiAnalysis = await pool.query(`
        SELECT 
          ${groupByClause} as period,
          COUNT(*) as crop_count,
          SUM(c.actual_yield * c.market_price) as total_revenue,
          SUM(c.total_expenses) as total_expenses,
          CASE 
            WHEN SUM(c.total_expenses) > 0 THEN 
              ((SUM(c.actual_yield * c.market_price) - SUM(c.total_expenses)) / SUM(c.total_expenses)) * 100
            ELSE 0 
          END as avg_roi_percentage,
          AVG(c.actual_yield * c.market_price - c.total_expenses) as avg_net_profit
        FROM crops c
        WHERE c.status = 'HARVESTED' 
        AND c.actual_yield IS NOT NULL
        GROUP BY ${groupByClause}
        ORDER BY period DESC
      `);

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          data: {
            period,
            analysis: roiAnalysis.rows
          }
        })
      };
    }

    return {
      statusCode: 404,
      headers,
      body: JSON.stringify({ error: 'Finance report not found' })
    };

  } catch (error) {
    console.error('Finance API Error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Internal server error' })
    };
  }
};