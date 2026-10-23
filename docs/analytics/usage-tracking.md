# Sift usage measurement

Measure paths to useful coverage and return visits using first-party PostgreSQL events. Browser IDs are pseudonymous, are not linked to Clerk, and do not identify people or work across devices. Clearing storage or reaching the 90-day identifier lifetime starts a new browser history. Do not backfill historical identities from IP hashes.

## Events and interpretation

| Event | Trigger |
| --- | --- |
| session_started | A visible page or reading action starts a browser session. New session after 30 minutes of inactivity. |
| feed_viewed | A non-empty feed/search/bookmark grid enters the visible viewport. Once per surface/category per session. |
| search_submitted | Topic/custom-topic search starts, with a random request ID. No query text in product events. |
| search_completed | Search finishes, fails, is cancelled or times out; includes status, result count and latency. A stream cut off before `done` is incomplete. |
| comparison_requested | A live or shared-link comparison starts. |
| comparison_completed | Request outcome and latency. Completion does not establish exposure. |
| comparison_viewed | Successful comparison content enters the visible viewport. Daily examples are labeled separately, including the homepage. Background fetch/preload and generic placeholder copy do not count. |
| explainer_expanded | A reader deliberately expands a collapsed panel. Featured/auto-expanded content does not count. |
| source_opened | Left/keyboard/middle activation of an original article link. Does not prove the external article was read. Civic dossier and policy links do not count. |

`comparison_viewed`, `explainer_expanded` and `source_opened` are proxies for meaningful reading. Keep them separate in reports. Live comparisons use request IDs; cached daily examples use a dated content ID. Browsing is a valid entry path and never requires a search first.

## Storage and controls

Apply `scripts/sql/product-events.sql` using the existing trusted migration connection before enabling. This is an additive, repeatable frontend-owned analytics migration; it does not modify the backend ingestion schema. Do not put credentials in SQL or terminal history.

Set both `PRODUCT_ANALYTICS_ENABLED=true` and `NEXT_PUBLIC_PRODUCT_ANALYTICS_ENABLED=true` in the intended deployment and rebuild. Both default to disabled. The server flag stops ingestion without changing the client build. Client-side identifiers can remain until the public flag is rebuilt or the user opts out; server disable means no events are collected.

Events accept a strict schema and only same-origin JSON POSTs. The endpoint returns 503 on persistence failure, 409 on a reused event ID with changed payload, 204 on a successful write or identical retry. Retries reuse the original payload and ID and run at most once. Collection is best effort: a closed browser, blocked request, rate limit or network outage can still lose events. The UI always continues. Monitor API failures and missing session-start coverage before trusting rates.

No raw IP, auth identity, query text, source URL, page query string or free-form metadata is added to this table. A transient hashed IP is used for in-memory rate limiting only. Existing search-query/primer tables retain their existing data contracts; requests now supply a session header where available.

The Privacy page discloses usage storage and has a browser-specific opt-out. Do Not Track and Global Privacy Control suppress collection. Storage failure suppresses all usage events rather than creating a new ID on every action. Testers can opt into exclusion using `localStorage.setItem('sift-usage-internal','1')`; the server can additionally exclude known browser UUIDs via `PRODUCT_ANALYTICS_INTERNAL_BROWSER_IDS`. Do not automatically treat family members as testers.

The server derives environment from `VERCEL_ENV`; all preview and development traffic is internal. Coarse UA classification is `browser`, `bot` or `unknown`; browser-like traffic is not proof of a human. Production reports must filter environment=production, is_internal=false, traffic_class=browser and show sample counts.

## Retention and analysis

Vercel invokes `/api/cron/analytics-retention` daily at 06:00 UTC. Configure `CRON_SECRET` before enabling collection. The authenticated endpoint deletes rows whose server receipt time is older than 90 days, including when ingestion is disabled. Confirm the deployed cron succeeds; no background function can guarantee deletion if credentials or scheduling fail. The operational deletion window is 90 days plus the daily job interval. Local identifiers expire at 90 days on next access. Existing legacy search/primer cleanup remains separate.

`product-activity.sql` counts events, observed browsers and sessions by UTC day using a supplied data cutoff. `product-retention.sql` measures exact rolling Day 7 meaningful return in [first visit + 7 days, first visit + 8 days) in another session. A cohort requires eight complete days before its Day 7 denominator matures. Missing denominators return NULL. Recent first-session outcomes are provisional until readers have finished their first sessions. First observed means first observed in retained tracking history, not acquired/new-to-product.

Monitor event and receipt time separately, late events, duplicate/conflict counts, missing session starts, internal exclusions, source coverage, and the production rollout timestamp. Suppressed/blocked collection is absent data, not inactivity. Browser storage race/reset and cross-device use can fragment identity. Small cohorts are descriptive; this tracking does not establish an experiment effect or explain why someone returned.

## Release checklist

1. Run type check, ESLint, tests/coverage and the CI production build.
2. Apply the migration twice to a disposable PostgreSQL database to verify repeatability. Verify identical retry and conflicting replay behavior against actual SQL.
3. Exercise feed, source click, deliberate versus auto-expanded primer, search outcomes, comparison failures and visible comparison output. Verify a new session retains the browser ID and opt-out stops writes.
4. Apply the additive production migration, configure both flags plus the cron secret, and deploy the reviewed change.
5. Verify one marked-internal production session and cleanup success. Save the rollout time; do not count release smoke tests as external adoption.
