SELECT cs.*
FROM
  class_signup cs
  INNER JOIN `class` c ON cs.`class` = c.id
  INNER JOIN membership m ON cs.used_membership = m.id
WHERE
  c.date > DATE($1) AND
  m.id = $2