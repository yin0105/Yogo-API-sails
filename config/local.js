/**
 * Local environment settings
 *
 * Use this file to specify configuration settings for use while developing
 * the app on your personal system: for example, this would be a good place
 * to store database or email passwords that apply only to you, and shouldn't
 * be shared with others in your organization.
 *
 * These settings take precedence over all other config files, including those
 * in the env/ subfolder.
 *
 * PLEASE NOTE:
 *        local.js is included in your .gitignore, so if you're using git
 *        as a version control solution for your Sails app, keep in mind that
 *        this file won't be committed to your repository!
 *
 *        Good news is, that means you can specify configuration for your local
 *        machine in this file without inadvertently committing personal information
 *        (like database passwords) to the repo.  Plus, this prevents other members
 *        of your team from commiting their local configuration changes on top of yours.
 *
 *    In a production environment, you probably want to leave this file out
 *    entirely and leave all your settings in env/production.js
 *
 *
 * For more information, check out:
 * http://sailsjs.org/#!/documentation/anatomy/myApp/config/local.js.html
 */
module.exports = {
  /***************************************************************************
   * Your SSL certificate and key, if you want to be able to serve HTTP      *
   * responses over https:// and/or use websockets over the wss:// protocol  *
   * (recommended for HTTP, strongly encouraged for WebSockets)              *
   *                                                                         *
   * In this example, we'll assume you created a folder in your project,     *
   * `config/ssl` and dumped your certificate/key files there:               *
   ***************************************************************************/
  ssl: {
    //ca: require('fs').readFileSync(__dirname + './ssl/my_apps_ssl_gd_bundle.crt'),
    //key: require('fs').readFileSync('/Users/anders/Dokumenter med backup/Webs/Yogo/ssl/localhost.key'),
    //cert: require('fs').readFileSync('/Users/anders/Dokumenter med backup/Webs/Yogo/ssl/localhost.crt'),
    //requestCert: false,
    //rejectUnauthorized: false
  },
  /***************************************************************************
   * The `port` setting determines which TCP port your app will be           *
   * deployed on.                                                            *
   *                                                                         *
   * Ports are a transport-layer concept designed to allow many different    *
   * networking applications run at the same time on a single computer.      *
   * More about ports:                                                       *
   * http://en.wikipedia.org/wiki/Port_(computer_networking)                 *
   *                                                                         *
   * By default, if it's set, Sails uses the `PORT` environment variable.    *
   * Otherwise it falls back to port 1337.                                   *
   *                                                                         *
   * In env/production.js, you'll probably want to change this setting       *
   * to 80 (http://) or 443 (https://) if you have an SSL certificate        *
   ***************************************************************************/
  // port: process.env.PORT || 1337,
  /***************************************************************************
   * The runtime "environment" of your Sails app is either typically         *
   * 'development' or 'production'.                                          *
   *                                                                         *
   * In development, your Sails app will go out of its way to help you       *
   * (for instance you will receive more descriptive error and               *
   * debugging output)                                                       *
   *                                                                         *
   * In production, Sails configures itself (and its dependencies) to        *
   * optimize performance. You should always put your app in production mode *
   * before you deploy it to a server.  This helps ensure that your Sails    *
   * app remains stable, performant, and scalable.                           *
   *                                                                         *
   * By default, Sails sets its environment using the `NODE_ENV` environment *
   * variable.  If NODE_ENV is not set, Sails will run in the                *
   * 'development' environment.                                              *
   ***************************************************************************/
  // environment: process.env.NODE_ENV || 'development'
  bootstrapTimeout: 60000,
  // ALSO UPDATE bootstrap.js WHEN ADDING REQUIRED PARAMS IN THIS FILE
  AWS_S3_IMAGE_UPLOAD_ACCESS_KEY_ID: 'AKIAJPU2PGU3CLTIK6XQ',
  AWS_S3_IMAGE_UPLOAD_ACCESS_KEY_SECRET: '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',
  AWS_S3_IMAGE_UPLOAD_BUCKET: 'yogo-original-images-test',
  IMAGE_SERVER: 'http://yogo-resized-images-test.s3-website.eu-central-1.amazonaws.com',
  // email: {
  //   sendRealEmails: false,
  //   sendAllEmailsTo: 'anders@yogo.dk',
  //   mailgun: {
  //     apiKey: 'key-4044fc886f1b0aeed4bdd526c85bc5b6',
  //     domain: 'sandboxd1e3ba7962a94be2a635dabf86ce538f.mailgun.org',
  //     // domain: 'mg-eu.yogo.dk',
  //     host: 'api.mailgun.net', // 'api.eu.mailgun.net' in production
  //     webhookSigningKey: 'key-4044fc886f1b0aeed4bdd526c85bc5b6',
  //   },
  //   sendBlindCopyOfAllEmailsTo: 'anders@yogo.dk'
  // },

  email: {
    sendRealEmails: false,
    sendAllEmailsTo: 'oleksandrdeinekait@gmail.com',
    mailgun: {
      apiKey: 'ce6f12722a4e03c7428f26b905ece8be-c485922e-be1c6b2b',
      domain: 'sandbox98a0199db5dc4b74afbd27218cbfea42.mailgun.org',
      host: 'api.mailgun.net',
      webhookSigningKey: 'ce6f12722a4e03c7428f26b905ece8be-c485922e-be1c6b2b',
    },
    sendBlindCopyOfAllEmailsTo: 'oleksandrdeinekait@gmail.com'
  },
  // ALSO UPDATE bootstrap.js WHEN ADDING REQUIRED PARAMS IN THIS FILE
  sms: {
    sendRealSms: false,
    sendAllSmsToMsisdn: '4526810241', // Anders Hjort Straarup's phone
    gatewayApi: { // Gateway API is a company with a confusing name
      apiKey: 'asdf',
      apiSecret: 'asdf',
      webhookSecret: 'asdf'
    },
  },
  aws_cloudwatch_log: {
    prefix: '/yogo/YogoApi-DEV/',
    accessKeyId: 'AKIAQSHDVGPLVUCL3GNX',
    accessKeySecret: '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',
    region: 'eu-central-1'
  },
  // ALSO UPDATE bootstrap.js WHEN ADDING REQUIRED PARAMS IN THIS FILE
  baseUrl: 'http://localhost:1337',
  externalRedirectUrl: 'https://yogo-api-dev.ngrok.io',
  usersWithAccessToExperimentalFeatures: 'anders@yogo.dk, magnus@yogo.dk',
  imgixServer: 'https://yogo-test.imgix.net',
  // ALSO UPDATE bootstrap.js WHEN ADDING REQUIRED PARAMS IN THIS FILE
  paymentProviders: {
    dibs: {
      ticketAuthUrl: 'http://localhost:1338/ticket-auth',
    },
    reepay: {
      testAccount: {
        privateApiKey: 'priv_1eab7489e56b2476867166a7acfbaa7c',
        webhookSecret: 'webhook_secret_bbfa0f2ce4ab1fb5f099eca25bfdba7a'
      }
    },
    stripe: {
      publishableKey: 'pk_test_51J9AaOBOiHfVTw1ZB91mzPVpLylaEdsFBtQaxaEUYY2kt6nGTOxtYn4PMgTrpJnRF4ZESTiUYzxoNoDmhumWA22H00Na6dRdxm',
      secretKey: 'sk_test_51J9AaOBOiHfVTw1ZIq0I5ZFSGojALwyjTL5hmN89nNVOZJJPiEF4qj5dFtsTJp5FOx3g0EhXZBBfbmxEeTelEwEX00y1wRoZrk'
    }
  },
  // ALSO UPDATE bootstrap.js WHEN ADDING REQUIRED PARAMS IN THIS FILE
  integrations: {
    vimeo: {
      clientId: 'asdf',
      clientSecret: 'asdf'
    },
    cometChat: {
      region: 'us',
      appId: 'asdf',
      apiKey: 'asdf',
      livestreamChatEnabled: true
    },
    classpass_com: {
      classpass_com_access_token: 'nHB8wffXiFZ4jxaohDwH',
      yogo_access_token: 'CMYeA8vNh5gaHOU7ZQJPr6qOms'
    },
  },
  fmLiveswitch: {
    gatewayURL: 'https://cloud.liveswitch.io/',
    applicationId: 'asdf', // YOGO DEV
    sharedSecret: 'asdf',
    webhookSecret:'asdf',
    maxConnectionsPerSession: '499'
  },
  sqs: {
    region: 'us-east-2',
    credential: {},
    policy: {
      "Id": "Policy1628414671189",
      "Version": "2012-10-17",
      "Statement": [
        {
          "Sid": "Stmt1628414649734",
          "Action": "sqs:*",
          "Effect": "Allow",
          "Resource": "arn:aws:sqs:us-east-2:249026561983:testYogoQueue",
          "Principal": {
            "AWS": [
              "b"
            ]
          }
        }
      ]
    },
    url: "https://sqs.us-east-2.amazonaws.com/249026561983/testYogoQueue",

  }
  
  // ALSO UPDATE bootstrap.js WHEN ADDING REQUIRED PARAMS IN THIS FILE
}