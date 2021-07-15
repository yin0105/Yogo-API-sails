module.exports = {

  tableName: 'membership_campaign',

  attributes: {

    client: {
      model: 'Client',
    },

    name: {
      type: 'string',
    },

    membership_type: {
      model: 'MembershipType'
    },

    number_of_months_at_reduced_price: {
      type: 'number',
    },

    reduced_price: {
      type: 'number',
    },

    min_number_of_months_since_customer_last_had_membership_type: {
      type: 'number'
    }
  },
}

