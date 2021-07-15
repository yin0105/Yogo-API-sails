SELECT c.*
FROM
  class_teachers__user_teaching_classes join_tbl
  INNER JOIN `class` c ON join_tbl.class_teachers = c.id
  INNER JOIN user u ON join_tbl.user_teaching_classes = u.id
WHERE
  join_tbl.user_teaching_classes = $1 AND
  c.archived = 0 AND
  u.archived = 0
GROUP BY
  class_teachers