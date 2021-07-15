UPDATE `order`
SET
  receipt_token = $1,
  # THE FOLLOWING LINE HAS AN EXTRA SUB QUERY LAYER BECAUSE MYSQL WON'T EXECUTE THE QUERY OTHERWISE
  invoice_id = (SELECT max_invoice_id FROM (SELECT MAX(invoice_id) AS max_invoice_id FROM `order` o WHERE client = $2 AND archived = 0) as x) + 1
WHERE id = $3