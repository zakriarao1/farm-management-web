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
    return { statusCode: 405, headers, body: JSON.stringify({ error: 'Method not allowed' }) };
  }

  try {
    const { path, queryStringParameters } = event;
    const { flockId, startDate, endDate, reportType } = queryStringParameters || {};

    console.log(`📊 Livestock Reports API: ${path}`, { flockId, startDate, endDate, reportType });

    // Financial Summary Report
    if (path.includes('/financial-summary')) {
      let flockCondition = '';
      const params = [];

      if (flockId) {
        flockCondition = 'WHERE f.id = $1';
        params.push(flockId);
      }

      const financialQuery = `
        SELECT 
          f.id as flock_id,
          f.name as flock_name,
          f.animal_type,
          COUNT(l.id) as total_animals,
          COALESCE(SUM(l.purchase_price), 0) as total_investment,
          COALESCE(SUM(le.amount), 0) as total_expenses,
          COALESCE(SUM(sr.total_amount), 0) as total_revenue,
          COALESCE(SUM(sr.total_amount), 0) - COALESCE(SUM(l.purchase_price), 0) - COALESCE(SUM(le.amount), 0) as net_profit,
          CASE 
            WHEN (COALESCE(SUM(l.purchase_price), 0) + COALESCE(SUM(le.amount), 0)) > 0 
            THEN ((COALESCE(SUM(sr.total_amount), 0) - COALESCE(SUM(l.purchase_price), 0) - COALESCE(SUM(le.amount), 0)) / 
                 (COALESCE(SUM(l.purchase_price), 0) + COALESCE(SUM(le.amount), 0))) * 100
            ELSE 0 
          END as roi_percentage
        FROM flocks f
        LEFT JOIN livestock l ON f.id = l.flock_id
        LEFT JOIN livestock_expenses le ON f.id = le.flock_id
        LEFT JOIN sales_records sr ON f.id = sr.flock_id
        ${flockCondition}
        GROUP BY f.id, f.name, f.animal_type
        ORDER BY net_profit DESC
      `;

      const result = await pool.query(financialQuery, params);
      
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ 
          data: result.rows,
          message: 'Financial summary report generated successfully'
        })
      };
    }

    // Health Status Report
    if (path.includes('/health-status')) {
      let flockCondition = '';
      const params = [];

      if (flockId) {
        flockCondition = 'WHERE flock_id = $1';
        params.push(flockId);
      }

      const healthQuery = `
        SELECT 
          status,
          COUNT(*) as animal_count,
          ROUND((COUNT(*) * 100.0 / (SELECT COUNT(*) FROM livestock ${flockCondition})), 2) as percentage
        FROM livestock
        ${flockCondition}
        GROUP BY status
        ORDER BY animal_count DESC
      `;

      const result = await pool.query(healthQuery, params);
      
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ 
          data: result.rows,
          message: 'Health status report generated successfully'
        })
      };
    }

    // Expenses Breakdown Report
    if (path.includes('/expenses-breakdown')) {
      let dateCondition = '';
      const params = [];
      let paramCount = 1;

      if (startDate) {
        dateCondition += ` AND date >= $${paramCount}`;
        params.push(startDate);
        paramCount++;
      }

      if (endDate) {
        dateCondition += ` AND date <= $${paramCount}`;
        params.push(endDate);
        paramCount++;
      }

      if (flockId) {
        dateCondition += ` AND flock_id = $${paramCount}`;
        params.push(flockId);
        paramCount++;
      }

      const expensesQuery = `
        SELECT 
          category,
          COUNT(*) as expense_count,
          SUM(amount) as total_amount,
          ROUND((SUM(amount) * 100.0 / (SELECT SUM(amount) FROM livestock_expenses WHERE 1=1 ${dateCondition})), 2) as percentage
        FROM livestock_expenses
        WHERE 1=1 ${dateCondition}
        GROUP BY category
        ORDER BY total_amount DESC
      `;

      const result = await pool.query(expensesQuery, params);
      
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ 
          data: result.rows,
          message: 'Expenses breakdown report generated successfully'
        })
      };
    }

    // Sales Analysis Report
    if (path.includes('/sales-analysis')) {
      let dateCondition = '';
      const params = [];
      let paramCount = 1;

      if (startDate) {
        dateCondition += ` AND sale_date >= $${paramCount}`;
        params.push(startDate);
        paramCount++;
      }

      if (endDate) {
        dateCondition += ` AND sale_date <= $${paramCount}`;
        params.push(endDate);
        paramCount++;
      }

      if (flockId) {
        dateCondition += ` AND flock_id = $${paramCount}`;
        params.push(flockId);
        paramCount++;
      }

      const salesQuery = `
        SELECT 
          sale_type,
          COUNT(*) as transaction_count,
          SUM(quantity) as total_quantity,
          SUM(total_amount) as total_revenue,
          ROUND(AVG(unit_price), 2) as average_price,
          ROUND((SUM(total_amount) * 100.0 / (SELECT SUM(total_amount) FROM sales_records WHERE 1=1 ${dateCondition})), 2) as revenue_percentage
        FROM sales_records
        WHERE 1=1 ${dateCondition}
        GROUP BY sale_type
        ORDER BY total_revenue DESC
      `;

      const result = await pool.query(salesQuery, params);
      
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ 
          data: result.rows,
          message: 'Sales analysis report generated successfully'
        })
      };
    }

    // Inventory Summary Report
    if (path.includes('/inventory-summary')) {
      let flockCondition = '';
      const params = [];

      if (flockId) {
        flockCondition = 'WHERE f.id = $1';
        params.push(flockId);
      }

      const inventoryQuery = `
        SELECT 
          f.id as flock_id,
          f.name as flock_name,
          f.animal_type,
          COUNT(l.id) as total_animals,
          COUNT(CASE WHEN l.status IN ('HEALTHY', 'SICK', 'PREGNANT') THEN 1 END) as active_animals,
          COUNT(CASE WHEN l.status = 'SOLD' THEN 1 END) as sold_animals,
          COUNT(CASE WHEN l.status = 'DECEASED' THEN 1 END) as deceased_animals,
          COALESCE(SUM(l.current_weight), 0) as total_weight,
          COALESCE(AVG(l.current_weight), 0) as average_weight,
          COALESCE(SUM(l.purchase_price), 0) as total_value
        FROM flocks f
        LEFT JOIN livestock l ON f.id = l.flock_id
        ${flockCondition}
        GROUP BY f.id, f.name, f.animal_type
        ORDER BY total_value DESC
      `;

      const result = await pool.query(inventoryQuery, params);
      
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ 
          data: result.rows,
          message: 'Inventory summary report generated successfully'
        })
      };
    }

    // Comprehensive Livestock Dashboard
    if (path.includes('/dashboard')) {
      const dashboardQueries = {
        overview: `
          SELECT 
            COUNT(*) as total_flocks,
            COUNT(l.id) as total_animals,
            COUNT(CASE WHEN l.status IN ('HEALTHY', 'SICK', 'PREGNANT') THEN 1 END) as active_animals,
            COALESCE(SUM(l.purchase_price), 0) as total_investment,
            COALESCE(SUM(le.amount), 0) as total_expenses,
            COALESCE(SUM(sr.total_amount), 0) as total_revenue,
            COALESCE(SUM(sr.total_amount), 0) - COALESCE(SUM(l.purchase_price), 0) - COALESCE(SUM(le.amount), 0) as net_profit
          FROM flocks f
          LEFT JOIN livestock l ON f.id = l.flock_id
          LEFT JOIN livestock_expenses le ON f.id = le.flock_id
          LEFT JOIN sales_records sr ON f.id = sr.flock_id
        `,
        health_status: `
          SELECT 
            status,
            COUNT(*) as count
          FROM livestock
          GROUP BY status
          ORDER BY count DESC
        `,
        recent_sales: `
          SELECT 
            sr.*,
            f.name as flock_name,
            l.tag_number as livestock_tag
          FROM sales_records sr
          LEFT JOIN flocks f ON sr.flock_id = f.id
          LEFT JOIN livestock l ON sr.livestock_id = l.id
          ORDER BY sr.sale_date DESC
          LIMIT 10
        `,
        top_expenses: `
          SELECT 
            category,
            SUM(amount) as total_amount
          FROM livestock_expenses
          GROUP BY category
          ORDER BY total_amount DESC
          LIMIT 5
        `
      };

      const results = {};

      for (const [key, query] of Object.entries(dashboardQueries)) {
        const result = await pool.query(query);
        results[key] = key === 'overview' ? result.rows[0] : result.rows;
      }

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ 
          data: results,
          message: 'Livestock dashboard data retrieved successfully'
        })
      };
    }

    return {
      statusCode: 404,
      headers,
      body: JSON.stringify({ error: 'Report type not found' })
    };

  } catch (error) {
    console.error('❌ Livestock Reports API Error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ 
        error: 'Internal server error: ' + error.message
      })
    };
  }
};