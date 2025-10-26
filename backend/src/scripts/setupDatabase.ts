// backend/src/scripts/setDatabase.ts

import { pool } from '../config/database';

const setupDatabase = async () => {
  try {
    console.log('🔄 Setting up database tables...');

    // Drop tables if they exist (for clean reset)
    await pool.query('DROP TABLE IF EXISTS expenses CASCADE');
    await pool.query('DROP TABLE IF EXISTS crops CASCADE');
    console.log('✅ Existing tables dropped');

    // Create crops table
    await pool.query(`
      CREATE TABLE crops (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        type VARCHAR(100) NOT NULL,
        variety VARCHAR(100),
        planting_date DATE NOT NULL,
        expected_harvest_date DATE,
        area DECIMAL(10,2) NOT NULL,
        area_unit VARCHAR(20) NOT NULL DEFAULT 'ACRES',
        expected_yield DECIMAL(10,2) NOT NULL,
        yield_unit VARCHAR(20) DEFAULT 'KILOGRAMS',
        market_price DECIMAL(10,2) NOT NULL DEFAULT 0,
        total_expenses DECIMAL(10,2) DEFAULT 0,
        status VARCHAR(50) NOT NULL DEFAULT 'PLANNED',
        field_location TEXT,
        notes TEXT,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `);
    console.log('✅ Crops table created');

    // Create expenses table with foreign key
    await pool.query(`
      CREATE TABLE expenses (
        id SERIAL PRIMARY KEY,
        crop_id INTEGER NOT NULL,
        description VARCHAR(255) NOT NULL,
        category VARCHAR(50) NOT NULL,
        amount DECIMAL(10,2) NOT NULL,
        date DATE NOT NULL,
        notes TEXT,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW(),
        CONSTRAINT fk_crop
          FOREIGN KEY(crop_id) 
          REFERENCES crops(id)
          ON DELETE CASCADE
      )
    `);
    console.log('✅ Expenses table created with foreign key');

    // Create indexes for better performance
    await pool.query('CREATE INDEX idx_crops_status ON crops(status)');
    await pool.query('CREATE INDEX idx_crops_planting_date ON crops(planting_date)');
    await pool.query('CREATE INDEX idx_expenses_crop_id ON expenses(crop_id)');
    await pool.query('CREATE INDEX idx_expenses_date ON expenses(date)');
    console.log('✅ Indexes created');

    // Insert sample crops
    const cropsResult = await pool.query(`
      INSERT INTO crops (name, type, variety, planting_date, expected_harvest_date, area, area_unit, expected_yield, yield_unit, market_price, status, field_location)
      VALUES 
      ('Wheat Field A', 'WHEAT', 'Winter Wheat', '2024-01-15', '2024-06-15', 10.5, 'ACRES', 5000, 'KILOGRAMS', 2.50, 'GROWING', 'North Field'),
      ('Corn Field B', 'CORN', 'Sweet Corn', '2024-02-01', '2024-07-01', 8.2, 'ACRES', 8000, 'KILOGRAMS', 1.80, 'PLANTED', 'South Field'),
      ('Tomato Greenhouse', 'TOMATO', 'Cherry Tomato', '2024-03-01', '2024-05-15', 2.5, 'ACRES', 1200, 'KILOGRAMS', 3.50, 'PLANNED', 'Greenhouse A')
      RETURNING id
    `);
    console.log('✅ Sample crops inserted');

    // Get the inserted crop IDs
    const cropIds = cropsResult.rows.map(row => row.id);

    // Insert sample expenses using the actual crop IDs
    await pool.query(`
      INSERT INTO expenses (crop_id, description, category, amount, date, notes)
      VALUES 
      ($1, 'Seeds Purchase', 'SEEDS', 1500.00, '2024-01-10', 'High-quality winter wheat seeds'),
      ($1, 'Fertilizer', 'FERTILIZERS', 800.50, '2024-01-20', 'Organic fertilizer application'),
      ($2, 'Corn Seeds', 'SEEDS', 1200.00, '2024-01-25', 'Sweet corn variety seeds'),
      ($2, 'Labor', 'LABOR', 950.00, '2024-02-05', 'Field preparation labor'),
      ($3, 'Greenhouse Setup', 'EQUIPMENT', 2500.00, '2024-02-20', 'Initial greenhouse setup costs')
    `, [cropIds[0], cropIds[1], cropIds[2]]);
    console.log('✅ Sample expenses inserted');

    // Update total expenses for each crop
    for (const cropId of cropIds) {
      await pool.query(`
        UPDATE crops 
        SET total_expenses = (
          SELECT COALESCE(SUM(amount), 0) 
          FROM expenses 
          WHERE crop_id = $1
        )
        WHERE id = $1
      `, [cropId]);
    }
    console.log('✅ Total expenses calculated and updated');

    console.log('🎉 Database setup completed successfully!');

    // Display summary
    const cropsCount = await pool.query('SELECT COUNT(*) FROM crops');
    const expensesCount = await pool.query('SELECT COUNT(*) FROM expenses');
    
    console.log(`📊 Database Summary:`);
    console.log(`   Crops: ${cropsCount.rows[0].count}`);
    console.log(`   Expenses: ${expensesCount.rows[0].count}`);

  } catch (error) {
    console.error('❌ Database setup error:', error);
    if (error instanceof Error) {
      console.error('Error details:', error.message);
      console.error('Stack trace:', error.stack);
    }
  } finally {
    await pool.end();
    console.log('🔌 Database connection closed');
  }
};

// Run the setup
setupDatabase();