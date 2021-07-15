/**
 * RoomsController
 *
 * @description :: Server-side logic for managing rooms
 * @help        :: See http://sailsjs.org/#!/documentation/concepts/Controllers
 */

module.exports = {

  async find(req, res) {

    const roomsQuery = Room.find({
      client: req.client.id,
      archived: false,
    })

    if (req.query.populate && _.includes(req.query.populate, 'branch')) {
      roomsQuery.populate('branch')
    }

    const rooms = await roomsQuery
    return res.json(rooms)

  },


  async findOne(req, res) {

    const room = await Room.findOne(req.params.id)
    return res.json(room)

  },

  create: async function (req, res) {

    let validatedRoom = await Room.validate(req.body)

    validatedRoom.client = req.client.id

    const createdRoom = await Room.create(validatedRoom).fetch()

    return res.json(createdRoom)

  },

  update: async function (req, res) {


    let validatedRoom = await Room.validate(req.body)

    const createdRoom = await Room.update({id: req.param('id')}, validatedRoom).fetch()

    return res.json(createdRoom)

  },

  destroy: async function (req, res) {

    const deletedRoom = await Room.update({id: req.param('id')}, {archived: true}).fetch()

    return res.json(deletedRoom)

  },

}

