CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE EXTENSION IF NOT EXISTS vector;

CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL UNIQUE,
  password_hash text NOT NULL,
  email_verified_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS organizations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  plan text NOT NULL DEFAULT 'Starter',
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS organization_members (
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (organization_id, user_id)
);

CREATE TABLE IF NOT EXISTS invitations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  email text NOT NULL,
  role text NOT NULL,
  token_hash text NOT NULL,
  expires_at timestamptz NOT NULL,
  accepted_at timestamptz
);

CREATE TABLE IF NOT EXISTS locations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name text NOT NULL,
  timezone text NOT NULL,
  address text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS agents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  location_id uuid REFERENCES locations(id),
  name text NOT NULL,
  industry text NOT NULL,
  status text NOT NULL DEFAULT 'draft',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS agent_versions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  agent_id uuid NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
  version integer NOT NULL,
  status text NOT NULL,
  config jsonb NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (agent_id, version)
);

CREATE TABLE IF NOT EXISTS voice_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  provider text NOT NULL,
  provider_voice_id text NOT NULL,
  name text NOT NULL,
  language text NOT NULL,
  metadata jsonb NOT NULL DEFAULT '{}'
);

CREATE TABLE IF NOT EXISTS provider_connections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  provider_type text NOT NULL,
  provider_name text NOT NULL,
  secret_ref text,
  status text NOT NULL DEFAULT 'unconfigured',
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS phone_numbers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  agent_id uuid REFERENCES agents(id),
  e164 text NOT NULL,
  provider text NOT NULL,
  capabilities jsonb NOT NULL DEFAULT '[]',
  status text NOT NULL,
  UNIQUE (organization_id, e164)
);

CREATE TABLE IF NOT EXISTS call_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  agent_id uuid REFERENCES agents(id),
  phone_number_id uuid REFERENCES phone_numbers(id),
  direction text NOT NULL,
  status text NOT NULL,
  started_at timestamptz,
  ended_at timestamptz,
  duration_seconds integer,
  outcome text,
  sentiment text,
  estimated_cost_cents integer NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS call_participants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  call_session_id uuid NOT NULL REFERENCES call_sessions(id) ON DELETE CASCADE,
  role text NOT NULL,
  phone_number text,
  display_name text
);

CREATE TABLE IF NOT EXISTS call_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  call_session_id uuid NOT NULL REFERENCES call_sessions(id) ON DELETE CASCADE,
  event_type text NOT NULL,
  actor text NOT NULL,
  occurred_at timestamptz NOT NULL DEFAULT now(),
  latency_ms integer,
  payload jsonb NOT NULL DEFAULT '{}'
);

CREATE TABLE IF NOT EXISTS transcript_segments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  call_session_id uuid NOT NULL REFERENCES call_sessions(id) ON DELETE CASCADE,
  speaker text NOT NULL,
  text text NOT NULL,
  start_ms integer NOT NULL,
  end_ms integer,
  is_final boolean NOT NULL DEFAULT true
);

CREATE TABLE IF NOT EXISTS recordings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  call_session_id uuid NOT NULL REFERENCES call_sessions(id) ON DELETE CASCADE,
  storage_key text NOT NULL,
  duration_seconds integer,
  consent_recorded boolean NOT NULL DEFAULT false,
  deleted_at timestamptz
);

CREATE TABLE IF NOT EXISTS tool_definitions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name text NOT NULL,
  input_schema jsonb NOT NULL,
  output_schema jsonb NOT NULL,
  confirmation_required boolean NOT NULL DEFAULT false,
  timeout_ms integer NOT NULL,
  UNIQUE (organization_id, name)
);

CREATE TABLE IF NOT EXISTS agent_tools (
  agent_id uuid NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
  tool_definition_id uuid NOT NULL REFERENCES tool_definitions(id) ON DELETE CASCADE,
  PRIMARY KEY (agent_id, tool_definition_id)
);

CREATE TABLE IF NOT EXISTS tool_executions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  call_session_id uuid REFERENCES call_sessions(id) ON DELETE SET NULL,
  tool_definition_id uuid REFERENCES tool_definitions(id) ON DELETE SET NULL,
  status text NOT NULL,
  confirmed_at timestamptz,
  input jsonb NOT NULL DEFAULT '{}',
  output jsonb NOT NULL DEFAULT '{}',
  error text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS knowledge_bases (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name text NOT NULL,
  status text NOT NULL DEFAULT 'empty',
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS knowledge_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  knowledge_base_id uuid NOT NULL REFERENCES knowledge_bases(id) ON DELETE CASCADE,
  filename text NOT NULL,
  content_type text NOT NULL,
  status text NOT NULL,
  storage_key text,
  deleted_at timestamptz
);

CREATE TABLE IF NOT EXISTS knowledge_chunks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  knowledge_document_id uuid NOT NULL REFERENCES knowledge_documents(id) ON DELETE CASCADE,
  chunk_index integer NOT NULL,
  text text NOT NULL,
  embedding vector(1536),
  metadata jsonb NOT NULL DEFAULT '{}'
);

CREATE TABLE IF NOT EXISTS transfer_destinations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  agent_id uuid REFERENCES agents(id) ON DELETE CASCADE,
  label text NOT NULL,
  phone_number text NOT NULL,
  conditions jsonb NOT NULL DEFAULT '[]'
);

CREATE TABLE IF NOT EXISTS extracted_call_fields (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  call_session_id uuid NOT NULL REFERENCES call_sessions(id) ON DELETE CASCADE,
  field_name text NOT NULL,
  field_value jsonb NOT NULL
);

CREATE TABLE IF NOT EXISTS call_summaries (
  call_session_id uuid PRIMARY KEY REFERENCES call_sessions(id) ON DELETE CASCADE,
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  summary text NOT NULL,
  outcome text,
  sentiment text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS webhook_endpoints (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  url text NOT NULL,
  events jsonb NOT NULL DEFAULT '[]',
  signing_secret_ref text NOT NULL,
  active boolean NOT NULL DEFAULT true
);

CREATE TABLE IF NOT EXISTS webhook_deliveries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  webhook_endpoint_id uuid NOT NULL REFERENCES webhook_endpoints(id) ON DELETE CASCADE,
  event_type text NOT NULL,
  payload jsonb NOT NULL,
  status text NOT NULL,
  attempts integer NOT NULL DEFAULT 0,
  next_retry_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS api_keys (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  label text NOT NULL,
  key_hash text NOT NULL,
  scopes jsonb NOT NULL DEFAULT '[]',
  last_used_at timestamptz,
  revoked_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS usage_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  call_session_id uuid REFERENCES call_sessions(id) ON DELETE SET NULL,
  provider text NOT NULL,
  unit text NOT NULL,
  quantity numeric(18,6) NOT NULL,
  unit_cost_cents numeric(18,6) NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS usage_aggregates (
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  day date NOT NULL,
  provider text NOT NULL,
  unit text NOT NULL,
  quantity numeric(18,6) NOT NULL,
  estimated_cost_cents numeric(18,6) NOT NULL,
  PRIMARY KEY (organization_id, day, provider, unit)
);

CREATE TABLE IF NOT EXISTS billing_plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  limits jsonb NOT NULL DEFAULT '{}'
);

CREATE TABLE IF NOT EXISTS subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  billing_plan_id uuid REFERENCES billing_plans(id),
  status text NOT NULL,
  current_period_start timestamptz,
  current_period_end timestamptz
);

CREATE TABLE IF NOT EXISTS audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  actor_user_id uuid REFERENCES users(id),
  action text NOT NULL,
  target text NOT NULL,
  metadata jsonb NOT NULL DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS data_retention_policies (
  organization_id uuid PRIMARY KEY REFERENCES organizations(id) ON DELETE CASCADE,
  transcript_retention_days integer NOT NULL DEFAULT 180,
  recording_retention_days integer NOT NULL DEFAULT 90,
  delete_after_days integer,
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_agents_org ON agents (organization_id);
CREATE INDEX IF NOT EXISTS idx_calls_org_started ON call_sessions (organization_id, started_at DESC);
CREATE INDEX IF NOT EXISTS idx_call_events_call ON call_events (call_session_id, occurred_at);
CREATE INDEX IF NOT EXISTS idx_transcript_call ON transcript_segments (call_session_id, start_ms);
CREATE INDEX IF NOT EXISTS idx_kb_org ON knowledge_bases (organization_id);
CREATE INDEX IF NOT EXISTS idx_chunks_org_document ON knowledge_chunks (organization_id, knowledge_document_id);
CREATE INDEX IF NOT EXISTS idx_webhook_deliveries_org ON webhook_deliveries (organization_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_usage_events_org_day ON usage_events (organization_id, created_at);
