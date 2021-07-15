SELECT m.*
FROM
  membership m
WHERE
  m.status = 'active' AND
  m.archived = 0 AND
  CURRENT_DATE() > m.paid_until - INTERVAL 7 DAY AND
  CURRENT_DATE() <= m.paid_until AND
  m.early_warning_for_missing_subscription_sent = 0 AND
  (SELECT id
   FROM payment_subscription
   WHERE membership = m.id AND status = 'active' AND archived = 0) IS NULL
LIMIT 1