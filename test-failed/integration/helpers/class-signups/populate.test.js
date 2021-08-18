const assert = require('assert');
const assertAsyncThrows = require('../../../utils/assert-async-throws');
const assertAsyncDbObject = require('../../../utils/assert-async-db-object');
const assertAsyncDbCollection = require('../../../utils/assert-async-db-collection');

const testClientId = require('../../../global-test-variables').TEST_CLIENT_ID;
const fixtures = require('../../../fixtures/factory').fixtures;

describe('helpers.classSignups.populate (incomplete test)', async function () {


    it('should return classSignups unchanged if populateFields is not specified.', async () => {

        await assertAsyncDbCollection(
            async () => {
                return await sails.helpers.classSignups.populate.with({
                    classSignups: [
                        {
                            id: 123,
                            user: 123,
                            'class': 123
                        }
                    ]
                })
            },
            [{
                id: 123,
                user: 123,
                'class': 123
            }]
        );

    });

    it('should throw "populateFieldsInvalid" if populateFields is specified, but not an array.', async () => {

        await assertAsyncThrows(
            async () => {
                await sails.helpers.classSignups.populate.with({
                    classSignups: [],
                    populateFields: "123"
                })
            },
            'populateFieldsInvalid'
        );

    });


});
