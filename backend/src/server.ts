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

// Middleware
app.use(helmet());
app.use(cors({
  origin: ['http://localhost:3000', 'http://localhost:3001', 'http://127.0.0.1:3000', 'http://127.0.0.1:3001'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());

// Public routes
app.use('/auth', authRoutes);

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


// Health check (public)
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'Farm Management API is running',
    timestamp: new Date().toISOString() 
  });
});

// Error handling
app.use(errorHandler);

const startServer = async () => {
  try {
    await connectDB();
    
    app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(`📍 Health check: http://localhost:${PORT}/health`);
      console.log(`🔐 Authentication: http://localhost:${PORT}/api/auth`);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
};

startServer();