-- Create queue table
CREATE TABLE IF NOT EXISTS queue (
  id SERIAL PRIMARY KEY,
  patient_id VARCHAR(50) NOT NULL,
  priority VARCHAR(20) DEFAULT 'normal' CHECK (priority IN ('urgent', 'high', 'normal')),
  status VARCHAR(20) DEFAULT 'waiting' CHECK (status IN ('waiting', 'called', 'serving', 'completed')),
  estimated_wait INTEGER DEFAULT 15,
  order_position INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  CONSTRAINT fk_patient FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE
);

-- Create index for manual ordering
CREATE INDEX IF NOT EXISTS idx_queue_order ON queue(order_position ASC, priority DESC, created_at ASC);

-- Create announcements table
CREATE TABLE IF NOT EXISTS announcements (
  id SERIAL PRIMARY KEY,
  message TEXT NOT NULL,
  type VARCHAR(20) DEFAULT 'info' CHECK (type IN ('info', 'warning', 'urgent')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert sample announcement
INSERT INTO announcements (message, type) 
VALUES ('Welcome to the Hospital Kiosk System', 'info')
ON CONFLICT DO NOTHING;