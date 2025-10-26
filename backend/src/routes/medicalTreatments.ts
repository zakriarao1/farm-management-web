import { Router } from 'express';
import { MedicalTreatmentController } from '../controllers/MedicalTreatmentController.js';
import { authenticateToken } from '../middleware/auth';

const router = Router();

// Use the controller methods directly (no 'new' needed)
router.get('/', authenticateToken, MedicalTreatmentController.getAllMedicalTreatments);
router.get('/livestock/:livestockId', authenticateToken, MedicalTreatmentController.getMedicalTreatmentsByLivestock);
router.get('/upcoming', authenticateToken, MedicalTreatmentController.getUpcomingMedicalTreatments);
router.post('/', authenticateToken, MedicalTreatmentController.createMedicalTreatment);
router.put('/:id', authenticateToken, MedicalTreatmentController.updateMedicalTreatment);
router.delete('/:id', authenticateToken, MedicalTreatmentController.deleteMedicalTreatment);

export default router;