// backend/src/routes/sales.ts
import { Router } from 'express';
import { SalesController } from '../controllers/SalesController';
import { authenticateToken } from '../middleware/auth';

const router = Router();
const salesController = new SalesController();

// Sales routes
router.post('/', authenticateToken, (req, res) => {
  salesController.recordSale(req, res);
});

router.get('/', authenticateToken, (req, res) => {
  salesController.getAllSales(req, res);
});

router.get('/summary', authenticateToken, (req, res) => {
  salesController.getSalesSummary(req, res);
});

router.delete('/:id', authenticateToken, (req, res) => {
  salesController.deleteSale(req, res);
});

export default router;