SELECT
  e.id,
  IFNULL(
      (
        SELECT COUNT(*)
        FROM event_signup
        WHERE
          `event` = e.id
          AND archived = 0
      ),
      0
  ) signup_count
FROM
  `event` e
WHERE
  e.id IN ($1)
  AND e.archived = 0