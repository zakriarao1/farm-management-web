// backend/src/services/NotificationService.ts

import { pool } from '../config/database';

export class NotificationService {
  async checkUpcomingHarvests() {
    try {
      const upcomingHarvests = await pool.query(`
        SELECT 
          id,
          name,
          expected_harvest_date,
          status
        FROM crops 
        WHERE expected_harvest_date BETWEEN NOW() AND NOW() + INTERVAL '7 days'
          AND status IN ('PLANTED', 'GROWING', 'READY_FOR_HARVEST')
        ORDER BY expected_harvest_date ASC
      `);

      return upcomingHarvests.rows;
    } catch (error) {
      console.error('Check upcoming harvests error:', error);
      return [];
    }
  }

  async checkLowBudgetCrops(budgetThreshold: number = 100) {
    try {
      const lowBudgetCrops = await pool.query(`
        SELECT 
          id,
          name,
          total_expenses,
          (expected_yield * market_price) as projected_revenue
        FROM crops 
        WHERE (expected_yield * market_price - total_expenses) < $1
          AND status IN ('PLANTED', 'GROWING')
        ORDER BY (expected_yield * market_price - total_expenses) ASC
      `, [budgetThreshold]);

      return lowBudgetCrops.rows;
    } catch (error) {
      console.error('Check low budget crops error:', error);
      return [];
    }
  }
}