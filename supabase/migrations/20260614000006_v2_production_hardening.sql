-- Migration: 20260614000006_v2_production_hardening.sql
-- Description: Production readiness hardening (Indexes, RLS, UUIDv7, Optimistic Concurrency, Queues)

-- 1. UUIDv7 SUPPORT
CREATE OR REPLACE FUNCTION uuid_generate_v7() RETURNS uuid
AS $$
DECLARE
  unix_ts_ms bytea;
  uuid_bytes bytea;
BEGIN
  unix_ts_ms = substring(int8send(floor(extract(epoch from clock_timestamp()) * 1000)::bigint) from 3);
  uuid_bytes = unix_ts_ms || gen_random_bytes(10);
  uuid_bytes = set_byte(uuid_bytes, 6, (b'0111' || get_byte(uuid_bytes, 6)::bit(4))::integer);
  uuid_bytes = set_byte(uuid_bytes, 8, (b'10'   || get_byte(uuid_bytes, 8)::bit(6))::integer);
  RETURN encode(uuid_bytes, 'hex')::uuid;
END
$$ LANGUAGE plpgsql VOLATILE;

-- 2. JOB QUEUE INFRASTRUCTURE
CREATE TABLE job_queue (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v7(),
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    job_type TEXT NOT NULL,
    payload JSONB NOT NULL DEFAULT '{}'::jsonb,
    status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'processing', 'completed', 'failed'
    priority INTEGER NOT NULL DEFAULT 0,
    attempts INTEGER NOT NULL DEFAULT 0,
    max_attempts INTEGER NOT NULL DEFAULT 3,
    last_error TEXT,
    run_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    locked_at TIMESTAMPTZ,
    locked_by TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_job_queue_fetch ON job_queue(status, priority DESC, run_at) WHERE status = 'pending';

-- 3. OPTIMISTIC CONCURRENCY (VERSION)
ALTER TABLE organizations ADD COLUMN version INTEGER NOT NULL DEFAULT 1;
ALTER TABLE events ADD COLUMN version INTEGER NOT NULL DEFAULT 1;
ALTER TABLE tasks ADD COLUMN version INTEGER NOT NULL DEFAULT 1;
ALTER TABLE invoices ADD COLUMN version INTEGER NOT NULL DEFAULT 1;

CREATE OR REPLACE FUNCTION increment_version() RETURNS TRIGGER AS $$
BEGIN
    NEW.version = OLD.version + 1;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER increment_org_version BEFORE UPDATE ON organizations FOR EACH ROW EXECUTE PROCEDURE increment_version();
CREATE TRIGGER increment_event_version BEFORE UPDATE ON events FOR EACH ROW EXECUTE PROCEDURE increment_version();
CREATE TRIGGER increment_task_version BEFORE UPDATE ON tasks FOR EACH ROW EXECUTE PROCEDURE increment_version();

-- 4. SLUG SUPPORT
ALTER TABLE events ADD COLUMN slug TEXT;
ALTER TABLE albums ADD COLUMN slug TEXT;

-- 5. MISSING UNIQUE CONSTRAINTS
ALTER TABLE billing_plans ADD CONSTRAINT unique_billing_plan_name UNIQUE (name);
ALTER TABLE rehearsal_sessions ADD CONSTRAINT unique_rehearsal_session_time UNIQUE(rehearsal_id, start_time);
ALTER TABLE channel_members ADD CONSTRAINT unique_channel_member UNIQUE(channel_id, user_id);

-- 6. MISSING FOREIGN KEYS & ON DELETE BEHAVIORS
-- Protect financial records: Revert CASCADE to RESTRICT
ALTER TABLE invoices DROP CONSTRAINT invoices_user_id_fkey, ADD CONSTRAINT invoices_user_id_fkey FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE RESTRICT;
ALTER TABLE transactions DROP CONSTRAINT IF EXISTS transactions_user_id_fkey, ADD CONSTRAINT transactions_user_id_fkey FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE RESTRICT;
ALTER TABLE orders DROP CONSTRAINT orders_customer_id_fkey, ADD CONSTRAINT orders_customer_id_fkey FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE RESTRICT;

-- 7. MISSING UPDATED_AT TRIGGERS
CREATE TRIGGER set_timestamp_tasks BEFORE UPDATE ON tasks FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER set_timestamp_invoices BEFORE UPDATE ON invoices FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER set_timestamp_channels BEFORE UPDATE ON channels FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER set_timestamp_albums BEFORE UPDATE ON albums FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER set_timestamp_pages BEFORE UPDATE ON pages FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER set_timestamp_form_templates BEFORE UPDATE ON form_templates FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER set_timestamp_api_keys BEFORE UPDATE ON api_keys FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

-- 8. AUDIT TRIGGERS
CREATE OR REPLACE FUNCTION capture_audit_log() RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        INSERT INTO audit_logs (organization_id, action, target_type, target_id, changes)
        VALUES (NEW.organization_id, TG_OP, TG_TABLE_NAME, NEW.id, row_to_json(NEW));
        RETURN NEW;
    ELSIF TG_OP = 'UPDATE' THEN
        INSERT INTO audit_logs (organization_id, action, target_type, target_id, changes)
        VALUES (NEW.organization_id, TG_OP, TG_TABLE_NAME, NEW.id, jsonb_build_object('old', row_to_json(OLD), 'new', row_to_json(NEW)));
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        INSERT INTO audit_logs (organization_id, action, target_type, target_id, changes)
        VALUES (OLD.organization_id, TG_OP, TG_TABLE_NAME, OLD.id, row_to_json(OLD));
        RETURN OLD;
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER audit_organizations AFTER INSERT OR UPDATE OR DELETE ON organizations FOR EACH ROW EXECUTE PROCEDURE capture_audit_log();
CREATE TRIGGER audit_billing_plans AFTER INSERT OR UPDATE OR DELETE ON billing_plans FOR EACH ROW EXECUTE PROCEDURE capture_audit_log();
CREATE TRIGGER audit_invoices AFTER INSERT OR UPDATE OR DELETE ON invoices FOR EACH ROW EXECUTE PROCEDURE capture_audit_log();

-- 9. SOFT-DELETE PARTIAL INDEXES
CREATE INDEX idx_organizations_active ON organizations(id) WHERE deleted_at IS NULL;
CREATE INDEX idx_events_active ON events(organization_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_tasks_active ON tasks(organization_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_users_active ON users(id) WHERE deleted_at IS NULL;
CREATE INDEX idx_invoices_active ON invoices(organization_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_files_active ON files(organization_id) WHERE deleted_at IS NULL;

-- 10. MISSING SEARCH INDEXES
ALTER TABLE tasks ADD COLUMN fts tsvector GENERATED ALWAYS AS (to_tsvector('english', coalesce(title, '') || ' ' || coalesce(description, ''))) STORED;
ALTER TABLE pages ADD COLUMN fts tsvector GENERATED ALWAYS AS (to_tsvector('english', coalesce(title, '') || ' ' || coalesce(slug, ''))) STORED;

CREATE INDEX idx_tasks_fts ON tasks USING GIN (fts);
CREATE INDEX idx_pages_fts ON pages USING GIN (fts);

-- 11. BASELINE TENANT-ISOLATION RLS
-- We'll enable RLS and add a generic policy for core tables
ALTER TABLE files ENABLE ROW LEVEL SECURITY;
ALTER TABLE pages ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE channels ENABLE ROW LEVEL SECURITY;
ALTER TABLE albums ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tenant Isolation: Files" ON files FOR ALL USING (organization_id IN (SELECT organization_id FROM organization_members WHERE user_id = auth.uid()));
CREATE POLICY "Tenant Isolation: Pages" ON pages FOR ALL USING (organization_id IN (SELECT organization_id FROM organization_members WHERE user_id = auth.uid()));
CREATE POLICY "Tenant Isolation: Invoices" ON invoices FOR ALL USING (organization_id IN (SELECT organization_id FROM organization_members WHERE user_id = auth.uid()));
CREATE POLICY "Tenant Isolation: Channels" ON channels FOR ALL USING (organization_id IN (SELECT organization_id FROM organization_members WHERE user_id = auth.uid()));
CREATE POLICY "Tenant Isolation: Albums" ON albums FOR ALL USING (organization_id IN (SELECT organization_id FROM organization_members WHERE user_id = auth.uid()));

-- 12. MISSING FOREIGN KEY INDEXES
CREATE INDEX idx_fk_user_profiles_user ON user_profiles(user_id);
CREATE INDEX idx_fk_user_profiles_org ON user_profiles(organization_id);
CREATE INDEX idx_fk_api_keys_org ON api_keys(organization_id);
CREATE INDEX idx_fk_task_assignments_task ON task_assignments(task_id);
CREATE INDEX idx_fk_task_assignments_user ON task_assignments(user_id);
CREATE INDEX idx_fk_form_fields_form ON form_fields(form_id);
CREATE INDEX idx_fk_media_items_file ON media_items(file_id);
CREATE INDEX idx_fk_transactions_invoice ON transactions(invoice_id);
CREATE INDEX idx_fk_reimbursements_user ON reimbursements(user_id);
CREATE INDEX idx_fk_reimbursements_task ON reimbursements(task_id);
