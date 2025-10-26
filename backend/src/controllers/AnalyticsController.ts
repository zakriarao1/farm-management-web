import { Request, Response } from 'express';
import { pool } from '../config/database';

export class AnalyticsController {
  async getAnalytics(req: Request, res: Response): Promise<void> {
    try {
      // Get basic farm analytics
      const queries = {
        totalCrops: 'SELECT COUNT(*) FROM crops WHERE status = $1',
        totalLivestock: 'SELECT COUNT(*) FROM livestock WHERE status = $1',
        totalExpenses: 'SELECT COALESCE(SUM(amount), 0) FROM farm_expenses WHERE date >= $1',
        upcomingTasks: 'SELECT COUNT(*) FROM tasks WHERE due_date BETWEEN $1 AND $2 AND status = $3'
      };

      const [cropsResult, livestockResult, expensesResult, tasksResult] = await Promise.all([
        pool.query(queries.totalCrops, ['active']),
        pool.query(queries.totalLivestock, ['active']),
        pool.query(queries.totalExpenses, [new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)]), // Last 30 days
        pool.query(queries.upcomingTasks, [new Date(), new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), 'pending'])
      ]);

      const analytics = {
        data: {
          total_crops: parseInt(cropsResult.rows[0].count),
          total_livestock: parseInt(livestockResult.rows[0].count),
          recent_expenses: parseFloat(expensesResult.rows[0].coalesce),
          upcoming_tasks: parseInt(tasksResult.rows[0].count),
          timestamp: new Date().toISOString()
        },
        message: 'Analytics retrieved successfully',
        success: true
      };

      res.json(analytics);
    } catch (error) {
      console.error('Get analytics error:', error);
      res.status(500).json({
        data: null,
        message: 'Failed to fetch analytics',
        success: false
      });
    }
  }

  async getRealTimeData(req: Request, res: Response): Promise<void> {
    try {
      // Simulate real-time data
      const realTimeData = {
        data: {
          system_health: 'optimal',
          last_update: new Date().toISOString(),
          active_users: 1,
          server_uptime: process.uptime(),
          memory_usage: process.memoryUsage(),
          alerts: []
        },
        message: 'Real-time data retrieved successfully',
        success: true
      };

      res.json(realTimeData);
    } catch (error) {
      console.error('Get real-time data error:', error);
      res.status(500).json({
        data: null,
        message: 'Failed to fetch real-time data',
        success: false
      });
    }
  }
}