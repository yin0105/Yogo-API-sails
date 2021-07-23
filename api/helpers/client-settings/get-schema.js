module.exports = {

  friendlyName: 'Get client settings schema',

  description: 'Returns the client settings schema',

  sync: true,

  fn: (inputs, exits) => {

    return exits.success({

      google_tag_manager_id: {
        type: 'string',
        defaultsTo: '',
      },

      website_domain: {
        type: 'string',
        isURL: true,
        defaultsTo: '',
      },

      website_cms: {
        type: 'string',
        isIn: ['wordpress', 'squarespace', 'other'],
        defaultsTo: 'other',
      },

      login_greeting: {
        type: 'string',
        localizedDefault: true,
        defaultsTo: {
          da: 'Velkommen til [studio_name]',
          en: 'Welcome to [studio_name]',
        },
      },

      sms_sender_name: {
        type: 'string',
        defaultsTo: '',
      },

      sms_customer_your_class_has_been_cancelled_message: {
        type: 'string',
        localizedDefault: true,
        defaultsTo: {
          da: `Kære [customer_first_name]

Vi må desværre aflyse [class_type_name], [class_date] kl. [class_start_time].

Hvis du har brugt et klippekort til at tilmelde dig, har du fået dit klip tilbage.

Venlig hilsen
[studio_name]`,
          en: `Dear [customer_first_name],

Unfortunately, we have to cancel [class_type_name], [class_date] at [class_start_time].

If you used a class pass with a fixed number of classes to sign up, the class has been returned.

Kind regards,
[studio_name]`,
        },
      },

      email_customer_your_class_has_been_cancelled_subject: {
        type: 'string',
        localizedDefault: true,
        defaultsTo: {
          da: `AFLYST: [class_type_name], [class_date] kl. [class_start_time]`,
          en: `CANCELLED: [class_type_name], [class_date] at [class_start_time]`,
        },
      },

      email_customer_your_class_has_been_cancelled_body: {
        type: 'string',
        localizedDefault: true,
        defaultsTo: {
          da: `Kære [customer_first_name]

Vi må desværre aflyse [class_type_name], [class_date] kl. [class_start_time].

Hvis du har brugt et klippekort til at tilmelde dig, har du fået dit klip tilbage.

Venlig hilsen
[studio_name]`,
          en: `Dear [customer_first_name],

Unfortunately, we have to cancel [class_type_name], [class_date] at [class_start_time].

If you used a class pass with a fixed number of classes to sign up, the class has been returned.

Kind regards,
[studio_name]`,
        },
      },

      payment_service_provider: {
        type: 'string',
        isIn: ['dibs', 'reepay'],
        defaultsTo: null,
      },

      payment_service_provider_dibs_merchant_id: {
        type: 'string',
        defaultsTo: '',
      },

      payment_show_visa_mastercard_logos: {
        type: 'boolean',
        defaultsTo: true,
      },

      payment_show_dankort_logo: {
        type: 'boolean',
        defaultsTo: false,
      },

      payment_show_mobilepay_logo: {
        type: 'boolean',
        defaultsTo: false,
      },

      pause_automatic_membership_payments: {
        type: 'boolean',
        defaultsTo: false,
      },

      send_receipt_on_email_for_automatic_membership_payments: {
        type: 'boolean',
        defaultsTo: true,
      },

      vimeo_update_video_list_needed: {
        type: 'boolean',
        defaultsTo: true,
      },

      livestream_enabled: {
        type: 'boolean',
        defaultsTo: false,
      },

      livestream_send_email_to_customers_minutes_before_class_start: {
        type: 'integer',
        defaultsTo: 30,
      },

      livestream_email_to_customers_before_class_start_subject: {
        type: 'string',
        localizedDefault: true,
        defaultsTo: {
          da: 'Livestream til [class_name] kl. [class_start_time] starter snart',
          en: 'Livestream for [class_name] at [class_start_time] will start shortly',
        },
      },

      livestream_email_to_customers_before_class_start_body: {
        type: 'string',
        localizedDefault: true,
        defaultsTo: {
          da: `Kære [first_name]

Du er tilmeldt livestream til [class_name], [class_date] kl. [class_start_time].

Klassen starter snart og du kan streame den her:
[class_livestream_link]

Venlig hilsen
[studio_name]`,
          en: `Dear [first_name],

You are signed up for the livestream for [class_name], [class_date] at [class_start_time].

The class will start shortly and the livestream is available here:
[class_livestream_link]

Kind regards,
[studio_name]`,
        },
      },

      client_can_see_client_export_page: {
        type: 'boolean',
        defaultsTo: false,
      },

      theme: {
        defaultsTo: 'minimalistic',
        type: 'string',
        isIn: ['framed', 'minimalistic'],
      },

      theme_primary_color: {
        type: 'string',
        defaultsTo: '#12169c',
      },

      theme_background_color: {
        type: 'string',
        defaultsTo: '#f7f7f7',
      },

      theme_font_type: {
        type: 'string',
        isIn: ['google_web_font', 'custom'],
        defaultsTo: 'google_web_font',
      },

      theme_google_web_font: {
        type: 'string',
        defaultsTo: 'Open Sans',
      },

      theme_font_family: {
        type: 'string',
        defaultsTo: 'Open Sans',
      },

      // Deprecated
      theme_custom_font_head_tags: {
        type: 'string',
        defaultsTo: '',
      },

      theme_custom_font_stylesheet_url: {
        type: 'string',
        defaultsTo: '',
      },

      theme_font_size: {
        type: 'string',
        defaultsTo: 'auto',
      },

      checkin_show_classes_that_start_within: {
        type: 'string',
        isIn: ['rest_of_the_day', 'number_of_minutes'],
        defaultsTo: 'rest_of_the_day',
      },

      checkin_show_classes_that_start_within_number_of_minutes: {
        type: 'integer',
        defaultsTo: 120,
      },

      checkin_direct_customer_to_room_after_checkin: {
        type: 'boolean',
        defaultsTo: true,
      },

      checkin_classes_are_visible_until: {
        type: 'string',
        isIn: ['class_start', 'class_end', 'minutes_after_class_start'],
        defaultsTo: 'minutes_after_class_start',
      },

      checkin_classes_are_visible_for_minutes_after_start: {
        type: 'integer',
        defaultsTo: 15,
      },

      checkin_show_alphabet_scrollbar: {
        type: 'boolean',
        defaultsTo: true,
      },

      calendar_layout_type: {
        type: 'string',
        isIn: ['list', 'timetable'],
        defaultsTo: 'list',
      },

      calendar_show_room: {
        type: 'boolean',
        defaultsTo: false,
      },

      calendar_show_teacher_filter: {
        type: 'boolean',
        defaultsTo: true,
      },

      calendar_show_classtype_filter: {
        type: 'boolean',
        defaultsTo: true,
      },

      calendar_show_classes_and_events_separately_or_together: {
        type: 'string',
        isIn: ['separately', 'together'],
        defaultsTo: 'separately',
      },

      frontend_myprofile_show_myactivity: {
        type: 'boolean',
        defaultsTo: true,
      },

      frontend_overlay_size: {
        type: 'string',
        isIn: ['full_screen', 'popup'],
        defaultsTo: 'popup',
      },

      frontend_show_menu_item_calendar: {
        type: 'boolean',
        defaultsTo: true,
      },

      frontend_show_menu_item_events: {
        type: 'boolean',
        defaultsTo: true,
      },

      frontend_show_menu_item_prices: {
        type: 'boolean',
        defaultsTo: true,
      },

      class_waiting_list_enabled: {
        type: 'boolean',
        defaultsTo: true,
      },

      class_waiting_list_max_customers_on_waiting_list: {
        type: 'integer',
        defaultsTo: 20,
      },

      email_class_waiting_list_purged_customer_did_not_get_seat_subject: {
        type: 'string',
        localizedDefault: true,
        defaultsTo: {
          da: 'Ventelisten er nu annulleret til [class_name], [class_date] kl. [class_start_time]',
          en: 'The waitlist is now cancelled for [class_name], [class_date] at [class_start_time]',
        },
      },

      email_class_waiting_list_purged_customer_did_not_get_seat_body: {
        type: 'string',
        localizedDefault: true,
        defaultsTo: {
          da: `Kære [first_name]

Ventelisten til [class_name], [class_date] kl. [class_start_time] er nu annulleret, da holdet starter inden længe. Du fik desværre ikke plads på holdet.

Hvis du brugte et klippekort til at tilmelde dig ventelisten, har du fået dit klip tilbage.

Venlig hilsen
[studio_name]`,
          en: `Dear [first_name],

The waitlist for [class_name], [class_date] at [class_start_time] has now been cancelled, as the class will begin shortly. Unfortunately, there are still no spots available.

If you used a class pass with a set number of classes, the class has been returned to your class pass.

Kind regards,
[studio_name]`,
        },
      },

      email_class_waiting_list_customer_moved_from_waiting_list_to_signup_subject: {
        type: 'string',
        localizedDefault: true,
        defaultsTo: {
          da: 'Du er nu tilmeldt [class_name], [class_date] kl. [class_start_time]',
          en: 'You are now signed up for [class_name], [class_date] at [class_start_time]',
        },
      },

      email_class_waiting_list_customer_moved_from_waiting_list_to_signup_body: {
        type: 'string',
        localizedDefault: true,
        defaultsTo: {
          da: `Kære [first_name]

Du er nu tilmeldt [class_name], [class_date] kl. [class_start_time], som du stod på venteliste til.

Vi glæder os til at se dig!

Venlig hilsen
[studio_name]`,
          en: `Dear [first_name],

You are now signed up for [class_name], [class_date] at [class_start_time], which you were on the waitlist for.

We are looking forward to see you.

Kind regards,
[studio_name]`,
        },
      },

      sms_class_waiting_list_customer_moved_from_waiting_list_to_signup: {
        type: 'string',
        localizedDefault: true,
        defaultsTo: {
          da: `Kære [first_name]

Du er nu tilmeldt [class_name], [class_date] kl. [class_start_time], som du stod på venteliste til.

Vi glæder os til at se dig!

Venlig hilsen
[studio_name]`,
          en: `Dear [first_name],

You are now signed up for [class_name], [class_date] at [class_start_time], which you were on the waitlist for.

We are looking forward to see you.

Kind regards,
[studio_name]`,
        },
      },

      email_your_waiting_list_class_has_been_cancelled_subject: {
        type: 'string',
        localizedDefault: true,
        defaultsTo: {
          da: 'AFLYST: [class_name], [class_date] kl. [class_start_time]',
          en: 'CANCELLED: [class_name], [class_date] at [class_start_time]',
        },
      },

      email_your_waiting_list_class_has_been_cancelled_body: {
        type: 'string',
        localizedDefault: true,
        defaultsTo: {
          da: `Kære [first_name]

Vi må desværre aflyse [class_name], [class_date] kl. [class_start_time], som du står på venteliste til.

Hvis du brugte et klippekort til at tilmelde dig, har du fået dit klip tilbage.

Venlig hilsen
[studio_name]`,
          en: `Dear [first_name],

Unfortunately, we have to cancel [class_name], [class_date] at [class_start_time], which you are on the waitlist for.

If you used a class pass with a fixed number of classes to sign up, the class has been returned.

Kind regards,
[studio_name]`,
        },
      },

      private_class_waiting_list_enabled: {
        type: 'boolean',
        defaultsTo: true,
      },

      private_class_waiting_list_max_customers_on_waiting_list: {
        type: 'integer',
        defaultsTo: 2,
      },

      signup_show_phone_field: {
        type: 'boolean',
        defaultsTo: true,
      },

      signup_phone_field_required: {
        type: 'boolean',
        defaultsTo: true,
      },

      signup_show_date_of_birth_field: {
        type: 'boolean',
        defaultsTo: false,
      },

      signup_date_of_birth_field_required: {
        type: 'boolean',
        defaultsTo: false,
      },

      email_welcome_subject: {
        type: 'string',
        localizedDefault: true,
        defaultsTo: {
          da: `Velkommen til [studio_name]`,
          en: `Welcome to [studio_name]`,
        },
      },

      email_welcome_body: {
        type: 'string',
        localizedDefault: true,
        defaultsTo: {
          da: `Kære [customer_first_name]

Velkommen til [studio_name].

Din profil er oprettet og du kan nu købe medlemskaber, klippekort og kurser, melde dig til hold m.m.

Venlig hilsen
[studio_name]`,
          en: `Dear [customer_first_name],

Welcome to [studio_name].

Your profile has been created and you can now buy memberships, class passes and events, sign up for classes etc.

Kind regards,
[studio_name]`,
        },
      },

      email_customer_reset_password_subject: {
        type: 'string',
        localizedDefault: true,
        defaultsTo: {
          da: 'Nulstilling af din adgangskode hos [studio_name]',
          en: 'Reset password for [studio_name]',
        },
      },

      email_customer_reset_password_body: {
        type: 'string',
        localizedDefault: true,
        defaultsTo: {
          da: `Kære [customer_first_name]

Du har bedt om at nulstille din adgangskode hos [studio_name].

Du kan indstille en ny adgangskode ved at følge dette link: [link]

Hvis det ikke virker, kan du kopiere linket ind i adresselinjen på din browser.

Venlig hilsen
[studio_name]`,
          en: `Dear [customer_first_name],

You have requested a password reset for [studio_name].

You can set a new password by following this link: [link]

If it doesn't work, you can copy and paste the link into the address bar in your browser.

Kind regards,
[studio_name]`,
        },
      },

      email_receipt_subject: {
        type: 'string',
        localizedDefault: true,
        defaultsTo: {
          da: 'Kvittering fra [studio_name]',
          en: 'Receipt from [studio_name]',
        },
      },

      email_receipt_body: {
        type: 'string',
        localizedDefault: true,
        defaultsTo: {
          da: `Kære [customer_first_name]

Tak for dit køb. Din kvittering er vedhæftet.

Venlig hilsen
[studio_name]`,
          en: `Dear [customer_first_name],

Thanks for your purchase. This is your receipt.

Kind regards,
[studio_name]`,
        },
      },

      receipt_pdf_filename: {
        type: 'string',
        localizedDefault: true,
        defaultsTo: {
          da: 'Kvittering fra [studio_name].pdf',
          en: 'Receipt from [studio_name].pdf',
        },
      },

      email_customer_cancelled_membership_with_notice_subject: {
        type: 'string',
        localizedDefault: true,
        defaultsTo: {
          da: 'Du har opsagt dit medlemskab [membership_type]',
          en: 'You have cancelled your [membership_type] membership',
        },
      },

      email_customer_cancelled_membership_with_notice_body: {
        type: 'string',
        localizedDefault: true,
        defaultsTo: {
          da: `Kære [customer_first_name]

Du har opsagt dit medlemskab [membership_type].

Der er en måneds opsigelse på medlemskabet.

Medlemskabet stopper en måned efter næste betaling, dvs. [cancelled_from_date].

Venlig hilsen
[studio_name]`,
          en: `Dear [customer_first_name],

You have cancelled your [membership_type] membership.

There is a one-month notice on the membership and therefore the membership will terminate one month after your next payment, i.e [cancelled_from_date].

Kind regards,
[studio_name]`,
        },
      },

      email_customer_cancelled_membership_without_notice_subject: {
        type: 'string',
        localizedDefault: true,
        defaultsTo: {
          da: 'Du har opsagt dit medlemskab [membership_type]',
          en: 'You have cancelled your [membership_type] membership',
        },
      },

      email_customer_cancelled_membership_without_notice_body: {
        type: 'string',
        localizedDefault: true,
        defaultsTo: {
          da: `Kære [customer_first_name]

Du har opsagt dit medlemskab [membership_type].

Medlemskabet stopper når den betalte periode udløber, dvs [cancelled_from_date].

Venlig hilsen
[studio_name]`,
          en: `Dear [customer_first_name],

You have cancelled your [membership_type] membership.

The membership will terminate at the end of the paid period, i.e [cancelled_from_date].

Kind regards,
[studio_name]`,
        },
      },


      email_customer_reactivated_cancelled_membership_subject: {
        type: 'string',
        localizedDefault: true,
        defaultsTo: {
          da: 'Du har genoptaget dit medlemskab [membership_type]',
          en: 'You have re-activated your [membership_type] membership',
        },
      },

      email_customer_reactivated_cancelled_membership_body: {
        type: 'string',
        localizedDefault: true,
        defaultsTo: {
          da: `Kære [customer_first_name]

Du har genoptaget dit medlemskab [membership_type].

Medlemskabet er hermed aktivt igen og næste betaling på [next_payment_amount] kr. bliver trukket på dit betalingskort [next_payment_date].

Venlig hilsen
[studio_name]`,
          en: `Dear [customer_first_name],

You have re-activated your [membership_type] membership.

The membership is now active and the next payment for [next_payment_amount] kr. will be drawn from your payment card [next_payment_date].

Kind regards,
[studio_name]`,
        },
      },

      email_your_cancelled_membership_has_ended_subject: {
        type: 'string',
        localizedDefault: true,
        defaultsTo: {
          da: `Opsagt medlemskab [membership_name] er stoppet`,
          en: `Your cancelled [membership_name] membership has been terminated`,
        },
      },

      email_your_cancelled_membership_has_ended_body: {
        type: 'string',
        localizedDefault: true,
        defaultsTo: {
          da: `Kære [customer_first_name]

Dit medlemskab [membership_name], som du har opsagt, er hermed stoppet, da opsigelsesperioden er udløbet.

Venlig hilsen
[studio_name]`,
          en: `Dear [customer_first_name],

Your membership [membership_name], which you have cancelled, has now been terminated, as the notice period has passed.

Kind regards,
[studio_name]`,
        },
      },

      membership_number_of_failed_payment_attempts_before_termination: {
        type: 'integer',
        defaultsTo: 5,
      },

      membership_payment_failed_1_email_subject: {
        type: 'string',
        localizedDefault: true,
        defaultsTo: {
          da: 'Vi kunne ikke forny dit medlemskab',
          en: 'We could not renew your membership',
        },
      },

      membership_payment_failed_1_email_body: {
        type: 'string',
        localizedDefault: true,
        defaultsTo: {
          da: `Kære [customer_first_name]

Vi har forsøgt at trække [membership_payment_amount] på dit betalingskort for at forny dit medlemskab [membership_name].

Betalingen blev afvist. Du bedes venligst logge ind på din profil og lægge et nyt betalingskort ind. Du kan også vælge at prøve betalingen igen med det nuværende betalingskort.

Du kan logge ind ved at følge dette link: [update_membership_payment_method_link]

Venlig hilsen
[studio_name]`,
          en: `Dear [customer_first_name],

We tried to renew your membership [membership_name] by withdrawing [membership_payment_amount] on your payment card.

The payment was declined. Please log in to your profile and specify another payment card. You can also try the payment again with the current payment card.

You can log in by following this link: [update_membership_payment_method_link]

Kind regards,
[studio_name]`,
        },
      },

      membership_payment_failed_no_payment_method_1_email_subject: {
        type: 'string',
        localizedDefault: true,
        defaultsTo: {
          da: 'Vi kunne ikke forny dit medlemskab',
          en: 'We could not renew your membership',
        },
      },

      membership_payment_failed_no_payment_method_1_email_body: {
        type: 'string',
        localizedDefault: true,
        defaultsTo: {
          da: `Kære [customer_first_name]

Vi har forsøgt at forny dit medlemskab [membership_name], men der er ikke noget betalingskort tilknyttet medlemskabet. Du bedes venligst logge ind på din profil og lægge et betalingskort ind.

Du kan logge ind ved at følge dette link: [update_membership_payment_method_link]

Venlig hilsen
[studio_name]`,
          en: `Dear [customer_first_name],

We tried to renew your membership [membership_name] but there is currently no payment card associated with your membership. Please log in to your profile and specify another payment card.

You can log in by following this link: [update_membership_payment_method_link]

Kind regards,
[studio_name]`,
        },
      },


      membership_payment_failed_days_before_attempt_2: {
        type: 'integer',
        defaultsTo: 3,
      },

      membership_payment_failed_2_email_subject: {
        type: 'string',
        localizedDefault: true,
        defaultsTo: {
          da: 'Vi kunne ikke forny dit medlemskab',
          en: 'We could not renew your membership',
        },
      },

      membership_payment_failed_2_email_body: {
        type: 'string',
        localizedDefault: true,
        defaultsTo: {
          da: `Kære [customer_first_name]

Vi har forsøgt at trække [membership_payment_amount] på dit betalingskort for at forny dit medlemskab [membership_name].

Betalingen blev afvist. Du bedes venligst logge ind på din profil og lægge et nyt betalingskort ind. Du kan også vælge at prøve betalingen igen med det nuværende betalingskort.

Du kan logge ind ved at følge dette link: [update_membership_payment_method_link]

Venlig hilsen
[studio_name]`,
          en: `Dear [customer_first_name],

We tried to renew your membership [membership_name] by withdrawing [membership_payment_amount] on your payment card.

The payment was declined. Please log in to your profile and specify another payment card. You can also try the payment again with the current payment card.

You can log in by following this link: [update_membership_payment_method_link]

Kind regards,
[studio_name]`,
        },
      },

      membership_payment_failed_no_payment_method_2_email_subject: {
        type: 'string',
        localizedDefault: true,
        defaultsTo: {
          da: 'Vi kunne ikke forny dit medlemskab',
          en: 'We could not renew your membership',
        },
      },

      membership_payment_failed_no_payment_method_2_email_body: {
        type: 'string',
        localizedDefault: true,
        defaultsTo: {
          da: `Kære [customer_first_name]

Vi har forsøgt at forny dit medlemskab [membership_name], men der er ikke noget betalingskort tilknyttet medlemskabet. Du bedes venligst logge ind på din profil og lægge et betalingskort ind.

Du kan logge ind ved at følge dette link: [update_membership_payment_method_link]

Venlig hilsen
[studio_name]`,
          en: `Dear [customer_first_name],

We tried to renew your membership [membership_name] but there is currently no payment card associated with your membership. Please log in to your profile and specify another payment card.

You can log in by following this link: [update_membership_payment_method_link]

Kind regards,
[studio_name]`,
        },
      },

      membership_payment_failed_days_before_attempt_3: {
        type: 'integer',
        defaultsTo: 3,
      },

      membership_payment_failed_3_email_subject: {
        type: 'string',
        localizedDefault: true,
        defaultsTo: {
          da: 'Vi kunne ikke forny dit medlemskab',
          en: 'We could not renew your membership',
        },
      },

      membership_payment_failed_3_email_body: {
        type: 'string',
        localizedDefault: true,
        defaultsTo: {
          da: `Kære [customer_first_name]

Vi har forsøgt at trække [membership_payment_amount] på dit betalingskort for at forny dit medlemskab [membership_name].

Betalingen blev afvist. Du bedes venligst logge ind på din profil og lægge et nyt betalingskort ind. Du kan også vælge at prøve betalingen igen med det nuværende betalingskort.

Du kan logge ind ved at følge dette link: [update_membership_payment_method_link]

Venlig hilsen
[studio_name]`,
          en: `Dear [customer_first_name],

We tried to renew your membership [membership_name] by withdrawing [membership_payment_amount] on your payment card.

The payment was declined. Please log in to your profile and specify another payment card. You can also try the payment again with the current payment card.

You can log in by following this link: [update_membership_payment_method_link]

Kind regards,
[studio_name]`,
        },
      },

      membership_payment_failed_no_payment_method_3_email_subject: {
        type: 'string',
        localizedDefault: true,
        defaultsTo: {
          da: 'Vi kunne ikke forny dit medlemskab',
          en: 'We could not renew your membership',
        },
      },

      membership_payment_failed_no_payment_method_3_email_body: {
        type: 'string',
        localizedDefault: true,
        defaultsTo: {
          da: `Kære [customer_first_name]

Vi har forsøgt at forny dit medlemskab [membership_name], men der er ikke noget betalingskort tilknyttet medlemskabet. Du bedes venligst logge ind på din profil og lægge et betalingskort ind.

Du kan logge ind ved at følge dette link: [update_membership_payment_method_link]

Venlig hilsen
[studio_name]`,
          en: `Dear [customer_first_name],

We tried to renew your membership [membership_name] but there is currently no payment card associated with your membership. Please log in to your profile and specify another payment card.

You can log in by following this link: [update_membership_payment_method_link]

Kind regards,
[studio_name]`,
        },
      },

      membership_payment_failed_days_before_attempt_4: {
        type: 'integer',
        defaultsTo: 3,
      },

      membership_payment_failed_4_email_subject: {
        type: 'string',
        localizedDefault: true,
        defaultsTo: {
          da: 'Dit medlemskab bliver annulleret i morgen',
          en: 'Your membership will be cancelled tomorrow',
        },
      },

      membership_payment_failed_4_email_body: {
        type: 'string',
        localizedDefault: true,
        defaultsTo: {
          da: `Kære [customer_first_name].

I morgen vil vi forsøge at trække [membership_payment_amount] for dit medlemskab [membership_name] for sidste gang. Hvis betalingen ikke går igennem, vil dit medlemskab blive annulleret.

Du kan logge ind og angive et nyt betalingskort her: [update_membership_payment_method_link]

Venlig hilsen
[studio_name]`,
          en: `Dear [customer_first_name].

Tomorrow we will try one final time to withdraw [membership_payment_amount] on your payment card to renew your membership [membership_name]. If the payment is declined, your membership will be cancelled.

You can log in and specify a new payment card here: [update_membership_payment_method_link]

Kind regards,
[studio_name]`,
        },
      },

      membership_payment_failed_no_payment_method_4_email_subject: {
        type: 'string',
        localizedDefault: true,
        defaultsTo: {
          da: 'Dit medlemskab bliver annulleret i morgen',
          en: 'Your membership will be cancelled tomorrow',
        },
      },

      membership_payment_failed_no_payment_method_4_email_body: {
        type: 'string',
        localizedDefault: true,
        defaultsTo: {
          da: `Kære [customer_first_name]

I morgen vil vi forsøge at trække [membership_payment_amount] for dit medlemskab [membership_name] for sidste gang. Hvis der stadig ikke er noget betalingskort på medlemskabet i morgen, vil medlemskabet blive annulleret.

Du kan logge ind og angive et betalingskort her: [update_membership_payment_method_link]

Venlig hilsen
[studio_name]`,
          en: `Dear [customer_first_name],

Tomorrow we will try one final time to withdraw [membership_payment_amount] on your payment card to renew your membership [membership_name]. If there is still no payment card associated with your membership tomorrow, your membership will be cancelled.

You can log in and specify a payment card here: [update_membership_payment_method_link]

Kind regards,
[studio_name]`,
        },
      },

      membership_payment_failed_days_before_attempt_5: {
        type: 'integer',
        defaultsTo: 1,
      },

      membership_payment_failed_5_email_subject: {
        type: 'string',
        localizedDefault: true,
        defaultsTo: {
          da: 'Dit medlemskab er stoppet',
          en: 'Your membership has been cancelled',
        },
      },

      membership_payment_failed_5_email_body: {
        type: 'string',
        localizedDefault: true,
        defaultsTo: {
          da: `Kære [customer_first_name]

Vi har forsøgt at trække [membership_payment_amount] på dit betalingskort for at forny dit medlemskab [membership_name].

Betalingen blev afvist. Vi har nu forsøgt at trække betalingen flere gange uden held og dit medlemskab er derfor stoppet.

Venlig hilsen
[studio_name]`,
          en: `Dear [customer_first_name],

We tried to renew your membership [membership_name] by withdrawing [membership_payment_amount] on your payment card.

The payment was declined. We have tried to withdraw the payment several times and your membership has therefore now been cancelled.

Kind regards,
[studio_name]`,
        },
      },

      membership_payment_failed_no_payment_method_5_email_subject: {
        type: 'string',
        localizedDefault: true,
        defaultsTo: {
          da: 'Dit medlemskab er stoppet',
          en: 'Your membership has been cancelled',
        },
      },

      membership_payment_failed_no_payment_method_5_email_body: {
        type: 'string',
        localizedDefault: true,
        defaultsTo: {
          da: `Kære [customer_first_name]

Vi har forsøgt at forny dit medlemskab [membership_name].

Der er ikke noget betalingskort tilknyttet dit medlemskab. Vi har nu forsøgt at forny medlemskabet flere gange uden held og dit medlemskab er derfor stoppet.

Venlig hilsen
[studio_name]`,
          en: `Dear [customer_first_name],

We have tried to renew your membership [membership_name].

There is no payment card associated with your membership. We have tried to renew your membership several times and your membership has therefore now been cancelled.

Kind regards,
[studio_name]`,
        },
      },

      invoice_email_additional_recipients: {
        type: 'string',
        defaultsTo: '',
      },

      dibs_merchant: {
        type: 'string',
        defaultsTo: '',
      },

      customer_profile_use_additional_info_field: {
        type: 'boolean',
        defaultsTo: true,
      },

      customer_profile_additional_info_field_subtitle: {
        type: 'string',
        defaultsTo: '',
      },

      calendar_capacity_info_format: {
        type: 'string',
        isIn: ['available_slash_total_seats', 'warning_on_few_seats_left', 'number_of_available_seats', 'none'],
        defaultsTo: 'available_slash_total_seats',
      },

      calendar_few_seats_left_warning_text: {
        type: 'string',
        localizedDefault: true,
        defaultsTo: {
          da: 'Få ledige pladser',
          en: 'Few available seats',
        },
      },

      calendar_few_seats_left_warning_limit: {
        type: 'integer',
        defaultsTo: 3,
      },

      email_customer_import_welcome_set_password_subject: {
        type: 'string',
        localizedDefault: true,
        defaultsTo: {
          da: 'Velkommen til vores nye bookingsystem',
          en: 'Welcome to our new booking system',
        },
      },

      email_customer_import_welcome_set_password_body: {
        type: 'string',
        localizedDefault: true,
        defaultsTo: {
          da: `Kære [first_name]

Nu er vores nye bookingsystem online. Vi har flyttet din profil over i det nye system, herunder dit medlemskab eller klippekort og dine forhåndstilmeldinger til klasser og kurser. Det eneste du skal gøre er at klikke på nedenstående link og oprette en adgangskode. Den kan vi desværre ikke flytte med over.

[reset_password_link]

Linket virker i 14 dage. Herefter kan du stadig sagtens oprette en adgangskode, så skal du blot gå ind på [login_link] og vælge “Nulstil adgangskode”

Hvis du har nogen spørgsmål, så kontakt os på [studio_email]

Mange hilsner,
[studio_name]`,
          en: `Dear [first_name]

Our new booking system is now online. We have moved your profile to the new system including your membership or access pass and your signups for classes and events. The only thing you need to do is click the link below and create a new password. Unfortunately, we can\'t move that over from the old system.

[reset_password_link]

The link works for 14 days. After that you can still choose a new password. Just click here: [login_link] and click “Reset password”

If you have any questions, please contact us on [studio_email]

Kind regards,
[studio_name]`,
        },
      },

      email_customer_import_welcome_set_password_body_html: {
        type: 'string',
        defaultsTo: '',
      },

      email_bcc_to_client_send_to: {
        type: 'string',
        defaultsTo: '',
        isEmail: true,
      },

      email_bcc_to_client_on_class_cancelled: {
        type: 'boolean',
        defaultsTo: false,
      },

      email_bcc_to_client_on_customer_cancel_or_resume_membership: {
        type: 'boolean',
        defaultsTo: true,
      },

      email_bcc_to_client_on_customer_moved_from_waiting_list_to_class: {
        type: 'boolean',
        defaultsTo: false,
      },

      email_bcc_to_client_on_class_waiting_list_cancelled: {
        type: 'boolean',
        defaultsTo: false,
      },

      email_bcc_to_client_on_your_class_livestream_will_begin_shortly: {
        type: 'boolean',
        defaultsTo: false,
      },

      email_bcc_to_client_on_membership_renewal_failed: {
        type: 'boolean',
        defaultsTo: true,
      },

      email_bcc_to_client_on_receipt: {
        type: 'boolean',
        defaultsTo: true,
      },

      terms: {
        type: 'string',
        defaultsTo: '',
      },

      show_recurring_terms: {
        type: 'boolean',
        defaultsTo: false,
      },

      recurring_terms: {
        type: 'string',
        defaultsTo: '',
      },

      class_signoff_deadline: {
        type: 'integer',
        defaultsTo: 120,
      },

      private_class_signup_deadline: {
        type: 'integer',
        defaultsTo: 1440, // 24 hours
      },

      private_class_signoff_deadline: {
        type: 'integer',
        defaultsTo: 1440, // 24 hours
      },

      class_livestream_signoff_deadline: {
        type: 'integer',
        defaultsTo: 0,
      },

      customer_can_sign_up_for_class_max_days_before_class: {
        type: 'integer',
        defaultsTo: 31,
      },

      no_show_fees_enabled: {
        type: 'boolean',
        defaultsTo: false,
      },

      no_show_fees_apply_method: {
        type: 'string',
        isIn: ['auto', 'manual'],
        defaultsTo: 'manual',
      },

      no_show_membership_fee_amount: {
        type: 'integer',
        defaultsTo: 30,
      },

      no_show_time_based_class_pass_deduct_number_of_days: {
        type: 'integer',
        defaultsTo: 1,
      },

      no_show_fees_and_late_cancel_fees_are_different: {
        type: 'boolean',
        defaultsTo: false,
      },

      late_cancel_membership_fee_amount: {
        type: 'integer',
        defaultsTo: 30,
      },

      late_cancel_time_based_class_pass_deduct_number_of_days: {
        type: 'integer',
        defaultsTo: 1,
      },

      no_show_fees_send_emails_on_apply_and_cancel: {
        type: 'boolean',
        defaultsTo: false,
      },

      email_no_show_fee_applied_membership_subject: {
        type: 'string',
        localizedDefault: true,
        defaultsTo: {
          da: 'Gebyr for manglende fremmøde pålagt',
          en: 'No-show fee applied',
        },
      },

      email_no_show_fee_applied_membership_body: {
        type: 'string',
        localizedDefault: true,
        defaultsTo: {
          da: `Kære [first_name]

Da du er udeblevet fra [class_name], [class_date] kl. [class_time], har vi pålagt et gebyr på [fee_amount] kr på dit medlemskab.

Gebyret vil blive trukket sammen med den næste automatiske betaling.

Med venlig hilsen
[studio_name]`,
          en: `Dear [first_name],

Because you did not attend [class_name], [class_date] [class_time], we have applied a fee of [fee_amount] to your membership.

The fee will be charged with you next automatic payment.

Kind regards,
[studio_name]`,
        },
      },

      email_no_show_fee_cancelled_membership_subject: {
        type: 'string',
        localizedDefault: true,
        defaultsTo: {
          da: 'Gebyr for manglende fremmøde annulleret',
          en: 'No-show fee cancelled',
        },
      },

      email_no_show_fee_cancelled_membership_body: {
        type: 'string',
        localizedDefault: true,
        defaultsTo: {
          da: `Kære [first_name]

Dit gebyr på [fee_amount] for manglende fremmøde til [class_name], [class_date] kl. [class_time], er blevet annulleret. Gebyret vil ikke blive trukket.

Med venlig hilsen
[studio_name]`,
          en: `Dear [first_name],

Your fee of [fee_amount] for not attending [class_name], [class_date] [class_time], has been cancelled. The fee will not be charged.

Kind regards,
[studio_name]`,
        },
      },

      email_late_cancel_fee_applied_membership_subject: {
        type: 'string',
        localizedDefault: true,
        defaultsTo: {
          da: 'Gebyr for sen afmelding pålagt',
          en: 'Late cancellation fee applied',
        },
      },

      email_late_cancel_fee_applied_membership_body: {
        type: 'string',
        localizedDefault: true,
        defaultsTo: {
          da: `Kære [first_name]

Da du har afmeldt dig [class_name], [class_date] kl. [class_time] efter afmeldingsfristen, har vi pålagt et gebyr på [fee_amount] kr på dit medlemskab.

Gebyret vil blive trukket sammen med den næste automatiske betaling.

Med venlig hilsen
[studio_name]`,
          en: `Dear [first_name],

Due to late cancellation of [class_name], [class_date] [class_time], we have applied a fee of [fee_amount] to your membership.

The fee will be charged with you next automatic payment.

Kind regards,
[studio_name]`,
        },
      },

      email_late_cancel_fee_cancelled_membership_subject: {
        type: 'string',
        localizedDefault: true,
        defaultsTo: {
          da: 'Gebyr for sen afmelding annulleret',
          en: 'Late cancellation fee cancelled',
        },
      },

      email_late_cancel_fee_cancelled_membership_body: {
        type: 'string',
        localizedDefault: true,
        defaultsTo: {
          da: `Kære [first_name]

Dit gebyr på [fee_amount] for sen afmelding til [class_name], [class_date] kl. [class_time], er blevet annulleret. Gebyret vil ikke blive trukket.

Med venlig hilsen
[studio_name]`,
          en: `Dear [first_name],

Your fee of [fee_amount] for late cancellation of [class_name], [class_date] [class_time], has been cancelled. The fee will not be charged.

Kind regards,
[studio_name]`,
        },
      },

      email_no_show_fee_applied_time_based_class_pass_subject: {
        type: 'string',
        localizedDefault: true,
        defaultsTo: {
          da: 'Gebyr for manglende fremmøde pålagt',
          en: 'No-show fee applied',
        },
      },

      email_no_show_fee_applied_time_based_class_pass_body: {
        type: 'string',
        localizedDefault: true,
        defaultsTo: {
          da: `Kære [first_name]

Da du er udeblevet fra [class_name], [class_date] kl. [class_time], har vi trukket [days_deducted] fra udløbsdatoen på dit adgangskort.

Med venlig hilsen
[studio_name]`,
          en: `Dear [first_name],

Because you did not attend [class_name], [class_date] [class_time], we have charged a fee of [days_deducted] from your class pass.

Kind regards,
[studio_name]`,
        },
      },

      email_no_show_fee_cancelled_time_based_class_pass_subject: {
        type: 'string',
        localizedDefault: true,
        defaultsTo: {
          da: 'Gebyr for manglende fremmøde annulleret',
          en: 'No-show fee cancelled',
        },
      },

      email_no_show_fee_cancelled_time_based_class_pass_body: {
        type: 'string',
        localizedDefault: true,
        defaultsTo: {
          da: `Kære [first_name]

Dit gebyr for manglende fremmøde til [class_name], [class_date] kl. [class_time] er annulleret. Der er lagt [days_deducted] til udløbsdatoen på dit adgangskort.

Med venlig hilsen
[studio_name]`,
          en: `Dear [first_name],

Your fee for not attending [class_name], [class_date] [class_time] has been cancelled. We have added [days_deducted] to your class pass.

Kind regards,
[studio_name]`,
        },
      },

      email_late_cancel_fee_applied_time_based_class_pass_subject: {
        type: 'string',
        localizedDefault: true,
        defaultsTo: {
          da: 'Gebyr for sen afmelding pålagt',
          en: 'Late cancellation fee applied',
        },
      },

      email_late_cancel_fee_applied_time_based_class_pass_body: {
        type: 'string',
        localizedDefault: true,
        defaultsTo: {
          da: `Kære [first_name]

Da du har afmeldt dig fra [class_name], [class_date] kl. [class_time] efter afmeldingsfristen, har vi trukket [days_deducted] fra udløbsdatoen på dit adgangskort.

Med venlig hilsen
[studio_name]`,
          en: `Dear [first_name],

Due to late cancellation of [class_name], [class_date] [class_time], we have charged a fee of [days_deducted] from your class pass.

Kind regards,
[studio_name]`,
        },
      },

      email_late_cancel_fee_cancelled_time_based_class_pass_subject: {
        type: 'string',
        localizedDefault: true,
        defaultsTo: {
          da: 'Gebyr for sen afmelding annulleret',
          en: 'Late cancellation fee cancelled',
        },
      },

      email_late_cancel_fee_cancelled_time_based_class_pass_body: {
        type: 'string',
        localizedDefault: true,
        defaultsTo: {
          da: `Kære [first_name]

Dit gebyr for sen afmelding fra [class_name], [class_date] kl. [class_time] er annulleret. Der er lagt [days_deducted] til udløbsdatoen på dit adgangskort.

Med venlig hilsen
[studio_name]`,
          en: `Dear [first_name],

Your late cancellation fee for [class_name], [class_date] [class_time] has been cancelled. We have added [days_deducted] to your class pass.

Kind regards,
[studio_name]`,
        },
      },

      email_no_show_fee_applied_fixed_count_class_pass_subject: {
        type: 'string',
        localizedDefault: true,
        defaultsTo: {
          da: 'Gebyr for manglende fremmøde pålagt',
          en: 'No-show fee applied',
        },
      },

      email_no_show_fee_applied_fixed_count_class_pass_body: {
        type: 'string',
        localizedDefault: true,
        defaultsTo: {
          da: `Kære [first_name]

Du er udeblevet fra [class_name], [class_date] kl. [class_time]. Dit klip vil ikke blive refunderet.

Med venlig hilsen
[studio_name]`,
          en: `Dear [first_name],

You did not attend [class_name], [class_date] [class_time]. Your class will not be refunded to your class pass.

Kind regards,
[studio_name]`,
        },
      },

      email_no_show_fee_cancelled_fixed_count_class_pass_subject: {
        type: 'string',
        localizedDefault: true,
        defaultsTo: {
          da: 'Gebyr for manglende fremmøde annulleret',
          en: 'No-show fee cancelled',
        },
      },

      email_no_show_fee_cancelled_fixed_count_class_pass_body: {
        type: 'string',
        localizedDefault: true,
        defaultsTo: {
          da: `Kære [first_name]

Dit gebyr for manglende fremmøde til [class_name], [class_date] kl. [class_time] er annulleret. Dit klip er blevet refunderet.

Med venlig hilsen
[studio_name]`,
          en: `Dear [first_name],

Your fee for not attending [class_name], [class_date] [class_time] has been cancelled. Your class has been refunded to your class pass.

Kind regards,
[studio_name]`,
        },
      },

      email_late_cancel_fee_applied_fixed_count_class_pass_subject: {
        type: 'string',
        localizedDefault: true,
        defaultsTo: {
          da: 'Gebyr for sen afmelding pålagt',
          en: 'Late cancellation fee applied',
        },
      },

      email_late_cancel_fee_applied_fixed_count_class_pass_body: {
        type: 'string',
        localizedDefault: true,
        defaultsTo: {
          da: `Kære [first_name]

Du har afmeldt dig fra [class_name], [class_date] kl. [class_time] efter afmeldingsfristen. Dit klip vil ikke blive refunderet.

Med venlig hilsen
[studio_name]`,
          en: `Dear [first_name],

You have cancelled your registration for [class_name], [class_date] [class_time] after the cancellation deadline. Your class will not be refunded to your class pass.

Kind regards,
[studio_name]`,
        },
      },

      email_late_cancel_fee_cancelled_fixed_count_class_pass_subject: {
        type: 'string',
        localizedDefault: true,
        defaultsTo: {
          da: 'Gebyr for sen afmelding annulleret',
          en: 'Late cancellation fee cancelled',
        },
      },

      email_late_cancel_fee_cancelled_fixed_count_class_pass_body: {
        type: 'string',
        localizedDefault: true,
        defaultsTo: {
          da: `Kære [first_name]

Dit gebyr for sen afmelding fra [class_name], [class_date] kl. [class_time] er annulleret. Dit klip er blevet refunderet.

Med venlig hilsen
[studio_name]`,
          en: `Dear [first_name],

Your late cancellation fee for [class_name], [class_date] [class_time] has been cancelled. Your class has been refunded to your class pass.

Kind regards,
[studio_name]`,
        },
      },

      customer_can_pause_membership: {
        type: 'boolean',
        defaultsTo: false,
      },

      membership_pause_max_count_per_running_year: {
        type: 'integer',
        defaultsTo: 3,
      },

      customer_can_pause_membership_indefinitely: {
        type: 'boolean',
        defaultsTo: false,
      },

      membership_pause_max_days_per_pause: {
        type: 'integer',
        defaultsTo: 90,
      },

      membership_pause_fee: {
        type: 'integer',
        defaultsTo: 0
      },

      membership_pause_fee_send_receipt_on_email: {
        type: 'boolean',
        defaultsTo: true,
      },

      gift_card_minimum_amount: {
        type: 'integer',
        defaultsTo: 100,
      },

      gift_card_valid_for_days: {
        type: 'string',
        defaultsTo: 730, // 2 years
      },

      gift_card_delivery_mode: {
        type: 'string',
        isIn: ['auto', 'manual'],
        defaultsTo: 'manual',
      },

      gift_card_recipient_email_subject: {
        type: 'string',
        localizedDefault: true,
        defaultsTo: {
          en: 'You have received a gift',
          da: 'Du har modtaget en gave',
        },
      },

      gift_card_recipient_email_body: {
        type: 'string',
        localizedDefault: true,
        defaultsTo: {
          en: `Dear [recipient_name],

You have received a gift from [giver_name] of [amount] that you can spend as you like on [studio_name], [studio_website].

You gift code is: [code]

Message from [giver_name]:
[message]

Kind regards,
[studio_name]
`,
          da: `Kære [recipient_name]

Du har modtaget en gave fra [giver_name] på [amount], som du kan bruge som du har lyst på [studio_name], [studio_website].

Din gavekode er [code]

Besked fra [giver_name]:
[message]

Med venlig hilsen
[studio_name]
`,
        },
      },

      gift_card_manual_delivery_admin_notification_email: {
        type: 'string',
        defaultsTo: '',
      },

      gift_card_manual_delivery_admin_notification_subject: {
        type: 'string',
        localizedDefault: true,
        defaultsTo: {
          da: 'Gavekort solgt via YOGO',
          en: 'Gift card sold via YOGO',
        },
      },

      gift_card_manual_delivery_admin_notification_body: {
        type: 'string',
        localizedDefault: true,
        defaultsTo: {
          da: `Kære [studio_name]

Der er solgt et gavekort via YOGO, som skal sendes manuelt til modtageren. Her er info om gavekortet:

Modtager email: [recipient_email]
Modtager navn: [recipient_name]
Givers email: [giver_email]
Givers navn: [giver_name]
Beløb: [amount]
Kode: [code]
Besked fra afsender til modtager: [message]

Købstidspunkt: [gift_card_created]
Fakturanr.: [invoice_id]  

Med venlig hilsen
YOGO
`,
          en: `Dear [studio_name]

A gift card has been sold through YOGO, which needs to be sent to the recipient manually. Here is info about the gift card:

Recipient email: [recipient_email]
Recipient name: [recipient_name]
Giver email: [giver_email]
Giver name: [giver_name]
Amount: [amount]
Code: [code]
Message from giver to recipient: [message]

Time of purchase: [gift_card_created]
Invoice no.: [invoice_id]  

Kind regards,
YOGO
`,
        },
      },

      gift_card_show_in_prices: {
        type: 'boolean',
        defaultsTo: false,
      },

      gift_card_show_in_price_groups: {
        type: 'string',
        defaultsTo: '[]',
      },

      gift_card_prices_title: {
        type: 'string',
        defaultsTo: '',
      },

      gift_card_prices_image_id: {
        type: 'integer',
        defaultsTo: null,
      },

      gift_card_prices_description: {
        type: 'string',
        defaultsTo: '',
      },

      customer_can_cancel_membership: {
        type: 'boolean',
        defaultsTo: true,
      },

      customer_profile_video_widget_title: {
        type: 'string',
        localizedDefault: true,
        defaultsTo: {
          da: 'Mine videoer',
          en: 'My videos',
        },
      },

      locale: {
        type: 'string',
        isIn: ['da', 'en'],
        defaultsTo: 'da',
      },

    });

  },
};
