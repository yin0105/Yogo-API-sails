const { fixtures } = require('../fixtures/factory')
const qs = require('qs')

const authorize = exports.authorize = (token, context) => {
  if (!token) {
    throw new Error('Missing argument `token`.')
  }

  const bearer = `Bearer ${token}`
  return request => {
    request.set('Authorization', bearer)
    if (context) {
      request.set('X-Yogo-Request-Context', context)
    }

    return request
  }
}

exports.authorizeAdmin = (token = fixtures.userAdminAccessToken) =>
  authorize(token, 'admin')

exports.authorizeUserAlice = (token = fixtures.userAliceAccessToken) =>
  authorize(token)

exports.authorizeUserBill = (token = fixtures.userBillAccessToken) =>
  authorize(token)

exports.authorizeUserCharlie = (token = fixtures.userCharlieAccessToken) =>
  authorize(token)

exports.authorizeUserDennis = (token = fixtures.userDennisAccessToken) =>
  authorize(token)

exports.authorizeTeacherEvelyn = (token = fixtures.userEvelynAccessToken) =>
  authorize(token, 'teacher')

exports.authorizeTeacherFiona = (token = fixtures.userFionaAccessToken) =>
  authorize(token, 'teacher')

exports.stringifyQuery = (query, options = {}) => qs.stringify(query, {
    arrayFormat: 'brackets',
    ...options
  })

exports.acceptExtendedErrorFormat = () => (request) => {
    request.set('X-Yogo-Client-Accepts-Extended-Error-Format', 1)
    return request;
}
