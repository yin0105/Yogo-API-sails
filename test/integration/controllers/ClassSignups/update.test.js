const supertest = require('supertest');

const testClientId = require('../../../global-test-variables').TEST_CLIENT_ID;
const fixtures = require('../../../fixtures/factory').fixtures;

const compareDbCollection = require('../../../utils/compare-db-collection');
const comparePartialObject = require('../../../utils/compare-partial-object');

const assert = require('assert');

const MockDate = require('mockdate');


describe('controllers.ClassSignups.update', () => {

    let class1,
        class2,
        signupClass1UserA,
        signupClass2UserA;

    before(async () => {
        class1 = await Class.create({
            date: '2018-05-15',
            start_time: '10:00:00',
            end_time: '12:00:00',
            client: testClientId,
            seats: 1
        }).fetch();

    });

    after(async () => {
        await Class.destroy({
            id: class1.id
        });
    });


    it('should update only checked_in field on an existing signup. Test check in', async () => {

        const signup = await ClassSignup.create({
            'class': class1.id,
            user: fixtures.userAlice.id,
            client: testClientId
        }).fetch();

        const response = await supertest(sails.hooks.http.app)
            .put(
                '/class-signups/' + signup.id +
                '?client=' + testClientId
            )
            .send({
                'class': 99999999,
                user: fixtures.userBill.id,
                used_membership: 99999999,
                checked_in: 55555555
            })
            .set('Authorization', 'Bearer ' + fixtures.userAdminAccessToken)
            .set('X-Yogo-Request-Context', 'admin')
            .expect(200);

        const result = JSON.parse(response.text);

        comparePartialObject(
            result,
            {
                'class': class1.id,
                user: fixtures.userAlice.id,
                used_membership: null,
                checked_in: 55555555
            }
        );
        responseSignupId = result.id;

        const updatedSignup = await ClassSignup.findOne(responseSignupId);

        comparePartialObject(
            updatedSignup,
            {
                id: responseSignupId,
                'class': class1.id,
                user: fixtures.userAlice.id,
                used_membership: null,
                checked_in: 55555555
            }
        );

        // Clean up
        await ClassSignup.destroy({id: signup.id});

    });

    it('should update only checked_in field on an existing signup. Test check out', async () => {

        const signup = await ClassSignup.create({
            'class': class1.id,
            user: fixtures.userAlice.id,
            client: testClientId,
            used_membership: 99999999,
            checked_in: 55555555
        }).fetch();

        const response = await supertest(sails.hooks.http.app)
            .put(
                '/class-signups/' + signup.id +
                '?client=' + testClientId
            )
            .send({
                'class': 99999999,
                user: fixtures.userBill.id,
                used_membership: 0,
                checked_in: 0
            })
            .set('Authorization', 'Bearer ' + fixtures.userAdminAccessToken)
            .set('X-Yogo-Request-Context', 'admin')
            .expect(200);

        const result = JSON.parse(response.text);

        comparePartialObject(
            result,
            {
                'class': class1.id,
                user: fixtures.userAlice.id,
                used_membership: 99999999,
                checked_in: 0
            }
        );
        responseSignupId = result.id;

        const updatedSignup = await ClassSignup.findOne(responseSignupId);

        comparePartialObject(
            updatedSignup,
            {
                id: responseSignupId,
                'class': class1.id,
                user: fixtures.userAlice.id,
                used_membership: 99999999,
                checked_in: 0
            }
        );

        // Clean up
        await ClassSignup.destroy({id: signup.id});

    });

});
