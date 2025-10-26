import { pool } from '../config/database';

const updateSchema = async () => {
  try {
    console.log('🔄 Updating database schema...');

    // Create users table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        name VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `);
    console.log('✅ Users table created');

    // Add user_id to crops table
    await pool.query(`
      ALTER TABLE crops 
      ADD COLUMN IF NOT EXISTS user_id INTEGER REFERENCES users(id) ON DELETE CASCADE
    `);
    console.log('✅ Added user_id to crops table');

    // Add user_id to expenses table
    await pool.query(`
      ALTER TABLE expenses 
      ADD COLUMN IF NOT EXISTS user_id INTEGER REFERENCES users(id) ON DELETE CASCADE
    `);
    console.log('✅ Added user_id to expenses table');

    // Create indexes for better performance
    await pool.query('CREATE INDEX IF NOT EXISTS idx_crops_user_id ON crops(user_id)');
    await pool.query('CREATE INDEX IF NOT EXISTS idx_expenses_user_id ON expenses(user_id)');
    await pool.query('CREATE INDEX IF NOT EXISTS idx_users_email ON users(email)');
    console.log('✅ Indexes created');

    console.log('🎉 Database schema updated successfully!');

  } catch (error) {
    console.error('❌ Schema update error:', error);
  } finally {
    await pool.end();
  }
};

updateSchema();