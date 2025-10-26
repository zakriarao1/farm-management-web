import { pool } from '../config/database';

export interface ProductionRecord {
  id: number;
  livestock_id?: number;
  flock_id: number;
  product_type: string;
  quantity: number;
  unit: string;
  record_date: string;
  quality_notes?: string;
  sale_price?: number;
  created_at: string;
  updated_at: string;
}

export class ProductionRepository {
  async findAll(): Promise<ProductionRecord[]> {
    const query = `
      SELECT pr.*, l.identifier as animal_identifier, f.name as flock_name
      FROM production_records pr
      LEFT JOIN livestock l ON pr.livestock_id = l.id
      LEFT JOIN flocks f ON pr.flock_id = f.id
      ORDER BY pr.record_date DESC
    `;
    const result = await pool.query(query);
    return result.rows;
  }

  async findByFlockId(flockId: number): Promise<ProductionRecord[]> {
    const query = `
      SELECT pr.*, l.identifier as animal_identifier, f.name as flock_name
      FROM production_records pr
      LEFT JOIN livestock l ON pr.livestock_id = l.id
      LEFT JOIN flocks f ON pr.flock_id = f.id
      WHERE pr.flock_id = $1
      ORDER BY pr.record_date DESC
    `;
    const result = await pool.query(query, [flockId]);
    return result.rows;
  }

  async create(recordData: Omit<ProductionRecord, 'id' | 'created_at' | 'updated_at'>): Promise<ProductionRecord> {
    const {
      livestock_id,
      flock_id,
      product_type,
      quantity,
      unit,
      record_date,
      quality_notes,
      sale_price
    } = recordData;
    
    const query = `
      INSERT INTO production_records (
        livestock_id, flock_id, product_type, quantity, unit,
        record_date, quality_notes, sale_price, created_at, updated_at
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW(), NOW())
      RETURNING *
    `;
    
    const result = await pool.query(query, [
      livestock_id || null,
      flock_id,
      product_type,
      quantity,
      unit,
      record_date,
      quality_notes || null,
      sale_price || null
    ]);
    
    return result.rows[0];
  }

  async getProductionSummary(flockId?: number): Promise<any[]> {
    let query = `
      SELECT 
        product_type,
        unit,
        SUM(quantity) as total_quantity,
        SUM(COALESCE(sale_price, 0)) as total_revenue,
        COUNT(*) as record_count
      FROM production_records
    `;
    
    const params: any[] = [];
    
    if (flockId) {
      query += ' WHERE flock_id = $1';
      params.push(flockId);
    }
    
    query += ' GROUP BY product_type, unit ORDER BY total_revenue DESC';
    
    const result = await pool.query(query, params);
    return result.rows;
  }
}