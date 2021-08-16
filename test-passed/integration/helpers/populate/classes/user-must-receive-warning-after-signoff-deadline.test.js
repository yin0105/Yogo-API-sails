describe('helpers.populate.classes.user-must-receive-warning-after-signoff-deadline (always "true")', async function () {

  it('should return an empty array if input is empty', async () => {

    const result = await sails.helpers.populate.classes.userMustReceiveWarningAfterSignoffDeadline([]);

    expect(result).to.matchPattern([]);

  });


  it('should return input array unchanged if input is already populated', async () => {

    const workingCopy = [
      {user_must_receive_warning_after_signoff_deadline: true},
      {user_must_receive_warning_after_signoff_deadline: false},
    ];

    await sails.helpers.populate.classes.userMustReceiveWarningAfterSignoffDeadline(workingCopy);

    expect(workingCopy).to.matchPattern([
      {user_must_receive_warning_after_signoff_deadline: true},
      {user_must_receive_warning_after_signoff_deadline: false},
    ]);

  });

  it('should return Class.user_must_receive_warning_after_signoff_deadline (always "true")', async () => {
    let workingCopy = [
      {},
      {},
    ];

    await sails.helpers.populate.classes.userMustReceiveWarningAfterSignoffDeadline(workingCopy);

    expect(workingCopy).to.matchPattern(
      [
        {user_must_receive_warning_after_signoff_deadline: true},
        {user_must_receive_warning_after_signoff_deadline: true},
      ],
    );

  });

});


