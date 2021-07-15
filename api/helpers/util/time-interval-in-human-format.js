module.exports = {
  friendlyName: 'Time interval in human format',

  description: 'Formats a time interval in a simple and user-friendly way',

  inputs: {
    amount: {
      type: 'number',
      description: 'The number of time units',
      required: true,
    },
    unit: {
      type: 'string',
      description: 'The time unit',
      required: true,
      isIn: ['minute', 'minutes', 'hour', 'hours', 'day', 'days'],
    },
    locale: {
      type: 'string',
    }
  },

  sync: true,

  fn: (inputs, exits) => {

    const t = sails.helpers.t

    let minutes
    if (inputs.unit === 'day' || inputs.unit === 'days') {
      minutes = inputs.amount * 1440
    } else if (inputs.unit === 'hour' || inputs.unit === 'hours') {
      minutes = inputs.amount * 60
    } else {
      minutes = inputs.amount
    }

    if (minutes === 0) {
      return exits.success('0 ' + t.with({key: 'time.minutes', locale: inputs.locale}))
    }

    const days = Math.floor(minutes / 1440)
    const hours = Math.floor((minutes % 1440) / 60)
    minutes = minutes % 60

    const dayUnitName = t.with({key: days > 1 ? 'time.days' : 'time.day', locale: inputs.locale});
    const hourUnitName = t.with({key: hours > 1 ? 'time.hours' : 'time.hour', locale: inputs.locale});
    const minuteUnitName = t.with({key: minutes > 1 ? 'time.minutes' : 'time.minute', locale: inputs.locale});

    let formattedString = ''

    if (days > 0) {
      formattedString = days + ' ' + dayUnitName
      if (hours > 0 && minutes > 0) {
        formattedString += ', '
      } else if (hours > 0 || minutes > 0) {
        formattedString += ' ' + t.with({key: 'global.and', locale: inputs.locale}) + ' '
      }
    }

    if (hours > 0) {
      formattedString += hours + ' ' + hourUnitName
      if (minutes > 0) {
        formattedString += ' ' + t.with({key: 'global.and', locale: inputs.locale}) + ' '
      }
    }

    if (minutes > 0) {
      formattedString += minutes + ' ' + minuteUnitName
    }

    return exits.success(formattedString)
  },

}
