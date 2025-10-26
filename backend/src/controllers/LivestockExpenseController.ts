// backend/src/controllers/LivestockExpenseController.ts
import { Request, Response } from 'express';
import { LivestockExpenseRepository } from '../repositories/LivestockExpenseRepository';

const expenseRepository = new LivestockExpenseRepository();

export class LivestockExpenseController {
  async getAllExpenses(req: Request, res: Response): Promise<void> {
    try {
      const expenses = await expenseRepository.findAll();
      res.json({
        data: expenses,
        message: 'Livestock expenses retrieved successfully'
      });
    } catch (error) {
      console.error('Get livestock expenses error:', error);
      res.status(500).json({ 
        error: 'Failed to fetch livestock expenses',
        message: error instanceof Error ? error.message : 'Unknown error occurred'
      });
    }
  }

  async getExpensesByFlock(req: Request, res: Response): Promise<void> {
    try {
      const flockId = parseInt(req.params.flockId || '');
      if (isNaN(flockId)) {
        res.status(400).json({ 
          error: 'Invalid flock ID',
          message: 'Please provide a valid flock ID'
        });
        return;
      }
      
      const expenses = await expenseRepository.findByFlockId(flockId);
      res.json({
        data: expenses,
        message: 'Flock expenses retrieved successfully'
      });
    } catch (error) {
      console.error('Get flock expenses error:', error);
      res.status(500).json({ 
        error: 'Failed to fetch flock expenses',
        message: error instanceof Error ? error.message : 'Unknown error occurred'
      });
    }
  }

  async getExpenseById(req: Request, res: Response): Promise<void> {
    try {
      const id = parseInt(req.params.id || '');
      if (isNaN(id)) {
        res.status(400).json({ 
          error: 'Invalid expense ID',
          message: 'Please provide a valid expense ID'
        });
        return;
      }
      
      const expense = await expenseRepository.findById(id);
      
      if (!expense) {
        res.status(404).json({ 
          error: 'Livestock expense not found',
          message: 'The requested livestock expense was not found'
        });
        return;
      }
      
      res.json({
        data: expense,
        message: 'Livestock expense retrieved successfully'
      });
    } catch (error) {
      console.error('Get livestock expense error:', error);
      res.status(500).json({ 
        error: 'Failed to fetch livestock expense',
        message: error instanceof Error ? error.message : 'Unknown error occurred'
      });
    }
  }

  async createExpense(req: Request, res: Response): Promise<void> {
    try {
      const expense = await expenseRepository.create(req.body);
      res.status(201).json({
        data: expense,
        message: 'Livestock expense created successfully'
      });
    } catch (error) {
      console.error('Create livestock expense error:', error);
      res.status(500).json({ 
        error: 'Failed to create livestock expense',
        message: error instanceof Error ? error.message : 'Unknown error occurred'
      });
    }
  }

  async updateExpense(req: Request, res: Response): Promise<void> {
    try {
      const id = parseInt(req.params.id || '');
      if (isNaN(id)) {
        res.status(400).json({ 
          error: 'Invalid expense ID',
          message: 'Please provide a valid expense ID'
        });
        return;
      }
      
      const expense = await expenseRepository.update(id, req.body);
      
      if (!expense) {
        res.status(404).json({ 
          error: 'Livestock expense not found',
          message: 'The requested livestock expense was not found'
        });
        return;
      }
      
      res.json({
        data: expense,
        message: 'Livestock expense updated successfully'
      });
    } catch (error) {
      console.error('Update livestock expense error:', error);
      res.status(500).json({ 
        error: 'Failed to update livestock expense',
        message: error instanceof Error ? error.message : 'Unknown error occurred'
      });
    }
  }

  async deleteExpense(req: Request, res: Response): Promise<void> {
    try {
      const id = parseInt(req.params.id || '');
      if (isNaN(id)) {
        res.status(400).json({ 
          error: 'Invalid expense ID',
          message: 'Please provide a valid expense ID'
        });
        return;
      }
      
      const deleted = await expenseRepository.delete(id);
      
      if (!deleted) {
        res.status(404).json({ 
          error: 'Livestock expense not found',
          message: 'The requested livestock expense was not found'
        });
        return;
      }
      
      res.json({ 
        message: 'Livestock expense deleted successfully',
        data: { deleted: true }
      });
    } catch (error) {
      console.error('Delete livestock expense error:', error);
      res.status(500).json({ 
        error: 'Failed to delete livestock expense',
        message: error instanceof Error ? error.message : 'Unknown error occurred'
      });
    }
  }

  async getExpenseSummary(req: Request, res: Response): Promise<void> {
    try {
      const summary = await expenseRepository.getExpenseSummary();
      res.json({
        data: summary,
        message: 'Expense summary retrieved successfully'
      });
    } catch (error) {
      console.error('Get livestock expense summary error:', error);
      res.status(500).json({ 
        error: 'Failed to fetch expense summary',
        message: error instanceof Error ? error.message : 'Unknown error occurred'
      });
    }
  }

  async getFlockExpenseSummary(req: Request, res: Response): Promise<void> {
    try {
      const summary = await expenseRepository.getFlockExpenseSummary();
      res.json({
        data: summary,
        message: 'Flock expense summary retrieved successfully'
      });
    } catch (error) {
      console.error('Get flock expense summary error:', error);
      res.status(500).json({ 
        error: 'Failed to fetch flock expense summary',
        message: error instanceof Error ? error.message : 'Unknown error occurred'
      });
    }
  }
}

// Make sure this export is at the end of the file
export default LivestockExpenseController;