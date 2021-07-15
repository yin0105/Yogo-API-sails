module.exports = {

    friendlyName: 'Db connection wrapper factory',

    description: 'Returns a wrapper that can be used on Waterline queries to make them use a specific database connection, or NOT, if no connection is specified.',

    inputs: {
        dbConnection: {
            type: 'ref',
            description: 'The database connection to use in the wrapper',
            required: false
        }
    },

    sync: true,

    fn: (inputs, exits) => {
        if (inputs.dbConnection) {
            return exits.success(
                function (query) {

                    const wrappedDbConnection = inputs.dbConnection;

                    return query.usingConnection(wrappedDbConnection);
                }
            )
        } else {
            return exits.success(
                function (query) {
                    return query;
                }
            )
        }
    }

};
