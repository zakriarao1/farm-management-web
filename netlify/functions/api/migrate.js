const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

exports.handler = async (event, context) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Content-Type': 'application/json'
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  try {
    console.log('🔄 Starting database migration...');

    // Create enum types
    await pool.query(`
      DO $$ BEGIN
        CREATE TYPE crop_status AS ENUM ('PLANNED', 'PLANTED', 'GROWING', 'READY_FOR_HARVEST', 'HARVESTED', 'FAILED');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);

    await pool.query(`
      DO $$ BEGIN
        CREATE TYPE area_unit AS ENUM ('ACRES', 'HECTARES', 'SQUARE_METERS');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);

    await pool.query(`
      DO $$ BEGIN
        CREATE TYPE yield_unit AS ENUM ('TONS', 'KILOGRAMS', 'POUNDS', 'BUSHELS');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);

    await pool.query(`
      DO $$ BEGIN
        CREATE TYPE expense_category AS ENUM ('SEEDS', 'FERTILIZERS', 'LABOR', 'EQUIPMENT', 'WATER', 'OTHER');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);

    // Create crops table
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

    // Create expenses table
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
await pool.query(`
  CREATE TABLE IF NOT EXISTS inventory_items (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    category VARCHAR(50) NOT NULL,
    quantity DECIMAL(10,2) NOT NULL,
    unit VARCHAR(20) NOT NULL,
    min_quantity DECIMAL(10,2) DEFAULT 0,
    unit_cost DECIMAL(10,2),
    supplier VARCHAR(255),
    last_restocked DATE,
    expiration_date DATE,
    location VARCHAR(100),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
  )
`);

await pool.query(`
  CREATE TABLE IF NOT EXISTS inventory_transactions (
    id SERIAL PRIMARY KEY,
    item_id INTEGER REFERENCES inventory_items(id) ON DELETE CASCADE,
    transaction_type VARCHAR(20) NOT NULL,
    quantity DECIMAL(10,2) NOT NULL,
    unit_cost DECIMAL(10,2),
    total_cost DECIMAL(10,2),
    reference_type VARCHAR(50),
    reference_id INTEGER,
    notes TEXT,
    transaction_date DATE DEFAULT CURRENT_DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
  )
`);
await pool.query(`
  CREATE TABLE IF NOT EXISTS flocks (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    breed VARCHAR(100) NOT NULL,
    quantity INTEGER NOT NULL DEFAULT 0,
    age INTEGER NOT NULL DEFAULT 0,
    health_status VARCHAR(50) NOT NULL DEFAULT 'HEALTHY',
    total_purchase_cost DECIMAL(10,2),  -- Add this line
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
  )
`);
await pool.query(`
  CREATE TABLE IF NOT EXISTS livestock_expenses (
    id SERIAL PRIMARY KEY,
    flock_id INTEGER REFERENCES flocks(id) ON DELETE CASCADE,
    livestock_id INTEGER,
    description TEXT NOT NULL,
    category VARCHAR(50) NOT NULL,
    amount DECIMAL(10,2) NOT NULL DEFAULT 0.0,
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
  )
`);

// Create index
await pool.query('CREATE INDEX IF NOT EXISTS idx_livestock_expenses_flock ON livestock_expenses(flock_id)');
await pool.query('CREATE INDEX IF NOT EXISTS idx_livestock_expenses_date ON livestock_expenses(date)');
// Create index
await pool.query('CREATE INDEX IF NOT EXISTS idx_flocks_breed ON flocks(breed)');
// Create inventory indexes
await pool.query('CREATE INDEX IF NOT EXISTS idx_inventory_category ON inventory_items(category)');
await pool.query('CREATE INDEX IF NOT EXISTS idx_inventory_transactions_item ON inventory_transactions(item_id)');
    // Create indexes
    await pool.query('CREATE INDEX IF NOT EXISTS idx_crops_status ON crops(status)');
    await pool.query('CREATE INDEX IF NOT EXISTS idx_crops_planting_date ON crops(planting_date)');
    await pool.query('CREATE INDEX IF NOT EXISTS idx_expenses_crop_id ON expenses(crop_id)');
    await pool.query('CREATE INDEX IF NOT EXISTS idx_expenses_date ON expenses(date)');

    console.log('✅ Database migration completed successfully!');

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ 
        message: 'Database migration completed successfully',
        tables: ['crops', 'expenses']
      })
    };
  } catch (error) {
    console.error('❌ Migration failed:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Migration failed: ' + error.message })
    };
  }
};