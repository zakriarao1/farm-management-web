// backend/src/controllers/FarmExpenseController.ts
import { Request, Response } from 'express';
import { FarmExpenseRepository } from '../repositories/FarmExpenseRepository';

const expenseRepository = new FarmExpenseRepository();

export class FarmExpenseController {
  async getAllExpenses(req: Request, res: Response): Promise<void> {
    try {
      const expenses = await expenseRepository.findAll();
      res.json(expenses);
    } catch (error) {
      console.error('Get farm expenses error:', error);
      res.status(500).json({ error: 'Failed to fetch farm expenses' });
    }
  }

  async getExpenseById(req: Request, res: Response): Promise<void> {
    try {
      const id = parseInt(req.params.id || '');
      if (isNaN(id)) {
        res.status(400).json({ error: 'Invalid expense ID' });
        return;
      }
      
      const expense = await expenseRepository.findById(id);
      
      if (!expense) {
        res.status(404).json({ error: 'Expense not found' });
        return;
      }
      
      res.json(expense);
    } catch (error) {
      console.error('Get expense error:', error);
      res.status(500).json({ error: 'Failed to fetch expense' });
    }
  }

  async getExpensesByType(req: Request, res: Response): Promise<void> {
    try {
      const { type } = req.params;
const expenses = await expenseRepository.findByType(type || '');
      res.json(expenses);
    } catch (error) {
      console.error('Get expenses by type error:', error);
      res.status(500).json({ error: 'Failed to fetch expenses' });
    }
  }

  async getExpensesByFlock(req: Request, res: Response): Promise<void> {
    try {
      const flockId = parseInt(req.params.flockId || '');
      if (isNaN(flockId)) {
        res.status(400).json({ error: 'Invalid flock ID' });
        return;
      }
      
      const expenses = await expenseRepository.findByFlockId(flockId);
      res.json(expenses);
    } catch (error) {
      console.error('Get flock expenses error:', error);
      res.status(500).json({ error: 'Failed to fetch flock expenses' });
    }
  }

  async createExpense(req: Request, res: Response): Promise<void> {
    try {
      const expense = await expenseRepository.create(req.body);
      res.status(201).json(expense);
    } catch (error) {
      console.error('Create expense error:', error);
      res.status(500).json({ error: 'Failed to create expense' });
    }
  }

  async updateExpense(req: Request, res: Response): Promise<void> {
    try {
      const id = parseInt(req.params.id || '');
      if (isNaN(id)) {
        res.status(400).json({ error: 'Invalid expense ID' });
        return;
      }
      
      const expense = await expenseRepository.update(id, req.body);
      
      if (!expense) {
        res.status(404).json({ error: 'Expense not found' });
        return;
      }
      
      res.json(expense);
    } catch (error) {
      console.error('Update expense error:', error);
      res.status(500).json({ error: 'Failed to update expense' });
    }
  }

  async deleteExpense(req: Request, res: Response): Promise<void> {
    try {
      const id = parseInt(req.params.id || '');
      if (isNaN(id)) {
        res.status(400).json({ error: 'Invalid expense ID' });
        return;
      }
      
      const deleted = await expenseRepository.delete(id);
      
      if (!deleted) {
        res.status(404).json({ error: 'Expense not found' });
        return;
      }
      
      res.json({ message: 'Expense deleted successfully' });
    } catch (error) {
      console.error('Delete expense error:', error);
      res.status(500).json({ error: 'Failed to delete expense' });
    }
  }

  async getExpenseSummary(req: Request, res: Response): Promise<void> {
    try {
      const summary = await expenseRepository.getExpenseSummary();
      res.json(summary);
    } catch (error) {
      console.error('Get expense summary error:', error);
      res.status(500).json({ error: 'Failed to fetch expense summary' });
    }
  }

  async getMonthlySummary(req: Request, res: Response): Promise<void> {
    try {
      const year = req.query.year ? parseInt(req.query.year as string) : undefined;
      const summary = await expenseRepository.getMonthlyExpenseSummary(year);
      res.json(summary);
    } catch (error) {
      console.error('Get monthly summary error:', error);
      res.status(500).json({ error: 'Failed to fetch monthly summary' });
    }
  }

  async getFlockExpenseSummary(req: Request, res: Response): Promise<void> {
    try {
      const flockId = req.query.flockId ? parseInt(req.query.flockId as string) : undefined;
      const summary = await expenseRepository.getFlockExpenseSummary(flockId);
      res.json(summary);
    } catch (error) {
      console.error('Get flock expense summary error:', error);
      res.status(500).json({ error: 'Failed to fetch flock expense summary' });
    }
  }

  async getTopExpenses(req: Request, res: Response): Promise<void> {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;
      const expenses = await expenseRepository.getTopExpenses(limit);
      res.json(expenses);
    } catch (error) {
      console.error('Get top expenses error:', error);
      res.status(500).json({ error: 'Failed to fetch top expenses' });
    }
  }

  async getExpensesByDateRange(req: Request, res: Response): Promise<void> {
    try {
      const { startDate, endDate } = req.query;
      
      if (!startDate || !endDate) {
        res.status(400).json({ error: 'Start date and end date are required' });
        return;
      }
      
      const expenses = await expenseRepository.getExpensesByDateRange(
        startDate as string, 
        endDate as string
      );
      res.json(expenses);
    } catch (error) {
      console.error('Get expenses by date range error:', error);
      res.status(500).json({ error: 'Failed to fetch expenses' });
    }
  }

  async getSupplierSummary(req: Request, res: Response): Promise<void> {
    try {
      const summary = await expenseRepository.getSupplierSummary();
      res.json(summary);
    } catch (error) {
      console.error('Get supplier summary error:', error);
      res.status(500).json({ error: 'Failed to fetch supplier summary' });
    }
  }
}