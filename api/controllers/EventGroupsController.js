/**
 * EventGroupsController
 *
 * @description ::
 * @help        :: See http://sailsjs.org/#!/documentation/concepts/Controllers
 */

const moment = require('moment');

module.exports = {

    find: async function (req, res) {

        let eventGroupQuery = EventGroup.find({client: req.client.id, archived: false}).sort('sort ASC');

        if (req.query.populate) {

            const populate = _.keyBy(
                _.intersection(
                    req.query.populate,
                    ['image', 'teachers', 'color']
                )
            );

            _.each(populate, function (field) {
                eventGroupQuery.populate(field)
            })

        }

        try {
            const eventGroups = await eventGroupQuery;
            return res.json(eventGroups);
        } catch (err) {
            return res.serverError(err);
        }

    },

    findOne: async function (req, res) {
        try {

            const eventGroup = await EventGroup.findOne({id: req.params.id});

            if (!eventGroup) {
                return res.badRequest('Event group not found')
            }

            return res.json(eventGroup);

        } catch (err) {
            return res.serverError(err)
        }

    },

    async update(req, res) {

        try {

            let eventGroupData = _.pick(req.body, [
                'name',
                'description',
                'image',
                'color'
            ]);

            const currentEventGroup = await EventGroup.findOne(req.param('id'));

            if (currentEventGroup.image && currentEventGroup.image !== eventGroupData.image) {
                await Image.update({id: currentEventGroup.image}, {archived: true})
            }

            const updatedEventGroup = await EventGroup.update({id: req.param('id')}, eventGroupData).fetch();

            if (currentEventGroup.image !== eventGroupData.image && eventGroupData.image) {
                await Image.update({id: eventGroupData.image}, {expires: 0})
            }

            return res.json(updatedEventGroup)

        } catch (err) {
            return res.serverError(err)
        }
    },

    async create(req, res) {
        try {

            let eventGroupData = _.pick(req.body, [
                'name',
                'description',
                'image',
                'color'
            ]);

            eventGroupData.client = req.client.id;
            eventGroupData.sort = 99999;

            const newEventGroup = await EventGroup.create(eventGroupData).fetch();

            if (eventGroupData.image) {
                await Image.update({id: eventGroupData.image}, {expires: 0})
            }

            return res.json(newEventGroup)

        } catch (err) {
            return res.serverError(err)
        }
    },

    async destroy(req, res) {
        try {

            const currentEventGroup = await EventGroup.findOne(req.param('id'));

            if (currentEventGroup.image) {
                await Image.update({id: currentEventGroup.image}, {archived: true})
            }

            await EventGroup.update({id: req.param('id')}, {archived: true});

            return res.ok()

        } catch (err) {
            return res.serverError(err)
        }
    },

    async updateSort(req, res) {
        try {

            const eventGroupIds = req.body.sortOrder;

            if (!_.isArray(eventGroupIds) || !eventGroupIds.length) {
                return res.badRequest('Invalid input')
            }

            await Promise.all(
                _.map(
                    eventGroupIds,
                    (id, idx) => EventGroup.update(
                        {
                            id: id,
                            client: req.client.id
                        },
                        {
                            sort: idx
                        }
                    )
                )
            );

            return res.ok()

        } catch (err) {
            return res.serverError(err)
        }
    }

};

