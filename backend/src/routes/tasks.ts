// backend/src/routes/tasks.ts

import { Router } from 'express';
import { TaskController } from '../controllers/TaskController';

const router = Router();
const taskController = new TaskController();

// POST /api/tasks - Create a new task
router.post('/', taskController.createTask);

// GET /api/tasks/upcoming - Get upcoming tasks
router.get('/upcoming', taskController.getUpcomingTasks);

// POST /api/tasks/generate-harvest-reminders - Generate harvest reminder tasks
router.post('/generate-harvest-reminders', taskController.generateHarvestReminders);

export default router;