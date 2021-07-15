module.exports = async (req, res) => {

  const event = await Event.findOne(req.param('id')).populate('signups', {archived: false}).populate('time_slots')

  if (event.signups.length) {
    return res.badRequest('Can not delete an event that has customers signed up')
  }

  await Event.update({id: req.param('id')}, {archived: true})

  if (event.time_slots.length) {
    const timeSlotIds = _.map(event.time_slots, 'id')
    await EventTimeSlot.update({id: timeSlotIds}, {archived: true})
  }

  return res.ok()

}
