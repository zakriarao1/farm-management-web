// backend/src/repositories/LivestockRepository.ts
import { pool } from '../config/database';

export interface Livestock {
  id: number;
  flock_id: number;
  identifier: string;
  species: string;
  breed?: string;
  date_of_birth?: string;
  gender: 'male' | 'female' | 'unknown';
  status: 'active' | 'sold' | 'deceased' | 'transferred';
  purchase_price?: number;
  purchase_date?: string;
  sale_price?: number;
  sale_date?: string;
  sale_reason?: string;
  weight_at_purchase?: number;
  current_weight?: number;
  created_at: string;
  updated_at: string;
}

export class LivestockRepository {
  async findAll(): Promise<Livestock[]> {
    const query = `
      SELECT l.*, f.name as flock_name
      FROM livestock l
      LEFT JOIN flocks f ON l.flock_id = f.id
      ORDER BY l.created_at DESC
    `;
    const result = await pool.query(query);
    return result.rows;
  }

  async findById(id: number): Promise<Livestock | null> {
    const query = `
      SELECT l.*, f.name as flock_name
      FROM livestock l
      LEFT JOIN flocks f ON l.flock_id = f.id
      WHERE l.id = $1
    `;
    const result = await pool.query(query, [id]);
    return result.rows[0] || null;
  }

  async findByFlockId(flockId: number): Promise<Livestock[]> {
    const query = `
      SELECT l.*, f.name as flock_name
      FROM livestock l
      LEFT JOIN flocks f ON l.flock_id = f.id
      WHERE l.flock_id = $1
      ORDER BY l.identifier
    `;
    const result = await pool.query(query, [flockId]);
    return result.rows;
  }

  async create(livestockData: Omit<Livestock, 'id' | 'created_at' | 'updated_at'>): Promise<Livestock> {
    const {
      flock_id,
      identifier,
      species,
      breed,
      date_of_birth,
      gender,
      status,
      purchase_price,
      purchase_date,
      sale_price,
      sale_date,
      sale_reason,
      weight_at_purchase,
      current_weight
    } = livestockData;
    
    const query = `
      INSERT INTO livestock (
        flock_id, identifier, species, breed, date_of_birth, gender, status,
        purchase_price, purchase_date, sale_price, sale_date, sale_reason,
        weight_at_purchase, current_weight, created_at, updated_at
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, NOW(), NOW())
      RETURNING *
    `;
    
    const result = await pool.query(query, [
      flock_id,
      identifier,
      species,
      breed || null,
      date_of_birth || null,
      gender,
      status,
      purchase_price || null,
      purchase_date || null,
      sale_price || null,
      sale_date || null,
      sale_reason || null,
      weight_at_purchase || null,
      current_weight || null
    ]);
    
    return result.rows[0];
  }

  async update(id: number, livestockData: Partial<Livestock>): Promise<Livestock | null> {
    const {
      flock_id,
      identifier,
      species,
      breed,
      date_of_birth,
      gender,
      status,
      purchase_price,
      purchase_date,
      sale_price,
      sale_date,
      sale_reason,
      weight_at_purchase,
      current_weight
    } = livestockData;
    
    const query = `
      UPDATE livestock 
      SET flock_id = COALESCE($1, flock_id),
          identifier = COALESCE($2, identifier),
          species = COALESCE($3, species),
          breed = COALESCE($4, breed),
          date_of_birth = COALESCE($5, date_of_birth),
          gender = COALESCE($6, gender),
          status = COALESCE($7, status),
          purchase_price = COALESCE($8, purchase_price),
          purchase_date = COALESCE($9, purchase_date),
          sale_price = COALESCE($10, sale_price),
          sale_date = COALESCE($11, sale_date),
          sale_reason = COALESCE($12, sale_reason),
          weight_at_purchase = COALESCE($13, weight_at_purchase),
          current_weight = COALESCE($14, current_weight),
          updated_at = NOW()
      WHERE id = $15
      RETURNING *
    `;
    
    const result = await pool.query(query, [
      flock_id,
      identifier,
      species,
      breed,
      date_of_birth,
      gender,
      status,
      purchase_price,
      purchase_date,
      sale_price,
      sale_date,
      sale_reason,
      weight_at_purchase,
      current_weight,
      id
    ]);
    
    return result.rows[0] || null;
  }

  async delete(id: number): Promise<boolean> {
    const result = await pool.query('DELETE FROM livestock WHERE id = $1', [id]);
    return (result.rowCount?? 0)> 0;
  }

  async recordSale(id: number, saleData: { 
    sale_price: number; 
    sale_date: string; 
    sale_reason?: string; 
  }): Promise<Livestock | null> {
    const { sale_price, sale_date, sale_reason } = saleData;
    
    const query = `
      UPDATE livestock 
      SET sale_price = $1,
          sale_date = $2,
          sale_reason = $3,
          status = 'sold',
          updated_at = NOW()
      WHERE id = $4
      RETURNING *
    `;
    
    const result = await pool.query(query, [
      sale_price,
      sale_date,
      sale_reason || null,
      id
    ]);
    
    return result.rows[0] || null;
  }

  async updateWeight(id: number, currentWeight: number): Promise<Livestock | null> {
    const query = `
      UPDATE livestock 
      SET current_weight = $1,
          updated_at = NOW()
      WHERE id = $2
      RETURNING *
    `;
    
    const result = await pool.query(query, [currentWeight, id]);
    return result.rows[0] || null;
  }

  async getAnimalFinancials(animalId: number): Promise<any> {
    const query = `
      SELECT 
        l.*,
        f.name as flock_name,
        COALESCE(SUM(le.amount), 0) as total_expenses,
        COALESCE(SUM(mt.cost), 0) as total_medical_costs,
        COALESCE(SUM(pr.sale_price), 0) as total_production_revenue,
        (COALESCE(l.sale_price, 0) + COALESCE(SUM(pr.sale_price), 0) - 
         COALESCE(l.purchase_price, 0) - COALESCE(SUM(le.amount), 0) - COALESCE(SUM(mt.cost), 0)) as net_profit_loss,
        CASE 
          WHEN l.purchase_date IS NOT NULL THEN 
            EXTRACT(DAYS FROM COALESCE(l.sale_date, CURRENT_DATE) - l.purchase_date)
          ELSE 0 
        END as days_owned
      FROM livestock l
      LEFT JOIN flocks f ON l.flock_id = f.id
      LEFT JOIN livestock_expenses le ON l.id = le.livestock_id
      LEFT JOIN medical_treatments mt ON l.id = mt.livestock_id
      LEFT JOIN production_records pr ON l.id = pr.livestock_id
      WHERE l.id = $1
      GROUP BY l.id, f.name
    `;
    
    const result = await pool.query(query, [animalId]);
    return result.rows[0] || null;
  }

  async getFlockPurchaseSummary(flockId: number): Promise<any> {
    const query = `
      SELECT 
        f.id as flock_id,
        f.name as flock_name,
        COUNT(l.id) as animal_count,
        COALESCE(SUM(l.purchase_price), 0) as total_purchase_cost,
        COALESCE(AVG(l.purchase_price), 0) as average_purchase_price,
        COUNT(CASE WHEN l.status = 'sold' THEN 1 END) as sold_animals,
        COUNT(CASE WHEN l.status = 'active' THEN 1 END) as active_animals,
        COALESCE(SUM(l.sale_price), 0) as total_sale_revenue
      FROM flocks f
      LEFT JOIN livestock l ON f.id = l.flock_id
      WHERE f.id = $1
      GROUP BY f.id, f.name
    `;
    
    const result = await pool.query(query, [flockId]);
    return result.rows[0] || null;
  }

  async getLivestockByStatus(status: string): Promise<Livestock[]> {
    const query = `
      SELECT l.*, f.name as flock_name
      FROM livestock l
      LEFT JOIN flocks f ON l.flock_id = f.id
      WHERE l.status = $1
      ORDER BY l.created_at DESC
    `;
    const result = await pool.query(query, [status]);
    return result.rows;
  }

  async getActiveLivestock(): Promise<Livestock[]> {
    return this.getLivestockByStatus('active');
  }

  async getSoldLivestock(): Promise<Livestock[]> {
    return this.getLivestockByStatus('sold');
  }

  async searchLivestock(query: string): Promise<Livestock[]> {
    const searchQuery = `
      SELECT l.*, f.name as flock_name
      FROM livestock l
      LEFT JOIN flocks f ON l.flock_id = f.id
      WHERE l.identifier ILIKE $1 
         OR l.species ILIKE $1 
         OR l.breed ILIKE $1
         OR f.name ILIKE $1
      ORDER BY l.identifier
    `;
    const result = await pool.query(searchQuery, [`%${query}%`]);
    return result.rows;
  }

  async getSpeciesSummary(): Promise<any[]> {
    const query = `
      SELECT 
        species,
        COUNT(*) as animal_count,
        COALESCE(SUM(purchase_price), 0) as total_purchase_cost,
        COALESCE(SUM(sale_price), 0) as total_sale_revenue,
        COUNT(CASE WHEN status = 'active' THEN 1 END) as active_animals,
        COUNT(CASE WHEN status = 'sold' THEN 1 END) as sold_animals
      FROM livestock
      GROUP BY species
      ORDER BY animal_count DESC
    `;
    const result = await pool.query(query);
    return result.rows;
  }

  async getGenderSummary(): Promise<any[]> {
    const query = `
      SELECT 
        gender,
        COUNT(*) as animal_count,
        COALESCE(SUM(purchase_price), 0) as total_purchase_cost
      FROM livestock
      GROUP BY gender
      ORDER BY animal_count DESC
    `;
    const result = await pool.query(query);
    return result.rows;
  }

  async getRecentPurchases(days: number = 30): Promise<Livestock[]> {
    const query = `
      SELECT l.*, f.name as flock_name
      FROM livestock l
      LEFT JOIN flocks f ON l.flock_id = f.id
      WHERE l.purchase_date >= CURRENT_DATE - INTERVAL '${days} days'
      ORDER BY l.purchase_date DESC
    `;
    const result = await pool.query(query);
    return result.rows;
  }

  async getRecentSales(days: number = 30): Promise<Livestock[]> {
    const query = `
      SELECT l.*, f.name as flock_name
      FROM livestock l
      LEFT JOIN flocks f ON l.flock_id = f.id
      WHERE l.sale_date >= CURRENT_DATE - INTERVAL '${days} days'
      ORDER BY l.sale_date DESC
    `;
    const result = await pool.query(query);
    return result.rows;
  }

  async getWeightGainSummary(flockId?: number): Promise<any[]> {
    let query = `
      SELECT 
        l.id,
        l.identifier,
        l.species,
        l.breed,
        l.weight_at_purchase,
        l.current_weight,
        l.purchase_date,
        f.name as flock_name,
        CASE 
          WHEN l.weight_at_purchase > 0 AND l.current_weight > 0 THEN
            l.current_weight - l.weight_at_purchase
          ELSE 0
        END as weight_gain,
        CASE 
          WHEN l.weight_at_purchase > 0 AND l.current_weight > 0 THEN
            ((l.current_weight - l.weight_at_purchase) / l.weight_at_purchase) * 100
          ELSE 0
        END as weight_gain_percentage
      FROM livestock l
      LEFT JOIN flocks f ON l.flock_id = f.id
      WHERE l.weight_at_purchase IS NOT NULL 
        AND l.current_weight IS NOT NULL
        AND l.weight_at_purchase > 0
        AND l.current_weight > 0
    `;
    
    const params: any[] = [];
    
    if (flockId) {
      query += ' AND l.flock_id = $1';
      params.push(flockId);
    }
    
    query += ' ORDER BY weight_gain_percentage DESC';
    
    const result = await pool.query(query, params);
    return result.rows;
  }

  async getIdentifierExists(identifier: string, excludeId?: number): Promise<boolean> {
    let query = 'SELECT COUNT(*) as count FROM livestock WHERE identifier = $1';
    const params: any[] = [identifier];
    
    if (excludeId) {
      query += ' AND id != $2';
      params.push(excludeId);
    }
    
    const result = await pool.query(query, params);
    return parseInt(result.rows[0].count) > 0;
  }

  async getFlockAnimalCount(flockId: number): Promise<number> {
    const query = 'SELECT COUNT(*) as count FROM livestock WHERE flock_id = $1';
    const result = await pool.query(query, [flockId]);
    return parseInt(result.rows[0].count);
  }

  async getFlockSpeciesDistribution(flockId: number): Promise<any[]> {
    const query = `
      SELECT 
        species,
        COUNT(*) as animal_count,
        COUNT(CASE WHEN gender = 'male' THEN 1 END) as males,
        COUNT(CASE WHEN gender = 'female' THEN 1 END) as females
      FROM livestock
      WHERE flock_id = $1
      GROUP BY species
      ORDER BY animal_count DESC
    `;
    const result = await pool.query(query, [flockId]);
    return result.rows;
  }

  async getMonthlyPurchaseSummary(year: number): Promise<any[]> {
    const query = `
      SELECT 
        EXTRACT(MONTH FROM purchase_date) as month,
        COUNT(*) as purchase_count,
        COALESCE(SUM(purchase_price), 0) as total_purchase_cost
      FROM livestock
      WHERE EXTRACT(YEAR FROM purchase_date) = $1
        AND purchase_date IS NOT NULL
      GROUP BY EXTRACT(MONTH FROM purchase_date)
      ORDER BY month
    `;
    const result = await pool.query(query, [year]);
    return result.rows;
  }

  async getMonthlySaleSummary(year: number): Promise<any[]> {
    const query = `
      SELECT 
        EXTRACT(MONTH FROM sale_date) as month,
        COUNT(*) as sale_count,
        COALESCE(SUM(sale_price), 0) as total_sale_revenue
      FROM livestock
      WHERE EXTRACT(YEAR FROM sale_date) = $1
        AND sale_date IS NOT NULL
      GROUP BY EXTRACT(MONTH FROM sale_date)
      ORDER BY month
    `;
    const result = await pool.query(query, [year]);
    return result.rows;
  }
}