module.exports = async (req, res) => {


  const customerToResetPasswordForQuery = {
    client: req.client.id,
    archived: false,
  }

  if (req.body.id) {
    customerToResetPasswordForQuery.id = req.body.id
  } else if (req.body.email) {
    customerToResetPasswordForQuery.email = req.body.email
  } else {
    return res.badRequest('You must provide either email or id to identify the customer')
  }

  const customerToResetPasswordFor = await User.findOne(customerToResetPasswordForQuery)

  if (!customerToResetPasswordFor) {
    return res.badRequest('Customer not found')
  }

  if (customerToResetPasswordFor.encrypted_password) {
    return res.ok('CUSTOMER_ALREADY_HAS_PASSWORD')
  }

  if (customerToResetPasswordFor.import_welcome_set_password_email_sent) {
    return res.ok('WELCOME_EMAIL_ALREADY_SENT')
  }

  const {
    email_customer_import_welcome_set_password_subject: emailSubjectTemplate,
    email_customer_import_welcome_set_password_body: emailBodyTemplate,
    email_customer_import_welcome_set_password_body_html: emailBodyHtmlTemplate,
  } = await sails.helpers.clientSettings.find.with({
    client: req.client,
    keys: [
      'email_customer_import_welcome_set_password_subject',
      'email_customer_import_welcome_set_password_body',
      'email_customer_import_welcome_set_password_body_html',
    ],
  })

  const token = await User.createAndReturnResetPasswordToken(customerToResetPasswordFor, 3600 * 24 * 14) // Link in email works for 14 days

  const resetPasswordLink = await sails.helpers.webapps.getLink(req.client, `/reset-password/${encodeURIComponent(customerToResetPasswordFor.email)}/${token}`)
  const loginLink = await sails.helpers.webapps.getLink(req.client, '/login')

  const [emailSubject, emailBody, emailHtmlBody] = await sails.helpers.string.fillInVariables(
    [emailSubjectTemplate, emailBodyTemplate, emailBodyHtmlTemplate],
    {
      login_link: loginLink,
      reset_password_link: resetPasswordLink
    },
    {
      studio: req.client,
      customer: customerToResetPasswordFor
    }
  )

  await sails.helpers.email.send.with({
    user: customerToResetPasswordFor,
    subject: emailSubject,
    text: emailBody,
    html: emailHtmlBody || undefined,
    blindCopyToClient: false,
    emailType: 'welcome_customer_reset_password',
  })

  await User.update({
    id: customerToResetPasswordFor.id,
  }, {
    import_welcome_set_password_email_sent: true,
  })

  return res.ok()

}
