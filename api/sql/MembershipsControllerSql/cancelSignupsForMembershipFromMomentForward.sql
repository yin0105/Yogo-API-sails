UPDATE
  class_signup cs
SET
  cs.archived = 1,
  cancelled_at = UNIX_TIMESTAMP() * 1000
WHERE
  cs.used_membership = $1 AND
  (SELECT c.date > DATE($2) OR (c.date = DATE($2) AND c.start_time > TIME($3))
   FROM `class` c
   WHERE c.id = cs.`class`)
