SELECT
  c.id,
  IFNULL(
      (
        SELECT COUNT(*)
        FROM class_signup
        WHERE
          `class` = c.id
          AND archived = 0
          AND cancelled_at = 0
      ),
      0
  ) signup_count
FROM
  `class` c
WHERE
  c.id IN ($1)
  AND c.archived = 0
