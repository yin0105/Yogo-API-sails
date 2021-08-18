const assert = require('assert')

describe('helpers.string.textToHtml', function () {

  it('should return the provided text, with linebreaks of various types converted to <br> tags.', () => {

    assert.equal(
      sails.helpers.string.textToHtml("Line 1\nLine 2\r\nLine 3 \n\n Line4\r\r\nLine 5"),
      "Line 1<br>\nLine 2<br>\nLine 3 <br>\n<br>\n Line4<br>\n<br>\nLine 5",
    )

  })


})


