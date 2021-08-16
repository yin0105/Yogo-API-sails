const testClientId = require('../../../global-test-variables').TEST_CLIENT_ID;

const sinon = require('sinon');

describe('helpers.video.update-all-video-provider-data', () => {

  function installVimeoGetVideosFake(data) {
    const vimeoGetVideosFake = sinon.fake.returns({tolerate: async () => data});
    sinon.replace(sails.helpers.integrations.vimeo, 'getVideosUploadedByCurrentUser', vimeoGetVideosFake);
    return vimeoGetVideosFake;
  }

  let clientSettingsRow;

  before(async () => {
    clientSettingsRow = await ClientSettings.create({
      client: testClientId,
      key: 'vimeo_oauth_access_token',
      value: 'DUMMY_ACCESS_TOKEN',
    }).fetch();
  });

  afterEach(async () => {
    sinon.restore();
  });

  after(async () => {
    await ClientSettings.destroy({id: clientSettingsRow.id});
  });

  it('should create videos that are not present in YOGO', async () => {

    installVimeoGetVideosFake([
      {
        uri: '/videos/10001',
        name: 'Video 1',
        description: "Description 1",
      },
      {
        uri: '/videos/10002',
        name: 'Video 2',
        description: "Description 2",
      },
    ]);

    await sails.helpers.video.updateAllVideoProviderData(testClientId);

    const videosInDb = await Video.find({});

    expect(videosInDb).to.matchPattern(`[
      {
        client: ${testClientId},
        video_provider: 'vimeo',
        video_provider_id: '10001',
        name_for_searching: 'Video 1',
        video_provider_data: {
          uri: '/videos/10001',
          id: '10001',
          name: 'Video 1',
          description: 'Description 1'
        },
        ...
      },
      {
        client: ${testClientId},
        video_provider: 'vimeo',
        video_provider_id: '10002',
        name_for_searching: 'Video 2',
        video_provider_data: {
          uri: '/videos/10002',
          id: '10002',
          name: 'Video 2',
          description: 'Description 2'
        },
        ...
      }]  
    `);

    await Video.destroy({});

  });

  it('should archive videos that do not exist in vimeo anymore and update those that do', async () => {

    await Video.createEach([
      {
        client: testClientId,
        video_provider: 'vimeo',
        video_provider_id: '10001',
        name_for_searching: 'Video 1',
        description_for_searching: "Description 1",
        video_provider_data: {
          uri: '/videos/10001',
          id: '10001',
          name: 'Video 1',
          description: "Description 1",
        },
      },
      {
        client: testClientId,
        video_provider_id: '10002',
        name_for_searching: 'Video 2',
        description_for_searching: "Description 2",
        video_provider_data: {
          uri: '/videos/10002',
          id: '10002',
          name: 'Video 2',
          description: "Description 2",
        },
      },
    ]);

    installVimeoGetVideosFake([
      {
        uri: '/videos/10002',
        name: 'Video 2 with modification',
        description: "Description 2 with modification",
      },
    ]);


    await sails.helpers.video.updateAllVideoProviderData(testClientId);

    const videosInDb = await Video.find({});

    expect(videosInDb).to.matchPattern(`[
      {
        client: ${testClientId},
        archived: true,
        video_provider_id: '10001',
        name_for_searching: 'Video 1',
        video_provider_data: {
          uri: '/videos/10001',
          id: '10001',
          name: 'Video 1',
          description: 'Description 1'
        },
        ...
      },
      {
        client: ${testClientId},
        archived: false,
        video_provider_id: '10002',
        name_for_searching: 'Video 2 with modification',
        description_for_searching: 'Description 2 with modification',
        video_provider_data: {
          uri: '/videos/10002',
          id: '10002',
          name: 'Video 2 with modification',
          description: 'Description 2 with modification'
        },
        ...
      }]  
    `);

    await Video.destroy({});

  });

  it('should reactivate videos that are archived, but are returned from Vimeo again', async () => {

    // It has happened that Vimeo has returned an empty response for just one call. In that case, we need to reactivate the videos in YOGO when they reappear in the Vimeo response, to keep relations.
    await Video.createEach([
      {
        client: testClientId,
        archived: true,
        video_provider: 'vimeo',
        video_provider_id: '10001',
        name_for_searching: 'Video 1',
        description_for_searching: "Description 1",
        video_provider_data: {
          uri: '/videos/10001',
          id: '10001',
          name: 'Video 1',
          description: "Description 1",
        },
      },
    ]);

    installVimeoGetVideosFake([
      {
        uri: '/videos/10001',
        name: 'Video 1 with modification',
        description: "Description 1 with modification",
      },
    ]);


    await sails.helpers.video.updateAllVideoProviderData(testClientId);

    const videosInDb = await Video.find({});

    expect(videosInDb).to.matchPattern(`[
      {
        client: ${testClientId},
        archived: false,
        video_provider_id: '10001',
        name_for_searching: 'Video 1 with modification',
        description_for_searching: 'Description 1 with modification',
        video_provider_data: {
          uri: '/videos/10001',
          id: '10001',
          name: 'Video 1 with modification',
          description: 'Description 1 with modification'
        },
        ...
      }
      ]  
    `);

    await Video.destroy({});

  });

  it('should do all the things in the same run', async () => {

    await Video.createEach([
      {
        client: testClientId,
        archived: true,
        video_provider: 'vimeo',
        video_provider_id: '10001',
        name_for_searching: 'Video 1',
        description_for_searching: "Description 1",
        video_provider_data: {
          uri: '/videos/10001',
          id: '10001',
          name: 'Video 1',
          description: "Description 1",
        },
      },
      {
        client: testClientId,
        archived: true,
        video_provider: 'vimeo',
        video_provider_id: '10002',
        name_for_searching: 'Video 2',
        description_for_searching: "Description 2",
        video_provider_data: {
          uri: '/videos/10002',
          id: '10002',
          name: 'Video 2',
          description: "Description 2",
        },
      },
      {
        client: testClientId,
        archived: false,
        video_provider: 'vimeo',
        video_provider_id: '10003',
        name_for_searching: 'Video 3',
        description_for_searching: "Description 3",
        video_provider_data: {
          uri: '/videos/10003',
          id: '10003',
          name: 'Video 3',
          description: "Description 3",
        },
      },
      {
        client: testClientId,
        archived: false,
        video_provider: 'vimeo',
        video_provider_id: '10004',
        name_for_searching: 'Video 4',
        description_for_searching: "Description 4",
        video_provider_data: {
          uri: '/videos/10004',
          id: '10004',
          name: 'Video 4',
          description: "Description 4",
        },
      },
      {
        client: testClientId,
        archived: false,
        video_provider: 'vimeo',
        video_provider_id: '10005',
        name_for_searching: 'Video 5',
        description_for_searching: "Description 5",
        video_provider_data: {
          uri: '/videos/10005',
          id: '10005',
          name: 'Video 5',
          description: "Description 5",
        },
      },
    ]);

    installVimeoGetVideosFake([
      {
        uri: '/videos/10002',
        name: 'Video 2 with modification',
        description: "Description 2 with modification",
      },
      {
        uri: '/videos/10003',
        name: 'Video 3',
        description: "Description 3",
      },
      {
        uri: '/videos/10004',
        name: 'Video 4 with modification',
        description: "Description 4 with modification",
      },
    ]);


    await sails.helpers.video.updateAllVideoProviderData(testClientId);

    const videosInDb = await Video.find({});

    expect(videosInDb).to.matchPattern(`[
      {
        client: ${testClientId},
        archived: true,
        video_provider_id: '10001',
        name_for_searching: 'Video 1',
        description_for_searching: 'Description 1',
        video_provider_data: {
          uri: '/videos/10001',
          id: '10001',
          name: 'Video 1',
          description: 'Description 1'
        },
        ...
      },
      {
        client: ${testClientId},
        archived: false,
        video_provider_id: '10002',
        name_for_searching: 'Video 2 with modification',
        description_for_searching: 'Description 2 with modification',
        video_provider_data: {
          uri: '/videos/10002',
          id: '10002',
          name: 'Video 2 with modification',
          description: 'Description 2 with modification'
        },
        ...
      },
      {
        client: ${testClientId},
        archived: false,
        video_provider_id: '10003',
        name_for_searching: 'Video 3',
        description_for_searching: 'Description 3',
        video_provider_data: {
          uri: '/videos/10003',
          id: '10003',
          name: 'Video 3',
          description: 'Description 3'
        },
        ...
      },
      {
        client: ${testClientId},
        archived: false,
        video_provider_id: '10004',
        name_for_searching: 'Video 4 with modification',
        description_for_searching: 'Description 4 with modification',
        video_provider_data: {
          uri: '/videos/10004',
          id: '10004',
          name: 'Video 4 with modification',
          description: 'Description 4 with modification'
        },
        ...
      },
      {
        client: ${testClientId},
        archived: true,
        video_provider_id: '10005',
        name_for_searching: 'Video 5',
        description_for_searching: 'Description 5',
        video_provider_data: {
          uri: '/videos/10005',
          id: '10005',
          name: 'Video 5',
          description: 'Description 5'
        },
        ...
      },
      ]  
    `);

    await Video.destroy({});

  });

  it('should use the latest archived version if there are more than one', async () => {

    const yogoVideos = await Video.createEach([
      {
        client: testClientId,
        archived: true,
        video_provider: 'vimeo',
        video_provider_id: '10001',
        name_for_searching: 'Video 1',
        description_for_searching: "Description 1",
        video_provider_data: {
          uri: '/videos/10001',
          id: '10001',
          name: 'Video 1',
          description: "Description 1",
        },
      },
      {
        client: testClientId,
        archived: true,
        video_provider: 'vimeo',
        video_provider_id: '10001',
        name_for_searching: 'Video 1',
        description_for_searching: "Description 1",
        video_provider_data: {
          uri: '/videos/10001',
          id: '10001',
          name: 'Video 1',
          description: "Description 1",
        },
      },
      {
        client: testClientId,
        archived: true,
        video_provider: 'vimeo',
        video_provider_id: '10002',
        name_for_searching: 'Video 2',
        description_for_searching: "Description 2",
        video_provider_data: {
          uri: '/videos/10002',
          id: '10002',
          name: 'Video 2',
          description: "Description 2",
        },
      },
      {
        client: testClientId,
        archived: true,
        video_provider: 'vimeo',
        video_provider_id: '10002',
        name_for_searching: 'Video 2',
        description_for_searching: "Description 2",
        video_provider_data: {
          uri: '/videos/10002',
          id: '10002',
          name: 'Video 2',
          description: "Description 2",
        },
      },
    ]).fetch();

    await Video.update({id: [yogoVideos[0].id, yogoVideos[3].id]}, {
      createdAt: Date.now() - 11111111,
    });

    installVimeoGetVideosFake([
      {
        uri: '/videos/10001',
        name: 'Video 1 with modification',
        description: "Description 1 with modification",
      },
      {
        uri: '/videos/10002',
        name: 'Video 2 with modification',
        description: "Description 2 with modification",
      },
    ]);


    await sails.helpers.video.updateAllVideoProviderData(testClientId);

    const videosInDb = await Video.find({});

    expect(videosInDb).to.matchPattern(`[
      {
        id: ${yogoVideos[0].id},
        client: ${testClientId},
        archived: true,
        video_provider_id: '10001',
        name_for_searching: 'Video 1',
        description_for_searching: 'Description 1',
        video_provider_data: {
          uri: '/videos/10001',
          id: '10001',
          name: 'Video 1',
          description: 'Description 1'
        },
        ...
      },
      {
        id: ${yogoVideos[1].id},
        client: ${testClientId},
        archived: false,
        video_provider_id: '10001',
        name_for_searching: 'Video 1 with modification',
        description_for_searching: 'Description 1 with modification',
        video_provider_data: {
          uri: '/videos/10001',
          id: '10001',
          name: 'Video 1 with modification',
          description: 'Description 1 with modification'
        },
        ...
      },
      {
        id: ${yogoVideos[2].id},
        client: ${testClientId},
        archived: false,
        video_provider_id: '10002',
        name_for_searching: 'Video 2 with modification',
        description_for_searching: 'Description 2 with modification',
        video_provider_data: {
          uri: '/videos/10002',
          id: '10002',
          name: 'Video 2 with modification',
          description: 'Description 2 with modification'
        },
        ...
      },
      {
        id: ${yogoVideos[3].id},
        client: ${testClientId},
        archived: true,
        video_provider_id: '10002',
        name_for_searching: 'Video 2',
        description_for_searching: 'Description 2',
        video_provider_data: {
          uri: '/videos/10002',
          id: '10002',
          name: 'Video 2',
          description: 'Description 2'
        },
        ...
      },     
      ]  
    `);

    await Video.destroy({});

  });

});
