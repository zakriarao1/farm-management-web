// frontend/src/livestock/services/types/index.ts

export type LivestockType = 'CHICKENS' | 'GOATS' | 'SHEEP' | 'COWS' | 'BUFFALOES' | 'DUCKS' | 'TURKEYS' | 'QUAILS' | 'RABBITS' | 'FISH' | 'BEES' | 'OTHER';

export type LivestockStatus = 'HEALTHY' | 'SICK' | 'PREGNANT' | 'SOLD' | 'DECEASED';

export type LivestockGender = 'MALE' | 'FEMALE' | 'UNKNOWN';



export interface BreedingRecord {
  id: number;
  livestock_id: number;
  breeding_date: string;
  expected_birth_date?: string;
  actual_birth_date?: string;
  offspring_count?: number;
  notes?: string;
  status: 'PREGNANT' | 'SUCCESSFUL' | 'FAILED' | 'COMPLETED';
  created_at: string;
  updated_at: string;
}

export interface MilkProduction {
  id: number;
  livestock_id: number;
  date: string;
  morning_yield: number;
  evening_yield: number;
  total_yield: number;
  quality_notes?: string;
  created_at: string;
  updated_at: string;
}

export interface Livestock {
  id: number;
  tag_number: string;
  animal_type: string;
  breed?: string;
  gender: LivestockGender;
  date_of_birth?: string;
  purchase_date?: string;
  purchase_price?: number;
  current_weight?: number;
  status: LivestockStatus;
  location?: string;
  notes?: string;
  flock_id?: number;
  created_at: string;
  updated_at: string;
  
  // For display purposes only
  flock_name?: string;
}

export interface CreateLivestockRequest {
  tag_number: string;
  animal_type: string;
  breed?: string;
  gender: LivestockGender;
  date_of_birth?: string;
  purchase_date?: string;
  purchase_price?: number;
  current_weight?: number;
  status: LivestockStatus;
  location?: string;
  notes?: string;
  flock_id?: number;
}

export interface UpdateLivestockRequest {
  tag_number?: string;
  animal_type?: string;
  breed?: string;
  gender?: LivestockGender;
  date_of_birth?: string;
  purchase_date?: string;
  purchase_price?: number;
  current_weight?: number;
  status?: LivestockStatus;
  location?: string;
  notes?: string;
  flock_id?: number;
}

export interface Flock {
  id: number;
  name: string;
  animal_type: string;
  breed?: string;
  total_animals: number;
  current_animals: number;
  purchase_date?: string;
  purchase_price?: number;
  description?: string;
  created_at: string;
  updated_at: string;
}

export interface LivestockExpense {
  id: number;
  flock_id: number;
  livestock_id?: number;
  description: string;
  category: string;
  amount: number;
  date: string;
  notes?: string;
  created_at: string;
  updated_at: string;
  flock_name?: string;
}

export interface CreateLivestockExpenseRequest {
  flock_id: number;
  livestock_id?: number;
  description: string;
  category: string;
  amount: number;
  date: string;
  notes?: string;
}
export interface FlockFinancialData {
  id: number;
  name: string;
  animal_type: string;
  total_animals: number;
  active_animals: number;
  sold_animals: number;
  deceased_animals: number;
  livestock_investment: number;
  sales_revenue: number;
  total_expenses: number;
  net_profit: number;
  roi_percentage: number;
}

export interface FlockFinancialSummary {
  flock_id: number;
  flock_name: string;
  total_purchase_cost: number;
  total_expenses: number;
  total_sales: number;
  net_profit: number;
  roi_percentage: number;
  total_animals?: number;
  sold_animals?: number;
  active_animals?: number;
  total_sale_revenue?: number;
}
export interface LivestockExpense {
  id: number;
  flock_id: number;
  livestock_id?: number;
  description: string;
  category: string;
  amount: number;
  date: string;
  notes?: string;
  created_at: string;
  updated_at: string;
  flock_name?: string;
  animal_identifier?: string;
}

export interface CreateLivestockExpenseRequest {
  flock_id: number;
  livestock_id?: number;
  description: string;
  category: string;
  amount: number;
  date: string;
  notes?: string;
}

export interface UpdateLivestockExpenseRequest {
  flock_id?: number;
  livestock_id?: number;
  description?: string;
  category?: string;
  amount?: number;
  date?: string;
  notes?: string;
}

export interface FlockExpenseSummary {
  flock_id: number;
  flock_name: string;
  total_expenses: number;
  animal_count: number;
  average_cost_per_animal: number;
}

export interface LivestockExpenseReport {
  total_expenses: number;
  expenses_by_category: Array<{
    category: string;
    total_amount: number;
    expense_count: number;
  }>;
  expenses_by_flock: FlockExpenseSummary[];
  recent_expenses: LivestockExpense[];
}

export interface MedicalTreatment {
  id: number;
  livestock_id: number;
  flock_id?: number;
  treatment_type: string;
  medicine_name?: string;
  dosage?: string;
  administered_date: string;
  next_due_date?: string;
  cost: number;
  veterinarian?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface CreateMedicalTreatmentRequest {
  livestock_id: number;
  flock_id?: number;
  treatment_type: string;
  medicine_name?: string;
  dosage?: string;
  administered_date: string;
  next_due_date?: string;
  cost?: number;
  veterinarian?: string;
  notes?: string;
}

export interface UpdateMedicalTreatmentRequest {
  livestock_id?: number;
  flock_id?: number;
  treatment_type?: string;
  medicine_name?: string;
  dosage?: string;
  administered_date?: string;
  next_due_date?: string;
  cost?: number;
  veterinarian?: string;
  notes?: string;
}

export interface ProductionRecord {
  id: number;
  flock_id: number;
  record_date: string;
  product_type: 'eggs' | 'milk' | 'meat' | 'wool' | 'other';
  quantity: number;
  unit: string;
  quality_grade?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
  
  // Joined data
  flock_name?: string;
}

export interface FlockFinancialSummary {
  flock_id: number;
  flock_name: string;
  total_purchase_cost: number;
  total_expenses: number;
  total_sales: number;
  net_profit: number;
  roi_percentage: number;
  // Remove or update these if they don't exist in your API:
  total_animals?: number;
  sold_animals?: number;
  active_animals?: number;
  total_sale_revenue?: number;
  // Add any other optional fields that might be missing
}

export interface AnimalFinancialSummary {
  animal_id: number;
  animal_identifier: string;
  flock_id: number;
  flock_name: string;
  purchase_cost: number;
  total_expenses: number;
  total_revenue: number;
  net_profit: number;
  current_value?: number;
  age_days: number;
  status: LivestockStatus;
} 
export interface HealthRecord {
  id: number;
  livestock_id: number;
  record_date: string;
  health_status: string;
  diagnosis?: string;
  treatment?: string;
  medication?: string;
  dosage?: string;
  veterinarian?: string;
  cost: number;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface CreateHealthRecordRequest {
  livestock_id: number;
  record_date: string;
  health_status: string;
  diagnosis?: string;
  treatment?: string;
  medication?: string;
  dosage?: string;
  veterinarian?: string;
  cost?: number;
  notes?: string;
}

export interface UpdateHealthRecordRequest {
  record_date?: string;
  health_status?: string;
  diagnosis?: string;
  treatment?: string;
  medication?: string;
  dosage?: string;
  veterinarian?: string;
  cost?: number;
  notes?: string;
}