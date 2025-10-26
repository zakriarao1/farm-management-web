import { Router } from 'express';
import { FinancialSummaryController } from '../controllers/FinancialSummaryController';
import { authenticateToken } from '../middleware/auth';

const router = Router();
const financialController = new FinancialSummaryController();

router.get('/flocks', authenticateToken, (req, res) => {
  financialController.getFlockFinancialSummary(req, res);
});

router.get('/animals', authenticateToken, (req, res) => {
  financialController.getAnimalFinancialSummary(req, res);
});

router.get('/flocks/:flockId/metrics', authenticateToken, (req, res) => {
  financialController.getFlockPerformanceMetrics(req, res);
});

export default router;