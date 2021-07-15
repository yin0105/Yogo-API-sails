SELECT mt.id
FROM
  `membership_type` mt
  INNER JOIN membershiptype_price_groups__pricegroup_membership_types join_tbl ON join_tbl.membershiptype_price_groups = mt.id
WHERE
  join_tbl.pricegroup_membership_types IN ($1) AND
  mt.archived = 0