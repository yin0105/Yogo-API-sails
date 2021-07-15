const comparePartialObject = require('./compare-partial-object')

module.exports = (dbResultCollection, expectedCollectionData, dataPathDescription) => {

  dataPathDescription = dataPathDescription || 'resultCollection'

  if (!_.isArray(dbResultCollection)) {
    throw new Error(dataPathDescription + ' is not an array')
  }

  _.each(
    expectedCollectionData,
    (expectedRecordData, idx) => {
      comparePartialObject(dbResultCollection[idx], expectedRecordData, dataPathDescription + '[' + idx + ']')
    },
  )

}
