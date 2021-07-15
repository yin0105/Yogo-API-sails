SELECT m.*
FROM
  membership m
WHERE
  CASE m.status
  WHEN 'active'
    THEN
      CURRENT_DATE() > m.paid_until
  WHEN 'cancelled_running'
    THEN
      (
        CURRENT_DATE() > m.paid_until AND
        CURRENT_DATE() < m.cancelled_from_date
      )
  ELSE
    0
  END AND

  m.renewal_failed = 0 AND
  m.archived = 0 AND

  # Must have active payment subscription
  (SELECT COUNT(*)
   FROM payment_subscription
   WHERE
     membership = m.id AND
     status = 'active' AND
     archived = 0
  ) > 0 AND
  m.automatic_payment_processing_started = 0
LIMIT 1
