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

        //console.log('Class created. Id: ' + class1.id);

    });

    after(async () => {

        await Class.destroy({
            id: class1.id
        });

    });

    it('should prevent locking a row, if there is already a lock on the row. Should wait until the locking transaction has finished', (done) => {

        //console.log('Test started');

        let lockingTransactionEnded = false;
        let secondTransactionDone = false;

        sails.getDatastore().transaction(async (dbConnection, proceed) => {

            //console.log('Locking transaction started');

            const row = await sails.helpers.db.getLockedRowForUpdate.with({
                table: 'class',
                rowId: class1.id,
                dbConnection: dbConnection
            });

            //console.log('Lock aquired');

            setTimeout(
                () => {
                    lockingTransactionEnded = true;
                    assert.equal(
                        secondTransactionDone,
                        false
                    );
                    //console.log('100 ms has passed. Locking transaction timeout done. Ending transaction');
                    proceed();
                },
                100
            );

        }).then();


        setTimeout(() => {
                //console.log('50 ms has passed. Start second transaction.');

                sails.getDatastore().transaction(async (dbConnection, proceed) => {

                    //console.log('Second transaction started');

                    const row = await sails.helpers.db.getLockedRowForUpdate.with({
                        table: 'class',
                        rowId: class1.id,
                        dbConnection: dbConnection
                    });

                    assert.equal(
                        lockingTransactionEnded,
                        true
                    );
                    //console.log('Class was read and row was locked from second transaction. Id: ' + row.id);

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
