const assert = require('assert');
const compareDbCollection = require('./compare-db-collection');

const assertFail = (message, result, expectedResult) => {
    return assert.fail(
        message + '\n' +
        'The returned result was: \n' +
        _.map(result, resultItem => resultItem.toString() + '\n') +
        'while the expected result was: \n' +
        _.map(expectedResult, expectedItem => expectedItem.toString() + '\n')
    )
};

module.exports = async (asyncFunc, expectedResult) => {

    const result = await asyncFunc();

    if (!_.isArray(result)) return assert.fail('Returned result is not an array.');

    if (result.length !== expectedResult.length) return assertFail('Returned array had the wrong length. Result length: ' + result.length + '. Expected result length: ' + expectedResult.length + '.' , result, expectedResult);

    const sortedResult = _.sortBy(result, 'id');
    const sortedExpectedResult = _.sortBy(expectedResult, 'id');

    try {
        compareDbCollection(
            sortedResult,
            sortedExpectedResult
        );

    } catch(err) {
        assertFail(err.message);
    }




    return assert.ok(true);

};
