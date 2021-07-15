const fixtures = require('../../../../fixtures/factory').fixtures
const assert = require('assert')

describe('helpers.populate.discount-codes.valid-for-items-text.js', async () => {

  it('should return empty array if input array is empty', async () => {

    const result = await sails.helpers.populate.discountCodes.validForItemsText([])

    assert.deepStrictEqual(
      result,
      []
    )
  })

  it('should return the input array if valid_for_items_text is already populated', async () => {

    const discountCodes = [
      {
        valid_for_items_text: 'Test text'
      },
      {
        valid_for_items_text: 'Test text 2'
      },
    ]

    const expectedResult = _.cloneDeep(discountCodes)

    const result = await sails.helpers.populate.discountCodes.validForItemsText(discountCodes)

    assert.deepStrictEqual(
      result,
      expectedResult
    )

    assert.deepStrictEqual(
      discountCodes,
      expectedResult
    )

  })

  it('should populate valid_for_items_text', async () => {

    const discountCodes = [
      {
        valid_for_items: []
      },
      {
        valid_for_items: [
          'membership_type_' + fixtures.membershipTypeYogaUnlimited.id,
        ]
      },
      {
        valid_for_items: [
          'membership_types',
          'class_pass_types',
          'events',
          'products'
        ]
      },
      {
        valid_for_items: [
          'membership_type_' + fixtures.membershipTypeYogaUnlimited.id,
          'class_pass_type_' + fixtures.classPassTypeYogaUnlimitedOneMonth.id,
          'event_' + fixtures.eventWithOneTimeSlot.id,
          'product_' + fixtures.productYogaMat.id
        ]
      }
    ]

    const result = await sails.helpers.populate.discountCodes.validForItemsText(discountCodes)

    assert.deepStrictEqual(
      result,
      [
        {
          valid_for_items: [],
          valid_for_items_text: ''
        },
        {
          valid_for_items: [
            'membership_type_' + fixtures.membershipTypeYogaUnlimited.id,
          ],
          valid_for_items_text: 'Yoga Unlimited'
        },
        {
          valid_for_items: [
            'membership_types',
            'class_pass_types',
            'events',
            'products'
          ],
          valid_for_items_text: 'Alle medlemskaber, Alle adgangskort, Alle kurser, Alle varer'
        },
        {
          valid_for_items: [
            'membership_type_' + fixtures.membershipTypeYogaUnlimited.id,
            'class_pass_type_' + fixtures.classPassTypeYogaUnlimitedOneMonth.id,
            'event_' + fixtures.eventWithOneTimeSlot.id,
            'product_' + fixtures.productYogaMat.id
          ],
          valid_for_items_text: 'Yoga Unlimited, One month of Yoga, Event with one time slot, Yoga Mat'
        }
      ]
    )

  })


})
