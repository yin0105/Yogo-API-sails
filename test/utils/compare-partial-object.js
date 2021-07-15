const assert = require('assert')
let comparePartialObject;
const moment = require('moment-timezone')

module.exports = comparePartialObject = (dbResultRecord, expectedRecordData, dataPathDescription) => {
  dataPathDescription = dataPathDescription || 'resultRecord';
  _.each(
    expectedRecordData,
    (expectedFieldValue, key) => {
        //console.log('dbResultRecord', dbResultRecord)
        //console.log('Expected:',key, expectedFieldValue)

      if (typeof dbResultRecord[key] === 'undefined' && expectedFieldValue !== 'UNDEFINED') throw new Error(
        'Error in ' + dataPathDescription + ': The property "' + key + '" does not exist.\n' +
        dbResultRecord,
        expectedRecordData
      );

      if (_.isArray(expectedFieldValue)) {

        //compareDbCollection(dbResultRecord[key], expectedFieldValue, dataPathDescription  );
        if (expectedFieldValue.length !== dbResultRecord[key].length) {
          throw new Error(
            'Error in ' + dataPathDescription + '.' + key + ': Data length was expected to be ' + expectedFieldValue.length + ' but was ' + dbResultRecord[key].length,
            dbResultRecord,
            expectedRecordData
          )
        }

        _.each(
          expectedFieldValue,
          (expectedFieldValueItem, idx) => {
            comparePartialObject(dbResultRecord[key][idx], expectedFieldValueItem, dataPathDescription + '.' + key + '[' + idx + ']')
          },
        )

      } else if (moment.isMoment(expectedFieldValue)) {
        if (!moment.isMoment(dbResultRecord[key]) && !typeof dbResultRecord[key].getMonth === 'function') throw new Error(
          'Error in ' + dataPathDescription + ': The returned value is not a Date or moment.js object.'
        )
        assert.strictEqual(
          moment(dbResultRecord[key]).format('x'),
          expectedFieldValue.format('x'),
          'Error in ' + dataPathDescription + ': The two moment.js objects does not refer to the same time.'
        )

      } else if (_.isObject(expectedFieldValue)) {

        comparePartialObject(dbResultRecord[key], expectedFieldValue, dataPathDescription + '.' + key);

      } else if (expectedFieldValue === 'POSITIVE_INTEGER') {

        if (dbResultRecord[key] <= 0) throw new Error(
          'Error in ' + dataPathDescription + ': The property "' + key + '" was returned as "' + dbResultRecord[key] + '", while the expected value was a positive integer.\n' +
          dbResultRecord +
          expectedRecordData
        )

      } else if (expectedFieldValue === 'UNDEFINED') {

        if (typeof dbResultRecord[key] !== 'undefined') throw new Error(
          'Error in ' + dataPathDescription + ': The property "' + key + '" was returned as "' + dbResultRecord[key] + '", while it was expected to be undefined.\n' +
          dbResultRecord +
          expectedRecordData
        )

      } else if (dbResultRecord[key] != expectedFieldValue) throw new Error(

        'Error in ' + dataPathDescription + ': The property "' + key + '" was returned as "' + dbResultRecord[key] + '", while the expected value was "' + expectedFieldValue + '".\n' +
        dbResultRecord +
        expectedRecordData

      );
    }
  );
};
