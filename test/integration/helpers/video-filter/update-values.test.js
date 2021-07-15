describe('helpers.video-filter.update-values', function () {

  it('should update filter values, preserving ids of existing values', async () => {

    const videoFilter = await VideoFilter.create({
      name: 'Video filter name',
    }).fetch();

    const dbValues = await VideoFilterValue.createEach([
      {
        name: 'Another filter value',
        video_filter_id: videoFilter.id + 1,
        sort_idx: -1,
      },
      {
        name: 'A',
        sort_idx: 0,
        video_filter_id: videoFilter.id,
      },
      {
        name: 'B',
        sort_idx: 1,
        video_filter_id: videoFilter.id,
      },
      {
        name: 'C',
        sort_idx: 2,
        video_filter_id: videoFilter.id,
      },
      {
        name: 'D',
        sort_idx: 3,
        video_filter_id: videoFilter.id,
      },
    ]).fetch();

    const updateValues = [
      {
        id: dbValues[2].id,
        name: 'BBB',
      },
      {
        name: 'CCC',
      },
      {
        id: dbValues[4].id,
        name: 'DDD',
      },
      {
        name: 'EEE',
      },
    ];

    await sails.helpers.videoFilter.updateValues(updateValues, videoFilter);

    const valuesAfterUpdate = await VideoFilterValue.find({}).sort('sort_idx');

    expect(valuesAfterUpdate).to.matchPattern(`[
      {
        name: 'Another filter value',
        video_filter_id: ${videoFilter.id + 1},
        sort_idx: -1,        
        ...
      },
      {
        id: ${dbValues[2].id},
        name: 'BBB',
        sort_idx: 0,
        video_filter_id: ${videoFilter.id},
        ...
      },
      {       
        name: 'CCC',
        sort_idx: 1,
        video_filter_id: ${videoFilter.id},
        ...
      },
      {       
        id: ${dbValues[4].id},
        name: 'DDD',
        sort_idx: 2,
        video_filter_id: ${videoFilter.id},
        ...
      },  
      {       
        name: 'EEE',
        sort_idx: 3,
        video_filter_id: ${videoFilter.id},
        ...
      },
    ]`,
    );

    await VideoFilterValue.destroy({});
    await VideoFilter.destroy({id: videoFilter.id});

  });

});
