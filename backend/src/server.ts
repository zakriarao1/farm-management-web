// backend/src/server.ts
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import { connectDB } from './config/database';
import { errorHandler } from './middleware/errorHandler';
import { authenticateToken } from './middleware/auth';

// Import routes
import cropRoutes from './routes/crops';
import expenseRoutes from './routes/expenses';
import reportRoutes from './routes/reports';
import emailRoutes from './routes/emailRoutes';
import weatherRoutes from './routes/weather';
import taskRoutes from './routes/tasks';
import inventoryRoutes from './routes/inventory';
import financialRoutes from './routes/finance';
import authRoutes from './routes/auth';
import livestockRoutes from './routes/livestock';
import flockRoutes from './routes/flocks';
import livestockExpenseRoutes from './routes/livestockExpenses';
import medicalTreatmentRoutes from './routes/medicalTreatments';
import productionRecordRoutes from './routes/productionRecords';
import financialSummaryRoutes from './routes/financialSummary';
import farmExpenseRoutes from './routes/farmExpenses';
import analyticsRoutes from './routes/analytics';
import salesRoutes from './routes/sales';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Get frontend URL from environment or use default
const FRONTEND_URL = process.env.FRONTEND_URL || 'https://farm-management-app.netlify.app';

// CORS configuration for production
const corsOptions = {
  origin: [
    FRONTEND_URL,
    'http://localhost:3000', 
    'http://localhost:3001', 
    'http://127.0.0.1:3000', 
    'http://127.0.0.1:3001',
    'http://localhost:5173' // Vite dev server
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
};

// Middleware
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));
app.use(cors(corsOptions));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Logging middleware for production
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// Public routes
app.use('/auth', authRoutes);

// Health check (public) - important for Railway
app.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'OK', 
    message: 'Farm Management API is running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    version: '1.0.0'
  });
});

// API status endpoint
app.get('/api', (req, res) => {
  res.json({
    message: 'Farm Management API',
    version: '1.0.0',
    endpoints: {
      auth: '/auth',
      crops: '/api/crops',
      livestock: '/api/livestock',
      tasks: '/api/tasks',
      inventory: '/api/inventory',
      finance: '/api/finance',
      analytics: '/api/analytics',
      health: '/health'
    }
  });
});

// Protected routes
app.use('/api/crops', authenticateToken, cropRoutes);
app.use('/api/expenses', authenticateToken, expenseRoutes);
app.use('/api/reports', authenticateToken, reportRoutes);
app.use('/api/email', authenticateToken, emailRoutes);
app.use('/api/weather', authenticateToken, weatherRoutes);
app.use('/api/tasks', authenticateToken, taskRoutes);
app.use('/api/inventory', authenticateToken, inventoryRoutes);
app.use('/api/finance', authenticateToken, financialRoutes);
app.use('/api/livestock', authenticateToken, livestockRoutes);
app.use('/api/flocks', authenticateToken, flockRoutes);
app.use('/api/livestock-expenses', authenticateToken, livestockExpenseRoutes);
app.use('/api/medical-treatments', authenticateToken, medicalTreatmentRoutes);
app.use('/api/production-records', authenticateToken, productionRecordRoutes);
app.use('/api/financial-summary', authenticateToken, financialSummaryRoutes);
app.use('/api/farm-expenses', authenticateToken, farmExpenseRoutes);
app.use('/api/analytics', authenticateToken, analyticsRoutes);
app.use('/api/sales', authenticateToken, salesRoutes);

// 404 handler for undefined routes
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Route not found',
    path: req.originalUrl,
    method: req.method
  });
});

// Error handling middleware (should be last)
app.use(errorHandler);

// Graceful shutdown handling
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully');
  process.exit(0);
});

const startServer = async () => {
  try {
    // Connect to database
    await connectDB();
    
    // Start server
    const server = app.listen(PORT, () => {
      console.log(`
🚀 Farm Management Server Started!
📍 Port: ${PORT}
🌍 Environment: ${process.env.NODE_ENV || 'development'}
📊 Health Check: http://localhost:${PORT}/health
🔐 API Base: http://localhost:${PORT}/api
✅ Frontend URL: ${FRONTEND_URL}
      `);
    });

    // Handle server errors
    server.on('error', (error: NodeJS.ErrnoException) => {
      if (error.code === 'EADDRINUSE') {
        console.error(`Port ${PORT} is already in use`);
        process.exit(1);
      } else {
        console.error('Server error:', error);
        process.exit(1);
      }
    });

  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
};

// Only start server if this file is run directly (not when imported)
if (require.main === module) {
  startServer();
}

export default app;