module.exports = async (req, res) => {

  let eventData = await Event.validate(req.body)

  const currentEventTimeSlots = await EventTimeSlot.find({event: req.param('id')})

  const currentEvent = await Event.findOne(req.param('id'))

  if (currentEvent && currentEvent.image && currentEvent.image !== eventData.image) {
    await Image.update({id: currentEvent.image}, {expires: 1})
  }

  if (eventData.use_time_slots) {
    _.each(eventData.time_slots, timeSlot => {
      timeSlot.client = req.client.id
    })
    eventData.time_slots = _.sortBy(eventData.time_slots, 'date')
    const timeSlots = await EventTimeSlot.createEach(eventData.time_slots).fetch()
    eventData.time_slots = _.map(timeSlots, 'id')
  } else {
    delete eventData.time_slots
  }

  const updatedEvents = await Event.update({id: req.param('id')}, eventData).fetch()
  const updatedEvent = updatedEvents[0]

  await EventTimeSlot.destroy({id: _.map(currentEventTimeSlots, 'id')})

  if (eventData.image) {
    await Image.update({id: eventData.image}, {expires: 0})
  }

  return res.json(updatedEvent)

}
