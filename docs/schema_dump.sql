-- WARNING: This schema is for context only and is not meant to be run.
-- Table order and constraints may not be valid for execution.

CREATE TABLE public.albums (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  farewell_id uuid,
  name text NOT NULL,
  created_by uuid,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT albums_pkey PRIMARY KEY (id),
  CONSTRAINT albums_farewell_id_fkey FOREIGN KEY (farewell_id) REFERENCES public.farewells(id),
  CONSTRAINT albums_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.users(id)
);
CREATE TABLE public.audit_logs (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  farewell_id uuid,
  user_id uuid,
  action text NOT NULL,
  details jsonb,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT audit_logs_pkey PRIMARY KEY (id),
  CONSTRAINT audit_logs_farewell_id_fkey FOREIGN KEY (farewell_id) REFERENCES public.farewells(id),
  CONSTRAINT audit_logs_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id)
);
CREATE TABLE public.chat_channels (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  type USER-DEFINED NOT NULL DEFAULT 'dm'::channel_type,
  scope_id uuid,
  name text,
  avatar_url text,
  created_by uuid,
  last_message_at timestamp with time zone DEFAULT now(),
  is_deleted boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT chat_channels_pkey PRIMARY KEY (id),
  CONSTRAINT chat_channels_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.users(id)
);
CREATE TABLE public.chat_members (
  channel_id uuid NOT NULL,
  user_id uuid NOT NULL,
  role USER-DEFINED DEFAULT 'member'::member_role,
  status USER-DEFINED DEFAULT 'active'::member_status,
  last_read_at timestamp with time zone DEFAULT now(),
  is_pinned boolean DEFAULT false,
  is_muted boolean DEFAULT false,
  joined_at timestamp with time zone DEFAULT now(),
  CONSTRAINT chat_members_pkey PRIMARY KEY (channel_id, user_id),
  CONSTRAINT chat_members_channel_id_fkey FOREIGN KEY (channel_id) REFERENCES public.chat_channels(id),
  CONSTRAINT chat_members_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id)
);
CREATE TABLE public.chat_messages (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  channel_id uuid,
  user_id uuid,
  content text,
  type USER-DEFINED DEFAULT 'text'::message_type,
  file_url text,
  reply_to_id uuid,
  is_edited boolean DEFAULT false,
  is_deleted boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT chat_messages_pkey PRIMARY KEY (id),
  CONSTRAINT chat_messages_channel_id_fkey FOREIGN KEY (channel_id) REFERENCES public.chat_channels(id),
  CONSTRAINT chat_messages_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id),
  CONSTRAINT chat_messages_reply_to_id_fkey FOREIGN KEY (reply_to_id) REFERENCES public.chat_messages(id)
);
CREATE TABLE public.chat_reactions (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  message_id uuid,
  user_id uuid,
  emoji text NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT chat_reactions_pkey PRIMARY KEY (id),
  CONSTRAINT chat_reactions_message_id_fkey FOREIGN KEY (message_id) REFERENCES public.chat_messages(id),
  CONSTRAINT chat_reactions_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id)
);
CREATE TABLE public.confessions (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  farewell_id uuid,
  content text NOT NULL,
  is_approved boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT confessions_pkey PRIMARY KEY (id),
  CONSTRAINT confessions_farewell_id_fkey FOREIGN KEY (farewell_id) REFERENCES public.farewells(id)
);
CREATE TABLE public.contributions (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  farewell_id uuid,
  user_id uuid,
  amount numeric NOT NULL,
  method text NOT NULL,
  transaction_id text,
  screenshot_url text,
  status USER-DEFINED DEFAULT 'pending'::contribution_status,
  verified_by uuid,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT contributions_pkey PRIMARY KEY (id),
  CONSTRAINT contributions_farewell_id_fkey FOREIGN KEY (farewell_id) REFERENCES public.farewells(id),
  CONSTRAINT contributions_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id),
  CONSTRAINT contributions_verified_by_fkey FOREIGN KEY (verified_by) REFERENCES public.users(id)
);
CREATE TABLE public.duties (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  farewell_id uuid,
  title text NOT NULL,
  description text,
  status USER-DEFINED DEFAULT 'pending'::duty_status,
  assigned_to ARRAY,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT duties_pkey PRIMARY KEY (id),
  CONSTRAINT duties_farewell_id_fkey FOREIGN KEY (farewell_id) REFERENCES public.farewells(id)
);
CREATE TABLE public.expenses (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  farewell_id uuid,
  title text NOT NULL,
  amount numeric NOT NULL,
  paid_by uuid,
  category text,
  receipt_url text,
  approved_by uuid,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT expenses_pkey PRIMARY KEY (id),
  CONSTRAINT expenses_farewell_id_fkey FOREIGN KEY (farewell_id) REFERENCES public.farewells(id),
  CONSTRAINT expenses_paid_by_fkey FOREIGN KEY (paid_by) REFERENCES public.users(id),
  CONSTRAINT expenses_approved_by_fkey FOREIGN KEY (approved_by) REFERENCES public.users(id)
);
CREATE TABLE public.farewell_join_requests (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  farewell_id uuid,
  user_id uuid,
  status USER-DEFINED DEFAULT 'pending'::join_status,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT farewell_join_requests_pkey PRIMARY KEY (id),
  CONSTRAINT farewell_join_requests_farewell_id_fkey FOREIGN KEY (farewell_id) REFERENCES public.farewells(id),
  CONSTRAINT farewell_join_requests_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id)
);
CREATE TABLE public.farewell_members (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  farewell_id uuid,
  user_id uuid,
  role USER-DEFINED DEFAULT 'student'::farewell_role,
  status USER-DEFINED DEFAULT 'approved'::join_status,
  joined_at timestamp with time zone DEFAULT now(),
  CONSTRAINT farewell_members_pkey PRIMARY KEY (id),
  CONSTRAINT farewell_members_farewell_id_fkey FOREIGN KEY (farewell_id) REFERENCES public.farewells(id),
  CONSTRAINT farewell_members_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id)
);
CREATE TABLE public.farewells (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  name text NOT NULL,
  year integer NOT NULL,
  section text,
  date timestamp with time zone,
  code text UNIQUE,
  requires_approval boolean DEFAULT false,
  status USER-DEFINED DEFAULT 'active'::farewell_status,
  created_by uuid,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT farewells_pkey PRIMARY KEY (id),
  CONSTRAINT farewells_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.users(id)
);
CREATE TABLE public.media (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  album_id uuid,
  url text NOT NULL,
  type USER-DEFINED NOT NULL,
  uploaded_by uuid,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT media_pkey PRIMARY KEY (id),
  CONSTRAINT media_album_id_fkey FOREIGN KEY (album_id) REFERENCES public.albums(id),
  CONSTRAINT media_uploaded_by_fkey FOREIGN KEY (uploaded_by) REFERENCES public.users(id)
);
CREATE TABLE public.notifications (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  user_id uuid,
  type USER-DEFINED NOT NULL,
  title text NOT NULL,
  body text,
  link text,
  is_read boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT notifications_pkey PRIMARY KEY (id),
  CONSTRAINT notifications_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id)
);
CREATE TABLE public.poll_options (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  poll_id uuid,
  option_text text NOT NULL,
  CONSTRAINT poll_options_pkey PRIMARY KEY (id),
  CONSTRAINT poll_options_poll_id_fkey FOREIGN KEY (poll_id) REFERENCES public.polls(id)
);
CREATE TABLE public.poll_votes (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  poll_id uuid,
  option_id uuid,
  user_id uuid,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT poll_votes_pkey PRIMARY KEY (id),
  CONSTRAINT poll_votes_poll_id_fkey FOREIGN KEY (poll_id) REFERENCES public.polls(id),
  CONSTRAINT poll_votes_option_id_fkey FOREIGN KEY (option_id) REFERENCES public.poll_options(id),
  CONSTRAINT poll_votes_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id)
);
CREATE TABLE public.polls (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  farewell_id uuid,
  question text NOT NULL,
  created_by uuid,
  is_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT polls_pkey PRIMARY KEY (id),
  CONSTRAINT polls_farewell_id_fkey FOREIGN KEY (farewell_id) REFERENCES public.farewells(id),
  CONSTRAINT polls_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.users(id)
);
CREATE TABLE public.song_requests (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  farewell_id uuid,
  user_id uuid,
  song_name text NOT NULL,
  artist text,
  votes integer DEFAULT 0,
  status text DEFAULT 'pending'::text,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT song_requests_pkey PRIMARY KEY (id),
  CONSTRAINT song_requests_farewell_id_fkey FOREIGN KEY (farewell_id) REFERENCES public.farewells(id),
  CONSTRAINT song_requests_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id)
);
CREATE TABLE public.tickets (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  farewell_id uuid,
  user_id uuid,
  ticket_code text DEFAULT encode(gen_random_bytes(6), 'hex'::text) UNIQUE,
  qr_code_url text,
  is_scanned boolean DEFAULT false,
  scanned_at timestamp with time zone,
  scanned_by uuid,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT tickets_pkey PRIMARY KEY (id),
  CONSTRAINT tickets_farewell_id_fkey FOREIGN KEY (farewell_id) REFERENCES public.farewells(id),
  CONSTRAINT tickets_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id),
  CONSTRAINT tickets_scanned_by_fkey FOREIGN KEY (scanned_by) REFERENCES public.users(id)
);
CREATE TABLE public.users (
  id uuid NOT NULL,
  username text UNIQUE,
  full_name text,
  avatar_url text,
  email text,
  status USER-DEFINED DEFAULT 'offline'::user_status,
  last_seen_at timestamp with time zone DEFAULT now(),
  public_key text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT users_pkey PRIMARY KEY (id),
  CONSTRAINT users_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id)
);
