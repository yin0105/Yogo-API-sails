SELECT m.*
FROM
  membership m
WHERE
  m.status = 'active' AND
  m.archived = 0 AND
  CURRENT_DATE() > m.paid_until AND
  (SELECT id
   FROM payment_subscription
   WHERE membership = m.id AND status = 'active' AND archived = 0) IS NULL AND
  m.warning_for_missing_subscription_on_payment_due_sent = 0
LIMIT 1