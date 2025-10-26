// backend/src/controller/CropController.ts

import { Request, Response } from 'express';
import { CropRepository } from '../repositories/CropRepository';
import { ExpenseRepository } from '../repositories/ExpenseRepository';

const cropRepository = new CropRepository();
const expenseRepository = new ExpenseRepository();

export class CropController {
  async getAllCrops(req: Request, res: Response): Promise<void> {
    try {
      const crops = await cropRepository.findAll();
      res.json(crops);
    } catch (error) {
      console.error('Get crops error:', error);
      res.status(500).json({ error: 'Failed to fetch crops' });
    }
  }

  async getCropById(req: Request, res: Response): Promise<void> {
    try {
      const id = parseInt(req.params.id || '');
      if (isNaN(id)) {
        res.status(400).json({ error: 'Invalid crop ID' });
        return;
      }
      
      const crop = await cropRepository.findById(id);
      
      if (!crop) {
        res.status(404).json({ error: 'Crop not found' });
        return;
      }
      
      res.json(crop);
    } catch (error) {
      console.error('Get crop error:', error);
      res.status(500).json({ error: 'Failed to fetch crop' });
    }
  }

  async createCrop(req: Request, res: Response): Promise<void> {
    try {
      const crop = await cropRepository.create(req.body);
      res.status(201).json(crop);
    } catch (error) {
      console.error('Create crop error:', error);
      res.status(500).json({ error: 'Failed to create crop' });
    }
  }

  async updateCrop(req: Request, res: Response): Promise<void> {
    try {
      const id = parseInt(req.params.id || '');
      if (isNaN(id)) {
        res.status(400).json({ error: 'Invalid crop ID' });
        return;
      }
      
      const crop = await cropRepository.update(id, req.body);
      
      if (!crop) {
        res.status(404).json({ error: 'Crop not found' });
        return;
      }
      
      res.json(crop);
    } catch (error) {
      console.error('Update crop error:', error);
      res.status(500).json({ error: 'Failed to update crop' });
    }
  }

  async deleteCrop(req: Request, res: Response): Promise<void> {
    try {
      const id = parseInt(req.params.id || '');
      if (isNaN(id)) {
        res.status(400).json({ error: 'Invalid crop ID' });
        return;
      }
      
      // Delete associated expenses first
      await expenseRepository.deleteByCropId(id);
      
      const deleted = await cropRepository.delete(id);
      
      if (!deleted) {
        res.status(404).json({ error: 'Crop not found' });
        return;
      }
      
      res.json({ message: 'Crop deleted successfully' });
    } catch (error) {
      console.error('Delete crop error:', error);
      res.status(500).json({ error: 'Failed to delete crop' });
    }
  }

  async getCropsByStatus(req: Request, res: Response): Promise<void> {
    try {
      const { status } = req.params;
      
      // ✅ Fix: Validate status parameter
      if (!status || typeof status !== 'string') {
        res.status(400).json({ error: 'Status parameter is required' });
        return;
      }
      
      const crops = await cropRepository.findByStatus(status);
      res.json(crops);
    } catch (error) {
      console.error('Get crops by status error:', error);
      res.status(500).json({ error: 'Failed to fetch crops' });
    }
  }

  async getActiveCrops(req: Request, res: Response): Promise<void> {
    try {
      const crops = await cropRepository.getActiveCrops();
      res.json(crops);
    } catch (error) {
      console.error('Get active crops error:', error);
      res.status(500).json({ error: 'Failed to fetch active crops' });
    }
  }

  async searchCrops(req: Request, res: Response): Promise<void> {
    try {
      const { q } = req.query;
      
      // ✅ Already fixed: Validate query parameter
      if (!q || typeof q !== 'string') {
        res.status(400).json({ error: 'Query parameter is required' });
        return;
      }
      
      const crops = await cropRepository.searchCrops(q);
      res.json(crops);
    } catch (error) {
      console.error('Search crops error:', error);
      res.status(500).json({ error: 'Failed to search crops' });
    }
  }

  async updateCropStatus(req: Request, res: Response): Promise<void> {
    try {
      const id = parseInt(req.params.id || '');
      if (isNaN(id)) {
        res.status(400).json({ error: 'Invalid crop ID' });
        return;
      }
      
      const { status } = req.body;
      
      if (!status) {
        res.status(400).json({ error: 'Status is required' });
        return;
      }
      
      const crop = await cropRepository.update(id, { status });
      
      if (!crop) {
        res.status(404).json({ error: 'Crop not found' });
        return;
      }
      
      res.json(crop);
    } catch (error) {
      console.error('Update crop status error:', error);
      res.status(500).json({ error: 'Failed to update crop status' });
    }
  }
}