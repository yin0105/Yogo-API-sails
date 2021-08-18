const { fixtures } = require('../../../fixtures/factory')

describe('helpers.images.url', () => {
  let getImageUrl

  before(() => {
    getImageUrl = sails.helpers.images.url
  })

  it('throws "imageNotFound" if image is not found', () => {
    const imageUrl = getImageUrl(9999, 200, 200)
    return expect(imageUrl).to.be.rejectedWith('imageNotFound')
  })

  it('throws "imageMissingFilename" if the found image has no filename', () => {
    const imageUrl = getImageUrl(fixtures.imageWithoutFilename, 200, 200)
    return expect(imageUrl).to.be.rejectedWith('imageMissingFilename')
  })

  it('throws "dimensionsMalformed" if the provided width is invalid', () => {
    const imageUrl = getImageUrl(fixtures.testClientImage, -200, 200)
    return expect(imageUrl).to.be.rejectedWith('dimensionsMalformed')
  })

  it('throws "dimensionsMalformed" if the provided height is invalid', () => {
    const imageUrl = getImageUrl(fixtures.testClientImage, 200, -200)
    return expect(imageUrl).to.be.rejectedWith('dimensionsMalformed')
  })

  it('returns correct image url', () => {
    const filename = fixtures.testClientImage.filename
    const imageUrl = getImageUrl(fixtures.testClientImage, 200, 200)
    return expect(imageUrl).to.eventually.equal(
      `${sails.config.imgixServer}/${filename}?w=200&h=200`
    )
  })
})
