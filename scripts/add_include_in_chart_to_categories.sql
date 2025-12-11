-- Add include_in_chart to categories
ALTER TABLE categories
ADD COLUMN include_in_chart BOOLEAN DEFAULT TRUE;
