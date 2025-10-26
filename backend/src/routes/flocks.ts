// backend/src/routes/flocks.ts
import { Router } from 'express';
import { FlockController } from '../controllers/FlockController';
import { authenticateToken } from '../middleware/auth';

const router = Router();
const flockController = new FlockController();

// Flock routes
router.get('/', authenticateToken, (req, res) => {
  flockController.getAllFlocks(req, res);
});

router.get('/:id', authenticateToken, (req, res) => {
  flockController.getFlockById(req, res);
});

router.post('/', authenticateToken, (req, res) => {
  flockController.createFlock(req, res);
});

router.put('/:id', authenticateToken, (req, res) => {
  flockController.updateFlock(req, res);
});

router.delete('/:id', authenticateToken, (req, res) => {
  flockController.deleteFlock(req, res);
});

router.get('/:id/stats', authenticateToken, (req, res) => {
  flockController.getFlockStats(req, res);
});

export default router;