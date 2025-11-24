const { Pool } = require('pg');

console.log('🔧 Initializing database connection...');

let pool = null;
let initializationAttempted = false;

// Function to initialize the database pool
const initializePool = () => {
  if (initializationAttempted && !pool) {
    console.log('⚠️ Pool initialization already attempted and failed');
    return null;
  }
  
  initializationAttempted = true;
  
  try {
    // Try multiple ways to get the DATABASE_URL
    const connectionString = process.env.DATABASE_URL;
    
    console.log('🔍 Checking for DATABASE_URL...');
    console.log('NODE_ENV:', process.env.NODE_ENV);
    console.log('DATABASE_URL exists:', !!connectionString);
    
    if (!connectionString) {
      console.error('❌ DATABASE_URL is not set in environment variables');
      console.log('💡 Available environment variables:', Object.keys(process.env).filter(key => key.includes('DATABASE') || key.includes('DB')));
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

    pool.on('remove', () => {
      console.log('ℹ️ Database connection removed');
    });

    console.log('✅ Database pool initialized successfully');
    return pool;

  } catch (error) {
    console.error('❌ Failed to initialize database pool:', error);
    pool = null;
    return null;
  }
};

// Initialize pool immediately
initializePool();

// Test connection function
const testConnection = async () => {
  console.log('🔍 testConnection called');
  
  if (!pool) {
    console.log('🔄 Database pool not initialized, attempting to initialize...');
    initializePool();
    
    if (!pool) {
      throw new Error('Database pool not initialized. Please check your DATABASE_URL environment variable.');
    }
  }

  try {
    console.log('🔍 Testing database connection with simple query...');
    const client = await pool.connect();
    
    // Test a simple query
    const result = await client.query('SELECT NOW() as current_time');
    console.log('✅ Database connection test successful');
    console.log('⏰ Database time:', result.rows[0].current_time);
    
    client.release();
    return true;
  } catch (error) {
    console.error('❌ Database connection test failed:', error.message);
    console.error('Full error:', error);
    throw new Error(`Database connection failed: ${error.message}`);
  }
};

// Function to get pool with retry
const getPool = () => {
  if (!pool) {
    console.log('🔄 Pool not available, reinitializing...');
    initializePool();
  }
  return pool;
};

module.exports = {
  get pool() {
    return getPool();
  },
  testConnection,
  initializePool,
  getPool
};