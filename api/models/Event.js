/**
 * Event.js
 *
 * @description :: TODO: You might write a short summary of how this model works and what it represents here.
 * @docs        :: http://sailsjs.org/documentation/concepts/models-and-orm/models
 */

const moment = require('moment');

const validator = require('validator');
const ValidationError = require('../errors/ValidationError');

module.exports = {

    attributes: {

        client: {
            model: 'Client'
        },

        name: {
            type: 'string'
        },

        description: {
            type: 'string',
            columnType: 'text'
        },

        start_date: {
            type: 'ref',
            columnType: 'date'
        },

        time_freetext: {
            type: 'string',
            columnType: 'text'
        },

        teachers: {
            collection: 'User',
            via: 'teaching_events'
        },

        room: {
            model: 'Room'
        },

        seats: {
            type: 'number'
        },

        price: {
            type: 'number'
        },

        cancelled: {
            type: 'boolean'
        },

        signups: {
            collection: 'EventSignup',
            via: 'event'
        },

        event_group: {
            model: 'EventGroup'
        },

        image: {
            model: 'Image'
        },

        use_time_slots: 'boolean',


        time_slots: {
            collection: 'EventTimeSlot',
            via: 'event'
        },

        show_in_calendar: {
            type: 'boolean',
            defaultsTo: true
        },

        color: {
            type: 'string',
            defaultsTo: '#000'
        },

        send_email_to_customer: {
            type: 'boolean',
            defaultsTo: false
        },

        email_subject: 'string',

        email_body: {
            type: 'string',
            columnType: 'text'
        },

        video_groups: {
            collection: 'VideoGroup',
            via: 'events'
        }

    },

    signUpUser: async function (eventId, userId, clientId, dbConnection) {
        try {
            let signupQuery = EventSignup.create({
                event: eventId,
                user: userId,
                client: clientId
            }).fetch();
            if (dbConnection) signupQuery.usingConnection(dbConnection)
            const eventSignup = await signupQuery;

            const event = await Event.findOne(eventId);

            if (event.send_email_to_customer) {
                await sails.helpers.email.customer.yourNewEvent(eventSignup)
            }

        } catch (err) {
            return err;
        }

    },

    customToJSON: function () {
        this.start_date = moment(this.start_date).format('YYYY-MM-DD')
        return this;
    },

    async validate(event) {
        event = _.pick(event, [
            'name',
            'description',
            'image',
            'event_group',
            'room',
            'price',
            'use_time_slots',
            'show_in_calendar',
            'time_slots',
            'seats',
            'teachers',
            'time_freetext',
            'start_date',
            'send_email_to_customer',
            'email_subject',
            'email_body',
        ])

        event.name = event.name.substr(0,50)
        event.price = parseInt(event.price)
        event.seats = parseInt(event.seats)

        if (parseInt(event.event_group) === 0) event.event_group = null
        if (parseInt(event.room) === 0) event.room = null

        if (!event.name) {
            throw new ValidationError({message: 'E_FIELD_MISSING', field: 'name'})
        }

        if (!event.seats) {
            throw new ValidationError({message: 'E_FIELD_MISSING', field: 'seats'})
        }

        if (event.price < 0) {
            throw new ValidationError({message: 'E_FIELD_MISSING', field: 'price'})
        }

        if (event.use_time_slots) {

            if (!event.time_slots || !event.time_slots.length) {
                throw new ValidationError({message: 'E_FIELD_MISSING', field: 'time_slots'})
            }

            _.each(event.time_slots, (timeSlot, idx) => {
                if (!timeSlot.date) {
                    throw new ValidationError({message: 'E_FIELD_MISSING', field: 'time_slot[' + idx + '].date'})
                }


                if (!timeSlot.start_time) {
                    throw new ValidationError({
                        message: 'E_FIELD_MISSING',
                        field: 'payment_options[' + idx + '].start_time'
                    })
                }
                if (!timeSlot.end_time) {
                    throw new ValidationError({
                        message: 'E_FIELD_MISSING',
                        field: 'payment_options[' + idx + '].end_time'
                    })
                }


                if (!validator.matches(timeSlot.start_time, /^\d\d:\d\d$/)) {
                    throw new ValidationError({
                        message: 'E_FIELD_INVALID',
                        field: 'payment_options[' + idx + '].start_time'
                    })
                }

                if (!validator.matches(timeSlot.end_time, /^\d\d:\d\d$/)) {
                    throw new ValidationError({
                        message: 'E_FIELD_INVALID',
                        field: 'payment_options[' + idx + '].end_time'
                    })
                }


            })


            // Sort by date and time
            event.time_slots = _.sortBy(event.time_slots, timeSlot => {
                return timeSlot.date + ' ' + timeSlot.start_time
            })

            // We need this to make search simpler
            event.start_date = event.time_slots[0].date


        } else {
            if (!event.start_date) {
                throw new ValidationError({message: 'E_FIELD_MISSING', field: 'start_date'})
            }
            if (!validator.matches(event.start_date, /^\d\d\d\d-\d\d-\d\d$/)) {
                throw new ValidationError({message: 'E_FIELD_INVALID', field: 'start_date'})
            }
        }


        // If image does not exist, remove reference
        let image
        if (event.image) {
            image = await Image.findOne(event.image)
            if (!image) delete event.image
        }

        return event

    }
};

