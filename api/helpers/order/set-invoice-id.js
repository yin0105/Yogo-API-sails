const knex = require('../../services/knex')

module.exports = {
  friendlyName: 'Set order invoice id',

  inputs: {
    order: {
      type: 'ref',
      required: true,
    },
  },

  fn: async (inputs, exits) => {

    const orderId = sails.helpers.util.idOrObjectIdInteger(inputs.order)
    const order = await Order.findOne(orderId)

    await sails.sendNativeQuery(`
                UPDATE \`order\` AS o
                    INNER JOIN
                    (
                        SELECT client, MAX(invoice_id) AS max_invoice_id
                        FROM \`order\`
                        WHERE client = $1
                          AND archived = 0
                        GROUP BY client
                    ) AS innerTable
                    ON innerTable.client = o.client
                SET invoice_id = innerTable.max_invoice_id + 1
                WHERE id = $2
      `,
      [order.client, orderId],
    )

    return exits.success()

  },
}
