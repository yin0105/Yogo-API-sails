SELECT m.*
FROM
  membership m
WHERE
  m.status = 'active' AND
  (SELECT id FROM payment_subscription WHERE membership = m.id AND status = 'active') IS NULL AND
  CURDATE() > m.paid_until + INTERVAL 14 DAY
LIMIT 1