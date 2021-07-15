module.exports = async (req, res) => {

  const eventData = await Event.validate(req.body)

  eventData.client = req.client.id

  if (eventData.image) {
    await Image.update({id: eventData.image}, {expires: 0})
  }

  if (eventData.use_time_slots) {
    _.each(eventData.time_slots, timeSlot => {
      timeSlot.client = req.client.id
    })
    eventData.time_slots = _.sortBy(eventData.time_slots, 'date')
    const createdTimeSlots = await EventTimeSlot.createEach(eventData.time_slots).fetch()
    eventData.time_slots = _.map(createdTimeSlots, 'id')
  }

  const newEvent = await Event.create(eventData).fetch()

  return res.json(newEvent)

}
