// backenc/src/routes/farmExpenses.ts
import { Router } from 'express';
import { FarmExpenseController } from '../controllers/FarmExpenseController';
import { authenticateToken } from '../middleware/auth';

const router = Router();
const expenseController = new FarmExpenseController();

// Basic CRUD operations
router.get('/', authenticateToken, (req, res) => {
  expenseController.getAllExpenses(req, res);
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

// Filtered queries
router.get('/type/:type', authenticateToken, (req, res) => {
  expenseController.getExpensesByType(req, res);
});

router.get('/flock/:flockId', authenticateToken, (req, res) => {
  expenseController.getExpensesByFlock(req, res);
});

// Reporting and analytics
router.get('/reports/summary', authenticateToken, (req, res) => {
  expenseController.getExpenseSummary(req, res);
});

router.get('/reports/monthly', authenticateToken, (req, res) => {
  expenseController.getMonthlySummary(req, res);
});

router.get('/reports/flock-summary', authenticateToken, (req, res) => {
  expenseController.getFlockExpenseSummary(req, res);
});

router.get('/reports/top-expenses', authenticateToken, (req, res) => {
  expenseController.getTopExpenses(req, res);
});

router.get('/reports/date-range', authenticateToken, (req, res) => {
  expenseController.getExpensesByDateRange(req, res);
});

router.get('/reports/suppliers', authenticateToken, (req, res) => {
  expenseController.getSupplierSummary(req, res);
});

export default router;