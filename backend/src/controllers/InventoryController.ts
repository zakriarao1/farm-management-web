// backend/src/controllers/InventoryController.ts

import { Request, Response } from 'express';
import { pool } from '../config/database';

export class InventoryController {
  async getInventory(req: Request, res: Response) {
    try {
      const { category, lowStock } = req.query;

      let query = `
        SELECT 
          i.*,
          (i.quantity <= i.min_quantity) as is_low_stock,
          COUNT(t.id) as transaction_count
        FROM inventory_items i
        LEFT JOIN inventory_transactions t ON i.id = t.item_id
      `;
      const params: any[] = [];
      let whereConditions: string[] = [];

      if (category) {
        params.push(category);
        whereConditions.push(`i.category = $${params.length}`);
      }

      if (lowStock === 'true') {
        whereConditions.push('i.quantity <= i.min_quantity');
      }

      if (whereConditions.length > 0) {
        query += ` WHERE ${whereConditions.join(' AND ')}`;
      }

      query += ` GROUP BY i.id ORDER BY i.name`;

      const result = await pool.query(query, params);

      res.json({
        message: 'Inventory retrieved successfully',
        data: result.rows
      });
    } catch (error) {
      console.error('Get inventory error:', error);
      res.status(500).json({ error: 'Failed to fetch inventory' });
    }
  }

  async addInventoryItem(req: Request, res: Response) {
    try {
      const {
        name, category, quantity, unit, minQuantity, unitCost,
        supplier, expirationDate, location, notes
      } = req.body;

      const result = await pool.query(
        `INSERT INTO inventory_items 
         (name, category, quantity, unit, min_quantity, unit_cost, supplier, expiration_date, location, notes) 
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) 
         RETURNING *`,
        [name, category, quantity, unit, minQuantity, unitCost, supplier, expirationDate, location, notes]
      );

      // Record initial transaction
      await pool.query(
        `INSERT INTO inventory_transactions 
         (item_id, transaction_type, quantity, unit_cost, total_cost, notes) 
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [result.rows[0].id, 'PURCHASE', quantity, unitCost, quantity * (unitCost || 0), 'Initial stock']
      );

      res.status(201).json({
        message: 'Inventory item added successfully',
        data: result.rows[0]
      });
    } catch (error) {
      console.error('Add inventory item error:', error);
      res.status(500).json({ error: 'Failed to add inventory item' });
    }
  }

  async useInventoryItem(req: Request, res: Response) {
  try {
    const { itemId, quantityUsed } = req.body;
    // Add your inventory logic here
    return res.json({ message: 'Item used successfully' });
  } catch (error) {
    console.error('Error using inventory item:', error);
    return res.status(500).json({ error: 'Failed to use inventory item' });
  }
}

  async getLowStockAlerts(req: Request, res: Response) {
    try {
      const lowStockItems = await pool.query(`
        SELECT 
          name,
          category,
          quantity,
          min_quantity,
          unit,
          (min_quantity - quantity) as needed_quantity
        FROM inventory_items 
        WHERE quantity <= min_quantity
        ORDER BY (min_quantity - quantity) DESC
      `);

      res.json({
        message: 'Low stock alerts retrieved successfully',
        data: lowStockItems.rows
      });
    } catch (error) {
      console.error('Get low stock alerts error:', error);
      res.status(500).json({ error: 'Failed to fetch low stock alerts' });
    }
  }
}