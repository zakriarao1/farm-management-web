// backend/src/controllers/LivestockController.ts
import { Request, Response } from 'express';
import { pool } from '../config/database';
import { LivestockRepository } from '../repositories/LivestockRepository';

export class LivestockController {
  private livestockRepository: LivestockRepository;

  constructor() {
    this.livestockRepository = new LivestockRepository();
  }

  // Get all livestock
  async getAll(req: Request, res: Response): Promise<void> {
    try {
      const result = await pool.query('SELECT * FROM livestock ORDER BY created_at DESC');
      res.json({ data: result.rows });
    } catch (error) {
      console.error('Get livestock error:', error);
      res.status(500).json({ error: 'Failed to fetch livestock' });
    }
  }

  // Get livestock by ID
  async getById(req: Request, res: Response): Promise<void> {
    try {
      const id = this.parseId(req.params.id);
      if (id === null) {
        res.status(400).json({ error: 'Invalid livestock ID' });
        return;
      }

      const result = await pool.query('SELECT * FROM livestock WHERE id = $1', [id]);
      
      if (result.rows.length === 0) {
        res.status(404).json({ error: 'Livestock not found' });
        return;
      }
      
      res.json({ data: result.rows[0] });
    } catch (error) {
      console.error('Get livestock by ID error:', error);
      res.status(500).json({ error: 'Failed to fetch livestock' });
    }
  }

  // Create new livestock
  async create(req: Request, res: Response): Promise<void> {
    try {
      const {
        tagId, type, breed, gender, dateOfBirth, purchaseDate,
        purchasePrice, weight, status, location, notes
      } = req.body;

      // Validate required fields
      if (!tagId || !type || !breed || !gender || !purchaseDate || !location) {
        res.status(400).json({ 
          error: 'Tag ID, type, breed, gender, purchase date, and location are required' 
        });
        return;
      }

      const result = await pool.query(
        `INSERT INTO livestock 
         (tag_id, type, breed, gender, date_of_birth, purchase_date, purchase_price, weight, status, location, notes) 
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) 
         RETURNING *`,
        [tagId, type, breed, gender, dateOfBirth, purchaseDate, purchasePrice, weight, status, location, notes]
      );
      
      res.status(201).json({ 
        message: 'Livestock created successfully',
        data: result.rows[0] 
      });
    } catch (error) {
      console.error('Create livestock error:', error);
      
      // Handle duplicate tag ID
      if (error instanceof Error && error.message.includes('unique constraint')) {
        res.status(400).json({ error: 'Tag ID already exists' });
        return;
      }
      
      res.status(500).json({ error: 'Failed to create livestock record' });
    }
  }

  // Update livestock
  async update(req: Request, res: Response): Promise<void> {
    try {
      const id = this.parseId(req.params.id);
      if (id === null) {
        res.status(400).json({ error: 'Invalid livestock ID' });
        return;
      }

      const {
        tagId, type, breed, gender, dateOfBirth, purchaseDate,
        purchasePrice, weight, status, location, notes
      } = req.body;

      // Check if livestock exists
      const existing = await pool.query('SELECT * FROM livestock WHERE id = $1', [id]);
      if (existing.rows.length === 0) {
        res.status(404).json({ error: 'Livestock not found' });
        return;
      }

      const result = await pool.query(
        `UPDATE livestock 
         SET tag_id = $1, type = $2, breed = $3, gender = $4, date_of_birth = $5, 
             purchase_date = $6, purchase_price = $7, weight = $8, status = $9, 
             location = $10, notes = $11, updated_at = CURRENT_TIMESTAMP
         WHERE id = $12 
         RETURNING *`,
        [tagId, type, breed, gender, dateOfBirth, purchaseDate, purchasePrice, weight, status, location, notes, id]
      );
      
      res.json({ 
        message: 'Livestock updated successfully',
        data: result.rows[0] 
      });
    } catch (error) {
      console.error('Update livestock error:', error);
      res.status(500).json({ error: 'Failed to update livestock record' });
    }
  }

  // Delete livestock
  async delete(req: Request, res: Response): Promise<void> {
    try {
      const id = this.parseId(req.params.id);
      if (id === null) {
        res.status(400).json({ error: 'Invalid livestock ID' });
        return;
      }
      
      // Check if livestock exists
      const existing = await pool.query('SELECT * FROM livestock WHERE id = $1', [id]);
      if (existing.rows.length === 0) {
        res.status(404).json({ error: 'Livestock not found' });
        return;
      }

      await pool.query('DELETE FROM livestock WHERE id = $1', [id]);
      
      res.json({ 
        message: 'Livestock deleted successfully' 
      });
    } catch (error) {
      console.error('Delete livestock error:', error);
      res.status(500).json({ error: 'Failed to delete livestock record' });
    }
  }

  // Get health records for livestock
  async getHealthRecords(req: Request, res: Response): Promise<void> {
    try {
      const livestockId = this.parseId(req.params.id);
      if (livestockId === null) {
        res.status(400).json({ error: 'Invalid livestock ID' });
        return;
      }
      
      // Check if livestock exists
      const livestock = await pool.query('SELECT * FROM livestock WHERE id = $1', [livestockId]);
      if (livestock.rows.length === 0) {
        res.status(404).json({ error: 'Livestock not found' });
        return;
      }

      const result = await pool.query(
        'SELECT * FROM health_records WHERE livestock_id = $1 ORDER BY record_date DESC',
        [livestockId]
      );
      
      res.json({ 
        message: 'Health records retrieved successfully',
        data: result.rows 
      });
    } catch (error) {
      console.error('Get health records error:', error);
      res.status(500).json({ error: 'Failed to fetch health records' });
    }
  }

  // Record sale for livestock
  async recordSale(req: Request, res: Response): Promise<void> {
    try {
      const id = this.parseId(req.params.id);
      if (id === null) {
        res.status(400).json({ error: 'Invalid livestock ID' });
        return;
      }
      
      const { sale_price, sale_date, sale_reason } = req.body;
      
      const livestock = await this.livestockRepository.recordSale(id, {
        sale_price,
        sale_date,
        sale_reason
      });
      
      if (!livestock) {
        res.status(404).json({ error: 'Livestock not found' });
        return;
      }
      
      res.json({
        message: 'Sale recorded successfully',
        data: livestock
      });
    } catch (error) {
      console.error('Record sale error:', error);
      res.status(500).json({ error: 'Failed to record sale' });
    }
  }

  // Update weight for livestock
  async updateWeight(req: Request, res: Response): Promise<void> {
    try {
      const id = this.parseId(req.params.id);
      if (id === null) {
        res.status(400).json({ error: 'Invalid livestock ID' });
        return;
      }
      
      const { current_weight } = req.body;
      
      if (!current_weight) {
        res.status(400).json({ error: 'Current weight is required' });
        return;
      }
      
      const livestock = await this.livestockRepository.updateWeight(id, current_weight);
      
      if (!livestock) {
        res.status(404).json({ error: 'Livestock not found' });
        return;
      }
      
      res.json({
        message: 'Weight updated successfully',
        data: livestock
      });
    } catch (error) {
      console.error('Update weight error:', error);
      res.status(500).json({ error: 'Failed to update weight' });
    }
  }

  // Get animal financials
  async getAnimalFinancials(req: Request, res: Response): Promise<void> {
    try {
      const id = this.parseId(req.params.id);
      if (id === null) {
        res.status(400).json({ error: 'Invalid livestock ID' });
        return;
      }
      
      const financials = await this.livestockRepository.getAnimalFinancials(id);
      
      if (!financials) {
        res.status(404).json({ error: 'Livestock not found' });
        return;
      }
      
      res.json({
        message: 'Financial data retrieved successfully',
        data: financials
      });
    } catch (error) {
      console.error('Get animal financials error:', error);
      res.status(500).json({ error: 'Failed to fetch animal financials' });
    }
  }

  // Add health record for livestock
  async addHealthRecord(req: Request, res: Response): Promise<void> {
    try {
      const livestockId = this.parseId(req.params.id);
      if (livestockId === null) {
        res.status(400).json({ error: 'Invalid livestock ID' });
        return;
      }

      const {
        recordDate, condition, treatment, medication, dosage, veterinarian, cost, notes
      } = req.body;

      // Validate required fields
      if (!recordDate || !condition || !treatment) {
        res.status(400).json({ 
          error: 'Record date, condition, and treatment are required' 
        });
        return;
      }

      // Check if livestock exists
      const livestock = await pool.query('SELECT * FROM livestock WHERE id = $1', [livestockId]);
      if (livestock.rows.length === 0) {
        res.status(404).json({ error: 'Livestock not found' });
        return;
      }

      const result = await pool.query(
        `INSERT INTO health_records 
         (livestock_id, record_date, condition, treatment, medication, dosage, veterinarian, cost, notes) 
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) 
         RETURNING *`,
        [livestockId, recordDate, condition, treatment, medication, dosage, veterinarian, cost, notes]
      );
      
      res.status(201).json({ 
        message: 'Health record added successfully',
        data: result.rows[0] 
      });
    } catch (error) {
      console.error('Add health record error:', error);
      res.status(500).json({ error: 'Failed to add health record' });
    }
  }

  // Helper method to parse ID from request parameters
  private parseId(id: string | undefined): number | null {
    if (!id) {
      return null;
    }
    const parsedId = parseInt(id, 10);
    return isNaN(parsedId) ? null : parsedId;
  }
}