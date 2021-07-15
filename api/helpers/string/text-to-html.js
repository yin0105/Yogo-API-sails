module.exports = {

  friendlyName: 'Text to html',

  description: 'Converts text line breaks to html <br> tags. Removes windows-style "double-linebreaks" \r\n.',

  sync: true,

  inputs: {
    text: {
      type: 'string',
      description: 'The text that should have line breaks converted.',
      required: true,
    },
  },

  fn: (inputs, exits) => {
    const html = inputs.text.replace(/\r\n/g, '\n').replace(/\r/g, '\n').replace(/\n/g, '<br>\n')
    //const html = inputs.text.replace(/(?:\r\n|\r|\n)/g, '<br>\n')

    return exits.success(html)
  },

}
