/**
 * EventsController
 *
 * @description ::
 * @help        :: See http://sailsjs.org/#!/documentation/concepts/Controllers
 */

const moment = require('moment')
require('require-sql')

module.exports = {

    find: async function (req, res) {

        try {

            let populateFields = req.query.populate
                ?
                _.keyBy(_.intersection(req.query.populate, [
                    'user',
                    'user.image',
                    'event',
                    'event.image',
                    'event.teachers',
                    'event.teachers.image',
                    'event.time_slots',
                    'event.room',
                    'event.event_group'
                ]))
                :
                {}

            let signups

            if (req.query.user) {

                const startDate = req.query.startDate ? moment(req.query.startDate, 'YYYY-MM-DD') : moment()
                const endDate = req.query.endDate ? moment(req.query.endDate, 'YYYY-MM-DD') : moment([9999, 11, 31])


                if (startDate.year() < 2017) {
                    return res.badRequest('startDate must be in 2017 or later')
                }

                if (endDate.isBefore(startDate, 'day')) {
                    return res.badRequest('endDate must be after startDate')
                }

                /*if (endDate.diff(startDate, 'year') >= 1) {
                    return res.badRequest('Date range can not be more than a year')
                }*/

                let SQL = require('../sql/EventSignupsControllerSql/findEventSignupsWithUser.sql')



                const rawResult = await sails.sendNativeQuery(SQL, [
                    parseInt(req.query.user),
                    startDate.format('YYYY-MM-DD'),
                    endDate.format('YYYY-MM-DD')
                ]);


                signups = rawResult.rows;

            } else if (req.query.event) {

                signups = await EventSignup.find({event: parseInt(req.query.event), archived: false})

            } else {
                return res.badRequest('User or event must be specified')
            }


            if (populateFields.user) {

                let userIds = _.uniq(_.map(signups, 'user'))

                let userQuery = User.find({id: userIds})

                if (populateFields['user.image']) userQuery.populate('image')

                let users = await userQuery

                users = _.keyBy(users, 'id')

                _.each(signups, (signup) => {
                    signup.user = users[signup.user]
                })

            }

            if (populateFields.event) {

                let eventIds = _.uniq(_.map(signups, 'event'))

                let eventQuery = Event.find({id: eventIds, archived: false})

                _.each(['image', 'teachers', 'time_slots', 'room', 'event_group'], field => {
                    if (populateFields['event.' + field]) eventQuery.populate(field)
                })

                let events = await eventQuery

                events = _.keyBy(events, 'id')

                _.each(signups, (signup) => {
                    signup.event = events[signup.event]
                })

            }


            if (populateFields['event'] && populateFields['event.teachers'] && populateFields['event.teachers.image']) {

                let imageIds = []

                _.each(signups, (signup) => {
                    imageIds = imageIds.concat(_.map(signup.event.teachers, teacher => teacher.image))
                })

                imageIds = _.uniq(_.compact(imageIds))

                let images = await Image.find({id: imageIds, archived: false})
                images = _.keyBy(images, 'id')

                _.each(signups, (signup) => {
                    signup.event.teachers = _.map(signup.event.teachers, teacher => images[teacher])
                })

            }


            return res.json(signups)

        } catch (err) {
            return res.serverError(err)
        }

    },

    async create(req, res) {
        try {

            const signupData = _.pick(req.body, ['event', 'user'])


            signupData.event = parseInt(signupData.event);
            signupData.user = parseInt(signupData.user);

            if (!signupData.event || !signupData.user) {
                return res.badRequest('User and event must be specified')
            }

            const existingSignup = await EventSignup.findOne({
                event: signupData.event,
                user: signupData.user,
                archived: false
            });

            if (existingSignup) {
                return res.ok('E_USER_IS_ALREADY_SIGNED_UP_FOR_EVENT');
            }


            signupData.client = req.client.id;

            const createdSignup = await EventSignup.create(signupData).fetch();

            const event = await Event.findOne(signupData.event);
            if (event.send_email_to_customer) {
                await sails.helpers.email.customer.yourNewEvent(createdSignup);
            }

            return res.json(createdSignup)

        } catch (err) {
            return res.serverError(err)
        }
    },

    async destroy(req, res) {
        try {

            await EventSignup.update({id: req.param('id')}, {archived: true});

            return res.ok()

        } catch (err) {
            return res.serverError(err)
        }
    }

};

