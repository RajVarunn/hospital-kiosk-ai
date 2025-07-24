-- Create queue table for patient queue management
CREATE TABLE IF NOT EXISTS queue (
  id SERIAL PRIMARY KEY,
  patient_id VARCHAR(50) NOT NULL,
  priority VARCHAR(20) DEFAULT 'normal' CHECK (priority IN ('urgent', 'high', 'normal')),
  status VARCHAR(20) DEFAULT 'waiting' CHECK (status IN ('waiting', 'called', 'serving', 'completed')),
  estimated_wait INTEGER DEFAULT 15,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Foreign key to patients table
  CONSTRAINT fk_patient FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE
);

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_queue_priority_created ON queue(priority DESC, created_at ASC);
CREATE INDEX IF NOT EXISTS idx_queue_status ON queue(status);
CREATE INDEX IF NOT EXISTS idx_queue_patient_id ON queue(patient_id);

-- Create announcements table for queue display
CREATE TABLE IF NOT EXISTS announcements (
  id SERIAL PRIMARY KEY,
  message TEXT NOT NULL,
  type VARCHAR(20) DEFAULT 'info' CHECK (type IN ('info', 'warning', 'urgent')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE
);

-- Insert sample announcement
INSERT INTO announcements (message, type) 
VALUES ('Welcome to the Hospital Kiosk System', 'info')
ON CONFLICT DO NOTHING;