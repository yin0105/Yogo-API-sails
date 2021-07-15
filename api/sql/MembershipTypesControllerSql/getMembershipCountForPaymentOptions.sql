SELECT
  po.id,
  IFNULL(
      (
        SELECT COUNT(*)
        FROM membership m
        WHERE
          m.payment_option = po.id AND
          m.archived = 0 AND
          m.status IN ('active', 'cancelled_running')
      ),
      0
  ) membershipCount
FROM membership_type_payment_option po
WHERE
  po.id IN ($1)