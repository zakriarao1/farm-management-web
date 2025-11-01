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
    const { flockId } = queryStringParameters || {};

    if (httpMethod !== 'GET') {
      return { statusCode: 405, headers, body: JSON.stringify({ error: 'Method not allowed' }) };
    }

    if (event.path.includes('/animal-summary')) {
      // Get animal summary
      const animalSummaryQuery = `
        SELECT 
          COUNT(*) as total_animals,
          COUNT(CASE WHEN status = 'ACTIVE' THEN 1 END) as active_animals,
          COUNT(CASE WHEN status = 'SOLD' THEN 1 END) as sold_animals,
          COALESCE(SUM(purchase_cost), 0) as total_investment,
          0 as total_revenue, -- Placeholder for sales revenue
          85 as average_health_score -- Placeholder health score
        FROM livestock
      `;

      const result = await pool.query(animalSummaryQuery);
      
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ data: result.rows[0] })
      };
    }

    if (event.path.includes('/summary')) {
      // Get flock financial summary (existing code)
      let flockCondition = '';
      const params = [];

      if (flockId) {
        flockCondition = 'WHERE f.id = $1';
        params.push(flockId);
      }

      const summaryQuery = `
        SELECT 
          f.id as flock_id,
          f.name as flock_name,
          COALESCE(f.total_purchase_cost, 0) as total_purchase_cost,
          COALESCE(SUM(le.amount), 0) as total_expenses,
          COALESCE(SUM(sr.total_amount), 0) as total_sales,
          (COALESCE(SUM(sr.total_amount), 0) - COALESCE(f.total_purchase_cost, 0) - COALESCE(SUM(le.amount), 0)) as net_profit,
          CASE 
            WHEN (COALESCE(f.total_purchase_cost, 0) + COALESCE(SUM(le.amount), 0)) > 0 
            THEN ((COALESCE(SUM(sr.total_amount), 0) - COALESCE(f.total_purchase_cost, 0) - COALESCE(SUM(le.amount), 0)) / (COALESCE(f.total_purchase_cost, 0) + COALESCE(SUM(le.amount), 0))) * 100
            ELSE 0 
          END as roi_percentage
        FROM flocks f
        LEFT JOIN livestock_expenses le ON f.id = le.flock_id
        LEFT JOIN sales_records sr ON f.id = sr.flock_id
        ${flockCondition}
        GROUP BY f.id, f.name, f.total_purchase_cost
        ORDER BY net_profit DESC
      `;

      const result = await pool.query(summaryQuery, params);
      
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ data: result.rows })
      };
    }

    if (event.path.includes('/overall-metrics')) {
      // Get overall financial metrics (existing code)
      const metricsQuery = `
        SELECT 
          COUNT(DISTINCT f.id) as total_flocks,
          COALESCE(SUM(f.total_purchase_cost), 0) as total_investment,
          COALESCE(SUM(le.amount), 0) as total_expenses,
          COALESCE(SUM(sr.total_amount), 0) as total_revenue,
          (COALESCE(SUM(sr.total_amount), 0) - COALESCE(SUM(f.total_purchase_cost), 0) - COALESCE(SUM(le.amount), 0)) as net_profit,
          CASE 
            WHEN (COALESCE(SUM(f.total_purchase_cost), 0) + COALESCE(SUM(le.amount), 0)) > 0 
            THEN ((COALESCE(SUM(sr.total_amount), 0) - COALESCE(SUM(f.total_purchase_cost), 0) - COALESCE(SUM(le.amount), 0)) / (COALESCE(SUM(f.total_purchase_cost), 0) + COALESCE(SUM(le.amount), 0))) * 100
            ELSE 0 
          END as average_roi
        FROM flocks f
        LEFT JOIN livestock_expenses le ON f.id = le.flock_id
        LEFT JOIN sales_records sr ON f.id = sr.flock_id
      `;

      const result = await pool.query(metricsQuery);
      
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ data: result.rows[0] })
      };
    }

    return {
      statusCode: 404,
      headers,
      body: JSON.stringify({ error: 'Endpoint not found' })
    };

  } catch (error) {
    console.error('Financial Summary API Error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Internal server error' })
    };
  }
};