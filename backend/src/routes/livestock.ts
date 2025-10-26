// backend/src/routes/livestock.ts
import { Router } from 'express';
import { LivestockController } from '../controllers/LivestockController';

const router = Router();
const livestockController = new LivestockController();

// Livestock CRUD routes
router.get('/', livestockController.getAll);
router.get('/:id', livestockController.getById);
router.post('/', livestockController.create);
router.put('/:id', livestockController.update);
router.delete('/:id', livestockController.delete);

// Health records routes
router.get('/:id/health-records', livestockController.getHealthRecords);
router.post('/:id/health-records', livestockController.addHealthRecord);

// Analytics routes (optional)
// router.get('/analytics/stats', livestockController.getStats);
// router.get('/analytics/health-alerts', livestockController.getHealthAlerts);

export default router;