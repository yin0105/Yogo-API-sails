const testClientId = require('../global-test-variables').TEST_CLIENT_ID;
const fxt = {};
const jwToken = require('../../api/services/jwTokens');


module.exports = {

  fixtures: fxt,

  async build() {

    console.log('Building fixtures...');

    // CLIENT LOGO
    fxt.testClientLogo = await Image.create({
      client: testClientId,
      original_filename: 'test-client-logo.jpg',
      filename: '1234-XXXX-XXXX-XXXX.jpg',
      expires: 0,
    }).fetch();

    // CLIENTS
    fxt.testClient1 = await Client.create({
      id: testClientId,
      name: 'Test client',
      email: 'example@example.com',
      class_signoff_deadline_minutes: 240,
      dibs_merchant: '12345678',
      logo: fxt.testClientLogo.id,
    }).fetch();

    fxt.testClient2 = await Client.create({
      id: testClientId + 1,
      name: 'Test client 2',
      email: 'example2@example.com',
    }).fetch();

    fxt.testClient3 = await Client.create({
      id: testClientId + 2,
      name: 'Test client 3',
      email: 'example3@example.com',
    }).fetch();


    // CLIENT SETTINGS
    await ClientSettings.createEach(
      [
        {
          key: 'payment_service_provider',
          value: 'dibs',
          client: testClientId,
        },
        {
          key: 'sms_sender_name',
          value: 'Test client',
          client: testClientId,
        },
      ],
    );

    // Domain
    fxt.testClientDomain = await Domain.create({
      name: 'test-client.yogo.dk',
      client: testClientId,
    }).fetch();


    // CLIENT BRANCHES
    fxt.testClientBranchA = await Branch.create({
      client: testClientId,
      name: 'Branch A',
    }).fetch();
    fxt.testClientBranchB = await Branch.create({
      client: testClientId,
      name: 'Branch B',
    }).fetch();
    fxt.testClientBranchC = await Branch.create({
      client: testClientId,
      name: 'Branch C',
    }).fetch();

    // ROOMS
    fxt.testClientRoomA1 = await Room.create({
      branch: fxt.testClientBranchA.id,
      name: 'Room A1',
    }).fetch();

    fxt.testClientRoomA2 = await Room.create({
      branch: fxt.testClientBranchA.id,
      name: 'Room A2',
    }).fetch();

    fxt.testClientRoomB1 = await Room.create({
      branch: fxt.testClientBranchB.id,
      name: 'Room B1',
    }).fetch();


    // USERS
    fxt.userAlice = await User.create({
      first_name: 'Alice',
      last_name: 'Ali',
      email: 'userAlice@yogo.dk',
      phone: '55555551',
      client: testClientId,
      customer: true,
      encrypted_password: '81dc9bdb52d04dc20036dbd8313ed055', // 1234
    }).fetch();

    fxt.userAliceAccessToken = jwToken.issue({
      id: fxt.userAlice.id,
    });

    fxt.userBill = await User.create({
      first_name: 'Bill',
      last_name: 'Billion',
      email: 'userBill@yogo.dk',
      phone: '55555552',
      client: testClientId,
      customer: true,
      encrypted_password: '81dc9bdb52d04dc20036dbd8313ed055', // 1234
      date_of_birth: '1980-05-20',
    }).fetch();

    fxt.userBillAccessToken = jwToken.issue({
      id: fxt.userBill.id,
    });

    fxt.userCharlie = await User.create({
      first_name: 'Charlie',
      last_name: 'Charleston',
      email: 'userCharlie@yogo.dk',
      phone: '55555553',
      client: testClientId,
      customer: true,
      encrypted_password: '81dc9bdb52d04dc20036dbd8313ed055', // 1234
    }).fetch();

    fxt.userCharlieAccessToken = jwToken.issue({
      id: fxt.userCharlie.id,
    });

    fxt.userDennis = await User.create({
      first_name: 'Dennis',
      last_name: 'Dentist',
      email: 'userDennis@yogo.dk',
      phone: '55555554',
      client: testClientId,
      customer: true,
      encrypted_password: '81dc9bdb52d04dc20036dbd8313ed055', // 1234
    }).fetch();

    fxt.userDennisAccessToken = jwToken.issue({
      id: fxt.userDennis.id,
    });

    fxt.userEvelyn = await User.create({
      first_name: 'Evelyn',
      last_name: 'Everlast',
      email: 'userEvelyn@yogo.dk',
      phone: '55555555',
      client: testClientId,
      customer: true,
      teacher: true,
      encrypted_password: '81dc9bdb52d04dc20036dbd8313ed055', // 1234
    }).fetch();

    fxt.userEvelynAccessToken = jwToken.issue({
      id: fxt.userEvelyn.id,
    });

    fxt.userFiona = await User.create({
      first_name: 'Fiona',
      last_name: 'Frederiksen',
      email: 'userFiona@yogo.dk',
      phone: '55555555',
      client: testClientId,
      customer: true,
      teacher: true,
      encrypted_password: '81dc9bdb52d04dc20036dbd8313ed055', // 1234
    }).fetch();

    fxt.userFionaAccessToken = jwToken.issue({
      id: fxt.userFiona.id,
    });

    fxt.userAdmin = await User.create({
      first_name: 'Admin',
      last_name: 'Adminson',
      email: 'userAdmin@yogo.dk',
      client: testClientId,
      admin: true,
      encrypted_password: '81dc9bdb52d04dc20036dbd8313ed055', // 1234
    }).fetch();

    fxt.userAdminAccessToken = jwToken.issue({
      id: fxt.userAdmin.id,
    });

    // IMAGES
    fxt.imageWithoutFilename = await Image.create({
      original_filename: 'image.jpeg',
      client: testClientId,
      expires: 0,
    }).fetch();

    fxt.testClientImage = await Image.create({
      original_filename: 'test-client-image.jpeg',
      filename: 'test-client-image.jpeg',
      client: testClientId,
      expires: 0,
    }).fetch();

    fxt.image1 = await Image.create({
      original_filename: 'image1.jpeg',
      filename: 'image1.jpeg',
      client: testClientId,
      expires: 0,
    }).fetch();

    fxt.image2WithExpiration = await Image.create({
      original_filename: 'image2.jpeg',
      filename: 'image2.jpeg',
      client: testClientId,
      expires: 123456789,
    }).fetch();

    // CLASS TYPES
    fxt.classTypeYoga = await ClassType.create({
      name: 'Yoga',
      client: testClientId,
      image: fxt.image1.id,
    }).fetch();

    fxt.classTypeHotYoga = await ClassType.create({
      name: 'Hot Yoga',
      client: testClientId,
    }).fetch();

    fxt.classTypeAstangaYoga = await ClassType.create({
      name: 'Astanga Yoga',
      client: testClientId,
    }).fetch();

    fxt.classTypeDance = await ClassType.create({
      name: 'Dance',
      client: testClientId,
    }).fetch();

    fxt.classTypeWorkout = await ClassType.create({
      name: 'Workout',
      client: testClientId,
    }).fetch();


    // Price groups
    fxt.priceGroupYoga = await PriceGroup.create({
      name: 'Yoga',
      client: testClientId,
    }).fetch();

    // MEMBERSHIP TYPES
    fxt.membershipTypeYogaUnlimited = await MembershipType.create({
      name: 'Yoga Unlimited',
      class_types: [fxt.classTypeYoga.id, fxt.classTypeHotYoga.id, fxt.classTypeAstangaYoga.id],
      class_types_livestream: [fxt.classTypeYoga.id, fxt.classTypeHotYoga.id, fxt.classTypeAstangaYoga.id],
      client: testClientId,
      price_groups: [fxt.priceGroupYoga.id],
    }).fetch();

    fxt.yogaUnlimitedPaymentOptionMonthly = await MembershipTypePaymentOption.create({
      name: 'Monthly',
      number_of_months_payment_covers: 1,
      payment_amount: 300,
      membership_type: fxt.membershipTypeYogaUnlimited.id,
      client: testClientId,
      for_sale: true,
    }).fetch();

    fxt.yogaUnlimitedPaymentOptionSemiannually = await MembershipTypePaymentOption.create({
      name: 'Semiannually',
      number_of_months_payment_covers: 6,
      payment_amount: 1500,
      membership_type: fxt.membershipTypeYogaUnlimited.id,
      client: testClientId,
      for_sale: true,
    }).fetch();

    fxt.yogaUnlimitedPaymentOptionYearly = await MembershipTypePaymentOption.create({
      name: 'Yearly',
      number_of_months_payment_covers: 12,
      payment_amount: 2500,
      membership_type: fxt.membershipTypeYogaUnlimited.id,
      client: testClientId,
      for_sale: true,
    }).fetch();

    fxt.membershipTypeYogaTwoClassesPerWeek = await MembershipType.create({
      name: 'Yoga two classes per week',
      class_types: [fxt.classTypeYoga.id, fxt.classTypeHotYoga.id, fxt.classTypeAstangaYoga.id],
      class_types_livestream: [fxt.classTypeYoga.id, fxt.classTypeHotYoga.id, fxt.classTypeAstangaYoga.id],
      client: testClientId,
      has_max_number_of_classes_per_week: true,
      max_number_of_classes_per_week: 2,
      price_groups: [fxt.priceGroupYoga.id],
    }).fetch();

    fxt.membershipTypeDance = await MembershipType.create({
      name: 'Dance Unlimited',
      class_types: [fxt.classTypeDance.id],
      client: testClientId,
    }).fetch();

    fxt.membershipTypeYogaUnlimitedLivestream = await MembershipType.create({
      name: 'Yoga Unlimited Livestream',
      class_types_livestream: [fxt.classTypeYoga.id, fxt.classTypeHotYoga.id, fxt.classTypeAstangaYoga.id],
      client: testClientId,
      price_groups: [fxt.priceGroupYoga.id],
    }).fetch();

    fxt.yogaUnlimitedLivestreamPaymentOptionMonthly = await MembershipTypePaymentOption.create({
      membership_type: fxt.membershipTypeYogaUnlimitedLivestream.id,
      name: 'Livestream monthly',
      number_of_months_payment_covers: 1,
      payment_amount: 150,
      client: testClientId,
      for_sale: true,
    }).fetch();


    // CLASS PASS TYPE
    fxt.classPassTypeYogaUnlimitedOneMonth = await ClassPassType.create({
      name: 'One month of Yoga',
      pass_type: 'unlimited',
      days: 30,
      client: testClientId,
      class_types: [fxt.classTypeYoga.id],
      price: 1200,
      price_groups: [fxt.priceGroupYoga.id],
    }).fetch();

    fxt.classPassTypeYogaUnlimitedOneMonthLivestream = await ClassPassType.create({
      name: 'One month of Yoga LIVESTREAM',
      pass_type: 'unlimited',
      days: 30,
      client: testClientId,
      class_types_livestream: [fxt.classTypeYoga.id],
      price: 1200,
      price_groups: [fxt.priceGroupYoga.id],
    }).fetch();

    fxt.classPassTypeYogaTenClasses = await ClassPassType.create({
      name: 'Ten yoga classes',
      pass_type: 'fixed_count',
      number_of_classes: 10,
      client: testClientId,
      class_types: [fxt.classTypeYoga.id],
      class_types_livestream: [fxt.classTypeYoga.id],
      price: 1100,
      price_groups: [fxt.priceGroupYoga.id],
    }).fetch();

    fxt.classPassTypeYogaTenClassesLivestream = await ClassPassType.create({
      name: 'Ten yoga classes, LIVESTREAM',
      pass_type: 'fixed_count',
      number_of_classes: 10,
      client: testClientId,
      class_types_livestream: [fxt.classTypeYoga.id],
      price: 1100,
      price_groups: [fxt.priceGroupYoga.id],
    }).fetch();

    fxt.classPassTypeDanceTenClasses = await ClassPassType.create({
      name: 'Ten dance classes',
      pass_type: 'fixed_count',
      number_of_classes: 10,
      client: testClientId,
      class_types: [fxt.classTypeDance.id],
      price: 1500,
    }).fetch();

    fxt.classPassTypeYogaOneClassIntroOffer = await ClassPassType.create({
      name: 'Yoga one class intro offer',
      pass_type: 'fixed_count',
      number_of_classes: 1,
      limited_number_per_customer: true,
      max_number_per_customer: 1,
      client: testClientId,
      class_types: [fxt.classTypeYoga.id],
      price: 300,
      price_groups: [fxt.priceGroupYoga.id],
    }).fetch();

    fxt.classPassTypeYogaOneClassIntroOfferThreePerCustomer = await ClassPassType.create({
      name: 'Yoga one class intro offer, max three per customer',
      pass_type: 'fixed_count',
      number_of_classes: 3,
      limited_number_per_customer: true,
      max_number_per_customer: 3,
      client: testClientId,
      class_types: [fxt.classTypeYoga.id],
      price: 600,
      price_groups: [fxt.priceGroupYoga.id],
    }).fetch();

    fxt.classPassTypeYogaOneClassIntroOfferFree = await ClassPassType.create({
      name: 'Yoga one class intro offer, free',
      pass_type: 'fixed_count',
      number_of_classes: 1,
      days: 30,
      limited_number_per_customer: true,
      max_number_per_customer: 1,
      client: testClientId,
      class_types: [fxt.classTypeYoga.id],
      price: 0,
      price_groups: [fxt.priceGroupYoga.id],
    }).fetch();





    // PRODUCTS
    fxt.productYogaMat = await Product.create({
      name: 'Yoga Mat',
      price: 220,
    }).fetch();

    fxt.productYogaShirt = await Product.create({
      name: 'Yoga shirt',
      price: 325,
    }).fetch();


    // EVENT

    fxt.eventWithoutTimeSlots = await Event.create({
      client: testClientId,
      seats: 3,
      name: 'Event without time slots',
      price: 2000,
      start_date: '2019-06-13',
      use_time_slots: false,
    }).fetch();

    fxt.eventWithOneTimeSlot = await Event.create({
      client: testClientId,
      seats: 20,
      name: 'Event with one time slot',
      price: 3000,
      start_date: '2019-07-13',
      use_time_slots: true,
    }).fetch();

    fxt.eventWithOneTimeSlotTimeSlot = await EventTimeSlot.create({
      client: testClientId,
      event: fxt.eventWithOneTimeSlot.id,
      date: '2019-07-13',
      start_time: '10:00:00',
      end_time: '18:00:00',
    }).fetch();

    fxt.eventWithMultipleTimeSlots = await Event.create({
      client: testClientId,
      seats: 10,
      name: 'Event with multiple time slots',
      price: 4000,
      start_date: '2019-08-13',
      use_time_slots: true,
    }).fetch();

    fxt.eventWithMultipleTimeSlotsTimeSlots = await Promise.all([
      EventTimeSlot.create({
        client: testClientId,
        event: fxt.eventWithMultipleTimeSlots.id,
        date: '2019-08-13',
        start_time: '10:00:00',
        end_time: '18:00:00',
      }).fetch(),
      EventTimeSlot.create({
        client: testClientId,
        event: fxt.eventWithMultipleTimeSlots.id,
        date: '2019-08-14',
        start_time: '10:00:00',
        end_time: '18:00:00',
      }).fetch(),
      EventTimeSlot.create({
        client: testClientId,
        event: fxt.eventWithMultipleTimeSlots.id,
        date: '2019-08-15',
        start_time: '10:00:00',
        end_time: '18:00:00',
      }).fetch(),
    ]);


    console.log('Done building fixtures.');

  },

  async teardown() {

    console.log('Tearing down fixtures...');

    const tableNamesToTruncate = [
      'Branch',
      'CartItem',
      'Class',
      'ClassEmail',
      'ClassEmailInstance',
      'ClassLivestreamSignup',
      'ClassPass',
      'ClassPassLog',
      'ClassPassType',
      'ClassSignup',
      'ClassType',
      'ClassTypeEmail',
      'ClassWaitingListSignup',
      'Client',
      'ClientSettings',
      //'CronLog',
      'DiscountCode',
      'Domain',
      'Event',
      'EventSignup',
      'EventTimeSlot',
      'Image',
      'Membership',
      'MembershipLog',
      'MembershipPause',
      'MembershipType',
      'MembershipTypePaymentOption',
      'NoShowFee',
      'Order',
      'OrderItem',
      'PaymentSubscription',
      'PaymentSubscriptionTransaction',
      'PriceGroup',
      'Room',
      'Sms',
      'User',
      'Video',
      'VideoFilter',
      'VideoFilterValue',
      'VideoGroup',
      'VideoMainCategory',
      'VideoTag',
    ];

    await Promise.all(_.map(tableNamesToTruncate, async tableName => {
      await eval(tableName).destroy({});
    }));

    await sails.sendNativeQuery("TRUNCATE TABLE class_teachers__user_teaching_classes");
    await sails.sendNativeQuery("TRUNCATE TABLE classpasstype_price_groups__pricegroup_class_pass_types");
    await sails.sendNativeQuery("TRUNCATE TABLE classpasstype_class_types__classtype_class_pass_types");

    console.log('Done tearing down fixtures.');
  },

};
