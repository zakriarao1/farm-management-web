// backend/src/routes/reports.ts

import { Router } from 'express';
import { ReportController } from '../controllers/ReportController';

const router = Router();
const reportController = new ReportController();

router.get('/analytics', reportController.getFarmAnalytics);
router.get('/crop-performance/:cropId', reportController.getCropPerformance);
router.get('/financial', reportController.getFinancialReport);
router.get('/expenses/recent', reportController.getRecentExpenses); // Use the instance method

export default router;