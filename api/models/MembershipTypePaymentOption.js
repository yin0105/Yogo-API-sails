/**
 * MembershipTypePaymentOption.js
 *
 * @description :: TODO: You might write a short summary of how this model works and what it represents here.
 * @docs        :: http://sailsjs.org/documentation/concepts/models-and-orm/models
 */

module.exports = {

    tableName: 'membership_type_payment_option',

    attributes: {

        client: {
            model: 'Client'
        },

        membership_type: {
            model: 'MembershipType'
        },

        number_of_months_payment_covers: 'number',

        name: 'string',

        payment_amount: 'number',

        for_sale: 'boolean',

        memberships: {
            collection: 'Membership',
            via: 'payment_option'
        }

    }
};

