const moment = require('moment');

module.exports = {

    friendlyName: 'Find class signups by user',

    description: 'Finds all class signups that a specific user has',

    inputs: {

        user: {
            type: 'ref',
            description: 'The user that you want to find signups for',
            required: true
        },

        startDate: {
            type: 'ref',
            description: 'Find signups for classes starting on this date or later',
            required: false
        },

        endDate: {
            type: 'ref',
            description: 'Find signups for classes starting on this date or earlier',
            required: false
        }

    },

    exits: {
        success: {},

        userNotFound: {
            description: 'The specified user was not found in the database'
        },

        startDateTooEarly: {
            description: 'startDate must be in 2017 or later'
        },

        endDateEarlierThanStartDate: {
            description: 'endDate must be later than or equal to startDate'
        },

        dateRangeTooLong: {
            description: 'Date range can not be more than a year'
        }

    },

    async fn(inputs, exits) {

        const user = await User.findOne(
            sails.helpers.util.idOrObjectIdInteger(inputs.user)
        );
        if (!user || user.archived) {
            throw 'userNotFound';
        }

        const startDate = inputs.startDate ? moment(inputs.startDate, 'YYYY-MM-DD') : moment();
        const endDate = inputs.endDate ? moment(inputs.endDate, 'YYYY-MM-DD') : moment(startDate).add(1, 'year').subtract(1, 'day');

        if (startDate.year() < 2017) {
            throw 'startDateTooEarly';
        }

        if (endDate.isBefore(startDate, 'day')) {
            throw 'endDateEarlierThanStartDate';
        }

        if (endDate.diff(startDate, 'year') >= 1) {
            throw 'dateRangeTooLong';
        }

        let SQL = require('../../sql/class-signups-controller/find-class-signups-by-user.sql');

        const rawResult = await sails.sendNativeQuery(SQL, [
            user.id,
            startDate.format('YYYY-MM-DD'),
            endDate.format('YYYY-MM-DD')
        ]);

        return exits.success(rawResult.rows);
    }

};
