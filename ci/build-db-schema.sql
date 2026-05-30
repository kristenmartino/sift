-- Minimal CI schema for the Next.js production build prerender.
--
-- This is NOT the production migration source of truth — that lives in the
-- sift-api repo (init.sql + app/db.py migrations). It exists only so that
-- `next build` can prerender the three DB-backed ISR pages against an empty,
-- throwaway Postgres in CI instead of a live database. No production secrets,
-- no real data.
--
-- The build PRERENDERS (static, ISR) "/" and "/methodology", which read:
--   getTopStoryForLanding -> articles          (app/page.tsx)
--   getAllOutletProfiles  -> outlet_profiles   (app/methodology/page.tsx)
-- "/civic" currently renders DYNAMICALLY (it reads searchParams), so its
-- queries run at request time, not at build. Its tables are included
-- defensively so this fixture stays valid if /civic becomes static again:
--   listAllPoliticiansLite -> politician_profiles  (app/civic/page.tsx)
--   listAllOrgsLite        -> org_profiles         (app/civic/page.tsx)
--   listAllBillsLite       -> bill_profiles        (app/civic/page.tsx)
-- Keep in sync with those query functions in sift/lib/db.ts.
--
-- Tables are intentionally EMPTY: prerender only needs the queries to execute
-- (returning zero rows), not real data. Only the columns each query selects,
-- filters, or orders by are declared.

-- "/" landing lead story — getTopStoryForLanding()
CREATE TABLE IF NOT EXISTS articles (
  id               TEXT PRIMARY KEY,
  title            TEXT,
  summary          TEXT,
  source_url       TEXT,
  source_name      TEXT,
  image_url        TEXT,
  category         TEXT,
  published_date   TIMESTAMPTZ,
  read_time        INTEGER,
  why_it_matters   TEXT,
  importance_score NUMERIC,
  context_primer   JSONB,
  reading_levels   JSONB,
  created_at       TIMESTAMPTZ,
  from_search      BOOLEAN
);

-- "/methodology" outlet list — getAllOutletProfiles()
CREATE TABLE IF NOT EXISTS outlet_profiles (
  slug                  TEXT PRIMARY KEY,
  name                  TEXT,
  parent_company        TEXT,
  parent_company_url    TEXT,
  founded_year          INTEGER,
  funding_model         TEXT,
  allsides_rating       TEXT,
  allsides_url          TEXT,
  allsides_last_checked  DATE,
  mbfc_factual          TEXT,
  mbfc_url              TEXT,
  mbfc_last_checked     DATE,
  major_funders         JSONB,
  external_links        JSONB,
  notes                 TEXT
);

-- "/civic" politician index — listAllPoliticiansLite()
CREATE TABLE IF NOT EXISTS politician_profiles (
  bioguide_id TEXT PRIMARY KEY,
  name        TEXT,
  party       TEXT,
  state       TEXT,
  chamber     TEXT
);

-- "/civic" organization index — listAllOrgsLite()
CREATE TABLE IF NOT EXISTS org_profiles (
  slug           TEXT PRIMARY KEY,
  name           TEXT,
  type           TEXT,
  political_lean TEXT
);

-- "/civic" bill index — listAllBillsLite()
CREATE TABLE IF NOT EXISTS bill_profiles (
  bill_id         TEXT PRIMARY KEY,
  congress        INTEGER,
  short_title     TEXT,
  status          TEXT,
  introduced_date DATE
);
