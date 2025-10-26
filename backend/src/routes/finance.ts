// backend/src/routes/finance.ts

import { Router } from 'express';
import { FinancialController } from '../controllers/FinancialController';

const router = Router();
const financeController = new FinancialController();

router.get('/profit-loss', financeController.getProfitLossReport);
router.get('/roi-analysis', financeController.getROIAnalysis);

export default router;