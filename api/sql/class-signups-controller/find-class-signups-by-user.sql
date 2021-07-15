SELECT cs.*
FROM
  class_signup cs
  INNER JOIN `class` c ON cs.`class` = c.id
WHERE
  cs.archived = 0
  AND cs.cancelled_at = 0
  AND c.archived = 0
  AND cs.`user` = $1 # userId
  AND c.`date` >= DATE($2) # startDate
  AND c.`date` <= DATE($3) # endDate
