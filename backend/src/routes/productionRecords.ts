import { Router } from 'express';
import { ProductionController } from '../controllers/ProductionController';
import { authenticateToken } from '../middleware/auth';

const router = Router();
const productionController = new ProductionController();

router.get('/', authenticateToken, (req, res) => {
  productionController.getAllProductionRecords(req, res);
});

router.get('/flock/:flockId', authenticateToken, (req, res) => {
  productionController.getProductionRecordsByFlock(req, res);
});

router.get('/summary', authenticateToken, (req, res) => {
  productionController.getProductionSummary(req, res);
});

router.post('/', authenticateToken, (req, res) => {
  productionController.createProductionRecord(req, res);
});

export default router;