/**
 * MembershipLog.js
 *
 * @description :: TODO: You might write a short summary of how this model works and what it represents here.
 * @docs        :: http://sailsjs.org/documentation/concepts/models-and-orm/models
 */


module.exports = {

    tableName: 'membership_log',

    attributes: {

        client: {
            model: 'Client'
        },

        user: {
            model: 'User',
        },

        membership: {
            model: 'Membership'
        },

        entry: 'string'

    },

    async log(membership, entry) {
        if (!_.isObject(membership)) {
            membership = await Membership.findOne(membership);
        }
        await MembershipLog.create({
            client: _.isObject(membership.client) ? membership.client.id : membership.client,
            user: _.isObject(membership.user) ? membership.user.id : membership.user,
            membership: membership.id,
            entry: entry
        })
    }

};

