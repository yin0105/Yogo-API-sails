SELECT
  join_tbl.user_teaching_classes id
FROM
  `class_teachers__user_teaching_classes` join_tbl
  INNER JOIN `class` c ON join_tbl.`class_teachers` = c.id
WHERE
  DATE(c.date) >= DATE($2)
  AND c.archived = 0
  AND c.client = $1
GROUP BY
  join_tbl.user_teaching_classes