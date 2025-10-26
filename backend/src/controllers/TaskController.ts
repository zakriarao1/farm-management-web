// backend/src/controllers/TaskController.ts

import { Request, Response } from 'express';
import { pool } from '../config/database';

export class TaskController {
  async createTask(req: Request, res: Response) {
    try {
      const { title, description, taskType, cropId, dueDate, priority, assignedTo } = req.body;

      const result = await pool.query(
        `INSERT INTO tasks (title, description, task_type, crop_id, due_date, priority, assigned_to) 
         VALUES ($1, $2, $3, $4, $5, $6, $7) 
         RETURNING *`,
        [title, description, taskType, cropId, dueDate, priority, assignedTo]
      );

      res.status(201).json({
        message: 'Task created successfully',
        data: result.rows[0]
      });
    } catch (error) {
      console.error('Create task error:', error);
      res.status(500).json({ error: 'Failed to create task' });
    }
  }

  async getUpcomingTasks(req: Request, res: Response) {
    try {
      const { days = 7 } = req.query;

      const tasks = await pool.query(`
        SELECT 
          t.*,
          c.name as crop_name,
          c.type as crop_type,
          (t.due_date - CURRENT_DATE) as days_until_due
        FROM tasks t
        LEFT JOIN crops c ON t.crop_id = c.id
        WHERE t.status = 'PENDING'
        AND t.due_date BETWEEN CURRENT_DATE AND CURRENT_DATE + $1::integer
        ORDER BY t.due_date ASC, t.priority DESC
      `, [days]);

      res.json({
        message: 'Upcoming tasks retrieved successfully',
        data: tasks.rows
      });
    } catch (error) {
      console.error('Get upcoming tasks error:', error);
      res.status(500).json({ error: 'Failed to fetch upcoming tasks' });
    }
  }

  async generateHarvestReminders(req: Request, res: Response) {
    try {
      // Find crops that are approaching harvest date
      const harvestReminders = await pool.query(`
        SELECT 
          c.*,
          (c.expected_harvest_date - CURRENT_DATE) as days_until_harvest
        FROM crops c
        WHERE c.status IN ('PLANTED', 'GROWING')
        AND c.expected_harvest_date IS NOT NULL
        AND c.expected_harvest_date BETWEEN CURRENT_DATE AND CURRENT_DATE + 14
        ORDER BY c.expected_harvest_date ASC
      `);

      // Create tasks for harvest reminders
      for (const crop of harvestReminders.rows) {
        await pool.query(
          `INSERT INTO tasks (title, description, task_type, crop_id, due_date, priority) 
           VALUES ($1, $2, $3, $4, $5, $6) 
           ON CONFLICT DO NOTHING`,
          [
            `Harvest ${crop.name}`,
            `Crop ${crop.name} (${crop.type}) is ready for harvest in ${crop.days_until_harvest} days`,
            'HARVEST',
            crop.id,
            crop.expected_harvest_date,
            'HIGH'
          ]
        );
      }

      res.json({
        message: 'Harvest reminders generated successfully',
        data: {
          remindersCreated: harvestReminders.rows.length,
          crops: harvestReminders.rows
        }
      });
    } catch (error) {
      console.error('Generate harvest reminders error:', error);
      res.status(500).json({ error: 'Failed to generate harvest reminders' });
    }
  }
}