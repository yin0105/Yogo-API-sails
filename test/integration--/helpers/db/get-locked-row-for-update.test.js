const assert = require('assert');

const assertAsyncThrows = require('../../../utils/assert-async-throws');
const assertAsyncDbObject = require('../../../utils/assert-async-db-object');

const testClientId = require('../../../global-test-variables').TEST_CLIENT_ID;
const fixtures = require('../../../fixtures/factory').fixtures;

describe('helpers.db.getLockedRowForUpdate', async function () {

    let class1;

    before(async () => {

        class1 = await Class.create({
            date: '2018-05-15',
            start_time: '12:00:00',
            end_time: '14:00:00',
            client: testClientId
        }).fetch();

    });

    after(async () => {

        await Class.destroy({
            id: class1.id
        });

    });

    it('should prevent locking a row, if there is already a lock on the row. Should wait until the locking transaction has finished', (done) => {

        let lockingTransactionEnded = false;
        let secondTransactionDone = false;

        sails.getDatastore().transaction(async (dbConnection, proceed) => {

            const row = await sails.helpers.db.getLockedRowForUpdate.with({
                table: 'class',
                rowId: class1.id,
                dbConnection: dbConnection
            });

            setTimeout(
                () => {
                    lockingTransactionEnded = true;
                    assert.equal(
                        secondTransactionDone,
                        true
                    );
                    proceed();
                },
                100
            );

        }).then();


        setTimeout(() => {

                sails.getDatastore().transaction(async (dbConnection, proceed) => {

                    const row = await sails.helpers.db.getLockedRowForUpdate.with({
                        table: 'class',
                        rowId: class1.id,
                        dbConnection: dbConnection
                    });

                    assert.equal(
                        lockingTransactionEnded,
                        false
                    );

                    secondTransactionDone = true;

                    proceed();

                }).then();
            },
            50
        );

        setTimeout(
            () => {
                assert.equal(
                    lockingTransactionEnded,
                    true
                );
                assert.equal(
                    secondTransactionDone,
                    true
                );

                done();

            },
            150
        );


    });

});
