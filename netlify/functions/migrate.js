const { pool, testConnection } = require('./db');

exports.handler = async (event, context) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
    'Content-Type': 'application/json'
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  console.log('🔄 Starting database migration...');

  try {
    // Test database connection first
    console.log('1. Testing database connection...');
    await testConnection();
    console.log('✅ Database connection OK');

    // Create enum types
    console.log('2. Creating enum types...');
    const enumTypes = [
      `DO $$ BEGIN
        CREATE TYPE crop_status AS ENUM ('PLANNED', 'PLANTED', 'GROWING', 'READY_FOR_HARVEST', 'HARVESTED', 'FAILED');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;`,

      `DO $$ BEGIN
        CREATE TYPE area_unit AS ENUM ('ACRES', 'HECTARES', 'SQUARE_METERS');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;`,

      `DO $$ BEGIN
        CREATE TYPE yield_unit AS ENUM ('TONS', 'KILOGRAMS', 'POUNDS', 'BUSHELS');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;`,

      `DO $$ BEGIN
        CREATE TYPE expense_category AS ENUM ('SEEDS', 'FERTILIZERS', 'LABOR', 'EQUIPMENT', 'WATER', 'OTHER');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;`
    ];

    for (const enumSql of enumTypes) {
      await pool.query(enumSql);
    }
    console.log('✅ Enum types created');

    // Create crops table
    console.log('3. Creating crops table...');
    await pool.query(`
      CREATE TABLE IF NOT EXISTS crops (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        type VARCHAR(100) NOT NULL,
        variety VARCHAR(100),
        planting_date DATE NOT NULL,
        expected_harvest_date DATE,
        actual_harvest_date DATE,
        area DECIMAL(10,2) NOT NULL DEFAULT 0.0,
        area_unit area_unit NOT NULL DEFAULT 'ACRES',
        expected_yield DECIMAL(10,2) NOT NULL DEFAULT 0.0,
        actual_yield DECIMAL(10,2),
        yield_unit yield_unit,
        field_location TEXT,
        market_price DECIMAL(10,2) NOT NULL DEFAULT 0.0,
        total_expenses DECIMAL(10,2) NOT NULL DEFAULT 0.0,
        notes TEXT,
        status crop_status NOT NULL DEFAULT 'PLANNED',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✅ Crops table created');

    // Create expenses table
    console.log('4. Creating expenses table...');
    await pool.query(`
      CREATE TABLE IF NOT EXISTS expenses (
        id SERIAL PRIMARY KEY,
        crop_id INTEGER REFERENCES crops(id) ON DELETE CASCADE,
        amount DECIMAL(10,2) NOT NULL DEFAULT 0.0,
        category expense_category NOT NULL DEFAULT 'OTHER',
        description TEXT,
        date DATE NOT NULL DEFAULT CURRENT_DATE,
        notes TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✅ Expenses table created');

    // Create indexes
    console.log('5. Creating indexes...');
    await pool.query('CREATE INDEX IF NOT EXISTS idx_crops_status ON crops(status)');
    await pool.query('CREATE INDEX IF NOT EXISTS idx_crops_planting_date ON crops(planting_date)');
    await pool.query('CREATE INDEX IF NOT EXISTS idx_expenses_crop_id ON expenses(crop_id)');
    await pool.query('CREATE INDEX IF NOT EXISTS idx_expenses_date ON expenses(date)');
    console.log('✅ Indexes created');

    // Add sample data
    console.log('6. Adding sample data...');
    const existingCrops = await pool.query('SELECT COUNT(*) FROM crops');
    if (parseInt(existingCrops.rows[0].count) === 0) {
      await pool.query(`
        INSERT INTO crops (name, type, variety, planting_date, expected_harvest_date, area, area_unit, expected_yield, yield_unit, market_price, status, field_location) 
        VALUES 
        ('Corn Field A', 'CORN', 'Sweet Corn', '2024-03-01', '2024-07-15', 5.0, 'ACRES', 25.0, 'TONS', 150.00, 'GROWING', 'North Field'),
        ('Wheat Field B', 'WHEAT', 'Winter Wheat', '2024-02-15', '2024-06-30', 8.0, 'ACRES', 40.0, 'TONS', 200.00, 'PLANTED', 'South Field')
      `);
      console.log('✅ Sample data added');
    } else {
      console.log('ℹ️  Sample data already exists');
    }

    console.log('🎉 Database migration completed successfully!');

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ 
        message: 'Database migration completed successfully',
        tables: ['crops', 'expenses'],
        sampleData: 'Sample crops added for testing'
      })
    };

  } catch (error) {
    console.error('❌ Migration failed:', error);
    
    let errorMessage = 'Migration failed';
    let details = error.message;

    if (error.message.includes('connection') || error.message.includes('ECONNREFUSED')) {
      errorMessage = 'Database connection failed';
      details = 'Please check your DATABASE_URL and ensure the database server is running';
    } else if (error.message.includes('password authentication failed')) {
      errorMessage = 'Database authentication failed';
      details = 'Please check your DATABASE_URL username and password';
    } else if (error.message.includes('does not exist')) {
      errorMessage = 'Database does not exist';
      details = 'Please check the database name in your DATABASE_URL';
    }

    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ 
        error: errorMessage,
        details: details,
        help: 'Make sure you have a .env file with DATABASE_URL=your_connection_string'
      })
    };
  }
};