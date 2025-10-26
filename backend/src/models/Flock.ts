// backend/src/models/Flock.ts
export interface Flock {
  id: number;
  name: string;
  description?: string;
  purchaseDate?: string;
  totalPurchaseCost?: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateFlockRequest extends Omit<Flock, 'id' | 'createdAt' | 'updatedAt'> {}
export interface UpdateFlockRequest extends Partial<Omit<Flock, 'id' | 'createdAt' | 'updatedAt'>> {}