SELECT
  join_tbl.user_teaching_events id
FROM
  `event_teachers__user_teaching_events` join_tbl
  INNER JOIN `event` e ON join_tbl.`event_teachers` = e.id
  INNER JOIN event_time_slot ets ON ets.event = e.id
WHERE
  DATE(ets.date) >= DATE($2)
  AND ets.archived = 0
  AND e.archived = 0
  AND e.client = $1
GROUP BY
  join_tbl.user_teaching_events