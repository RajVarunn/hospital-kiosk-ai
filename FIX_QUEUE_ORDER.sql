-- Fix existing queue records to have proper sequential order_position
WITH ordered_queue AS (
  SELECT id, ROW_NUMBER() OVER (ORDER BY created_at ASC) as new_position
  FROM queue
)
UPDATE queue 
SET order_position = ordered_queue.new_position
FROM ordered_queue 
WHERE queue.id = ordered_queue.id;