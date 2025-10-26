// backend/src/controllers/SalesController.ts
import { Request, Response } from 'express';
import { pool } from '../config/database';

export class SalesController {
  // Record a new sale
  async recordSale(req: Request, res: Response): Promise<void> {
    try {
      const {
        livestock_id,
        flock_id,
        sale_type,
        sale_date,
        description,
        quantity,
        unit_price,
        total_amount,
        customer_name,
        customer_contact,
        payment_method,
        notes
      } = req.body;

      // Validate required fields
      if (!sale_type || !sale_date || !description || !quantity || !unit_price || !payment_method) {
        res.status(400).json({
          data: null,
          message: 'Missing required fields',
          success: false
        });
        return;
      }

      const result = await pool.query(
        `INSERT INTO sales (
          livestock_id, flock_id, sale_type, sale_date, description, 
          quantity, unit_price, total_amount, customer_name, 
          customer_contact, payment_method, notes
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
        RETURNING *`,
        [
          livestock_id || null,
          flock_id || null,
          sale_type,
          sale_date,
          description,
          quantity,
          unit_price,
          total_amount,
          customer_name || null,
          customer_contact || null,
          payment_method,
          notes || null
        ]
      );

      // If it's an animal sale, update livestock status
      if (sale_type === 'animal' && livestock_id) {
        await pool.query(
          'UPDATE livestock SET status = $1, sale_price = $2, sale_date = $3 WHERE id = $4',
          ['sold', unit_price, sale_date, livestock_id]
        );
      }

      res.status(201).json({
        data: result.rows[0],
        message: 'Sale recorded successfully',
        success: true
      });
    } catch (error) {
      console.error('Error recording sale:', error);
      res.status(500).json({
        data: null,
        message: 'Internal server error',
        success: false
      });
    }
  }

  // Get all sales
  async getAllSales(req: Request, res: Response): Promise<void> {
    try {
      const { startDate, endDate, saleType } = req.query;

      let query = `
        SELECT 
          s.*,
          l.tag_id as animal_identifier,
          l.breed as animal_breed,
          f.name as flock_name
        FROM sales s
        LEFT JOIN livestock l ON s.livestock_id = l.id
        LEFT JOIN flocks f ON s.flock_id = f.id
        WHERE 1=1
      `;

      const params: any[] = [];
      let paramCount = 0;

      if (startDate) {
        paramCount++;
        query += ` AND s.sale_date >= $${paramCount}`;
        params.push(startDate);
      }

      if (endDate) {
        paramCount++;
        query += ` AND s.sale_date <= $${paramCount}`;
        params.push(endDate);
      }

      if (saleType) {
        paramCount++;
        query += ` AND s.sale_type = $${paramCount}`;
        params.push(saleType);
      }

      query += ` ORDER BY s.sale_date DESC, s.created_at DESC`;

      const result = await pool.query(query, params);

      res.json({
        data: result.rows,
        message: 'Sales retrieved successfully',
        success: true
      });
    } catch (error) {
      console.error('Error getting sales:', error);
      res.status(500).json({
        data: null,
        message: 'Internal server error',
        success: false
      });
    }
  }

  // Get sales summary
  async getSalesSummary(req: Request, res: Response): Promise<void> {
    try {
      const { startDate, endDate } = req.query;

      let query = `
        SELECT 
          sale_type,
          COUNT(*) as sale_count,
          SUM(quantity) as total_quantity,
          SUM(total_amount) as total_revenue,
          AVG(unit_price) as average_price,
          MIN(unit_price) as min_price,
          MAX(unit_price) as max_price
        FROM sales
        WHERE 1=1
      `;

      const params: any[] = [];
      let paramCount = 0;

      if (startDate) {
        paramCount++;
        query += ` AND sale_date >= $${paramCount}`;
        params.push(startDate);
      }

      if (endDate) {
        paramCount++;
        query += ` AND sale_date <= $${paramCount}`;
        params.push(endDate);
      }

      query += ` GROUP BY sale_type ORDER BY total_revenue DESC`;

      const result = await pool.query(query, params);

      res.json({
        data: result.rows,
        message: 'Sales summary retrieved successfully',
        success: true
      });
    } catch (error) {
      console.error('Error getting sales summary:', error);
      res.status(500).json({
        data: null,
        message: 'Internal server error',
        success: false
      });
    }
  }

  // Delete a sale
  async deleteSale(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      // Check if sale exists
      const existingSale = await pool.query('SELECT * FROM sales WHERE id = $1', [id]);
      if (existingSale.rows.length === 0) {
        res.status(404).json({
          data: null,
          message: 'Sale not found',
          success: false
        });
        return;
      }

      const sale = existingSale.rows[0];

      // If it was an animal sale, revert livestock status
      if (sale.sale_type === 'animal' && sale.livestock_id) {
        await pool.query(
          'UPDATE livestock SET status = $1, sale_price = NULL, sale_date = NULL WHERE id = $2',
          ['active', sale.livestock_id]
        );
      }

      await pool.query('DELETE FROM sales WHERE id = $1', [id]);

      res.json({
        data: { message: 'Sale deleted successfully' },
        message: 'Sale deleted successfully',
        success: true
      });
    } catch (error) {
      console.error('Error deleting sale:', error);
      res.status(500).json({
        data: null,
        message: 'Internal server error',
        success: false
      });
    }
  }
}