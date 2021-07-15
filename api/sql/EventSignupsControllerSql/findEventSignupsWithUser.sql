SELECT
  es.*
FROM
  event_signup es
  INNER JOIN `event` e ON es.`event` = e.id
WHERE
  es.`user` = $1 # userId
  AND es.archived = 0
  AND e.archived = 0
  AND
  IF(
      e.use_time_slots,
      (
        SELECT `date`
        FROM event_time_slot
        WHERE `event` = e.id
        ORDER BY `date` DESC, start_time DESC
        LIMIT 1
      ),
      e.start_date
  ) >= DATE($2) # startDate
  AND
  IF(
      e.use_time_slots,
      (
        SELECT `date`
        FROM event_time_slot
        WHERE `event` = e.id
        ORDER BY `date` ASC, start_time ASC
        LIMIT 1
      ),
      e.start_date
  ) <= DATE($3) #
