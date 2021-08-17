const supertest = require('supertest');

const testClientId = require('../../../global-test-variables').TEST_CLIENT_ID;
const fixtures = require('../../../fixtures/factory').fixtures;
const {authorizeAdmin} = require('../../../utils/request-helpers');

const assert = require('assert');

const sinon = require('sinon');


const newUserData = {
  first_name: 'UserFirstName',
  last_name: 'UserLastName',
  address_1: 'UserAddress',
  address_2: 'UserAddress2',
  zip_code: 'UserZipCode',
  city: 'UserCity',
  country: 'UserCountry',
  phone: 'UserPhone',
  email: 'useremail@yogo.dk',
  date_of_birth: '1990-01-01',
  password: 'secretPassword',
  customer_additional_info: 'UserAdditionalInfo',
  teacher_description: 'TeacherDescription',
  teacher: true,
  customer: true,
  admin: true,
  checkin: true,
  teacher_can_manage_all_classes: true
};

describe('controllers.Users.create', () => {

  let emailSendFake;

  before(async () => {
    newUserData.image = fixtures.image1.id;

    emailSendFake = sinon.fake();
    emailSendFake.with = emailSendFake;
    sinon.replace(sails.helpers.email, 'send', emailSendFake);
  });

  afterEach(async () => {
    emailSendFake.resetHistory();
  });

  after(async () => {
    sinon.restore();
  });

  describe('admin creating user', async () => {

    it('should return an error if the new email is already in use', async () => {

      const newUserDataWithExistingEmail = _.chain(newUserData)
        .cloneDeep()
        .assign({email: fixtures.userAlice.email})
        .value();

      const response = await supertest(sails.hooks.http.app)
        .post(
          '/users?client=' + testClientId)
        .send(newUserDataWithExistingEmail)
        .use(authorizeAdmin())
        .expect(200);


      assert.strictEqual(
        response.text,
        'E_EMAIL_EXISTS',
      );
    });

    it('should create user including settings for admin, checkin, teacher and customer', async () => {

      const response = await supertest(sails.hooks.http.app)
        .post(
          '/users?client=' + testClientId)
        .send(newUserData)
        .use(authorizeAdmin())
        .expect(200);

      expect(response.body).to.matchPattern(
        `{
          id: _.isInteger,
          createdAt: _.isInteger,
          updatedAt: _.isInteger, 
          client: ${testClientId},
          archived: false,
          first_name: 'UserFirstName',
          last_name: 'UserLastName',
          address_1: 'UserAddress',
          address_2: 'UserAddress2',
          zip_code: 'UserZipCode',
          city: 'UserCity',
          country: 'UserCountry',
          phone: 'UserPhone',
          email: 'useremail@yogo.dk',
          date_of_birth: '1990-01-01',
          image: ${fixtures.image1.id},
          customer_additional_info: 'UserAdditionalInfo',
          teacher_description: 'TeacherDescription',
          email_confirmed: false,
          teacher: true,
          customer: true,
          admin: true,
          checkin: true,
          import_welcome_set_password_email_sent: false,
          id_in_previous_booking_system: '',
          teacher_can_manage_all_classes: true,
          livestream_time_display_mode: 'remaining',
          classpass_com_user_id: null
        }`,
      );

      expect(emailSendFake.callCount).to.equal(0);

      const createdDbUser = await User.findOne({id: response.body.id});
      expect(createdDbUser).to.matchPattern(
        `{
          teacher_ical_token: /^[a-f\\d]{8}-[a-f\\d]{4}-[a-f\\d]{4}-[a-f\\d]{4}-[a-f\\d]{12}$/,
          ... 
        }`,
      );

      await User.destroy({id: response.body.id});

    });

    it('should allow empty date_of_birth', async () => {

      const data = _.omit(newUserData, 'date_of_birth');

      const response = await supertest(sails.hooks.http.app)
        .post(
          '/users?client=' + testClientId)
        .send(data)
        .use(authorizeAdmin())
        .expect(200);

      expect(response.body).to.matchPattern(`
        {       
          first_name: 'UserFirstName',
          last_name: 'UserLastName',         
          email: 'useremail@yogo.dk',
          date_of_birth: null,
          ...      
        }`,
      );

      await User.destroy({id: response.body.id});

    });

    it('should allow date_of_birth to be null', async () => {

      const data = _.assign(_.cloneDeep(newUserData), {date_of_birth: null});

      const response = await supertest(sails.hooks.http.app)
        .post(
          '/users?client=' + testClientId)
        .send(data)
        .use(authorizeAdmin())
        .expect(200);

      expect(response.body).to.matchPattern(`
        {       
          first_name: 'UserFirstName',
          last_name: 'UserLastName',         
          email: 'useremail@yogo.dk',
          date_of_birth: null,
          ...      
        }`,
      );

      await User.destroy({id: response.body.id});

    });

    it('should trim whitespace on input', async () => {

      const data = _.chain(newUserData)
        .cloneDeep()
        .assign({
          first_name: ' UserFirstName',
          last_name: 'UserLastName ',
          email: ' useremail@yogo.dk   ',
        })
        .value();

      const response = await supertest(sails.hooks.http.app)
        .post(
          '/users?client=' + testClientId)
        .use(authorizeAdmin())
        .send(data)
        .expect(200);


      expect(response.body).to.matchPattern(`
        {       
          first_name: 'UserFirstName',
          last_name: 'UserLastName',         
          email: 'useremail@yogo.dk',
          ...      
        }`,
      );

      await User.destroy({id: response.body.id});

    });


  });

  describe('customer creating user', async () => {

    it('should return an error if the new email is already in use', async () => {

      const newUserDataWithExistingEmail = _.chain(newUserData)
        .cloneDeep()
        .assign({email: fixtures.userAlice.email})
        .value();

      const response = await supertest(sails.hooks.http.app)
        .post(
          '/users?client=' + testClientId)
        .send(newUserDataWithExistingEmail)
        .expect(200);


      assert.strictEqual(
        response.text,
        'E_EMAIL_EXISTS',
      );
    });

    it('should create user, exclude settings for admin, checkin, teacher and customer, return access token', async () => {

      const response = await supertest(sails.hooks.http.app)
        .post(
          '/users?client=' + testClientId)
        .send(newUserData)
        .expect(200);

      const createdUser = response.body.user;

      expect(createdUser).to.matchPattern(`
        {
          id: _.isInteger,
          createdAt: _.isInteger,
          updatedAt: _.isInteger,
          client: ${testClientId},
          archived: false,
          first_name: 'UserFirstName',
          last_name: 'UserLastName',
          address_1: 'UserAddress',
          address_2: 'UserAddress2',
          zip_code: 'UserZipCode',
          city: 'UserCity',
          country: 'UserCountry',
          phone: 'UserPhone',
          email: 'useremail@yogo.dk',
          date_of_birth: '1990-01-01',
          image: ${fixtures.image1.id},
          customer_additional_info: 'UserAdditionalInfo',
          teacher_description: '',
          email_confirmed: false,
          teacher: false,
          customer: true,
          admin: false,
          checkin: false,
          teacher_can_manage_all_classes: false,
          livestream_time_display_mode: 'remaining',
          classpass_com_user_id: null                 
        }`,
      );

      assert(
        _.isString(response.body.token) && response.body.token.length > 10,
      );

      expect(emailSendFake.firstCall.args[0]).to.matchPattern(`
        {
          user: {id: ${createdUser.id}, ... },
          subject: 'Welcome to Test client',
          ...
        }
      `);

      const createdDbUser = await User.findOne({id: createdUser.id});

      expect(createdDbUser).to.matchPattern(
        `{
          teacher_ical_token: /^[a-f\\d]{8}-[a-f\\d]{4}-[a-f\\d]{4}-[a-f\\d]{4}-[a-f\\d]{12}$/,
          ...
        }`,
      );


      await User.destroy({id: response.body.user.id});

    });

    it('should allow empty date_of_birth', async () => {

      const data = _.omit(newUserData, 'date_of_birth');

      const response = await supertest(sails.hooks.http.app)
        .post(
          '/users?client=' + testClientId)
        .send(data)
        .expect(200);

      expect(response.body.user).to.matchPattern(`
        {       
          first_name: 'UserFirstName',
          last_name: 'UserLastName',         
          email: 'useremail@yogo.dk',
          date_of_birth: null,
          ...      
        }`,
      );

      await User.destroy({id: response.body.user.id});

    });

    it('should allow date_of_birth to be null', async () => {

      const data = _.assign(_.cloneDeep(newUserData), {date_of_birth: null});

      const response = await supertest(sails.hooks.http.app)
        .post(
          '/users?client=' + testClientId)
        .send(data)
        .expect(200);

      expect(response.body.user).to.matchPattern(`
        {       
          first_name: 'UserFirstName',
          last_name: 'UserLastName',         
          email: 'useremail@yogo.dk',
          date_of_birth: null,
          ...      
        }`,
      );

      await User.destroy({id: response.body.user.id});

    });

    it('should trim whitespace on input', async () => {

      const data = _.chain(newUserData)
        .cloneDeep()
        .assign({
          first_name: ' UserFirstName',
          last_name: 'UserLastName ',
          email: ' useremail@yogo.dk   ',
        })
        .value();

      const response = await supertest(sails.hooks.http.app)
        .post(
          '/users?client=' + testClientId)
        .send(data)
        .expect(200);


      expect(response.body.user).to.matchPattern(`
        {       
          first_name: 'UserFirstName',
          last_name: 'UserLastName',         
          email: 'useremail@yogo.dk',
          ...      
        }`,
      );

      await User.destroy({id: response.body.user.id});

    });

    it('should return password in welcome email if [password] is in the template', async () => {

      const clientSettingsRow = await ClientSettings.create({
        client: testClientId,
        key: 'email_welcome_body',
        value: '[password]',
      }).fetch();

      const response = await supertest(sails.hooks.http.app)
        .post(
          '/users?client=' + testClientId)
        .send(newUserData)
        .expect(200);

      const createdUser = response.body.user

      expect(emailSendFake.firstCall.args[0]).to.matchPattern(`
        {
          user: {id: ${createdUser.id}, ... },
          subject: 'Welcome to Test client',
          text: 'secretPassword',
          ...
        }
      `);

      await ClientSettings.destroy({id: clientSettingsRow.id});
      await User.destroy({id: response.body.user.id});

    });

  });

});
