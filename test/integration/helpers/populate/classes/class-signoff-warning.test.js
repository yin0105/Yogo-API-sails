const fixtures = require('../../../../fixtures/factory').fixtures;
const testClientId = require('../../../../global-test-variables').TEST_CLIENT_ID;
const assert = require('assert');
const MockDate = require('mockdate');
const moment = require('moment-timezone');

describe('helpers.populate.classes.class-signoff-warning', async function () {

  let
    class1,
    privateClass1,
    allClasses;

  before(async () => {

    class1 = await Class.create({
      client: testClientId,
      seats: 20,
      class_type: fixtures.classTypeYoga.id,
      date: '2019-05-16',
      start_time: '10:00:00',
    }).fetch();
    privateClass1 = await Class.create({
      client: testClientId,
      seats: 1,
      class_type: fixtures.classTypeYoga.id,
      date: '2019-05-16',
      start_time: '12:00:00',
    }).fetch();

    allClasses = [class1, privateClass1];

    MockDate.set(moment.tz('2019-05-01 00:00:00', 'Europe/Copenhagen'));

  });

  after(async () => {
    await Class.destroy({
      id: [class1.id, privateClass1.id],
    });
    MockDate.reset();
  });


  it('should return an empty array if input is empty', async () => {

    const result = await sails.helpers.populate.classes.classSignoffWarning([]);

    assert(_.isArray(result) && result.length === 0);

  });


  it('should return input array unchanged if input is already populated', async () => {

    const workingCopy = _.map(_.cloneDeep(allClasses), cls => {
      cls.class_signoff_warning = 'Test warning';
      return cls;
    });

    await sails.helpers.populate.classes.classSignoffWarning(workingCopy);

    assert.deepStrictEqual(
      _.map(workingCopy, 'class_signoff_warning'),
      ['Test warning', 'Test warning'],
    );

  });

  it('should return null if user is not specified', async () => {

    let workingCopy = _.cloneDeep(allClasses);

    await sails.helpers.populate.classes.classSignoffWarning(workingCopy);

    expect(workingCopy).to.matchPattern(`
      [
        {
          class_signoff_warning: null,
          ...
        },
        {
          class_signoff_warning: null,
          ...
        },
      ]`,
    );

  });

  it('should return null if user is not signed up', async () => {

    let workingCopy = _.cloneDeep(allClasses);

    await sails.helpers.populate.classes.classSignoffWarning(workingCopy, fixtures.userAlice);

    expect(workingCopy).to.matchPattern(`
      [
        {
          class_signoff_warning: null,
          ...
        },
        {
          class_signoff_warning: null,
          ...
        },
      ]`,
    );

  });


  it('should return Class.class_signoff_warning for signup with fixed count class pass, in English', async () => {
    let workingCopy = _.cloneDeep(allClasses);

    const classPass = await ClassPass.create({
      client: testClientId,
      user: fixtures.userAlice.id,
      class_pass_type: fixtures.classPassTypeYogaTenClasses.id,
      classes_left: 9,
    }).fetch();

    const signups = await ClassSignup.createEach([
      {
        client: testClientId,
        class: class1.id,
        user: fixtures.userAlice.id,
        used_class_pass: classPass.id,
      },
      {
        client: testClientId,
        class: privateClass1.id,
        user: fixtures.userAlice.id,
        used_class_pass: classPass.id,
      },
    ]).fetch();

    await sails.helpers.populate.classes.classSignoffWarning(workingCopy, fixtures.userAlice.id);

    expect(workingCopy).to.matchPattern(`
      [
        {
          class_signoff_warning: 'There is less than 2 hours before the class starts, so the class will not be refunded to your class pass.\\n\\nOf course, we would appreciate that you cancel if you can not attend, so someone else can get your seat.\\n\\nDo you want to cancel your booking?',
          ...
        },
        {
          class_signoff_warning: 'There is less than 1 day before your private class starts, so the class will not be refunded.\\n\\nOf course, we would appreciate that you cancel if you can not attend.\\n\\nDo you want to cancel your booking?',
          ...
        },
      ]`,
    );

    await ClassSignup.destroy({id: _.map(signups, 'id')});
    await ClassPass.destroy({id: classPass.id});

  });

  it('should return Class.class_signoff_warning for signup with fixed count class pass, in Danish', async () => {

    const oldLocale = sails.yogo ? sails.yogo.locale : undefined;
    sails.yogo = sails.yogo || {};
    sails.yogo.locale = 'da';

    let workingCopy = _.cloneDeep(allClasses);

    const classPass = await ClassPass.create({
      client: testClientId,
      user: fixtures.userAlice.id,
      class_pass_type: fixtures.classPassTypeYogaTenClasses.id,
      classes_left: 9,
    }).fetch();

    const signups = await ClassSignup.createEach([
      {
        client: testClientId,
        class: class1.id,
        user: fixtures.userAlice.id,
        used_class_pass: classPass.id,
      },
      {
        client: testClientId,
        class: privateClass1.id,
        user: fixtures.userAlice.id,
        used_class_pass: classPass.id,
      },
    ]).fetch();

    await sails.helpers.populate.classes.classSignoffWarning(workingCopy, fixtures.userAlice);

    expect(workingCopy).to.matchPattern(`
      [
        {
          class_signoff_warning: 'Der er mindre end 2 timer til holdet starter, og du vil derfor ikke få refunderet det klip, du har brugt til at tilmelde dig.\\n\\nVi sætter naturligvis pris på at du afmelder dig hvis du er forhindret, så en anden kan få pladsen.\\n\\nVil du afmelde dig fra holdet?',
          ...
        },
        {
          class_signoff_warning: 'Der er mindre end 1 dag til din aftale starter, og du vil derfor ikke få refunderet det klip, du har brugt til at tilmelde dig.\\n\\nVi sætter naturligvis pris på at du afmelder dig hvis du er forhindret, så en anden kan få pladsen.\\n\\nVil du afmelde dig?',
          ...
        },
      ]`,
    );

    sails.yogo.locale = oldLocale;

    await ClassSignup.destroy({id: _.map(signups, 'id')});
    await ClassPass.destroy({id: classPass.id});

  });

  it('should return Class.class_signoff_warning for signup with fixed count class pass when fees are different', async () => {
    let workingCopy = _.cloneDeep(allClasses);

    const classPass = await ClassPass.create({
      client: testClientId,
      user: fixtures.userAlice.id,
      class_pass_type: fixtures.classPassTypeYogaTenClasses.id,
      classes_left: 9,
    }).fetch();

    const signups = await ClassSignup.createEach([
      {
        client: testClientId,
        class: class1.id,
        user: fixtures.userAlice.id,
        used_class_pass: classPass.id,
      },
      {
        client: testClientId,
        class: privateClass1.id,
        user: fixtures.userAlice.id,
        used_class_pass: classPass.id,
      },
    ]).fetch();

    const clientSettingsRow = await ClientSettings.create({
      client: testClientId,
      key: 'no_show_fees_and_late_cancel_fees_are_different',
      value: 1,
    }).fetch();

    await sails.helpers.populate.classes.classSignoffWarning(workingCopy, fixtures.userAlice.id);

    expect(workingCopy).to.matchPattern(`
      [
        {
          class_signoff_warning: 'There is less than 2 hours before the class starts, so the class will not be refunded to your class pass.\\n\\nOf course, we would appreciate that you cancel if you can not attend, so someone else can get your seat.\\n\\nDo you want to cancel your booking?',
          ...
        },
        {
          class_signoff_warning: 'There is less than 1 day before your private class starts, so the class will not be refunded.\\n\\nOf course, we would appreciate that you cancel if you can not attend.\\n\\nDo you want to cancel your booking?',
          ...
        },
      ]`,
    );

    await ClassSignup.destroy({id: _.map(signups, 'id')});
    await ClassPass.destroy({id: classPass.id});
    await ClientSettings.destroy({id: clientSettingsRow.id});

  });

  it('should return Class.class_signoff_warning for signup with unlimited class pass, in English', async () => {

    let workingCopy = _.cloneDeep(allClasses);

    const classPass = await ClassPass.create({
      client: testClientId,
      user: fixtures.userAlice.id,
      class_pass_type: fixtures.classPassTypeYogaUnlimitedOneMonth.id,
      classes_left: 9,
    }).fetch();

    const signups = await ClassSignup.createEach([
      {
        client: testClientId,
        class: class1.id,
        user: fixtures.userAlice.id,
        used_class_pass: classPass.id,
      },
      {
        client: testClientId,
        class: privateClass1.id,
        user: fixtures.userAlice.id,
        used_class_pass: classPass.id,
      },
    ]).fetch();

    await sails.helpers.populate.classes.classSignoffWarning(workingCopy, fixtures.userAlice);

    expect(workingCopy).to.matchPattern(`
      [
        {
          class_signoff_warning: 'There is less than 2 hours before the class starts, so cancelling your booking will result in a fee of 1 day being charged from your class pass. The same fee will be applied if you keep the booking but don\\'t attend the class.\\n\\nOf course, we would appreciate that you cancel if you can not attend, so someone else can get your seat.\\n\\nWould you like to cancel your booking?',
          ...
        },
        {
          class_signoff_warning: 'There is less than 1 day before your private class starts, so cancelling your booking will result in a fee of 1 day being charged from your class pass. The same fee will be applied if you keep the booking but don\\'t attend the class.\\n\\nOf course, we would appreciate that you cancel if you can not attend.\\n\\nWould you like to cancel your booking?',
          ...
        },
      ]`,
    );

    await ClassSignup.destroy({id: _.map(signups, 'id')});
    await ClassPass.destroy({id: classPass.id});

  });

  it('should return Class.class_signoff_warning for signup with unlimited class pass, in Danish', async () => {

    const oldLocale = sails.yogo ? sails.yogo.locale : undefined;
    sails.yogo = sails.yogo || {};
    sails.yogo.locale = 'da';

    let workingCopy = _.cloneDeep(allClasses);

    const classPass = await ClassPass.create({
      client: testClientId,
      user: fixtures.userAlice.id,
      class_pass_type: fixtures.classPassTypeYogaUnlimitedOneMonth.id,
      classes_left: 9,
    }).fetch();

    const signups = await ClassSignup.createEach([
      {
        client: testClientId,
        class: class1.id,
        user: fixtures.userAlice.id,
        used_class_pass: classPass.id,
      },
      {
        client: testClientId,
        class: privateClass1.id,
        user: fixtures.userAlice.id,
        used_class_pass: classPass.id,
      },
    ]).fetch();

    await sails.helpers.populate.classes.classSignoffWarning(workingCopy, fixtures.userAlice);

    expect(workingCopy).to.matchPattern(`
      [
        {
          class_signoff_warning: 'Der er mindre end 2 timer til holdet starter, og der vil derfor blive trukket 1 dag fra løbetiden på dit adgangskort. Det samme vil blive trukket hvis du beholder tilmeldingen men ikke møder op.\\n\\nVi sætter naturligvis pris på at du afmelder dig hvis du er forhindret, så en anden kan få pladsen.\\n\\nVil du afmelde dig fra holdet?',
          ...
        },
        {
          class_signoff_warning: 'Der er mindre end 1 dag til din aftale starter, og der vil derfor blive trukket 1 dag fra løbetiden på dit adgangskort. Det samme vil blive trukket hvis du beholder tilmeldingen men ikke møder op.\\n\\nVi sætter naturligvis pris på at du afmelder dig hvis du er forhindret, så en anden kan få pladsen.\\n\\nVil du afmelde dig?',
          ...
        },
      ]`,
    );

    sails.yogo.locale = oldLocale;

    await ClassSignup.destroy({id: _.map(signups, 'id')});
    await ClassPass.destroy({id: classPass.id});

  });

  it('should return Class.class_signoff_warning for signup with unlimited class pass when fees are different', async () => {

    let workingCopy = _.cloneDeep(allClasses);

    const classPass = await ClassPass.create({
      client: testClientId,
      user: fixtures.userAlice.id,
      class_pass_type: fixtures.classPassTypeYogaUnlimitedOneMonth.id,
      classes_left: 9,
    }).fetch();

    const signups = await ClassSignup.createEach([
      {
        client: testClientId,
        class: class1.id,
        user: fixtures.userAlice.id,
        used_class_pass: classPass.id,
      },
      {
        client: testClientId,
        class: privateClass1.id,
        user: fixtures.userAlice.id,
        used_class_pass: classPass.id,
      },
    ]).fetch();

    const clientSettingsRows = await ClientSettings.createEach([
      {
        client: testClientId,
        key: 'no_show_fees_and_late_cancel_fees_are_different',
        value: 1,
      },
      {
        client: testClientId,
        key: 'no_show_time_based_class_pass_deduct_number_of_days',
        value: 5,
      },
      {
        client: testClientId,
        key: 'late_cancel_time_based_class_pass_deduct_number_of_days',
        value: 2,
      },
    ]).fetch();

    await sails.helpers.populate.classes.classSignoffWarning(workingCopy, fixtures.userAlice);

    expect(workingCopy).to.matchPattern(`
      [
        {
          class_signoff_warning: 'There is less than 2 hours before the class starts, so cancelling your booking will result in a fee of 2 days being charged from your class pass. A fee of 5 days will be applied if you keep the booking but don\\'t attend the class.\\n\\nOf course, we would appreciate that you cancel if you can not attend, so someone else can get your seat.\\n\\nWould you like to cancel your booking?',
          ...
        },
        {
          class_signoff_warning: 'There is less than 1 day before your private class starts, so cancelling your booking will result in a fee of 2 days being charged from your class pass. A fee of 5 days will be applied if you keep the booking but don\\'t attend the class.\\n\\nOf course, we would appreciate that you cancel if you can not attend.\\n\\nWould you like to cancel your booking?',
          ...
        },
      ]`,
    );

    await ClassSignup.destroy({id: _.map(signups, 'id')});
    await ClassPass.destroy({id: classPass.id});
    await ClientSettings.destroy({id: _.map(clientSettingsRows, 'id')});

  });

  it('should return Class.class_signoff_warning for signup with unlimited class pass when fees are different, in Danish', async () => {

    const oldLocale = sails.yogo ? sails.yogo.locale : undefined;
    sails.yogo = sails.yogo || {};
    sails.yogo.locale = 'da';

    let workingCopy = _.cloneDeep(allClasses);

    const classPass = await ClassPass.create({
      client: testClientId,
      user: fixtures.userAlice.id,
      class_pass_type: fixtures.classPassTypeYogaUnlimitedOneMonth.id,
      classes_left: 9,
    }).fetch();

    const signups = await ClassSignup.createEach([
      {
        client: testClientId,
        class: class1.id,
        user: fixtures.userAlice.id,
        used_class_pass: classPass.id,
      },
      {
        client: testClientId,
        class: privateClass1.id,
        user: fixtures.userAlice.id,
        used_class_pass: classPass.id,
      },
    ]).fetch();

    const clientSettingsRows = await ClientSettings.createEach([{
      client: testClientId,
      key: 'no_show_fees_and_late_cancel_fees_are_different',
      value: 1,
    },
      {
        client: testClientId,
        key: 'no_show_time_based_class_pass_deduct_number_of_days',
        value: 5,
      },
      {
        client: testClientId,
        key: 'late_cancel_time_based_class_pass_deduct_number_of_days',
        value: 2,
      },
    ]).fetch();

    await sails.helpers.populate.classes.classSignoffWarning(workingCopy, fixtures.userAlice);

    expect(workingCopy).to.matchPattern(`
      [
         {
          class_signoff_warning: 'Der er mindre end 2 timer til holdet starter, og der vil derfor blive trukket 2 dage fra løbetiden på dit adgangskort. Der vil blive trukket 5 dage fra løbetiden hvis du beholder tilmeldingen men ikke møder op.\\n\\nVi sætter naturligvis pris på at du afmelder dig hvis du er forhindret, så en anden kan få pladsen.\\n\\nVil du afmelde dig fra holdet?',
          ...
        },
        {
          class_signoff_warning: 'Der er mindre end 1 dag til din aftale starter, og der vil derfor blive trukket 2 dage fra løbetiden på dit adgangskort. Der vil blive trukket 5 dage fra løbetiden hvis du beholder tilmeldingen men ikke møder op.\\n\\nVi sætter naturligvis pris på at du afmelder dig hvis du er forhindret, så en anden kan få pladsen.\\n\\nVil du afmelde dig?',
          ...
        },
      ]`,
    );

    sails.yogo.locale = oldLocale;

    await ClassSignup.destroy({id: _.map(signups, 'id')});
    await ClassPass.destroy({id: classPass.id});
    await ClientSettings.destroy({id: _.map(clientSettingsRows, 'id')});

  });

  it('should return Class.class_signoff_warning for signup with membership, in English', async () => {

    let workingCopy = _.cloneDeep(allClasses);

    const membership = await Membership.create({
      client: testClientId,
      user: fixtures.userAlice.id,
      membership_type: fixtures.membershipTypeYogaUnlimited.id,
      status: 'active',
    }).fetch();

    const signups = await ClassSignup.createEach([
      {
        client: testClientId,
        class: class1.id,
        user: fixtures.userAlice.id,
        used_membership: membership.id,
      },
      {
        client: testClientId,
        class: privateClass1.id,
        user: fixtures.userAlice.id,
        used_membership: membership.id,
      },
    ]).fetch();

    await sails.helpers.populate.classes.classSignoffWarning(workingCopy, fixtures.userAlice);

    expect(workingCopy).to.matchPattern(`
      [
        {
          class_signoff_warning: 'There is less than 2 hours before the class starts, so cancelling your booking will result in a fee of 30 kr. The same fee will be applied if you keep the booking but don\\'t attend the class.\\n\\nOf course, we would appreciate that you cancel if you can not attend, so someone else can get your seat.\\n\\nWould you like to cancel your booking?',
          ...
        },
        {
          class_signoff_warning: 'There is less than 1 day before your private class starts, so cancelling your booking will result in a fee of 30 kr. The same fee will be applied if you keep the booking but don\\'t attend the class.\\n\\nOf course, we would appreciate that you cancel if you can not attend.\\n\\nWould you like to cancel your booking?',
          ...
        },
      ]`,
    );

    await ClassSignup.destroy({id: _.map(signups, 'id')});
    await Membership.destroy({id: membership.id});

  });

  it('should return Class.class_signoff_warning for signup with unlimited class pass, in Danish', async () => {

    const oldLocale = sails.yogo ? sails.yogo.locale : undefined;
    sails.yogo = sails.yogo || {};
    sails.yogo.locale = 'da';

    let workingCopy = _.cloneDeep(allClasses);

    const membership = await Membership.create({
      client: testClientId,
      user: fixtures.userAlice.id,
      membership_type: fixtures.membershipTypeYogaUnlimited.id,
      status: 'active',
    }).fetch();

    const signups = await ClassSignup.createEach([
      {
        client: testClientId,
        class: class1.id,
        user: fixtures.userAlice.id,
        used_membership: membership.id,
      },
      {
        client: testClientId,
        class: privateClass1.id,
        user: fixtures.userAlice.id,
        used_membership: membership.id,
      },
    ]).fetch();

    await sails.helpers.populate.classes.classSignoffWarning(workingCopy, fixtures.userAlice);

    expect(workingCopy).to.matchPattern(`
      [
        {
          class_signoff_warning: 'Der er mindre end 2 timer til holdet starter, og der vil derfor blive pålagt et gebyr på 30 kr. Det samme gebyr vil blive pålagt hvis du beholder tilmeldingen men ikke møder op.\\n\\nVi sætter naturligvis pris på at du afmelder dig hvis du er forhindret, så en anden kan få pladsen.\\n\\nVil du afmelde dig fra holdet?',
          ...
        },
        {
          class_signoff_warning: 'Der er mindre end 1 dag til din aftale starter, og der vil derfor blive pålagt et gebyr på 30 kr. Det samme gebyr vil blive pålagt hvis du beholder tilmeldingen men ikke møder op.\\n\\nVi sætter naturligvis pris på at du afmelder dig hvis du er forhindret, så en anden kan få pladsen.\\n\\nVil du afmelde dig?',
          ...
        },
      ]`,
    );

    sails.yogo.locale = oldLocale;

    await ClassSignup.destroy({id: _.map(signups, 'id')});
    await Membership.destroy({id: membership.id});

  });

  it('should return Class.class_signoff_warning for signup with membership when fees are different, in English', async () => {

    let workingCopy = _.cloneDeep(allClasses);

    const membership = await Membership.create({
      client: testClientId,
      user: fixtures.userAlice.id,
      membership_type: fixtures.membershipTypeYogaUnlimited.id,
      status: 'active',
    }).fetch();

    const signups = await ClassSignup.createEach([
      {
        client: testClientId,
        class: class1.id,
        user: fixtures.userAlice.id,
        used_membership: membership.id,
      },
      {
        client: testClientId,
        class: privateClass1.id,
        user: fixtures.userAlice.id,
        used_membership: membership.id,
      },
    ]).fetch();

    const clientSettingsRows = await ClientSettings.createEach([
      {
        client: testClientId,
        key: 'no_show_fees_and_late_cancel_fees_are_different',
        value: 1,
      },
      {
        client: testClientId,
        key: 'no_show_membership_fee_amount',
        value: 100,
      },
      {
        client: testClientId,
        key: 'late_cancel_membership_fee_amount',
        value: 50,
      },
    ]).fetch();

    await sails.helpers.populate.classes.classSignoffWarning(workingCopy, fixtures.userAlice);

    expect(workingCopy).to.matchPattern(`
      [
        {
          class_signoff_warning: 'There is less than 2 hours before the class starts, so cancelling your booking will result in a fee of 50 kr. A fee of 100 kr will be applied if you keep the booking but don\\'t attend the class.\\n\\nOf course, we would appreciate that you cancel if you can not attend, so someone else can get your seat.\\n\\nWould you like to cancel your booking?',
          ...
        },
        {
          class_signoff_warning: 'There is less than 1 day before your private class starts, so cancelling your booking will result in a fee of 50 kr. A fee of 100 kr will be applied if you keep the booking but don\\'t attend the class.\\n\\nOf course, we would appreciate that you cancel if you can not attend.\\n\\nWould you like to cancel your booking?',
          ...
        },
      ]`,
    );

    await ClassSignup.destroy({id: _.map(signups, 'id')});
    await Membership.destroy({id: membership.id});
    await ClientSettings.destroy({id: _.map(clientSettingsRows, 'id')});

  });

  it('should return Class.class_signoff_warning for signup with unlimited class pass when fees are different, in Danish', async () => {

    const oldLocale = sails.yogo ? sails.yogo.locale : undefined;
    sails.yogo = sails.yogo || {};
    sails.yogo.locale = 'da';

    let workingCopy = _.cloneDeep(allClasses);

    const membership = await Membership.create({
      client: testClientId,
      user: fixtures.userAlice.id,
      membership_type: fixtures.membershipTypeYogaUnlimited.id,
      status: 'active',
    }).fetch();

    const signups = await ClassSignup.createEach([
      {
        client: testClientId,
        class: class1.id,
        user: fixtures.userAlice.id,
        used_membership: membership.id,
      },
      {
        client: testClientId,
        class: privateClass1.id,
        user: fixtures.userAlice.id,
        used_membership: membership.id,
      },
    ]).fetch();

    const clientSettingsRows = await ClientSettings.createEach([
      {
        client: testClientId,
        key: 'no_show_fees_and_late_cancel_fees_are_different',
        value: 1,
      },
      {
        client: testClientId,
        key: 'no_show_membership_fee_amount',
        value: 100,
      },
      {
        client: testClientId,
        key: 'late_cancel_membership_fee_amount',
        value: 50,
      },
    ]).fetch();

    await sails.helpers.populate.classes.classSignoffWarning(workingCopy, fixtures.userAlice);

    expect(workingCopy).to.matchPattern(`
      [
        {
          class_signoff_warning: 'Der er mindre end 2 timer til holdet starter, og der vil derfor blive pålagt et gebyr på 50 kr. Et gebyr på 100 kr vil blive pålagt hvis du beholder tilmeldingen men ikke møder op.\\n\\nVi sætter naturligvis pris på at du afmelder dig hvis du er forhindret, så en anden kan få pladsen.\\n\\nVil du afmelde dig fra holdet?',
          ...
        },
        {
          class_signoff_warning: 'Der er mindre end 1 dag til din aftale starter, og der vil derfor blive pålagt et gebyr på 50 kr. Et gebyr på 100 kr vil blive pålagt hvis du beholder tilmeldingen men ikke møder op.\\n\\nVi sætter naturligvis pris på at du afmelder dig hvis du er forhindret, så en anden kan få pladsen.\\n\\nVil du afmelde dig?',
          ...
        },
      ]`,
    );

    sails.yogo.locale = oldLocale;

    await ClassSignup.destroy({id: _.map(signups, 'id')});
    await Membership.destroy({id: membership.id});
    await ClientSettings.destroy({id: _.map(clientSettingsRows, 'id')});

  });

  it('should return Class.class_signoff_warning for livestream signups with membership, in English', async () => {

    let workingCopy = _.cloneDeep(allClasses);

    const membership = await Membership.create({
      client: testClientId,
      user: fixtures.userAlice.id,
      membership_type: fixtures.membershipTypeYogaUnlimited.id,
      status: 'active',
    }).fetch();

    const signups = await ClassLivestreamSignup.createEach([
      {
        client: testClientId,
        class: class1.id,
        user: fixtures.userAlice.id,
        used_membership: membership.id,
      },
      {
        client: testClientId,
        class: privateClass1.id,
        user: fixtures.userAlice.id,
        used_membership: membership.id,
      },
    ]).fetch();

    await sails.helpers.populate.classes.classSignoffWarning(workingCopy, fixtures.userAlice);

    expect(workingCopy).to.matchPattern(`
      [
        {
          class_signoff_warning: 'There is less than 2 hours before the class starts, so cancelling your booking will result in a fee of 30 kr. The same fee will be applied if you keep the booking but don\\'t attend the class.\\n\\nOf course, we would appreciate that you cancel if you can not attend, so someone else can get your seat.\\n\\nWould you like to cancel your booking?',
          ...
        },
        {
          class_signoff_warning: 'There is less than 1 day before your private class starts, so cancelling your booking will result in a fee of 30 kr. The same fee will be applied if you keep the booking but don\\'t attend the class.\\n\\nOf course, we would appreciate that you cancel if you can not attend.\\n\\nWould you like to cancel your booking?',
          ...
        },
      ]`,
    );

    await ClassLivestreamSignup.destroy({id: _.map(signups, 'id')});
    await Membership.destroy({id: membership.id});

  });

  it('should return null if no membership or class pass is registered on signup', async () => {
    let workingCopy = _.cloneDeep(allClasses);

    const signups = await ClassSignup.createEach([
      {
        client: testClientId,
        class: class1.id,
        user: fixtures.userAlice.id,
      },
      {
        client: testClientId,
        class: privateClass1.id,
        user: fixtures.userAlice.id,
      },
    ]).fetch();

    await sails.helpers.populate.classes.classSignoffWarning(workingCopy, fixtures.userAlice.id);

    expect(workingCopy).to.matchPattern(`
      [
        {
          class_signoff_warning: null,
          ...
        },
        {
          class_signoff_warning: null,
          ...
        },
      ]`,
    );

    await ClassSignup.destroy({id: _.map(signups, 'id')});

  });


});


