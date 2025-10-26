// backend/src/routes/inventory.ts

import express from 'express';
const router = express.Router();

// GET /api/inventory
router.get('/', async (req, res) => {
  try {
    // Mock inventory data
    const mockInventory: any[] = [
      { id: 1, name: 'Organic Fertilizer', category: 'Fertilizers', quantity: 50, unit: 'kg', minStockLevel: 10 },
      { id: 2, name: 'Seeds - Tomato', category: 'Seeds', quantity: 200, unit: 'packets', minStockLevel: 50 },
      { id: 3, name: 'Pesticide', category: 'Chemicals', quantity: 15, unit: 'liters', minStockLevel: 5 }
    ];
    
    res.json({ 
      data: mockInventory, 
      message: 'Inventory retrieved successfully' 
    });
  } catch (error) {
    console.error('Error fetching inventory:', error);
    res.status(500).json({ error: 'Failed to fetch inventory' });
  }
});

// POST /api/inventory
router.post('/', async (req, res) => {
  try {
    const { name, category, quantity, unit, minStockLevel } = req.body;
    
    // Mock creation
    const newItem = {
      id: Date.now(),
      name,
      category,
      quantity,
      unit,
      minStockLevel
    };
    
    res.json({ 
      data: newItem, 
      message: 'Inventory item added successfully' 
    });
  } catch (error) {
    console.error('Error adding inventory item:', error);
    res.status(500).json({ error: 'Failed to add inventory item' });
  }
});

// POST /api/inventory/use
router.post('/use', async (req, res) => {
  try {
    const { itemId, quantityUsed } = req.body;
    
    // Mock usage
    const result = {
      remainingQuantity: 25, // Mock remaining quantity
      message: `Used ${quantityUsed} units of item ${itemId}`
    };
    
    res.json({ 
      data: result, 
      message: 'Inventory item used successfully' 
    });
  } catch (error) {
    console.error('Error using inventory item:', error);
    res.status(500).json({ error: 'Failed to use inventory item' });
  }
});

// GET /api/inventory/low-stock
router.get('/low-stock', async (req, res) => {
  try {
    // Mock low stock items
    const lowStockItems: any[] = [
      { id: 4, name: 'Herbicide', category: 'Chemicals', quantity: 3, unit: 'liters', minStockLevel: 5 }
    ];
    
    res.json({ 
      data: lowStockItems, 
      message: 'Low stock items retrieved' 
    });
  } catch (error) {
    console.error('Error fetching low stock items:', error);
    res.status(500).json({ error: 'Failed to fetch low stock items' });
  }
});

export default router;