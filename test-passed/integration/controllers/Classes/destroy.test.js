const assert = require('assert')

const testClientId = require('../../../global-test-variables').TEST_CLIENT_ID
const fixtures = require('../../../fixtures/factory').fixtures

const supertest = require('supertest')

const {authorizeUserAlice, authorizeAdmin} = require('../../../utils/request-helpers')

describe('controllers.Classes.destroy', async function () {

  before(async () => {

  })

  after(async () => {

  })

  it('should throw forbidden if user is not admin', async () => {

    const class1 = await Class.create({
      client: testClientId,
      class_type: fixtures.classTypeYoga.id,
      date: '2019-05-15',
      start_time: '12:00:00',
      archived: true,
    }).fetch()

    await supertest(sails.hooks.http.app)
      .delete('/classes/' + class1.id + '?client=' + testClientId)
      .expect(403)

    await supertest(sails.hooks.http.app)
      .delete('/classes/' + class1.id + '?client=' + testClientId)
      .use(authorizeUserAlice())
      .expect(403)

    await Class.destroy({id: class1.id})
  })

  it('should fail if class does not exist', async () => {

    await supertest(sails.hooks.http.app)
      .delete('/classes/1?client=' + testClientId)
      .use(authorizeAdmin())
      .expect(400)
      .expect('"No object with ID 1"')

  })

  it('should fail if class is already archived', async () => {

    const archivedClass = await Class.create({
      client: testClientId,
      class_type: fixtures.classTypeYoga.id,
      date: '2019-05-15',
      start_time: '12:00:00',
      archived: true,
    }).fetch()

    await supertest(sails.hooks.http.app)
      .delete('/classes/' + archivedClass.id + '?client=' + testClientId)
      .use(authorizeAdmin())
      .expect(400)

    await Class.destroy({id: archivedClass.id})

  })

  it('should succeed if class has no signups', async () => {

    const class1 = await Class.create({
      client: testClientId,
      class_type: fixtures.classTypeYoga.id,
      date: '2019-05-15',
      start_time: '12:00:00',
    }).fetch()

    await supertest(sails.hooks.http.app)
      .delete('/classes/' + class1.id + '?client=' + testClientId)
      .use(authorizeAdmin())
      .expect(200)

    const destroyedClass = await Class.findOne(class1.id)
    assert(destroyedClass.archived === true)

    await Class.destroy({id: class1.id})

  })

  it('should fail if class has signups and is not cancelled', async () => {

    const class1 = await Class.create({
      client: testClientId,
      class_type: fixtures.classTypeYoga.id,
      date: '2019-05-15',
      start_time: '12:00:00',
    }).fetch()

    const signup = await ClassSignup.create({
      'class': class1.id,
      user: fixtures.userAlice.id,
    }).fetch()

    await supertest(sails.hooks.http.app)
      .delete('/classes/' + class1.id + '?client=' + testClientId)
      .use(authorizeAdmin())
      .expect(400)

    await Class.destroy({id: class1.id})
    await ClassSignup.destroy({id: signup.id})

  })

  it('should succeed if class has signups and is cancelled', async () => {

    const class1 = await Class.create({
      client: testClientId,
      class_type: fixtures.classTypeYoga.id,
      date: '2019-05-15',
      start_time: '12:00:00',
      cancelled: true,
    }).fetch()

    const signup = await ClassSignup.create({
      'class': class1.id,
      user: fixtures.userAlice.id,
    }).fetch()

    await supertest(sails.hooks.http.app)
      .delete('/classes/' + class1.id + '?client=' + testClientId)
      .use(authorizeAdmin())
      .expect(200)

    const destroyedClass = await Class.findOne(class1.id)
    assert(destroyedClass.archived === true)

    await Class.destroy({id: class1.id})
    await ClassSignup.destroy({id: signup.id})

  })


})
