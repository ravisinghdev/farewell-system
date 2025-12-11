-- Add configuration columns to farewells table
ALTER TABLE farewells ADD COLUMN IF NOT EXISTS target_amount DECIMAL(12,2) DEFAULT 50000;
ALTER TABLE farewells ADD COLUMN IF NOT EXISTS is_maintenance_mode BOOLEAN DEFAULT false;
ALTER TABLE farewells ADD COLUMN IF NOT EXISTS accepting_payments BOOLEAN DEFAULT true;
ALTER TABLE farewells ADD COLUMN IF NOT EXISTS payment_config JSONB DEFAULT '{"upi": true, "cash": true, "bank_transfer": false, "upi_id": ""}'::jsonb;
