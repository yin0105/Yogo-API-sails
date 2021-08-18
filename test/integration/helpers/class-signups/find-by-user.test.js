const assert = require('assert');

const assertAsyncThrows = require('../../../utils/assert-async-throws');
const assertAsyncDbObject = require('../../../utils/assert-async-db-object');

const testClientId = require('../../../global-test-variables').TEST_CLIENT_ID;
const fixtures = require('../../../fixtures/factory').fixtures;

const MockDate = require('mockdate');

const compareNumbers = function (a, b) {
    return a - b;
};

describe('helpers.classSignups.findByUser', async function () {

    let classes = [],
        signups = [],
        archivedClass,
        archivedSignup,
        signupForArchivedClass,
        signupForNonexistingClass,
        signupUserBill;

    before(async () => {

      await Class.destroy({})
        // CREATE CLASSES AND SIGNUPS
        const classData = [
            '2016-12-31', // 0
            '2017-12-31',
            '2018-01-01',
            '2018-02-28',

            '2018-03-15', // 4
            '2018-03-16',
            '2019-03-15',
            '2019-03-16' // 7
        ];

        await Promise.all(_.map(
            classData,
            async (date, idx) => {
                classes[idx] = await Class.create({
                    date: date,
                    client: testClientId
                }).fetch();
                signups[idx] = await ClassSignup.create({
                    'class': classes[idx].id,
                    user: fixtures.userAlice.id,
                    client: testClientId
                }).fetch();
            }
        ));

        archivedSignup = await ClassSignup.create({
            'class': classes[4].id,
            user: fixtures.userAlice.id,
            archived: true
        }).fetch();

        archivedClass = await Class.create({
            date: '2018-05-15',
            client: testClientId,
            archived: true
        }).fetch();

        signupForArchivedClass = await ClassSignup.create({
            'class': archivedClass.id,
            user: fixtures.userAlice.id
        }).fetch();


        signupForNonexistingClass = await ClassSignup.create({
            'class': 999999,
            user: fixtures.userAlice.id
        }).fetch();

        signupUserBill = await ClassSignup.create({
            'class': classes[4].id,
            user: fixtures.userBill.id
        }).fetch();


    });

    after(async () => {
        await ClassSignup.destroy({
            id: _.map(signups, 'id')
        });
        await ClassSignup.destroy({
            id: _.map(
                [
                    archivedSignup,
                    signupForArchivedClass,
                    signupForNonexistingClass,
                    signupUserBill
                ],
                'id'
            )
        });

        await Class.destroy({
            id: _.map(classes, 'id')
        });

        await Class.destroy({
            id: archivedClass.id
        });

    });

    it('should throw "userNotFound" if user is not in the database. Test with ID input.', async () => {

        await assertAsyncThrows(
            async () => {
                await sails.helpers.classSignups.findByUser.with({
                    user: 9999999
                });
            },
            'userNotFound'
        )

    });

    it('should throw "userNotFound" if user is not in the database. Test with object input.', async () => {

        await assertAsyncThrows(
            async () => {
                await sails.helpers.classSignups.findByUser.with({
                    user: {
                        id: 9999999
                    }
                });
            },
            'userNotFound'
        )

    });

    it('should throw "userNotFound" if user is not in the database. Test with archived user.', async () => {

        const archivedUser = await User.create({
            archived: true,
            email: 'tester@example.com'
        }).fetch();

        await assertAsyncThrows(
            async () => {
                await sails.helpers.classSignups.findByUser.with({
                    user: archivedUser
                })
            },
            'userNotFound'
        );

        await User.destroy({
            id: archivedUser.id
        });

    });


    it('should set startDate and endDate to current date / current date + 1 year - 1 day, respectively, if nothing is specified', async () => {

        MockDate.set('3/16/2018');

        const result = await sails.helpers.classSignups.findByUser.with({
            user: fixtures.userAlice,
        });

        console.log("result = ", result)

        assert.deepEqual(
            _.map(result, 'id').sort(compareNumbers),
            [
                signups[5].id,
                signups[6].id
            ].sort(compareNumbers)
        );

        MockDate.reset();

    });

    it('should accept startDate and endDate as "YYYY-MM-DD" if specified', async () => {

        MockDate.set('3/16/2018');

        const result = await sails.helpers.classSignups.findByUser.with({
            user: fixtures.userAlice,
            startDate: '2018-01-01',
            endDate: '2018-03-15'
        });

        assert.deepEqual(
            _.map(result, 'id').sort(compareNumbers),
            [
                signups[2].id,
                signups[3].id,
                signups[4].id
            ].sort(compareNumbers)
        );

        MockDate.reset();

    });

    it('should throw "startDateTooEarly" if startDate is before the year 2017', async () => {

        await assertAsyncThrows(
            async () => {
                await sails.helpers.classSignups.findByUser.with({
                    user: fixtures.userAlice,
                    startDate: '2016-12-31'
                });
            },
            'startDateTooEarly'
        );

    });


    it('should throw "endDateEarlierThanStartDate" if endDate is before startDate', async () => {

        await assertAsyncThrows(
            async () => {
                await sails.helpers.classSignups.findByUser.with({
                    user: fixtures.userAlice,
                    startDate: '2018-12-31',
                    endDate: '2018-12-30'
                });
            },
            'endDateEarlierThanStartDate'
        );

    });


    it('should throw "dateRangeTooLong" if date range is longer than a year', async () => {

        await assertAsyncThrows(
            async () => {
                await sails.helpers.classSignups.findByUser.with({
                    user: fixtures.userAlice,
                    startDate: '2018-01-01',
                    endDate: '2019-01-01'
                });
            },
            'dateRangeTooLong'
        );

    });

});
