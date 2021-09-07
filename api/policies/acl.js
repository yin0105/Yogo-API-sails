/**
 * acl
 *
 * @description :: Policy to check if user is authorized with JSON web token
 * @help        :: See http://sailsjs.org/#!/documentation/concepts/Policies
 */

const controllerToModelMap = {
  Auth: null,
  Branches: 'Branch',
  CartItems: 'CartItem',
  Classes: 'Class',
  ClassPasses: 'ClassPass',
  ClassPassTypes: 'ClassPassType',
  //ClassSignups: 'ClassSignup',
  ClassTypes: 'ClassType',
  Clients: 'Client',
  Cron: null,
  DibsPayments: null,
  EventGroups: 'EventGroup',
  Events: 'Event',
  EventSignups: 'EventSignup',
  EventTimeSlots: 'EventTimeSlot',
  Images: 'Image',
  Memberships: 'Membership',
  MembershipTypes: 'MembershipType',
  Orders: 'Order',
  Ping: null,
  PriceGroups: 'PriceGroup',
  Rooms: 'Room',
  Users: 'User',
};

function getModelNameFromRequestControllerName(requestControllerName) {
  // Request controller names are lowercase
  let returnModelName = '';
  _.forOwn(controllerToModelMap, (modelName, controllerName) => {
    if (_.toLower(controllerName) === requestControllerName) {
      returnModelName = modelName;
      return false;
    }
  });
  return returnModelName;
}

module.exports = async function (req, res, next) {

  //console.log('req.options: ', req.options);
  //console.log('req.user:', req.user)
  //console.log('req.requestContext:', req.requestContext)

  const actionParts = req.options.action.split('/');

  const controller = actionParts[0];
  const action = actionParts[1];


  // Used for looking up objects
  let modelName, modelObject;

  // Auth controller is always allowed
  if (controller === 'auth') {
    return next();
  }

  // Cron controller is always allowed
  if (controller === 'cron') {
    return next();
  }

  // Payment controllers are always allowed
  if (controller === 'dibspayments') {
    return next();
  }

  // Order receipts are access controlled via token, so the action is public
  if (req.options.action === 'orders/pdfreceipt') {
    return next();
  }


  // Everyone can create a new customer account
  if (req.options.action === 'users/create') {
    return next();
  }

  // Everyone can get basic info on the current client
  if (req.options.action === 'clients/find-current') {
    return next();
  }


  // Authorization for these controllers are checked in controllers
  if (_.includes(
    [
      'cartitems',
      'classemails',
      'classlivestreamsignups',
      'classpasses',
      'classsignups',
      'classtypeemails',
      'classwaitinglistsignups',
      'discountcodes',
      'export',
      'giftcards',
      'integrationscometchat',
      'integrationsvimeo',
      'livestream',
      'membershippauses',
      'noshowfees',
      'products',
      'reepaypayments',
      'stripepayments',
      'reports',
      'videofilters',
      'videogroups',
      'videomaincategories',
      'videos'
    ],
    controller,
  )) {
    return next();
  }

  // Authorization for these controllers/actions are checked in controllers
  if (controller === 'users' && _.includes(['history', 'find', 'create-favorite-video', 'destroy-favorite-video'], action)) {
    return next();
  }
  if (controller === 'classes' && action === 'cancel') {
    return next();
  }
  if (controller === 'orders' && action === 'find') {
    return next();
  }
  if (controller === 'memberships' && action === 'find') {
    return next();
  }

  // This is a TEMPORARY solution :) It should probably check if the client is right
  if (controller === 'images' && action === 'findone') {
    return next();
  }

  // Some controllers are publicly readable without login. No dashes! This is controller names, not endpoints
  if (
    [
      'branches',
      'classes',
      'classrepeats',
      'classtypes',
      'classpasstypes',
      'teachers',
      'events',
      'eventgroups',
      'eventtimeslots',
      'membershiptypes',
      'classpasstypes',
      'pricegroups',
    ].indexOf(controller) > -1
    &&
    [
      'find',
      'findone',
      'find-one',
      'ics-file',
      'ical-feed-teacher'
    ].indexOf(action) > -1

  ) {
    return next();
  }


  // Everyone can upload images, since you need to do that on signup. TODO: Rate limiting, etc
  if (req.options.action === 'images/create') return next();

  // Client logo is public
  if (req.options.action === 'clients/logo') return next();


  // Admins can do anything, as long as it is on their own client (TODO: Maybe different types of admin)
  if (req.user && req.user.admin && req.requestContext === 'admin') {

    switch (action) {

      case 'find':
      case 'create':
        // Find and create automatically target the right client
        return next();


      case 'findone':
      case 'find-one':
      case 'update':
      case 'destroy':
        // findOne, update and destroy can only be on ones own client
        modelName = getModelNameFromRequestControllerName(controller);

        if (!modelName) break;

        modelObject = eval(modelName);

        const objectInQuestion = await modelObject.findOne(req.param('id'));

        if (!objectInQuestion) {
          return res.badRequest('No object with ID ' + req.param('id'));
        }

        if (objectInQuestion.client === req.client.id) {
          return next();
        }
        break;


      case 'updatesort':
      case 'update-sort':
        // Make sure all object ids are from the right client
        modelName = getModelNameFromRequestControllerName(controller);
        modelObject = eval(modelName);

        const invalidObjects = await
          modelObject.find({
            id: req.body.sortOrder,
            client: {'!=': req.client.id},
          });

        if (!invalidObjects.length) return next();
        break;

      case 'get-settings':
      case 'update-settings':
        // These actions belong to the Clients controller and the id in the URL specifies the client id.
        if (req.param('id') == req.user.client) {
          return next();
        }

    }

    if (controller === 'import') return next();

    // Admin is logged in, but the action is still now allowed
    console.log("acl 1")
    return res.forbidden();


  } else if (req.checkin) {

    // Checkin can get room list

    if (req.options.action === 'rooms/find') {
      return next();
    }

  } else if (req.user && req.user.customer) {

    // Customers can manipulate shopping cart and sign up for / off of classes
    /*if (
      controller === 'cartitems'
      &&
      (
        (action === 'create' && parseInt(req.user.id) === parseInt(req.body.user))
        ||
        (action === 'find' && parseInt(req.user.id) === parseInt(req.query.user))
      )
    ) {

      return next()

    }

    if (
      (controller === 'cartitems')
      &&
      (action === 'findone' || action === 'update' || action === 'destroy')
      && req.param('id')

    ) {

      let model
      switch (controller) {
        case 'cartitems':
          model = CartItem
          break
      }

      let result = await model.findOne(req.param('id'))

      if (controller === 'cartitems' && action === 'destroy' && !result) {
        return res.ok()
      }

      if (result && result.user == req.user.id) return next()
    }*/


    // Customers can see which events they are signed up for,
    // which class passes they have
    // and which memberships they have
    if (controller === 'eventsignups' || controller === 'memberships') {
      if (
        parseInt(req.user.id) === parseInt(req.query.user) &&
        action === 'find'
      ) {
        return next();
      }

      if (action === 'findone') {
        modelName = getModelNameFromRequestControllerName(controller);

        modelObject = eval(modelName);

        const obj = await modelObject.findOne(req.param('id'));

        if (obj.user === req.user.id) {
          return next();
        }
      }

    }

    // Customers can sign up for events directly if the event is free and the event is not already full
    if (req.options.action === 'eventsignups/create') {
      const event = await Event.findOne(req.body.event).populate('signups', {archived: false});
      if (event.price > 0) {
        return res.badRequest('Event is not free');
      }
      if (event.signups.length >= event.seats) {
        return res.ok('E_EVENT_IS_FULL');
      }
      return next();
    }

    // Customers can sign off from events if the event is free
    if (req.options.action === 'eventsignups/destroy') {
      const signup = await EventSignup.findOne(req.param('id')).populate('event');
      if (signup.event.price > 0) {
        return res.badRequest('Event is not free');
      }
      return next();
    }


    // Customers can read and update their own info
    if (
      (
        (req.options.action === 'users/find-one' || req.options.action === 'users/update')
        &&
        parseInt(req.param('id')) === parseInt(req.user.id)
      )
    ) {
      return next();
    }

    // Customers can get the images that they can edit themselves. That means their own profile image and real_user_image on their memberships
    if (
      req.options.action === 'images/findone'
      &&
      req.user.image

    ) {
      // Own profile image
      if (parseInt(req.user.image) === parseInt(req.param('id'))) {
        return next();
      }

      // Membership real_user images
      const usersMemberships = await
        Membership.find({user: req.user.id, archived: false});
      const membershipRealUserImageIds = _.compact(_.map(usersMemberships, membership => parseInt(membership.real_user_image)));
      if (_.includes(membershipRealUserImageIds, parseInt(req.param('id')))) {
        return next();
      }

    }


    // Customers can create new orders
    if (req.options.action === 'orders/create') {
      return next();
    }


    // Customers can make certain changes to their memberships
    if (req.options.action === 'memberships/update') {

      const membership = await
        Membership.findOne(req.param('id'));

      if (membership.user !== req.user.id || membership.archived) {
        console.log("acl 2")
        return res.forbidden();
      }

      // Customers can cancel their membership and they can restart a cancelled membership if it has not run out.
      if (
        (req.body.status === 'cancelled_running' && membership.status === 'active')
        ||
        (req.body.status === 'active' && membership.status === 'cancelled_running')
      ) {
        req.body = _.pick(req.body, [
          'status',
        ]);
        return next();
      }

      // Customers can change the real user of a membership
      if (typeof req.body.real_user_is_someone_else !== 'undefined') {
        req.body = _.pick(req.body, [
          'real_user_is_someone_else',
          'real_user_image',
          'real_user_name',
        ]);
        return next();
      }

    }

    // Customers can retry failed membership payments
    if (req.options.action === 'memberships/retryfailedsubscriptionpayment') {
      return next();
    }

  }


  // None of the above. Block access.

  /*console.log('Forbidden req.options: ', req.options);
  console.log('req.user: ', req.user);
  if (req.user) {
    console.log('req.user.customer: ', req.user.customer);
    console.log('req.user.admin: ', req.user.admin);
  }
  console.log('req.checkin: ', req.checkin);*/
  console.log("acl 3")
  return res.forbidden();

};
