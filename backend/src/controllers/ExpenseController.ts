import { Request, Response } from 'express';
import { expenseRepository } from '../repositories/ExpenseRepository';

export class ExpenseController {
  async getExpensesByCrop(req: Request, res: Response) {
    try {
      const cropId = parseInt(req.params.cropId || '0');
      
      if (cropId === 0) {
        return res.status(400).json({ error: 'Invalid crop ID' });
      }

      const expenses = await expenseRepository.findByCropId(cropId);
      return res.json(expenses);
    } catch (error) {
      console.error('Error fetching expenses:', error);
      return res.status(500).json({ error: 'Failed to fetch expenses' });
    }
  }
async getAllExpenses(req: Request, res: Response) {
    try {
      const expenses = await expenseRepository.findAll();
      return res.json({
        success: true,
        data: expenses,
        count: expenses.length
      });
    } catch (error) {
      console.error('Error fetching all expenses:', error);
      return res.status(500).json({ 
        success: false,
        error: 'Failed to fetch expenses' 
      });
    }
  }
  async createExpense(req: Request, res: Response) {
    try {
      const expenseData = req.body;
      const expense = await expenseRepository.create(expenseData);
      return res.status(201).json(expense);
    } catch (error) {
      console.error('Error creating expense:', error);
      return res.status(500).json({ error: 'Failed to create expense' });
    }
  }

  async updateExpense(req: Request, res: Response) {
    try {
      const id = parseInt(req.params.id || '0');
      
      if (id === 0) {
        return res.status(400).json({ error: 'Invalid expense ID' });
      }

      const expenseData = req.body;
      const expense = await expenseRepository.update(id, expenseData);
      
      if (!expense) {
        return res.status(404).json({ error: 'Expense not found' });
      }
      
      return res.json(expense);
    } catch (error) {
      console.error('Error updating expense:', error);
      return res.status(500).json({ error: 'Failed to update expense' });
    }
  }

  async deleteExpense(req: Request, res: Response) {
    try {
      const id = req.params.id; // Keep as string since your delete method expects string
      
      if (!id) {
        return res.status(400).json({ error: 'Expense ID is required' });
      }

      const success = await expenseRepository.delete(id);
      
      if (!success) {
        return res.status(404).json({ error: 'Expense not found' });
      }
      
      return res.status(204).send();
    } catch (error) {
      console.error('Error deleting expense:', error);
      return res.status(500).json({ error: 'Failed to delete expense' });
    }
  }
}