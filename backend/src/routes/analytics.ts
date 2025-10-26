import { Router } from 'express';
import { authenticateToken } from '../middleware/auth';
import { AnalyticsController } from '../controllers/AnalyticsController';

const router = Router();
const analyticsController = new AnalyticsController();

router.get('/', authenticateToken, (req, res) => {
  analyticsController.getAnalytics(req, res);
});

router.get('/realtime', authenticateToken, (req, res) => {
  analyticsController.getRealTimeData(req, res);
});

export default router;