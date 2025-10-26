import { Request, Response } from 'express';
import { FinancialSummaryRepository } from '../repositories/FinancialSummaryRepository';

const financialRepo = new FinancialSummaryRepository();

export class FinancialSummaryController {
  async getFlockFinancialSummary(req: Request, res: Response): Promise<void> {
    try {
      const flockId = req.query.flockId ? parseInt(req.query.flockId as string) : undefined;
      
      const summary = await financialRepo.getFlockFinancialSummary(flockId);
      res.json(summary);
    } catch (error) {
      console.error('Get flock financial summary error:', error);
      res.status(500).json({ error: 'Failed to fetch flock financial summary' });
    }
  }

  async getAnimalFinancialSummary(req: Request, res: Response): Promise<void> {
    try {
      const animalId = req.query.animalId ? parseInt(req.query.animalId as string) : undefined;
      
      const summary = await financialRepo.getAnimalFinancialSummary(animalId);
      res.json(summary);
    } catch (error) {
      console.error('Get animal financial summary error:', error);
      res.status(500).json({ error: 'Failed to fetch animal financial summary' });
    }
  }

  async getFlockPerformanceMetrics(req: Request, res: Response): Promise<void> {
    try {
      const flockId = parseInt(req.params.flockId || '');
      if (isNaN(flockId)) {
        res.status(400).json({ error: 'Invalid flock ID' });
        return;
      }
      
      const metrics = await financialRepo.getFlockPerformanceMetrics(flockId);
      
      if (!metrics) {
        res.status(404).json({ error: 'Flock not found' });
        return;
      }
      
      res.json(metrics);
    } catch (error) {
      console.error('Get flock performance metrics error:', error);
      res.status(500).json({ error: 'Failed to fetch flock performance metrics' });
    }
  }
}