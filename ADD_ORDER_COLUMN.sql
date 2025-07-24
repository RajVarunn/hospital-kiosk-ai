-- Add order_position column to existing queue table
ALTER TABLE queue ADD COLUMN IF NOT EXISTS order_position INTEGER DEFAULT 0;

-- Update existing records to have sequential order_position based on creation time
WITH ordered_queue AS (
  SELECT id, ROW_NUMBER() OVER (ORDER BY created_at ASC) as new_position
  FROM queue
  WHERE order_position = 0 OR order_position IS NULL
)
UPDATE queue 
SET order_position = ordered_queue.new_position
FROM ordered_queue 
WHERE queue.id = ordered_queue.id;

-- Drop old index and create new one
DROP INDEX IF EXISTS idx_queue_priority;
CREATE INDEX IF NOT EXISTS idx_queue_order ON queue(order_position ASC, priority DESC, created_at ASC);