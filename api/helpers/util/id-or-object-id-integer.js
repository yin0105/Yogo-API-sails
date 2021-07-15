module.exports = {

    friendlyName: 'Id or object id as integer',

    description: 'Returns input.id if input is an object. Returns input if input is a number. Casts return value to integer',

    sync: true,

    inputs: {
        input: {
            type: 'ref',
            description: 'Can be an integer id or an object with id property.',
            required: true
        }
    },

    fn: (inputs, exits) => {
        const input = inputs.input;
        if (_.isObject(input) && input.id) return exits.success(parseInt(input.id));

        return exits.success(parseInt(input));
    }

};
