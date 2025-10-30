-- Run this in your Neon SQL editor
CREATE TABLE IF NOT EXISTS flocks (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  purchase_date DATE,
  total_purchase_cost DECIMAL(10,2),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS livestock (
  id SERIAL PRIMARY KEY,
  flock_id INTEGER REFERENCES flocks(id),
  name VARCHAR(100) NOT NULL,
  breed VARCHAR(50),
  health_status VARCHAR(20) DEFAULT ''healthy'',
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS livestock_expenses (
  id SERIAL PRIMARY KEY,
  flock_id INTEGER REFERENCES flocks(id),
  description TEXT NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  expense_date DATE DEFAULT CURRENT_DATE,
  created_at TIMESTAMP DEFAULT NOW()
);
