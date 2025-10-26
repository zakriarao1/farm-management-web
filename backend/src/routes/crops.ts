// backend/src/routes/crops.ts

import { Router } from 'express';
import { CropController } from '../controllers/CropController';
import { pool } from '../config/database';
import { authenticateToken } from '../middleware/auth';

const router = Router();
const cropController = new CropController();

// Crop routes with authentication
router.get('/', authenticateToken, (req, res) => {
  cropController.getAllCrops(req, res);
});

router.get('/active', authenticateToken, (req, res) => {
  cropController.getActiveCrops(req, res);
});

router.get('/search', authenticateToken, (req, res) => {
  cropController.searchCrops(req, res);
});

router.get('/status/:status', authenticateToken, (req, res) => {
  cropController.getCropsByStatus(req, res);
});

router.get('/:id', authenticateToken, (req, res) => {
  cropController.getCropById(req, res);
});

router.post('/', authenticateToken, (req, res) => {
  cropController.createCrop(req, res);
});

router.put('/:id', authenticateToken, (req, res) => {
  cropController.updateCrop(req, res);
});

router.patch('/:id/status', authenticateToken, (req, res) => {
  cropController.updateCropStatus(req, res);
});

router.delete('/:id', authenticateToken, (req, res) => {
  cropController.deleteCrop(req, res);
});

// Expense routes for crops
router.get('/:id/expenses', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    
    // ✅ FIX: Handle undefined id parameter
    if (!id) {
      return res.status(400).json({ error: 'Crop ID is required' });
    }
    
    console.log(`Fetching expenses for crop ID: ${id}`);
    
    const query = `
      SELECT * FROM expenses 
      WHERE crop_id = $1 
      ORDER BY created_at DESC
    `;
    
    // ✅ FIX: Use parseInt(id) instead of parseInt(id) - handle undefined
    const cropId = parseInt(id);
    if (isNaN(cropId)) {
      return res.status(400).json({ error: 'Invalid crop ID' });
    }
    
    const result = await pool.query(query, [cropId]);
    
    console.log(`Found ${result.rows.length} expenses for crop ${id}`);
    
    return res.json({ 
      message: 'Expenses retrieved successfully', 
      data: result.rows 
    });
  } catch (error: any) {
    console.error('Error retrieving crop expenses:', error);
    return res.status(500).json({ error: 'Failed to retrieve expenses' });
  }
});

// POST /crops/:id/expenses - Create expense for specific crop
router.post('/:id/expenses', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { description, category, amount, date, notes } = req.body;
    
    // ✅ FIX: Handle undefined id parameter
    if (!id) {
      return res.status(400).json({ error: 'Crop ID is required' });
    }
    
    console.log(`Creating expense for crop ID: ${id}`, req.body);
    
    // Validate required fields
    if (!description || !amount || !category) {
      return res.status(400).json({ 
        error: 'Description, amount, and category are required' 
      });
    }

    const query = `
      INSERT INTO expenses (crop_id, description, category, amount, date, notes, created_at, updated_at)
      VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())
      RETURNING *
    `;
    
    // ✅ FIX: Validate crop ID and handle parsing
    const cropId = parseInt(id);
    if (isNaN(cropId)) {
      return res.status(400).json({ error: 'Invalid crop ID' });
    }
    
    const values = [
      cropId, // ✅ Use the validated cropId
      description, 
      category, 
      parseFloat(amount), 
      date, 
      notes || null
    ];
    
    const result = await pool.query(query, values);
    
    console.log('Expense created successfully:', result.rows[0]);
    
    return res.status(201).json({ 
      message: 'Expense created successfully', 
      data: result.rows[0] 
    });
  } catch (error: any) {
    console.error('Error creating expense:', error);
    return res.status(500).json({ error: 'Failed to create expense' });
  }
});

export default router;