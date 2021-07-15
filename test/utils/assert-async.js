const assert = require('assert');

module.exports = async (asyncFunc, expectedResult) => {

    const result = await asyncFunc();

    if (result == expectedResult) return assert.ok(true);

    return assert.fail(result, expectedResult);

};
