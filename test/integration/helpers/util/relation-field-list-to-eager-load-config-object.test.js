const assert = require('assert')


describe('helpers.util.relation-field-list-to-eager-load-config-object', () => {

  it('should convert an array of dot-notated relation field names to an eager load config object', () => {

    const testInput = [
      'room',
      'room.branch',
      'class_type',
      'class_type.image',
      'teachers',
      'teachers.image',
      'signup_count',
      'signups',
      'signups.user',
      'signups.user.image',
      'signups.used_membership',
      'signups.used_membership.real_user_image',
    ]

    const result = sails.helpers.populate.relationFieldListToEagerLoadConfigObject(testInput)

    assert.deepStrictEqual(
      result,
      {
        room: {
          branch: true,
        },
        class_type: {
          image: true,
        },
        teachers: {
          image: true,
        },
        signup_count: true,
        signups: {
          user: {
            image: true,
          },
          used_membership: {
            real_user_image: true,
          },
        },
      },
    )

  })

})
