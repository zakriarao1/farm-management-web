const { Pool } = require('pg');

console.log('🔧 Initializing database connection...');

let pool = null;

// Function to initialize the database pool
const initializePool = () => {
  try {
    // Try multiple ways to get the DATABASE_URL
    const connectionString = process.env.DATABASE_URL;
    
    console.log('🔍 Checking for DATABASE_URL...');
    console.log('NODE_ENV:', process.env.NODE_ENV);
    console.log('DATABASE_URL exists:', !!connectionString);
    
    if (!connectionString) {
      console.error('❌ DATABASE_URL is not set in environment variables');
      console.log('💡 Please create a .env file with DATABASE_URL=your_connection_string');
      return null;
    }

    // Mask password in logs for security
    const maskedUrl = connectionString.replace(/:[^:@]+@/, ':****@');
    console.log('🔗 Database URL:', maskedUrl);

    pool = new Pool({
      connectionString: connectionString,
      ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
      max: 5,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 10000,
    });

    // Add event listeners for better debugging
    pool.on('connect', () => {
      console.log('✅ New database connection established');
    });

    pool.on('error', (err) => {
      console.error('❌ Database pool error:', err);
    });

    console.log('✅ Database pool initialized successfully');
    return pool;

  } catch (error) {
    console.error('❌ Failed to initialize database pool:', error);
    return null;
  }
};

// Initialize pool immediately
initializePool();

// Test connection function
const testConnection = async () => {
  if (!pool) {
    console.log('🔄 Attempting to initialize database pool...');
    initializePool();
    
    if (!pool) {
      throw new Error('Database pool not initialized. Please check your DATABASE_URL environment variable.');
    }
  }

  try {
    console.log('🔍 Testing database connection...');
    const client = await pool.connect();
    
    // Test a simple query
    const result = await client.query('SELECT NOW() as current_time, version() as version');
    console.log('✅ Database connection test successful');
    console.log('⏰ Database time:', result.rows[0].current_time);
    console.log('📊 Database version:', result.rows[0].version.split('\n')[0]);
    
    client.release();
    return true;
  } catch (error) {
    console.error('❌ Database connection test failed:', error.message);
    throw new Error(`Database connection failed: ${error.message}`);
  }
};

module.exports = {
  get pool() {
    if (!pool) {
      initializePool();
    }
    return pool;
  },
  testConnection,
  initializePool
};