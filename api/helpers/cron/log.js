module.exports = {

    friendlyName: 'Cron log',

    description: 'Creates log entry in cron_log',

    inputs: {

        entry: {
            type: 'string',
            required: true
        },

        client: {
            type: 'ref',
            required: false
        },

    },

    fn: async (inputs, exits) => {

        const logData = {
            entry: inputs.entry
        };

        if (inputs.client) {
            logData.client = sails.helpers.util.idOrObjectIdInteger(inputs.client);
        }

        await CronLog.create(logData);

        return exits.success();

    }


};
