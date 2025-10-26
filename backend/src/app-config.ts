import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';

// Import routes
import cropRoutes from './routes/crops';
import expenseRoutes from './routes/expenses';
import reportRoutes from './routes/reports';
import emailRoutes from './routes/emailRoutes';
import weatherRoutes from './routes/weather';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/crops', cropRoutes);
app.use('/api/expenses', expenseRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/email', emailRoutes);
app.use('/api/weather', weatherRoutes);

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'Farm Management API is running',
    timestamp: new Date().toISOString() 
  });
});

// API welcome route
app.get('/api', (req, res) => {
  res.json({ 
    message: 'Farm Management API',
    version: '1.0.0',
    endpoints: {
      crops: '/api/crops',
      expenses: '/api/expenses',
      health: '/health'
    }
  });
});

// Root route
app.get('/', (req, res) => {
  res.json({ 
    message: 'Farm Management System API',
    version: '1.0.0',
    documentation: 'Visit /api for available endpoints'
  });
});
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`🌤️ Weather API available at http://localhost:${PORT}/api/weather`);
});
export default app;