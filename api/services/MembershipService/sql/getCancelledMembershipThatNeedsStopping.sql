SELECT m.*
FROM
  membership m
WHERE
  m.status = 'cancelled_running' AND
  CURDATE() >= m.cancelled_from_date AND
  m.automatic_payment_processing_started = 0 AND
  m.archived = 0
LIMIT 1
