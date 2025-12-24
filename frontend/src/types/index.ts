//  frontend/src/types/index.ts

// Your existing types...
export type AreaUnit = 'ACRES' | 'HECTARES' | 'SQUARE_METERS' | 'MARLA' | 'KANAL';
export type YieldUnit = 'TONS' | 'KILOGRAMS' | 'POUNDS' | 'BUSHELS' | 'MONS';
export type CropStatus = 
  | 'PLANNED' 
  | 'PLANTED' 
  | 'GROWING' 
  | 'READY_FOR_HARVEST' 
  | 'HARVESTED' 
  | 'STOCKED' 
  | 'SOLD' 
  | 'FAILED';

// Replace enums with string literal types
export type TaskType = 
  | 'PLANTING' 
  | 'HARVEST' 
  | 'IRRIGATION' 
  | 'FERTILIZATION' 
  | 'PEST_CONTROL' 
  | 'MAINTENANCE' 
  | 'INSPECTION' 
  | 'OTHER';

export type TaskStatus = 
  | 'PENDING' 
  | 'IN_PROGRESS' 
  | 'COMPLETED' 
  | 'CANCELLED';

export type TaskPriority = 
  | 'LOW' 
  | 'MEDIUM' 
  | 'HIGH' 
  | 'URGENT';

export type InventoryCategory = 
  | 'SEEDS' 
  | 'FERTILIZER' 
  | 'PESTICIDES' 
  | 'TOOLS' 
  | 'EQUIPMENT' 
  | 'FUEL' 
  | 'MAINTENANCE' 
  | 'OTHER';


export interface Crop {
  id: number;
  name: string;
  plantingDate: string;
  harvestDate?: string;
  area: number;
  areaUnit: AreaUnit;
  yield: number;
  yieldUnit: YieldUnit;
  marketPrice: number;
  totalExpenses: number;
  status: CropStatus;
  notes?: string;
  created_at?: string;
  updated_at?: string;

   planting_date?: string;
  harvest_date?: string;
  area_value?: number | string;
  yield_value?: number | string;
  total_expenses?: number | string;
  area_unit?: AreaUnit;
  yield_unit?: YieldUnit;
  market_price?: number | string;
}

export interface CreateCropRequest {
  name: string;
  plantingDate: string;
  area: number;
  areaUnit: AreaUnit;
  yield?: number;
  yieldUnit?: YieldUnit;
  marketPrice?: number;
  totalExpenses?: number;
  status: CropStatus;
  notes?: string;
  harvestDate?: string;
}

export interface UpdateCropRequest {
  name: string;
  plantingDate: string;
  area: number;
  areaUnit: AreaUnit;
  yield?: number;
  yieldUnit?: YieldUnit;
  marketPrice?: number;
  totalExpenses?: number;
  status: CropStatus;
  notes?: string;
  harvestDate?: string;
}


export type ExpenseCategory = 
  | 'SEEDS'
  | 'FERTILIZERS'
  | 'PESTICIDES'
  | 'LABOR'
  | 'FUEL'
  | 'EQUIPMENT'
  | 'WATER'
  | 'IRRIGATION'
  | 'TRANSPORTATION'
  | 'OTHER';

export interface Expense {
  id: number;
  crop_id: number;  // snake_case
  description: string;
  category: ExpenseCategory;
  amount: number;
  date: string;
  notes?: string;
  created_at?: string;  // snake_case
  updated_at?: string;  // snake_case
}


export interface CreateExpenseRequest {
  crop_id: number;  // snake_case
  description: string;
  category: ExpenseCategory;
  amount: number;
  date: string;
  notes?: string;
}

export interface UpdateExpenseRequest {
  description?: string;
  category?: ExpenseCategory;
  amount?: number;
  date?: string;
  notes?: string;
  crop_id?: number; // Optional for updates
}

export interface StatusCounts {
  [status: string]: number;
}

export interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  color?: 'primary' | 'secondary' | 'success' | 'warning' | 'info' | 'error';
}

// Task types
export interface Task {
  id: string;
  title: string;
  description?: string;
  taskType: TaskType;
  cropId?: string;
  cropName?: string;
  cropType?: string;
  dueDate: string;
  completedDate?: string;
  status: TaskStatus;
  priority: TaskPriority;
  assignedTo?: string;
  createdAt: string;
  updatedAt: string;
  daysUntilDue?: number;
}

// Weather types
export interface WeatherData {
  temperature: number;
  humidity: number;
  precipitation: number;
  windSpeed: number;
  condition: string;
  forecast: DailyForecast[];
  coordinates?: {
    lat: number;
    lon: number;
  };
  timestamp?: string;
}

export interface DailyForecast {
  date: string;
  maxTemp: number;
  minTemp: number;
  precipitation: number;
  condition: string;
}

export interface WeatherAlert {
  event: string;
  description: string;
  start: number;
  end: number;
  severity: string;
}

export interface WeatherRecommendation {
  type: 'IRRIGATION' | 'PROTECTION' | 'HARVEST' | 'PLANTING';
  message: string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH';
}

export interface WeatherRecommendationsResponse {
  recommendations: WeatherRecommendation[];
  weather: WeatherData;
  coordinates: { 
    lat: number; 
    lon: number; 
  };
  cropType: string;
  timestamp: string;
}

// Inventory types
export interface InventoryItem {
  id: string;
  name: string;
  category: InventoryCategory;
  quantity: number;
  unit: string;
  minQuantity: number;
  unitCost?: number;
  supplier?: string;
  lastRestocked?: string;
  expirationDate?: string;
  location?: string;
  notes?: string;
  isLowStock?: boolean;
  transactionCount?: number;
  createdAt: string;
  updatedAt: string;
}

export interface InventoryTransaction {
  id: string;
  itemId: string;
  transactionType: 'PURCHASE' | 'USAGE' | 'ADJUSTMENT';
  quantity: number;
  unitCost?: number;
  totalCost?: number;
  referenceType?: string;
  referenceId?: string;
  notes?: string;
  transactionDate: string;
  createdAt: string;
}

// API Response types
export interface ApiResponse<T> {
  data: T;
  message?: string;
  success?: boolean;
}

// Request types
export interface CreateTaskRequest {
  title: string;
  description?: string;
  taskType: TaskType;
  cropId?: string;
  dueDate: string;
  priority: TaskPriority;
  assignedTo?: string;
}

export interface CreateInventoryItemRequest {
  name: string;
  category: InventoryCategory;
  quantity: number;
  unit: string;
  minQuantity: number;
  unitCost?: number;
  supplier?: string;
  expirationDate?: string;
  location?: string;
  notes?: string;
}

export interface UseInventoryItemRequest {
  itemId: string;
  quantity: number;
  referenceType?: string;
  referenceId?: string;
  notes?: string;
}

export interface HarvestReminderResponse {
  remindersCreated: number;
  crops: Array<{
    id: string;
    name: string;
    type: string;
    expectedHarvestDate: string;
    daysUntilHarvest: number;
  }>;
}

// Analytics types
// Analytics types - UPDATED WITH INDEX SIGNATURE
export interface AnalyticsSummary {
  total_crops?: number;
  active_crops?: number;
  total_expenses?: number;
  projected_revenue?: number;
  avg_expected_yield?: number;
  avg_actual_yield?: number;
  harvested_crops_count?: number;
  total_actual_yield?: number;
  // Add this index signature
  [key: string]: string | number | boolean | null | undefined;
}
export interface AnalyticsData {
  summary?: AnalyticsSummary;
  cropDistribution: CropDistribution[];
  statusDistribution?: StatusDistribution[];
  monthlyExpenses?: MonthlyExpense[];
  topCropsByExpenses?: TopCropByExpense[];
}

// Supporting analytics interfaces
export interface CropDistribution {
  type: string;
  count: number;
  total_area: number;
}

export interface StatusDistribution {
  status: string;
  count: number;
}

export interface MonthlyExpense {
  month: string;
  total_expenses: number;
  expense_count: number;
}

export interface TopCropByExpense {
  name: string;
  type: string;
  total_expenses: number;
  expense_count: number;
}

// Helper objects for dropdown options (replacement for enum values)
export const TaskTypeOptions = {
  PLANTING: 'PLANTING',
  HARVEST: 'HARVEST',
  IRRIGATION: 'IRRIGATION',
  FERTILIZATION: 'FERTILIZATION',
  PEST_CONTROL: 'PEST_CONTROL',
  MAINTENANCE: 'MAINTENANCE',
  INSPECTION: 'INSPECTION',
  OTHER: 'OTHER'
} as const;




export const TaskStatusOptions = {
  PENDING: 'PENDING',
  IN_PROGRESS: 'IN_PROGRESS',
  COMPLETED: 'COMPLETED',
  CANCELLED: 'CANCELLED'
} as const;

export const TaskPriorityOptions = {
  LOW: 'LOW',
  MEDIUM: 'MEDIUM',
  HIGH: 'HIGH',
  URGENT: 'URGENT'
} as const;

export const InventoryCategoryOptions = {
  SEEDS: 'SEEDS',
  FERTILIZER: 'FERTILIZER',
  PESTICIDES: 'PESTICIDES',
  TOOLS: 'TOOLS',
  EQUIPMENT: 'EQUIPMENT',
  FUEL: 'FUEL',
  MAINTENANCE: 'MAINTENANCE',
  OTHER: 'OTHER'
} as const;
export interface ProfitLossSummary {
  totalRevenue: number;
  totalExpenses: number;
  netProfit: number;
  roi: number;
  soldCropsCount: number;
  expenseCount: number;
}

export interface ROIAnalysis {
  period: string;
  crop_count: number;
  total_revenue: number;
  total_expenses: number;
  avg_roi_percentage: number;
  avg_net_profit: number;
}

export interface ProfitLossReport {
  summary: ProfitLossSummary;
  roiByCrop: Array<{
    name: string;
    type: string;
    revenue: number;
    total_expenses: number;
    roi_percentage: number;
  }>;
  timeframe: {
    startDate: string;
    endDate: string;
  };
}

export interface ROIAnalysisResponse {
  period: string;
  analysis: ROIAnalysis[];
}