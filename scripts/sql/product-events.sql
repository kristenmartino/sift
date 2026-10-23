-- Additive, repeatable migration. Apply before enabling usage measurement.
CREATE TABLE IF NOT EXISTS product_events (
  event_id uuid PRIMARY KEY,
  schema_version smallint NOT NULL CHECK (schema_version = 1),
  occurred_at timestamptz NOT NULL,
  received_at timestamptz NOT NULL DEFAULT now(),
  browser_id uuid NOT NULL,
  session_id uuid NOT NULL,
  event_name text NOT NULL CHECK (event_name IN (
    'session_started','feed_viewed','search_submitted','search_completed',
    'comparison_requested','comparison_completed','comparison_viewed',
    'explainer_expanded','source_opened')),
  entry_path text NOT NULL CHECK (entry_path IN ('home','news','context','other')),
  environment text NOT NULL CHECK (environment IN ('production','preview','development')),
  is_internal boolean NOT NULL,
  traffic_class text NOT NULL CHECK (traffic_class IN ('browser','bot','unknown')),
  properties jsonb NOT NULL DEFAULT '{}'::jsonb,
  payload_hash text NOT NULL
);
CREATE INDEX IF NOT EXISTS product_events_browser_time_idx ON product_events (browser_id, occurred_at);
CREATE INDEX IF NOT EXISTS product_events_session_time_idx ON product_events (session_id, occurred_at);
CREATE INDEX IF NOT EXISTS product_events_received_idx ON product_events (received_at);
