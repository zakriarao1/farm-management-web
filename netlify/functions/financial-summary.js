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
    const { httpMethod, queryStringParameters, path } = event;
    const { flockId } = queryStringParameters || {};

    if (httpMethod !== 'GET') {
      return { statusCode: 405, headers, body: JSON.stringify({ error: 'Method not allowed' }) };
    }

    console.log('📊 Financial Summary API Path:', path);

    // Handle /financial-summary/flocks endpoint
    if (path.includes('/flocks') || path.endsWith('/financial-summary/flocks')) {
      console.log('🐑 Processing flocks financial summary request');
      
     const flocksQuery = `
  SELECT 
    f.id,
    f.name,
    f.animal_type,
    f.total_purchase_cost,
    COUNT(l.id) as total_animals,
    COUNT(CASE WHEN l.status IN ('HEALTHY', 'SICK', 'PREGNANT') THEN 1 END) as active_animals,
    COUNT(CASE WHEN l.status = 'SOLD' THEN 1 END) as sold_animals,
    COUNT(CASE WHEN l.status = 'DECEASED' THEN 1 END) as deceased_animals,
    COALESCE(SUM(l.purchase_price), 0) as livestock_investment,
    
    -- Sales revenue from animals in this flock
    COALESCE((
      SELECT SUM(sr.total_amount) 
      FROM sales_records sr 
      JOIN livestock l2 ON sr.livestock_id = l2.id 
      WHERE l2.flock_id = f.id
    ), 0) as total_revenue,
    
    -- Expenses for this flock
    COALESCE((
      SELECT SUM(le.amount) 
      FROM livestock_expenses le 
      WHERE le.flock_id = f.id
    ), 0) as total_expenses,
    
    -- Calculate net profit
    COALESCE((
      SELECT SUM(sr.total_amount) 
      FROM sales_records sr 
      JOIN livestock l2 ON sr.livestock_id = l2.id 
      WHERE l2.flock_id = f.id
    ), 0) - COALESCE(SUM(l.purchase_price), 0) - COALESCE((
      SELECT SUM(le.amount) 
      FROM livestock_expenses le 
      WHERE le.flock_id = f.id
    ), 0) as net_profit,
    
    -- Calculate ROI
    CASE 
      WHEN (COALESCE(SUM(l.purchase_price), 0) + COALESCE((
        SELECT SUM(le.amount) 
        FROM livestock_expenses le 
        WHERE le.flock_id = f.id
      ), 0)) > 0 
      THEN ROUND((
        (COALESCE((
          SELECT SUM(sr.total_amount) 
          FROM sales_records sr 
          JOIN livestock l2 ON sr.livestock_id = l2.id 
          WHERE l2.flock_id = f.id
        ), 0) - COALESCE(SUM(l.purchase_price), 0) - COALESCE((
          SELECT SUM(le.amount) 
          FROM livestock_expenses le 
          WHERE le.flock_id = f.id
        ), 0)) / 
        (COALESCE(SUM(l.purchase_price), 0) + COALESCE((
          SELECT SUM(le.amount) 
          FROM livestock_expenses le 
          WHERE le.flock_id = f.id
        ), 0))
      ) * 100, 2)
      ELSE 0 
    END as roi_percentage
    
  FROM flocks f
  LEFT JOIN livestock l ON f.id = l.flock_id
  GROUP BY f.id, f.name, f.animal_type, f.total_purchase_cost
  ORDER BY f.name
`;

      console.log('🔍 Executing flocks query...');
      const result = await pool.query(flocksQuery);
      console.log(`✅ Found ${result.rows.length} flocks`);
      
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ 
          data: result.rows,
          message: 'Flocks financial summary retrieved successfully'
        })
      };
    }

    // Animal Summary Endpoint
    if (path.includes('/animal-summary')) {
      console.log('🐄 Processing animal summary request');
      
      const animalSummaryQuery = `
        SELECT 
          COUNT(*) as total_animals,
          COUNT(CASE WHEN status IN ('HEALTHY', 'SICK', 'PREGNANT') THEN 1 END) as active_animals,
          COUNT(CASE WHEN status = 'SOLD' THEN 1 END) as sold_animals,
          COUNT(CASE WHEN status = 'DECEASED' THEN 1 END) as deceased_animals,
          COALESCE(SUM(purchase_price), 0) as total_investment,
          COALESCE(SUM(current_weight), 0) as total_weight,
          COALESCE(AVG(
            CASE 
              WHEN status = 'HEALTHY' THEN 100
              WHEN status = 'SICK' THEN 50
              WHEN status = 'PREGNANT' THEN 80
              ELSE 60 
            END
          ), 0) as average_health_score
        FROM livestock
        WHERE status IS NOT NULL
      `;

      const result = await pool.query(animalSummaryQuery);
      
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ data: result.rows[0] })
      };
    }

    // Flock Financial Summary
    if (path.includes('/summary')) {
      console.log('💰 Processing flock summary request');
      
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
          f.animal_type,
          COALESCE(SUM(l.purchase_price), 0) as total_purchase_cost,
          COALESCE(COUNT(l.id), 0) as total_animals,
          COALESCE(SUM(sr.total_amount), 0) as total_sales,
          COALESCE(SUM(sr.total_amount), 0) - COALESCE(SUM(l.purchase_price), 0) as net_profit,
          CASE 
            WHEN COALESCE(SUM(l.purchase_price), 0) > 0 
            THEN ((COALESCE(SUM(sr.total_amount), 0) - COALESCE(SUM(l.purchase_price), 0)) / COALESCE(SUM(l.purchase_price), 0)) * 100
            ELSE 0 
          END as roi_percentage
        FROM flocks f
        LEFT JOIN livestock l ON f.id = l.flock_id
        LEFT JOIN sales_records sr ON f.id = sr.flock_id
        ${flockCondition}
        GROUP BY f.id, f.name, f.animal_type
        ORDER BY net_profit DESC
      `;

      const result = await pool.query(summaryQuery, params);
      
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ data: result.rows })
      };
    }

    // Overall Metrics
    if (path.includes('/overall-metrics')) {
      console.log('📈 Processing overall metrics request');
      
      const metricsQuery = `
        SELECT 
          COUNT(DISTINCT f.id) as total_flocks,
          COUNT(l.id) as total_animals,
          COALESCE(SUM(l.purchase_price), 0) as total_investment,
          COALESCE(SUM(sr.total_amount), 0) as total_revenue,
          COALESCE(SUM(sr.total_amount), 0) - COALESCE(SUM(l.purchase_price), 0) as net_profit,
          CASE 
            WHEN COALESCE(SUM(l.purchase_price), 0) > 0 
            THEN ((COALESCE(SUM(sr.total_amount), 0) - COALESCE(SUM(l.purchase_price), 0)) / COALESCE(SUM(l.purchase_price), 0)) * 100
            ELSE 0 
          END as average_roi
        FROM flocks f
        LEFT JOIN livestock l ON f.id = l.flock_id
        LEFT JOIN sales_records sr ON f.id = sr.flock_id
      `;

      const result = await pool.query(metricsQuery);
      
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ data: result.rows[0] })
      };
    }

    console.log('❌ Endpoint not found:', path);
    return {
      statusCode: 404,
      headers,
      body: JSON.stringify({ error: 'Endpoint not found. Available endpoints: /flocks, /animal-summary, /summary, /overall-metrics' })
    };

  } catch (error) {
    console.error('❌ Financial Summary API Error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ 
        error: 'Internal server error: ' + error.message,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
      })
    };
  } 
};