-- Migration: 20240101000000_core_schema.sql
-- Description: Consolidated Core infrastructure, Identity, Organizations, Invitations, Activity Logs

-- ==========================================
-- 1. EXTENSIONS
-- ==========================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ==========================================
-- 2. FUNCTIONS
-- ==========================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE OR REPLACE FUNCTION get_my_organizations()
RETURNS UUID[] AS $$
BEGIN
  RETURN ARRAY(
    SELECT organization_id
    FROM public.organization_members
    WHERE user_id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ==========================================
-- 3. TABLES
-- ==========================================
CREATE TABLE public.organizations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    settings JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMPTZ,
    deleted_by UUID
);

CREATE TABLE public.users (
    id UUID PRIMARY KEY, -- Maps to auth.users.id
    email TEXT UNIQUE NOT NULL,
    full_name TEXT,
    avatar_url TEXT,
    last_active_organization_id UUID REFERENCES public.organizations(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMPTZ,
    deleted_by UUID
);

CREATE TABLE public.organization_members (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    role TEXT NOT NULL DEFAULT 'Member',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMPTZ,
    deleted_by UUID,
    UNIQUE(organization_id, user_id)
);

CREATE TABLE public.organization_invitations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    email TEXT,
    role TEXT NOT NULL DEFAULT 'Member',
    token TEXT UNIQUE NOT NULL,
    created_by UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'revoked')),
    expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE public.activity_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
    actor_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
    action TEXT NOT NULL,
    entity_type TEXT,
    entity_id UUID,
    metadata JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ==========================================
-- 4. TRIGGERS & INDEXES
-- ==========================================
CREATE TRIGGER set_timestamp_organizations BEFORE UPDATE ON public.organizations FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER set_timestamp_users BEFORE UPDATE ON public.users FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER set_timestamp_org_members BEFORE UPDATE ON public.organization_members FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER set_timestamp_org_invitations BEFORE UPDATE ON public.organization_invitations FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

CREATE INDEX idx_org_members_user ON public.organization_members(user_id);
CREATE INDEX idx_org_members_org ON public.organization_members(organization_id);
CREATE INDEX idx_activity_logs_org ON public.activity_logs(organization_id);

-- Sync auth.users
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.users (id, email, full_name, avatar_url)
  VALUES (
    new.id,
    new.email,
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'avatar_url'
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- ==========================================
-- 5. RPCs
-- ==========================================
CREATE OR REPLACE FUNCTION create_new_organization(
  org_name TEXT,
  org_slug TEXT
) RETURNS UUID AS $$
DECLARE
  new_org_id UUID;
BEGIN
  INSERT INTO public.organizations (name, slug)
  VALUES (org_name, org_slug)
  RETURNING id INTO new_org_id;

  INSERT INTO public.organization_members (organization_id, user_id, role)
  VALUES (new_org_id, auth.uid(), 'Owner');

  UPDATE public.users
  SET last_active_organization_id = new_org_id
  WHERE id = auth.uid();

  INSERT INTO public.activity_logs (organization_id, actor_id, action, entity_type, entity_id, metadata)
  VALUES (new_org_id, auth.uid(), 'organization.created', 'organization', new_org_id, jsonb_build_object('name', org_name));

  RETURN new_org_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION accept_invitation(
  invite_token TEXT
) RETURNS UUID AS $$
DECLARE
  v_invite RECORD;
BEGIN
  SELECT * INTO v_invite
  FROM public.organization_invitations
  WHERE token = invite_token AND status = 'pending' AND expires_at > NOW();

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Invalid, expired, or already accepted invitation.';
  END IF;

  IF v_invite.email IS NOT NULL THEN
    IF v_invite.email != (SELECT email FROM auth.users WHERE id = auth.uid()) THEN
      RAISE EXCEPTION 'This invitation is not for your email address.';
    END IF;
  END IF;

  IF EXISTS (SELECT 1 FROM public.organization_members WHERE organization_id = v_invite.organization_id AND user_id = auth.uid()) THEN
    RAISE EXCEPTION 'You are already a member of this organization.';
  END IF;

  INSERT INTO public.organization_members (organization_id, user_id, role)
  VALUES (v_invite.organization_id, auth.uid(), v_invite.role);

  UPDATE public.organization_invitations
  SET status = 'accepted', updated_at = NOW()
  WHERE id = v_invite.id;

  RETURN v_invite.organization_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- ==========================================
-- 6. ROW LEVEL SECURITY
-- ==========================================
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organization_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organization_invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;

-- Users
CREATE POLICY "Users can view their own record" ON public.users FOR SELECT USING (id = auth.uid());
CREATE POLICY "Users can update their own record" ON public.users FOR UPDATE USING (id = auth.uid());

-- Organizations
CREATE POLICY "Users can view organizations they belong to" ON public.organizations FOR SELECT USING (id = ANY(get_my_organizations()));
CREATE POLICY "Users can update organizations they belong to" ON public.organizations FOR UPDATE USING (id = ANY(get_my_organizations()));

-- Organization Members
CREATE POLICY "Users can view members of their organizations" ON public.organization_members FOR SELECT USING (organization_id = ANY(get_my_organizations()));
CREATE POLICY "Users can update members of their organizations" ON public.organization_members FOR UPDATE USING (organization_id = ANY(get_my_organizations()));
CREATE POLICY "Users can delete members of their organizations" ON public.organization_members FOR DELETE USING (organization_id = ANY(get_my_organizations()));

-- Invitations
CREATE POLICY "Users can view invitations of their organizations" ON public.organization_invitations FOR SELECT USING (organization_id = ANY(get_my_organizations()));
CREATE POLICY "Users can insert invitations for their organizations" ON public.organization_invitations FOR INSERT WITH CHECK (organization_id = ANY(get_my_organizations()));
CREATE POLICY "Users can update invitations of their organizations" ON public.organization_invitations FOR UPDATE USING (organization_id = ANY(get_my_organizations()));
CREATE POLICY "Users can delete invitations of their organizations" ON public.organization_invitations FOR DELETE USING (organization_id = ANY(get_my_organizations()));
CREATE POLICY "Public pending invitations are readable" ON public.organization_invitations FOR SELECT USING (status = 'pending' AND expires_at > NOW());

-- Activity Logs
CREATE POLICY "Users can view activity logs of their organizations" ON public.activity_logs FOR SELECT USING (organization_id = ANY(get_my_organizations()));

-- ==========================================
-- 7. GRANTS
-- ==========================================
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO anon;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO anon;
