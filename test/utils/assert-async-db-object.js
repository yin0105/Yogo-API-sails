const assert = require('assert');

module.exports = async (asyncFunc, expectedResult) => {

    const result = await asyncFunc();

    if (!_.isObject(result)) return assert.fail('Returned result is not an object.');

    _.each(_.keys(expectedResult), key => {
        if (result[key] != expectedResult[key]) return assert.fail(
            'The property "' + key + '" was returned as "' + result[key] + '", while the expected value was "' + expectedResult[key] + '".'
        );
    });

    return assert.ok(true);

};
