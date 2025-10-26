// backend/src/controllers/FlockController.ts
import { Request, Response } from 'express';
import { FlockRepository } from '../repositories/FlockRepository';

const flockRepository = new FlockRepository();

export class FlockController {
  async getAllFlocks(req: Request, res: Response): Promise<void> {
    try {
      const flocks = await flockRepository.findAll();
      
      // ✅ FIX: Return proper ApiResponse format
      res.json({
        data: flocks,
        message: 'Flocks retrieved successfully',
        success: true
      });
    } catch (error) {
      console.error('Get flocks error:', error);
      res.status(500).json({ 
        data: null,
        message: 'Failed to fetch flocks',
        success: false
      });
    }
  }

  async getFlockById(req: Request, res: Response): Promise<void> {
    try {
      const id = parseInt(req.params.id || '');
      if (isNaN(id)) {
        res.status(400).json({ 
          data: null,
          message: 'Invalid flock ID',
          success: false 
        });
        return;
      }
      
      const flock = await flockRepository.findById(id);
      
      if (!flock) {
        res.status(404).json({ 
          data: null,
          message: 'Flock not found',
          success: false 
        });
        return;
      }
      
      // ✅ FIX: Return proper ApiResponse format
      res.json({
        data: flock,
        message: 'Flock retrieved successfully',
        success: true
      });
    } catch (error) {
      console.error('Get flock error:', error);
      res.status(500).json({ 
        data: null,
        message: 'Failed to fetch flock',
        success: false
      });
    }
  }

  async createFlock(req: Request, res: Response): Promise<void> {
    try {
      const flock = await flockRepository.create(req.body);
      
      // ✅ FIX: Return proper ApiResponse format
      res.status(201).json({
        data: flock,
        message: 'Flock created successfully',
        success: true
      });
    } catch (error) {
      console.error('Create flock error:', error);
      res.status(500).json({ 
        data: null,
        message: 'Failed to create flock',
        success: false
      });
    }
  }

  async updateFlock(req: Request, res: Response): Promise<void> {
    try {
      const id = parseInt(req.params.id || '');
      if (isNaN(id)) {
        res.status(400).json({ 
          data: null,
          message: 'Invalid flock ID',
          success: false 
        });
        return;
      }
      
      const flock = await flockRepository.update(id, req.body);
      
      if (!flock) {
        res.status(404).json({ 
          data: null,
          message: 'Flock not found',
          success: false 
        });
        return;
      }
      
      // ✅ FIX: Return proper ApiResponse format
      res.json({
        data: flock,
        message: 'Flock updated successfully',
        success: true
      });
    } catch (error) {
      console.error('Update flock error:', error);
      res.status(500).json({ 
        data: null,
        message: 'Failed to update flock',
        success: false
      });
    }
  }

  async deleteFlock(req: Request, res: Response): Promise<void> {
    try {
      const id = parseInt(req.params.id || '');
      if (isNaN(id)) {
        res.status(400).json({ 
          data: null,
          message: 'Invalid flock ID',
          success: false 
        });
        return;
      }
      
      const deleted = await flockRepository.delete(id);
      
      if (!deleted) {
        res.status(404).json({ 
          data: null,
          message: 'Flock not found',
          success: false 
        });
        return;
      }
      
      // ✅ FIX: Return proper ApiResponse format
      res.json({
        data: { message: 'Flock deleted successfully' },
        message: 'Flock deleted successfully',
        success: true
      });
    } catch (error) {
      console.error('Delete flock error:', error);
      res.status(500).json({ 
        data: null,
        message: 'Failed to delete flock',
        success: false
      });
    }
  }

  async getFlockStats(req: Request, res: Response): Promise<void> {
    try {
      const id = parseInt(req.params.id || '');
      if (isNaN(id)) {
        res.status(400).json({ 
          data: null,
          message: 'Invalid flock ID',
          success: false 
        });
        return;
      }
      
      const stats = await flockRepository.getFlockStats(id);
      
      if (!stats) {
        res.status(404).json({ 
          data: null,
          message: 'Flock not found',
          success: false 
        });
        return;
      }
      
      // ✅ FIX: Return proper ApiResponse format
      res.json({
        data: stats,
        message: 'Flock stats retrieved successfully',
        success: true
      });
    } catch (error) {
      console.error('Get flock stats error:', error);
      res.status(500).json({ 
        data: null,
        message: 'Failed to fetch flock stats',
        success: false
      });
    }
  }
}