-- $1 = explicit UTC data cutoff. First observed in retained tracking history,
-- not a newly acquired person. Incomplete Day 7 windows are NULL, not 0%.
WITH eligible AS (
  SELECT * FROM product_events
  WHERE environment = 'production' AND NOT is_internal AND traffic_class = 'browser'
    AND received_at <= $1::timestamptz AND occurred_at <= $1::timestamptz
    AND received_at >= $1::timestamptz - interval '90 days'
), first_visits AS (
  SELECT DISTINCT ON (browser_id) browser_id, session_id AS first_session_id, occurred_at AS first_at
  FROM eligible WHERE event_name = 'session_started'
  ORDER BY browser_id, occurred_at, session_id
), outcomes AS (
  SELECT f.*,
    EXISTS (SELECT 1 FROM eligible e WHERE e.browser_id = f.browser_id
      AND e.session_id = f.first_session_id AND e.occurred_at >= f.first_at
      AND e.event_name IN ('comparison_viewed','explainer_expanded','source_opened')) AS first_session_value,
    EXISTS (SELECT 1 FROM eligible e WHERE e.browser_id = f.browser_id
      AND e.session_id <> f.first_session_id
      AND e.occurred_at >= f.first_at + interval '7 days'
      AND e.occurred_at < f.first_at + interval '8 days'
      AND e.event_name IN ('comparison_viewed','explainer_expanded','source_opened')) AS day7_value
  FROM first_visits f
)
SELECT (first_at AT TIME ZONE 'UTC')::date AS first_observed_day_utc,
       count(*) AS first_observed_browsers,
       count(*) FILTER (WHERE first_session_value) AS first_session_value_browsers,
       count(*) FILTER (WHERE first_at + interval '8 days' <= $1::timestamptz) AS mature_day7_browsers,
       count(*) FILTER (WHERE first_at + interval '8 days' <= $1::timestamptz AND day7_value) AS day7_returned_browsers,
       count(*) FILTER (WHERE first_at + interval '8 days' <= $1::timestamptz AND day7_value)::numeric /
         NULLIF(count(*) FILTER (WHERE first_at + interval '8 days' <= $1::timestamptz), 0) AS day7_return_rate
FROM outcomes GROUP BY 1 ORDER BY 1;
