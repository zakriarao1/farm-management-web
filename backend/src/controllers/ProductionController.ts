// backend/src/controllers/ProductionController.ts
import { Request, Response } from 'express';
import { pool } from '../config/database';
import { ProductionRecord, CreateProductionRecordRequest, UpdateProductionRecordRequest } from '../models/ProductionRecord';
import { ApiResponse } from '../types/response';

export class ProductionController {

  // Get all production records
  async getAllProductionRecords(req: Request, res: Response): Promise<void> {
    try {
      const { flockId, startDate, endDate, productType } = req.query;
      
      let query = `
        SELECT 
          pr.*, 
          f.name as flock_name 
        FROM production_records pr
        LEFT JOIN flocks f ON pr.flock_id = f.id
        WHERE 1=1
      `;
      const params: any[] = [];
      let paramCount = 0;

      if (flockId) {
        paramCount++;
        query += ` AND pr.flock_id = $${paramCount}`;
        params.push(flockId);
      }

      if (productType) {
        paramCount++;
        query += ` AND pr.product_type = $${paramCount}`;
        params.push(productType);
      }

      if (startDate) {
        paramCount++;
        query += ` AND pr.record_date >= $${paramCount}`;
        params.push(startDate);
      }

      if (endDate) {
        paramCount++;
        query += ` AND pr.record_date <= $${paramCount}`;
        params.push(endDate);
      }

      query += ` ORDER BY pr.record_date DESC, pr.created_at DESC`;

      const result = await pool.query(query, params);
      const records: ProductionRecord[] = result.rows.map(row => ({
        id: row.id,
        flockId: row.flock_id,
        recordDate: row.record_date,
        productType: row.product_type,
        quantity: parseFloat(row.quantity),
        unit: row.unit,
        qualityGrade: row.quality_grade,
        notes: row.notes,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
        flockName: row.flock_name
      }));

      const response: ApiResponse<ProductionRecord[]> = {
        data: records,
        message: 'Production records retrieved successfully',
        success: true
      };

      res.json(response);
    } catch (error) {
      console.error('Error getting production records:', error);
      res.status(500).json({
        data: null,
        message: 'Internal server error',
        success: false
      });
    }
  }

  // Get production records by flock ID
  async getProductionRecordsByFlock(req: Request, res: Response): Promise<void> {
    try {
      const { flockId } = req.params;
      const { startDate, endDate } = req.query;

      let query = `
        SELECT 
          pr.*, 
          f.name as flock_name 
        FROM production_records pr
        LEFT JOIN flocks f ON pr.flock_id = f.id
        WHERE pr.flock_id = $1
      `;
      const params: any[] = [flockId];
      let paramCount = 1;

      if (startDate) {
        paramCount++;
        query += ` AND pr.record_date >= $${paramCount}`;
        params.push(startDate);
      }

      if (endDate) {
        paramCount++;
        query += ` AND pr.record_date <= $${paramCount}`;
        params.push(endDate);
      }

      query += ` ORDER BY pr.record_date DESC, pr.created_at DESC`;

      const result = await pool.query(query, params);
      const records: ProductionRecord[] = result.rows.map(row => ({
        id: row.id,
        flockId: row.flock_id,
        recordDate: row.record_date,
        productType: row.product_type,
        quantity: parseFloat(row.quantity),
        unit: row.unit,
        qualityGrade: row.quality_grade,
        notes: row.notes,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
        flockName: row.flock_name
      }));

      const response: ApiResponse<ProductionRecord[]> = {
        data: records,
        message: 'Production records retrieved successfully',
        success: true
      };

      res.json(response);
    } catch (error) {
      console.error('Error getting production records by flock:', error);
      res.status(500).json({
        data: null,
        message: 'Internal server error',
        success: false
      });
    }
  }

  // Get production record by ID
  async getProductionRecordById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      const result = await pool.query(
        `SELECT 
          pr.*, 
          f.name as flock_name 
         FROM production_records pr
         LEFT JOIN flocks f ON pr.flock_id = f.id
         WHERE pr.id = $1`,
        [id]
      );

      if (result.rows.length === 0) {
        res.status(404).json({
          data: null,
          message: 'Production record not found',
          success: false
        });
        return;
      }

      const row = result.rows[0];
      const record: ProductionRecord = {
        id: row.id,
        flockId: row.flock_id,
        recordDate: row.record_date,
        productType: row.product_type,
        quantity: parseFloat(row.quantity),
        unit: row.unit,
        qualityGrade: row.quality_grade,
        notes: row.notes,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
        flockName: row.flock_name
      };

      const response: ApiResponse<ProductionRecord> = {
        data: record,
        message: 'Production record retrieved successfully',
        success: true
      };

      res.json(response);
    } catch (error) {
      console.error('Error getting production record:', error);
      res.status(500).json({
        data: null,
        message: 'Internal server error',
        success: false
      });
    }
  }

  // Create new production record
  async createProductionRecord(req: Request, res: Response): Promise<void> {
    try {
      const { flockId, recordDate, productType, quantity, unit, qualityGrade, notes }: CreateProductionRecordRequest = req.body;

      // Validate required fields
      if (!flockId || !recordDate || !productType || !quantity || !unit) {
        res.status(400).json({
          data: null,
          message: 'Missing required fields: flockId, recordDate, productType, quantity, unit',
          success: false
        });
        return;
      }

      // Check if flock exists
      const flockCheck = await pool.query('SELECT id FROM flocks WHERE id = $1', [flockId]);
      if (flockCheck.rows.length === 0) {
        res.status(404).json({
          data: null,
          message: 'Flock not found',
          success: false
        });
        return;
      }

      // Validate product type
      const validProductTypes = ['eggs', 'milk', 'meat', 'wool', 'other'];
      if (!validProductTypes.includes(productType)) {
        res.status(400).json({
          data: null,
          message: `Invalid product type. Must be one of: ${validProductTypes.join(', ')}`,
          success: false
        });
        return;
      }

      // Validate quantity
      if (quantity <= 0) {
        res.status(400).json({
          data: null,
          message: 'Quantity must be greater than 0',
          success: false
        });
        return;
      }

      const result = await pool.query(
        `INSERT INTO production_records 
         (flock_id, record_date, product_type, quantity, unit, quality_grade, notes) 
         VALUES ($1, $2, $3, $4, $5, $6, $7) 
         RETURNING *`,
        [flockId, recordDate, productType, quantity, unit, qualityGrade, notes]
      );

      // Get the record with flock data
      const recordWithFlock = await pool.query(
        `SELECT 
          pr.*, 
          f.name as flock_name 
         FROM production_records pr
         LEFT JOIN flocks f ON pr.flock_id = f.id
         WHERE pr.id = $1`,
        [result.rows[0].id]
      );

      const row = recordWithFlock.rows[0];
      const newRecord: ProductionRecord = {
        id: row.id,
        flockId: row.flock_id,
        recordDate: row.record_date,
        productType: row.product_type,
        quantity: parseFloat(row.quantity),
        unit: row.unit,
        qualityGrade: row.quality_grade,
        notes: row.notes,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
        flockName: row.flock_name
      };

      const response: ApiResponse<ProductionRecord> = {
        data: newRecord,
        message: 'Production record created successfully',
        success: true
      };

      res.status(201).json(response);
    } catch (error) {
      console.error('Error creating production record:', error);
      res.status(500).json({
        data: null,
        message: 'Internal server error',
        success: false
      });
    }
  }

  // Update production record
  async updateProductionRecord(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { recordDate, productType, quantity, unit, qualityGrade, notes }: UpdateProductionRecordRequest = req.body;

      // Check if record exists
      const existingRecord = await pool.query('SELECT * FROM production_records WHERE id = $1', [id]);
      if (existingRecord.rows.length === 0) {
        res.status(404).json({
          data: null,
          message: 'Production record not found',
          success: false
        });
        return;
      }

      // Validate product type if provided
      if (productType) {
        const validProductTypes = ['eggs', 'milk', 'meat', 'wool', 'other'];
        if (!validProductTypes.includes(productType)) {
          res.status(400).json({
            data: null,
            message: `Invalid product type. Must be one of: ${validProductTypes.join(', ')}`,
            success: false
          });
          return;
        }
      }

      // Validate quantity if provided
      if (quantity !== undefined && quantity <= 0) {
        res.status(400).json({
          data: null,
          message: 'Quantity must be greater than 0',
          success: false
        });
        return;
      }

      // Build dynamic update query
      const updateFields: string[] = [];
      const params: any[] = [];
      let paramCount = 1;

      if (recordDate) {
        updateFields.push(`record_date = $${paramCount}`);
        params.push(recordDate);
        paramCount++;
      }

      if (productType) {
        updateFields.push(`product_type = $${paramCount}`);
        params.push(productType);
        paramCount++;
      }

      if (quantity !== undefined) {
        updateFields.push(`quantity = $${paramCount}`);
        params.push(quantity);
        paramCount++;
      }

      if (unit) {
        updateFields.push(`unit = $${paramCount}`);
        params.push(unit);
        paramCount++;
      }

      if (qualityGrade !== undefined) {
        updateFields.push(`quality_grade = $${paramCount}`);
        params.push(qualityGrade);
        paramCount++;
      }

      if (notes !== undefined) {
        updateFields.push(`notes = $${paramCount}`);
        params.push(notes);
        paramCount++;
      }

      // Always update the updated_at timestamp
      updateFields.push(`updated_at = CURRENT_TIMESTAMP`);

      if (updateFields.length === 1) { // Only updated_at was added
        res.status(400).json({
          data: null,
          message: 'No fields to update',
          success: false
        });
        return;
      }

      params.push(id);
      const query = `
        UPDATE production_records 
        SET ${updateFields.join(', ')}
        WHERE id = $${paramCount}
        RETURNING *
      `;

      const result = await pool.query(query, params);

      // Get the updated record with flock data
      const recordWithFlock = await pool.query(
        `SELECT 
          pr.*, 
          f.name as flock_name 
         FROM production_records pr
         LEFT JOIN flocks f ON pr.flock_id = f.id
         WHERE pr.id = $1`,
        [result.rows[0].id]
      );

      const row = recordWithFlock.rows[0];
      const updatedRecord: ProductionRecord = {
        id: row.id,
        flockId: row.flock_id,
        recordDate: row.record_date,
        productType: row.product_type,
        quantity: parseFloat(row.quantity),
        unit: row.unit,
        qualityGrade: row.quality_grade,
        notes: row.notes,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
        flockName: row.flock_name
      };

      const response: ApiResponse<ProductionRecord> = {
        data: updatedRecord,
        message: 'Production record updated successfully',
        success: true
      };

      res.json(response);
    } catch (error) {
      console.error('Error updating production record:', error);
      res.status(500).json({
        data: null,
        message: 'Internal server error',
        success: false
      });
    }
  }

  // Delete production record
  async deleteProductionRecord(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      // Check if record exists
      const existingRecord = await pool.query('SELECT * FROM production_records WHERE id = $1', [id]);
      if (existingRecord.rows.length === 0) {
        res.status(404).json({
          data: null,
          message: 'Production record not found',
          success: false
        });
        return;
      }

      await pool.query('DELETE FROM production_records WHERE id = $1', [id]);

      const response: ApiResponse<{ message: string }> = {
        data: { message: 'Production record deleted successfully' },
        message: 'Production record deleted successfully',
        success: true
      };

      res.json(response);
    } catch (error) {
      console.error('Error deleting production record:', error);
      res.status(500).json({
        data: null,
        message: 'Internal server error',
        success: false
      });
    }
  }

  // Get production summary
  async getProductionSummary(req: Request, res: Response): Promise<void> {
    try {
      const { flockId, startDate, endDate, groupBy = 'product_type' } = req.query;

      let query = `
        SELECT 
          ${groupBy === 'flock' ? 'f.name as group_name, f.id as group_id' : 'pr.product_type as group_name, pr.product_type as group_id'},
          SUM(pr.quantity) as total_quantity,
          COUNT(pr.id) as record_count,
          AVG(pr.quantity) as average_quantity,
          MIN(pr.quantity) as min_quantity,
          MAX(pr.quantity) as max_quantity
        FROM production_records pr
        LEFT JOIN flocks f ON pr.flock_id = f.id
        WHERE 1=1
      `;
      const params: any[] = [];
      let paramCount = 0;

      if (flockId) {
        paramCount++;
        query += ` AND pr.flock_id = $${paramCount}`;
        params.push(flockId);
      }

      if (startDate) {
        paramCount++;
        query += ` AND pr.record_date >= $${paramCount}`;
        params.push(startDate);
      }

      if (endDate) {
        paramCount++;
        query += ` AND pr.record_date <= $${paramCount}`;
        params.push(endDate);
      }

      query += ` GROUP BY ${groupBy === 'flock' ? 'f.id, f.name' : 'pr.product_type'} 
                 ORDER BY total_quantity DESC`;

      const result = await pool.query(query, params);

      const summary = result.rows.map(row => ({
        groupName: row.group_name,
        groupId: row.group_id,
        totalQuantity: parseFloat(row.total_quantity),
        recordCount: parseInt(row.record_count),
        averageQuantity: parseFloat(row.average_quantity),
        minQuantity: parseFloat(row.min_quantity),
        maxQuantity: parseFloat(row.max_quantity)
      }));

      const response: ApiResponse<any> = {
        data: summary,
        message: 'Production summary retrieved successfully',
        success: true
      };

      res.json(response);
    } catch (error) {
      console.error('Error getting production summary:', error);
      res.status(500).json({
        data: null,
        message: 'Internal server error',
        success: false
      });
    }
  }

  // Get production statistics
  async getProductionStatistics(req: Request, res: Response): Promise<void> {
    try {
      const { flockId, period = 'month' } = req.query;

      // Calculate date range based on period
      const endDate = new Date();
      const startDate = new Date();
      
      switch (period) {
        case 'week':
          startDate.setDate(startDate.getDate() - 7);
          break;
        case 'month':
          startDate.setMonth(startDate.getMonth() - 1);
          break;
        case 'quarter':
          startDate.setMonth(startDate.getMonth() - 3);
          break;
        case 'year':
          startDate.setFullYear(startDate.getFullYear() - 1);
          break;
        default:
          startDate.setMonth(startDate.getMonth() - 1);
      }

      let query = `
        SELECT 
          product_type,
          COUNT(*) as total_records,
          SUM(quantity) as total_quantity,
          AVG(quantity) as average_quantity,
          MIN(quantity) as min_quantity,
          MAX(quantity) as max_quantity
        FROM production_records
        WHERE record_date BETWEEN $1 AND $2
      `;
      const params: any[] = [startDate.toISOString().split('T')[0], endDate.toISOString().split('T')[0]];

      if (flockId) {
        query += ` AND flock_id = $3`;
        params.push(flockId);
      }

      query += ` GROUP BY product_type ORDER BY total_quantity DESC`;

      const result = await pool.query(query, params);

      const statistics = result.rows.map(row => ({
        productType: row.product_type,
        totalRecords: parseInt(row.total_records),
        totalQuantity: parseFloat(row.total_quantity),
        averageQuantity: parseFloat(row.average_quantity),
        minQuantity: parseFloat(row.min_quantity),
        maxQuantity: parseFloat(row.max_quantity)
      }));

      const response: ApiResponse<any> = {
        data: {
          statistics,
          period: {
            startDate: startDate.toISOString().split('T')[0],
            endDate: endDate.toISOString().split('T')[0],
            period
          }
        },
        message: 'Production statistics retrieved successfully',
        success: true
      };

      res.json(response);
    } catch (error) {
      console.error('Error getting production statistics:', error);
      res.status(500).json({
        data: null,
        message: 'Internal server error',
        success: false
      });
    }
  }

  // Get monthly production trend
  async getMonthlyProductionTrend(req: Request, res: Response): Promise<void> {
    try {
      const { flockId, year = new Date().getFullYear() } = req.query;

      const query = `
        SELECT 
          EXTRACT(MONTH FROM record_date) as month,
          product_type,
          SUM(quantity) as total_quantity
        FROM production_records
        WHERE EXTRACT(YEAR FROM record_date) = $1
        ${flockId ? 'AND flock_id = $2' : ''}
        GROUP BY EXTRACT(MONTH FROM record_date), product_type
        ORDER BY month, product_type
      `;

      const params: any[] = [year];
      if (flockId) {
        params.push(flockId);
      }

      const result = await pool.query(query, params);

      const monthlyTrend = result.rows.map(row => ({
        month: parseInt(row.month),
        productType: row.product_type,
        totalQuantity: parseFloat(row.total_quantity)
      }));

      const response: ApiResponse<any> = {
        data: monthlyTrend,
        message: 'Monthly production trend retrieved successfully',
        success: true
      };

      res.json(response);
    } catch (error) {
      console.error('Error getting monthly production trend:', error);
      res.status(500).json({
        data: null,
        message: 'Internal server error',
        success: false
      });
    }
  }
}

export default new ProductionController();