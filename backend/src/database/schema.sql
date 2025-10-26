-- /backend/src/database/schema.sql
-- Create database
CREATE DATABASE farm_management;

-- Connect to database
\c farm_management;

-- Create enum types
CREATE TYPE crop_status AS ENUM ('PLANNED', 'PLANTED', 'GROWING', 'READY_FOR_HARVEST', 'HARVESTED', 'FAILED');
CREATE TYPE area_unit AS ENUM ('ACRES', 'HECTARES', 'SQUARE_METERS');
CREATE TYPE yield_unit AS ENUM ('TONS', 'KILOGRAMS', 'POUNDS', 'BUSHELS');
CREATE TYPE expense_category AS ENUM ('SEEDS', 'FERTILIZERS', 'LABOR', 'EQUIPMENT', 'WATER', 'OTHER');

-- Create crops table
CREATE TABLE IF NOT EXISTS crops (
    id SERIAL PRIMARY KEY,
    firestore_id VARCHAR(255),
    name VARCHAR(255) NOT NULL,
    type VARCHAR(100) NOT NULL,
    variety VARCHAR(100),
    planting_date DATE NOT NULL,
    expected_harvest_date DATE,
    actual_harvest_date DATE,
    area DECIMAL(10,2) NOT NULL DEFAULT 0.0,
    area_unit area_unit NOT NULL DEFAULT 'ACRES',
    expected_yield DECIMAL(10,2) NOT NULL DEFAULT 0.0,
    actual_yield DECIMAL(10,2),
    yield_unit yield_unit,
    field_location TEXT,
    market_price DECIMAL(10,2) NOT NULL DEFAULT 0.0,
    total_expenses DECIMAL(10,2) NOT NULL DEFAULT 0.0,
    notes TEXT,
    status crop_status NOT NULL DEFAULT 'PLANNED',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create expenses table
CREATE TABLE IF NOT EXISTS expenses (
    id SERIAL  PRIMARY KEY DEFAULT gen_random_uuid(),
    firestore_id VARCHAR(255),
    crop_id INTEGER REFERENCES crops(id) ON DELETE CASCADE,
    crop_firestore_id VARCHAR(255),
    amount DECIMAL(10,2) NOT NULL DEFAULT 0.0,
    category expense_category NOT NULL DEFAULT 'OTHER',
    description TEXT,
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS tasks (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    task_type VARCHAR(50) NOT NULL,
    crop_id INTEGER REFERENCES crops(id) ON DELETE CASCADE,
    due_date DATE NOT NULL,
    completed_date DATE,
    status VARCHAR(20) DEFAULT 'PENDING',
    priority VARCHAR(20) DEFAULT 'MEDIUM',
    assigned_to VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS inventory_items (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    category VARCHAR(50) NOT NULL,
    quantity DECIMAL(10,2) NOT NULL,
    unit VARCHAR(20) NOT NULL,
    min_quantity DECIMAL(10,2) DEFAULT 0,
    unit_cost DECIMAL(10,2),
    supplier VARCHAR(255),
    last_restocked DATE,
    expiration_date DATE,
    location VARCHAR(100),
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS inventory_transactions (
    id SERIAL PRIMARY KEY,
    item_id INTEGER REFERENCES inventory_items(id) ON DELETE CASCADE,
    transaction_type VARCHAR(20) NOT NULL, -- PURCHASE, USAGE, ADJUSTMENT
    quantity DECIMAL(10,2) NOT NULL,
    unit_cost DECIMAL(10,2),
    total_cost DECIMAL(10,2),
    reference_type VARCHAR(50), -- CROP, MAINTENANCE, etc.
    reference_id INTEGER,
    notes TEXT,
    transaction_date DATE DEFAULT CURRENT_DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS weather_data (
    id SERIAL PRIMARY KEY,
    crop_id INTEGER REFERENCES crops(id),
    temperature DECIMAL(5,2),
    humidity DECIMAL(5,2),
    precipitation DECIMAL(5,2),
    condition VARCHAR(50),
    recorded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Add reports table
CREATE TABLE IF NOT EXISTS reports (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    type VARCHAR(50) NOT NULL,
    data JSONB,
    generated_by VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
ALTER TABLE crops ADD COLUMN IF NOT EXISTS user_id INTEGER REFERENCES users(id);
ALTER TABLE expenses ADD COLUMN IF NOT EXISTS user_id INTEGER REFERENCES users(id);
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS user_id INTEGER REFERENCES users(id);
ALTER TABLE inventory_items ADD COLUMN IF NOT EXISTS user_id INTEGER REFERENCES users(id);

-- Create livestock tables if they don't exist
CREATE TABLE IF NOT EXISTS livestock (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    tag_id VARCHAR(100) UNIQUE NOT NULL,
    type VARCHAR(50) NOT NULL,
    breed VARCHAR(100) NOT NULL,
    gender VARCHAR(20) NOT NULL,
    date_of_birth DATE,
    purchase_date DATE NOT NULL,
    purchase_price DECIMAL(10,2),
    weight DECIMAL(10,2),
    status VARCHAR(50) NOT NULL,
    location VARCHAR(200),
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS health_records (
    id SERIAL PRIMARY KEY,
    livestock_id INTEGER REFERENCES livestock(id) ON DELETE CASCADE,
    record_date DATE NOT NULL,
    condition VARCHAR(200) NOT NULL,
    treatment TEXT NOT NULL,
    medication VARCHAR(200),
    dosage VARCHAR(100),
    veterinarian VARCHAR(100),
    cost DECIMAL(10,2),
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
ALTER TABLE livestock ADD COLUMN flock_id INTEGER;

-- Create a flocks table to manage groups of animals
CREATE TABLE IF NOT EXISTS flocks (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  purchase_date DATE,
  total_purchase_cost DECIMAL(10,2),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Add foreign key constraint
ALTER TABLE livestock ADD CONSTRAINT fk_livestock_flock 
  FOREIGN KEY (flock_id) REFERENCES flocks(id);

-- Create livestock_expenses table (separate from crop expenses)
CREATE TABLE IF NOT EXISTS livestock_expenses (
  id SERIAL PRIMARY KEY,
  flock_id INTEGER REFERENCES flocks(id),
  livestock_id INTEGER REFERENCES livestock(id),
  description VARCHAR(255) NOT NULL,
  category VARCHAR(100) NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  date DATE NOT NULL,
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_livestock_flock_id ON livestock(flock_id);
CREATE INDEX IF NOT EXISTS idx_livestock_expenses_flock_id ON livestock_expenses(flock_id);
CREATE INDEX IF NOT EXISTS idx_livestock_expenses_livestock_id ON livestock_expenses(livestock_id);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_crops_status ON crops(status);
CREATE INDEX IF NOT EXISTS idx_crops_planting_date ON crops(planting_date);
CREATE INDEX IF NOT EXISTS idx_expenses_crop_id ON expenses(crop_id);
CREATE INDEX IF NOT EXISTS idx_expenses_date ON expenses(date);
CREATE INDEX IF NOT EXISTS idx_tasks_crop_id ON tasks(crop_id);
CREATE INDEX IF NOT EXISTS idx_tasks_due_date ON tasks(due_date);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);
CREATE INDEX IF NOT EXISTS idx_inventory_category ON inventory_items(category);
CREATE INDEX IF NOT EXISTS idx_inventory_transactions_item ON inventory_transactions(item_id);
-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_crops_updated_at BEFORE UPDATE ON crops FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();