// backend/src/routes/expenses.ts

import { Router } from 'express';
import { ExpenseController } from '../controllers/ExpenseController';
import { Expense } from '../models/Expense'; // Adjust import path as needed
import { authenticateToken } from '../middleware/auth'; // Add this import

const router = Router();
const expenseController = new ExpenseController();

// Expense routes
router.get('/', authenticateToken, expenseController.getAllExpenses);
router.post('/, authenticateToken', expenseController.createExpense);
router.put('/:id', authenticateToken, expenseController.updateExpense);
router.delete('/:id', authenticateToken, expenseController.deleteExpense);

// Simple test route
router.get('/test', authenticateToken, (req, res) => {
  res.json({ message: 'Expenses router test route working!' });
});
router.get('/recent', authenticateToken, async (req, res) => {
  try {
    // Return recent expenses (last 30 days or limit to 10)
    const recentExpenses: Expense[] = []; // Your implementation
    res.json({ data: recentExpenses, message: 'Recent expenses' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch recent expenses' });
  }
});
export default router;