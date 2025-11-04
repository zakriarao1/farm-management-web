export type LivestockType = 'CATTLE' | 'POULTRY' | 'SHEEP' | 'GOATS'  | 'FISH'  | 'OTHER';


export type LivestockStatus = 
  | 'active' 
  | 'sick' 
  | 'pregnant' 
  | 'calving' 
  | 'milking' 
  | 'ready_for_sale' 
  | 'sold' 
  | 'deceased';

export type LivestockGender = 'MALE' | 'FEMALE' | 'CASTRATED';

export interface Livestock {
  id: number;
  tagId: string;
  type: LivestockType;
  breed?: string;
  gender: LivestockGender;
  dateOfBirth?: string;
  purchaseDate?: string;
  purchasePrice?: number;
  weight?: number;
  status: LivestockStatus;
  location?: string;
  notes?: string;
  created_at: string; // snake_case
  updated_at: string; // snake_case
  identifier?: string;
  species?: string;
  flock_name?: string;
  flock_id?: number;
}


export interface AnimalEvent {
  id: number;
  livestock_id: number;
  event_type: string;
  event_date: string;
  description: string;
  cost?: number;
  revenue?: number;
  notes?: string;
  created_at: string;
  updated_at: string;
  animal_identifier?: string;
}

export interface HealthRecord {
  id: number;
  date: string;
  condition: string;
  treatment: string;
  medication?: string;
  dosage?: string;
  veterinarian?: string;
  cost: number;
  notes?: string;
  created_at: string;
  createdAt?: string; // Add this as optional
}

export interface BreedingRecord {
  id: number;
  livestockId: number;
  breedingDate: string;
  expectedBirthDate?: string;
  actualBirthDate?: string;
  offspringCount?: number;
  notes?: string;
  status: 'PREGNANT' | 'SUCCESSFUL' | 'FAILED' | 'COMPLETED';
  createdAt: string;
}

export interface MilkProduction {
  id: number;
  livestockId: number;
  date: string;
  morningYield: number;
  eveningYield: number;
  totalYield: number;
  qualityNotes?: string;
  createdAt: string;
}

// Remove the old CreateLivestockRequest and UpdateLivestockRequest interfaces
// and replace with these:

export interface CreateLivestockRequest extends Omit<Livestock, 'id' | 'createdAt' | 'updatedAt'> {}

export interface UpdateLivestockRequest extends Partial<Omit<Livestock, 'id' | 'createdAt' | 'updatedAt'>> {}

// Analytics types
export interface LivestockStats {
  totalAnimals: number;
  byType: Record<string, number>;
  byStatus: Record<string, number>;
  averageWeight: number;
  totalValue: number;
  healthAlerts: number;
  pregnantAnimals: number;
}

export interface HealthAlert {
  livestockId: number;
  tagId: string;
  type: string;
  breed: string;
  condition: string;
  lastCheckup: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH';
}

export interface Flock {
  id: number;
  name: string;
  breed: string;
  quantity: number;
  age: number;
  health_status: string;
  total_purchase_cost?: number;
  description?: string;
  purchase_date?: string;
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
  medication_name: string;
  dosage: string;
  administration_method: string;
  treatment_date: string;
  next_treatment_date?: string;
  veterinarian?: string;
  cost: number;
  notes?: string;
  created_at: string;
  updated_at: string;
  
  // Joined data
  animal_identifier?: string;
  flock_name?: string;
}

export interface CreateMedicalTreatmentRequest {
  livestock_id: number;
  flock_id?: number;
  treatment_type: string;
  medication_name: string;
  dosage: string;
  administration_method: string;
  treatment_date: string;
  next_treatment_date?: string;
  veterinarian?: string;
  cost: number;
  notes?: string;
}

export interface UpdateMedicalTreatmentRequest {
  treatment_type?: string;
  medication_name?: string;
  dosage?: string;
  administration_method?: string;
  treatment_date?: string;
  next_treatment_date?: string;
  veterinarian?: string;
  cost?: number;
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