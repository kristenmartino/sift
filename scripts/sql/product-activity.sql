-- $1 = explicit UTC data cutoff (timestamptz). Browser counts are not people.
-- 'browser' is a coarse UA heuristic, not verification of a human.
WITH eligible AS (
  SELECT * FROM product_events
  WHERE environment = 'production' AND NOT is_internal AND traffic_class = 'browser'
    AND received_at <= $1::timestamptz AND occurred_at <= $1::timestamptz
    AND received_at >= $1::timestamptz - interval '90 days'
)
SELECT (occurred_at AT TIME ZONE 'UTC')::date AS day_utc,
       event_name, count(*) AS events,
       count(DISTINCT browser_id) AS observed_browsers,
       count(DISTINCT session_id) AS observed_sessions
FROM eligible
GROUP BY 1, 2 ORDER BY 1, 2;
