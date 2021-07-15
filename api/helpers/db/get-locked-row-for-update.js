module.exports = {

    friendlyName: 'Get locked row for update',

    description: 'Lock the record. Other connections are (I think) not allowed to go past this helper then. There needs to be an active transaction for this to work.',

    inputs: {
        table: {
            type: 'string',
            required: true
        },

        rowId: {
            type: 'number',
            required: true
        },

        dbConnection: {
            type: 'ref',
            description: 'The database connection to use in the wrapper',
            required: true
        },

    },

    fn: async (inputs, exits) => {
        const result = await sails.sendNativeQuery(`SELECT * FROM ${inputs.table} WHERE id = ${inputs.rowId} FOR UPDATE`, [])
            .usingConnection(inputs.dbConnection);

        return exits.success(result.rows[0]);
    }

};
