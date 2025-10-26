// backend/src/routes/livestockExpenses.ts
import { Router } from 'express';
import { LivestockExpenseController } from '../controllers/LivestockExpenseController';
import { authenticateToken } from '../middleware/auth';

const router = Router();
const expenseController = new LivestockExpenseController();

// Livestock expense routes
router.get('/', authenticateToken, (req, res) => {
  expenseController.getAllExpenses(req, res);
});

router.get('/flock/:flockId', authenticateToken, (req, res) => {
  expenseController.getExpensesByFlock(req, res);
});

router.get('/:id', authenticateToken, (req, res) => {
  expenseController.getExpenseById(req, res);
});

router.post('/', authenticateToken, (req, res) => {
  expenseController.createExpense(req, res);
});

router.put('/:id', authenticateToken, (req, res) => {
  expenseController.updateExpense(req, res);
});

router.delete('/:id', authenticateToken, (req, res) => {
  expenseController.deleteExpense(req, res);
});

// Reporting routes
router.get('/reports/summary', authenticateToken, (req, res) => {
  expenseController.getExpenseSummary(req, res);
});

router.get('/reports/flock-summary', authenticateToken, (req, res) => {
  expenseController.getFlockExpenseSummary(req, res);
});

export default router;