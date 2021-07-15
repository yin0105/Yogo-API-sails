const assert = require('assert')

module.exports = async (asyncFunc, expectedErr) => {

  let result

  try {

    result = await asyncFunc()

  } catch (err) {

    if (_.isString(expectedErr)) {
      if (err.code === expectedErr) return assert.ok(true)
      return assert.fail(new Error(err.code + ' != ' + expectedErr + ". The error thrown was: " + err.type + ' ' + err.name + ' ' + err.code + ' ' + err.message))
    } else if (expectedErr.message) {
      if (err.message === expectedErr.message) return assert.ok(true)
      throw new Error(err.message + ' != ' + expectedErr.message + ". The error thrown was: " + err.type + ' ' + err.name + ' ' + err.message)
    } else if (typeof expectedErr === 'function') {
      return expectedErr(err)
    } else {
      return assert.fail(new Error('expectedErr format is invalid'))
    }

  }

  return assert.fail(new Error('Did not throw exception. Function returned: ' + result))

}
