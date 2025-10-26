// backend/src/repositories/FlockRepository.ts
import { pool } from '../config/database';

export interface Flock {
  id: number;
  name: string;
  description?: string;
  purchase_date?: string;
  total_purchase_cost?: number;
  created_at: string;
  updated_at: string;
}

export class FlockRepository {
  async findAll(): Promise<Flock[]> {
    const result = await pool.query('SELECT * FROM flocks ORDER BY name');
    return result.rows;
  }

  async findById(id: number): Promise<Flock | null> {
    const result = await pool.query('SELECT * FROM flocks WHERE id = $1', [id]);
    return result.rows[0] || null;
  }

  async create(flockData: Omit<Flock, 'id' | 'created_at' | 'updated_at'>): Promise<Flock> {
    const { name, description, purchase_date, total_purchase_cost } = flockData;
    
    const query = `
      INSERT INTO flocks (name, description, purchase_date, total_purchase_cost, created_at, updated_at)
      VALUES ($1, $2, $3, $4, NOW(), NOW())
      RETURNING *
    `;
    
    const result = await pool.query(query, [
      name, 
      description || null, 
      purchase_date || null, 
      total_purchase_cost || null
    ]);
    
    return result.rows[0];
  }

  async update(id: number, flockData: Partial<Flock>): Promise<Flock | null> {
    const { name, description, purchase_date, total_purchase_cost } = flockData;
    
    const query = `
      UPDATE flocks 
      SET name = COALESCE($1, name),
          description = COALESCE($2, description),
          purchase_date = COALESCE($3, purchase_date),
          total_purchase_cost = COALESCE($4, total_purchase_cost),
          updated_at = NOW()
      WHERE id = $5
      RETURNING *
    `;
    
    const result = await pool.query(query, [
      name, 
      description, 
      purchase_date, 
      total_purchase_cost, 
      id
    ]);
    
    return result.rows[0] || null;
  }

  async delete(id: number): Promise<boolean> {
    const result = await pool.query('DELETE FROM flocks WHERE id = $1', [id]);
    return (result.rowCount?? 0)> 0;
  }

  async getFlockStats(flockId: number): Promise<any> {
    const query = `
      SELECT 
        f.*,
        COUNT(l.id) as animal_count,
        COALESCE(SUM(le.amount), 0) as total_expenses
      FROM flocks f
      LEFT JOIN livestock l ON f.id = l.flock_id
      LEFT JOIN livestock_expenses le ON f.id = le.flock_id
      WHERE f.id = $1
      GROUP BY f.id
    `;
    
    const result = await pool.query(query, [flockId]);
    return result.rows[0] || null;
  }
}