import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());

// In-memory storage (for testing)
let crops = [];
let currentId = 1;

// Health check route
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'Farm Management API is running',
    timestamp: new Date().toISOString() 
  });
});

// Get all crops with optional search and status filter
app.get('/api/crops', (req, res) => {
  try {
    const { search, status } = req.query;
    let filteredCrops = [...crops];

    // Apply search filter
    if (search) {
      filteredCrops = filteredCrops.filter(crop => 
        crop.name.toLowerCase().includes(search.toLowerCase()) ||
        crop.type.toLowerCase().includes(search.toLowerCase()) ||
        crop.variety.toLowerCase().includes(search.toLowerCase())
      );
    }

    // Apply status filter
    if (status && status !== 'ALL') {
      filteredCrops = filteredCrops.filter(crop => crop.status === status);
    }

    res.json({
      message: 'Crops fetched successfully',
      data: filteredCrops
    });
  } catch (error) {
    console.error('Error fetching crops:', error);
    res.status(500).json({
      error: 'Failed to fetch crops',
      message: error.message
    });
  }
});

// Get crop by ID
app.get('/api/crops/:id', (req, res) => {
  try {
    const crop = crops.find(c => c.id === parseInt(req.params.id));
    if (!crop) {
      return res.status(404).json({
        error: 'Crop not found'
      });
    }
    res.json({
      message: 'Crop fetched successfully',
      data: crop
    });
  } catch (error) {
    console.error('Error fetching crop:', error);
    res.status(500).json({
      error: 'Failed to fetch crop',
      message: error.message
    });
  }
});

// Create new crop
app.post('/api/crops', (req, res) => {
  try {
    const crop = {
      id: currentId++,
      ...req.body,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    crops.push(crop);
    
    res.status(201).json({
      message: 'Crop created successfully',
      data: crop
    });
  } catch (error) {
    console.error('Error creating crop:', error);
    res.status(500).json({
      error: 'Failed to create crop',
      message: error.message
    });
  }
});

// Update crop
app.put('/api/crops/:id', (req, res) => {
  try {
    const index = crops.findIndex(c => c.id === parseInt(req.params.id));
    if (index === -1) {
      return res.status(404).json({
        error: 'Crop not found'
      });
    }

    crops[index] = {
      ...crops[index],
      ...req.body,
      updatedAt: new Date().toISOString()
    };

    res.json({
      message: 'Crop updated successfully',
      data: crops[index]
    });
  } catch (error) {
    console.error('Error updating crop:', error);
    res.status(500).json({
      error: 'Failed to update crop',
      message: error.message
    });
  }
});

// Delete crop
app.delete('/api/crops/:id', (req, res) => {
  try {
    const index = crops.findIndex(c => c.id === parseInt(req.params.id));
    if (index === -1) {
      return res.status(404).json({
        error: 'Crop not found'
      });
    }

    crops.splice(index, 1);

    res.json({
      message: 'Crop deleted successfully',
      data: { message: 'Crop deleted' }
    });
  } catch (error) {
    console.error('Error deleting crop:', error);
    res.status(500).json({
      error: 'Failed to delete crop',
      message: error.message
    });
  }
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Route not found',
    path: req.originalUrl
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({
    error: 'Internal server error',
    message: err.message
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📍 Health check: http://localhost:${PORT}/health`);
  console.log(`📊 API: http://localhost:${PORT}/api`);
  console.log(`🌱 Ready to accept crop data!`);
});
let expenses = [];
let expenseId = 1;
// Get expenses for a crop
app.get('/api/crops/:id/expenses', (req, res) => {
  try {
    const cropExpenses = expenses.filter(expense => expense.cropId === parseInt(req.params.id));
    res.json({
      message: 'Expenses fetched successfully',
      data: cropExpenses
    });
  } catch (error) {
    console.error('Error fetching expenses:', error);
    res.status(500).json({
      error: 'Failed to fetch expenses',
      message: error.message
    });
  }
});

// Create new expense
app.post('/api/expenses', (req, res) => {
  try {
    const expense = {
      id: expenseId++,
      ...req.body,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    expenses.push(expense);
    
    // Update crop total expenses
    const cropIndex = crops.findIndex(c => c.id === expense.cropId);
    if (cropIndex !== -1) {
      const cropExpenses = expenses.filter(e => e.cropId === expense.cropId);
      crops[cropIndex].totalExpenses = cropExpenses.reduce((sum, e) => sum + e.amount, 0);
    }
    
    res.status(201).json({
      message: 'Expense created successfully',
      data: expense
    });
  } catch (error) {
    console.error('Error creating expense:', error);
    res.status(500).json({
      error: 'Failed to create expense',
      message: error.message
    });
  }
});

// Update expense
app.put('/api/expenses/:id', (req, res) => {
  try {
    const index = expenses.findIndex(e => e.id === parseInt(req.params.id));
    if (index === -1) {
      return res.status(404).json({
        error: 'Expense not found'
      });
    }

    expenses[index] = {
      ...expenses[index],
      ...req.body,
      updatedAt: new Date().toISOString()
    };

    // Update crop total expenses
    const cropId = expenses[index].cropId;
    const cropIndex = crops.findIndex(c => c.id === cropId);
    if (cropIndex !== -1) {
      const cropExpenses = expenses.filter(e => e.cropId === cropId);
      crops[cropIndex].totalExpenses = cropExpenses.reduce((sum, e) => sum + e.amount, 0);
    }

    res.json({
      message: 'Expense updated successfully',
      data: expenses[index]
    });
  } catch (error) {
    console.error('Error updating expense:', error);
    res.status(500).json({
      error: 'Failed to update expense',
      message: error.message
    });
  }
});

// Delete expense
app.delete('/api/expenses/:id', (req, res) => {
  try {
    const index = expenses.findIndex(e => e.id === parseInt(req.params.id));
    if (index === -1) {
      return res.status(404).json({
        error: 'Expense not found'
      });
    }

    const cropId = expenses[index].cropId;
    expenses.splice(index, 1);

    // Update crop total expenses
    const cropIndex = crops.findIndex(c => c.id === cropId);
    if (cropIndex !== -1) {
      const cropExpenses = expenses.filter(e => e.cropId === cropId);
      crops[cropIndex].totalExpenses = cropExpenses.reduce((sum, e) => sum + e.amount, 0);
    }

    res.json({
      message: 'Expense deleted successfully',
      data: { message: 'Expense deleted' }
    });
  } catch (error) {
    console.error('Error deleting expense:', error);
    res.status(500).json({
      error: 'Failed to delete expense',
      message: error.message
    });
  }
});