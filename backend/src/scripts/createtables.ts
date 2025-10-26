// backend/src/scripts/createtables.ts

import { pool } from '../config/database';

const createTables = async () => {
  try {
    // Create expenses table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS expenses (
        id SERIAL PRIMARY KEY,
        crop_id INTEGER NOT NULL,
        description VARCHAR(255) NOT NULL,
        category VARCHAR(50) NOT NULL,
        amount DECIMAL(10,2) NOT NULL,
        date DATE NOT NULL,
        notes TEXT,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `);
    
    console.log('✅ Expenses table created successfully');
    
    // Create crops table (if it doesn't exist)
    await pool.query(`
      CREATE TABLE IF NOT EXISTS crops (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        type VARCHAR(100) NOT NULL,
        variety VARCHAR(100),
        planting_date DATE NOT NULL,
        expected_harvest_date DATE,
        area DECIMAL(10,2) NOT NULL,
        area_unit VARCHAR(20) NOT NULL,
        expected_yield DECIMAL(10,2) NOT NULL,
        yield_unit VARCHAR(20),
        market_price DECIMAL(10,2) NOT NULL,
        total_expenses DECIMAL(10,2) DEFAULT 0,
        status VARCHAR(50) NOT NULL,
        field_location TEXT,
        notes TEXT,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `);
    
    console.log('✅ Crops table created successfully');
    
    // Insert sample data
    await pool.query(`
      INSERT INTO crops (name, type, variety, planting_date, area, area_unit, expected_yield, yield_unit, market_price, status)
      VALUES 
      ('Wheat Field A', 'WHEAT', 'Winter Wheat', '2024-01-15', 10.5, 'ACRES', 5000, 'KILOGRAMS', 2.50, 'GROWING'),
      ('Corn Field B', 'CORN', 'Sweet Corn', '2024-02-01', 8.2, 'ACRES', 8000, 'KILOGRAMS', 1.80, 'PLANTED')
      ON CONFLICT DO NOTHING
    `);
    
    await pool.query(`
      INSERT INTO expenses (crop_id, description, category, amount, date, notes)
      VALUES 
      (1, 'Seeds Purchase', 'SEEDS', 1500.00, '2024-01-15', 'High-quality winter wheat seeds'),
      (1, 'Fertilizer', 'FERTILIZERS', 800.50, '2024-01-20', 'Organic fertilizer application'),
      (2, 'Labor', 'LABOR', 1200.00, '2024-02-05', 'Field preparation labor')
      ON CONFLICT DO NOTHING
    `);
    
    console.log('✅ Sample data inserted successfully');
    
  } catch (error) {
    console.error('❌ Database setup error:', error);
  } finally {
    await pool.end();
  }
};

createTables();