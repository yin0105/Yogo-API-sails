/**
 * PaymentsControllerDibs
 *
 * @description :: Server-side logic for managing payments via DIBS
 * @help        :: See http://links.sailsjs.org/docs/controllers
 */

require('require-sql')

const md5 = require('md5');
const request = require('request-promise-native');
const querystring = require('querystring');
const crypto = require('crypto');
const receipt = require('../helpers/email/customer/receipt');
const moment = require('moment');

module.exports = {


    paymentAccepted: async function (req, res) {


        // IS THIS A REGULAR PAYMENT RESPONSE?
      // 2: authorization approved
      // 5: capture completed
      // 12: capture pending (other aquirers than Nets run the payments in batches at night)
        if (req.body.statuscode !== '2' && req.body.statuscode !== '5' && req.body.statuscode !== '12') {
            return res.badRequest('Unknown status code: ' + req.body.statuscode)
        }


        let order;
        let dibsClientData;

        // Get order and DIBS data from db
        try {
            // If this is a test payment, there is a random postfix which needs to be discarded. Ex orderid: 123_test9287346
            const orderId = req.body.orderid.split('_')[0];

            order = await Order.findOne(orderId);
            if (!order) return res.badRequest('Order not found');

            dibsClientData = await DibsClientData.find({client: order.client});
            if (!order) return res.serverError('Client dibs data not found');

        } catch (err) {
            return res.serverError(err)
        }

        let parameterString,
            calculatedMd5Key;


        // Regular payment

        //
        // CHECK MD5 KEY
        //

        parameterString = 'transact=' + req.body.transact; // TODO Make it work with trans fees
        parameterString += '&amount=' + req.body.amount;
        parameterString += '&currency=' + req.body.currency;

        console.log(parameterString, dibsClientData);

        calculatedMd5Key = md5(dibsClientData.md5_key_2 + md5(dibsClientData.md5_key_1 + parameterString))

        console.log(calculatedMd5Key);

        // TODO Reinstate MD5 check
        /*if (calculatedMd5Key !== req.body.authkey) {
            return res.status(400).json({err: 'Md5key did not match other parameters'});
        }*/


        // See if payment needs to be processed. It might already have been.
        try {

            const doProcessOrder = await sails.getDatastore().transaction(async (dbConnection, proceed) => {

                // LOCK THE ORDER WE ARE DEALING WITH, TO PREVENT DOUBLE UPDATES FROM CALLBACK AND RETURN-URL
                order = await sails.sendNativeQuery("SELECT * FROM `order` WHERE id = $1 FOR UPDATE", [order.id])
                    .usingConnection(dbConnection);

                order = order.rows[0];

                console.log(order);


                // CHECK FOR ERRORS IN REQUEST
                if (order.total * 100 !== parseInt(req.body.amount)) {
                    return proceed(new Error('Amount different from order total'))
                }

                if (req.body.currency !== '208' && req.body.currency !== 'DKK') {
                    return proceed(new Error('Invalid currency'))
                }

                if (order.paid ||
                    order.system_updated ||
                    order.receipt_sent ||
                    order.payment_failed
                ) {
                    console.log(
                        'Order already processed. ' +
                        'Paid: ' + order.paid + '. ' +
                        'System updated: ' + order.system_updated + '. ' +
                        'Receipt sent: ' + order.receipt_sent + '. ' +
                        'Payment failed: ' + order.payment_failed + '.'
                    );
                    return proceed(null, false)
                }
                //console.log('Request seems to be error-free');

                await Order.update(
                    {
                        id: order.id
                    }, {
                        paid: new Date()
                    }
                ).usingConnection(dbConnection);

                return proceed(null, true)
            });


            // If order has already been processed, abort.
            if (!doProcessOrder) {
              if (req.body.redirectToFrontend === false) {
                return res.ok()
              } else {
                return res.redirect(302, req.body.frontendsuccessurl);
              }

            }


            // WRITE INFO ABOUT TRANSACTION
            await Order.update(
                {
                    id: order.id
                }, {
                    paid: new Date(),
                    transaction_id: req.body.transact,
                    transaction_fee: req.body.fee,
                    pay_type: req.body.paytype,
                    card_prefix: req.body.cardprefix,
                    card_last_4_digits: req.body.cardnomask.substr(12, 4),
                    gateway_statuscode: req.body.statuscode
                }
            );


            console.log('Updated order with success');


            // APPLY ORDER ITEMS TO CUSTOMER

            await Order.applyItemsToCustomer(order.id);


            // Mark system updated and prepare for invoice

            await Order.update(
                {
                    id: order.id
                }, {
                    system_updated: new Date(),
                    receipt_token: crypto.randomBytes(32).toString('hex')
                }
            );

            await SqlService.setInvoiceId({
                client: req.client.id,
                order: order.id
            });


            // REMOVE BOUGHT ITEMS FROM CART

            let orderItems = await OrderItem.find({order: order.id})
            await Promise.all(orderItems.map(async (orderItem) => {
                await CartItem.destroy({
                    user: order.user,
                    item_type: orderItem.item_type,
                    item_id: orderItem.item_id
                })
            }));

            // SEND RECEIPT

            await receipt.send(order);

            await Order.update(
                {
                    id: order.id
                }, {
                    receipt_sent: new Date()
                }
            );

            // Redirect to profile
          if (req.body.redirectToFrontend === false) {
            return res.ok()
          } else {
            return res.redirect(302, req.body.frontendsuccessurl);
          }


        } catch (err) {
            return res.serverError(err);
        }

    },

    paymentCancelled: function (req, res) {
        console.log('req.body:', req.body);
        console.log('req.query:', req.query);
        return res.redirect(302, req.body.frontenddeclineurl);
    },

    preauthStartTicketAccepted: async function (req, res) {

        console.log('req.body:', req.body);
        console.log('req.query:', req.query);

        // IS THIS A PREAUTH RESPONSE?
        if (req.body.statuscode !== '13') {
            return res.badRequest('Unknown status code')
        }

        let order;
        let dibsClientData;

        // Get order and DIBS data from db
        try {
            // If this is a test payment, there is a random postfix which needs to be discarded. Ex orderid: 123_test9287346
            const orderId = req.body.orderid.split('_')[0];

            order = await Order.findOne(orderId);
            if (!order) return res.badRequest('Order not found');

            dibsClientData = await DibsClientData.find({client: order.client})
            if (!order) return res.serverError('Client dibs data not found');

        } catch (err) {
            return res.serverError(err)
        }


        //
        // CHECK MD5 KEY
        //

        parameterString = 'transact=' + req.body.transact; // TODO Make it work with trans fees
        parameterString += '&amount=preauth';
        parameterString += '&currency=' + req.body.currency;

        console.log(parameterString, dibsClientData);

        calculatedMd5Key = md5(dibsClientData.md5_key_2 + md5(dibsClientData.md5_key_1 + parameterString))

        console.log('calculatedMd5Key:', calculatedMd5Key);

        // TODO Reinstate MD5 check
        /*if (calculatedMd5Key !== req.body.authkey) {
            return res.status(400).json({err: 'Md5key did not match other parameters'});
        }*/

        try {

            // Find out if we should process the order now.
            const doProcessOrder = await sails.getDatastore().transaction(async (dbConnection, proceed) => {

                // LOCK THE ORDER WE ARE DEALING WITH, TO PREVENT DOUBLE UPDATES FROM CALLBACK AND RETURN-URL
                order = await sails.sendNativeQuery("SELECT * FROM `order` WHERE id = $1 FOR UPDATE", [order.id])
                    .usingConnection(dbConnection)

                order = order.rows[0];

                if (order.subscription_created || order.paid || order.system_updated || order.receipt_sent || order.payment_failed) {
                    console.log('Order already processed. Paid: ' + order.paid + '. System updated: ' + order.system_updated + '. Receipt sent: ' + order.receipt_sent + '. Payment failed: ' + order.payment_failed);

                    return proceed(null, false)

                }

                // Order has not been processed. Do it now.
                await Order.update({
                    id: order.id
                }, {
                    subscription_created: new Date()
                }).usingConnection(dbConnection);

                return proceed(null, true)

            });

            if (!doProcessOrder) {
                return res.redirect(302, req.body.frontendsuccessurl);
            }

            console.log(order);

            let orderItem = await OrderItem.find({order: order.id, item_type: 'membership_type'}).limit(1);

            orderItem = orderItem[0];

            console.log('Found order item: ', orderItem);

            if (!orderItem) {
                throw new Error('Order item not found')
            }


            // CREATE TICKET/SUBSCRIPTION

            let subscription = await PaymentSubscription.create({
                client: req.client.id,
                payment_provider_subscription_id: req.body.transact,
                status: 'active',
                pay_type: req.body.paytype,
                card_last_4_digits: req.body.cardnomask.substr(12, 4),
                card_nomask: req.body.cardnomask,
                card_prefix: req.body.cardprefix,
                card_expiration: req.body.cardexpdate,
                card_checksum: req.body.checksum
            }).fetch()

            console.log('Created payment subscription')

            await Order.update({id: order.id}, {payment_subscription: subscription.id})

            console.log('Insert')

            const subscriptionTransaction = await PaymentSubscriptionTransaction.create({
                amount: order.total,
                status: 'pending',
                client: req.client.id,
                payment_subscription: subscription.id
            }).fetch()

            const user = await User.findOne(order.user);
            const ordertext = user.first_name + ' ' + user.last_name + '\n' + orderItem.name;

            let transactionRequestBody = {
                merchant: req.client.dibs_merchant,
                ticket: subscription.payment_provider_subscription_id,
                amount: order.total * 100,
                currency: '208',
                orderid: order.id + '_first_payment' + (order.test ? '_test' + moment().valueOf() : ''),
                textreply: 'true',
                capturenow: 'yes',
                ordertext: ordertext
                // TODO: MD5 key
            };

            if (order.test) {
                transactionRequestBody.test = 1;
            }

            let transactionResponse

            if (transactionRequestBody.amount > 0) {
              transactionResponse = await request.post('https://payment.architrade.com/cgi-ssl/ticket_auth.cgi', {
                form: transactionRequestBody
              });
            } else {
              transactionResponse = "status=ACCEPTED"
            }


            console.log('transactionResponse:', transactionResponse);

            const transactionResponseData = querystring.parse(transactionResponse);

            console.log('transactionResponseData: ', transactionResponseData);

            if (transactionResponseData.status === 'ACCEPTED') {

                await Order.update({id: order.id}, {
                    paid: new Date(),
                    pay_type: req.body.paytype,
                    card_last_4_digits: req.body.cardnomask.substr(12, 4),
                    card_prefix: req.body.cardprefix
                });

                // Set invoice id
                await SqlService.setInvoiceId({
                    client: req.client.id,
                    order: order.id
                });

                await PaymentSubscriptionTransaction.update({id: subscriptionTransaction.id}, {
                    status: 'accepted',
                    transaction_id: transactionResponseData.transact,
                    approvalcode: transactionResponseData.approvalcode,
                });

                const membershipCampaign = orderItem.membership_campaign ?
                  await MembershipCampaign.findOne({id: orderItem.membership_campaign}) :
                  null

                const discountCodeOrderItem = await OrderItem.findOne({order: order.id, item_type: 'discount_code'})
                const discountCode = discountCodeOrderItem ?
                  await DiscountCode.findOne(discountCodeOrderItem.item_id) :
                  null

                let membership = await MembershipType.applyToCustomer(
                    orderItem.item_id,
                    orderItem.payment_option,
                    order.user,
                    order.id,
                    null,
                    !!orderItem.real_user_name,
                    orderItem.real_user_name,
                    null,
                    orderItem.membership_campaign,
                    membershipCampaign ? membershipCampaign.number_of_months_at_reduced_price - 1 : 0,
                    discountCode ? discountCode.id : null
                  );

                console.log('created membership:', membership);

                const paymentOption = await MembershipTypePaymentOption.findOne(orderItem.payment_option);

                await MembershipLog.log(
                    membership,
                    'Medlemskab købt af kunden. Betalingsperiode: ' + paymentOption.name
                );

                await PaymentSubscription.update({id: subscription.id}, {membership: membership.id})


                // Fetch the order back, so we have all details for the receipt.
                order = await Order.update(
                    {
                        id: order.id
                    }, {
                        system_updated: new Date(),
                        membership: membership.id,
                        receipt_token: crypto.randomBytes(32).toString('hex')
                    }
                ).fetch()
                order = order[0]

                await receipt.send(order);

                await Order.update(
                    {
                        id: order.id
                    }, {
                        receipt_sent: new Date()
                    }
                )


                // REMOVE MEMBERSHIP FROM CART

                await CartItem.destroy({
                    user: order.user,
                    item_type: 'membership_type',
                    item_id: orderItem.item_id
                })

                return res.redirect(302, req.body.frontendsuccessurl);


            } else {

                await Order.update({id: order.id}, {
                    payment_failed: new Date()
                })

                await PaymentSubscriptionTransaction.update({id: subscriptionTransaction.id}, {
                    status: 'failed',
                    comment: transactionResponseData.reason
                })

                return res.redirect(302, req.body.frontenddeclineurl);

            }


        } catch (err) {
            return res.serverError(err);
        }

    },


    async preauthStartTicketCancelled(req, res) {
        console.log('req.body:', req.body);
        console.log('req.query:', req.query);

        return res.redirect(302, req.body.frontenddeclineurl);
    },


    async preauthChangeMembershipCreditCardAccepted(req, res) {

        console.log('req.body:', req.body);
        console.log('req.query:', req.query);

        // IS THIS A PREAUTH RESPONSE?
        if (req.body.statuscode !== '13') {
            return res.redirect(302, req.body.frontenddeclineurl);
        }

        let membership;

        try {

            // First check if the membership exists
            membership = await Membership.findOne(req.body.membershipid).populate('payment_subscriptions', {
                status: 'active',
                archived: false
            });
            if (!membership) return res.badRequest('Membership not found');


            await sails.getDatastore().transaction(async (dbConnection, proceed) => {


                // Lock the membership record. Other connections are (I think) not allowed to go past this line then.
                await sails.sendNativeQuery("SELECT * FROM `membership` WHERE id = $1 FOR UPDATE", [req.body.membershipid])
                    .usingConnection(dbConnection);

                const activePaymentSubscriptionWithSameCard = await PaymentSubscription.find({
                    membership: membership.id,
                    card_nomask: req.body.cardnomask,
                    card_prefix: req.body.cardprefix,
                    card_expiration: req.body.cardexpdate,
                    status: 'active',
                    archived: false
                }).usingConnection(dbConnection);

                if (
                    activePaymentSubscriptionWithSameCard &&
                    _.isArray(activePaymentSubscriptionWithSameCard) &&
                    activePaymentSubscriptionWithSameCard.length
                ) {
                    // Card is already active. This is probably because this is the accepturl and the callback has already been executed. Or maybe the customer just added the currently active card again. In any case, it counts as a success.
                    console.log('Card is already active');
                    return proceed();
                }

                // TODO (perhaps): Disable former payment tickets at DIBS
                await PaymentSubscription.update({id: _.map(membership.payment_subscriptions, 'id')}, {status: 'stopped'}).usingConnection(dbConnection);

                await PaymentSubscription.create({
                    client: req.client.id,
                    membership: membership.id,
                    payment_provider_subscription_id: req.body.transact,
                    status: 'active',
                    pay_type: req.body.paytype,
                    card_last_4_digits: req.body.cardnomask.substr(12, 4),
                    card_nomask: req.body.cardnomask,
                    card_prefix: req.body.cardprefix,
                    card_expiration: req.body.cardexpdate
                }).usingConnection(dbConnection);

                // Reset renewal_failed, so cron will try it again
                await Membership.update(
                  {id: membership.id},
                  {
                    renewal_failed: Math.max(membership.renewal_failed - 1, 0),
                    renewal_failed_last_time_at: 0
                  }
                )
                  .usingConnection(dbConnection)

                return proceed()

            });

            // (Now that we have a new credit card, see if membership needs payment.)

            await sails.helpers.memberships.lockVerifyAndProcessMembership(
              membership,
              sails.helpers.memberships.membershipPaymentShouldStillBeProcessed,
              sails.helpers.memberships.fetchMembershipPayment
            )

            /*const membershipNeedsPayment = await MembershipService.testIfMembershipNeedsAutoPaymentAndSetFlagIfTrue({membershipId: membership.id});

            if (membershipNeedsPayment) {
                await DibsPaymentService.fetchMembershipRenewalPayment({
                    membershipId: membership.id
                });
                // Release membership for future auto payments
                await Membership.update({id: membership.id}, {automatic_payment_processing_started: 0});
            }*/


            return res.redirect(302, req.body.frontendsuccessurl);


        } catch (err) {
            return res.serverError(err)
        }

    },

    async preauthChangeMembershipCreditCardCancelled(req, res) {
        console.log('req.body:', req.body);
        console.log('req.query:', req.query);

        return res.redirect(302, req.body.frontenddeclineurl);
    },

};
