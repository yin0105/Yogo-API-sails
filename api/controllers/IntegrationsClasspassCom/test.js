const moment = require('moment');
const knex = require('../../services/knex')
const axios = require('axios').default;

module.exports = async (req, res) => {

  // const resp = await sails.helpers.integrations.classpass.registerPartner.with({
  //   partner:  {
  //     "partner_id": 123,
  //     // "partner_name": "Zen Yoga",
  //     "partner_description": "Find your inner peace with out yoga classes catering to all ability levels.",
  //     "images": [
  //         {
  //             "width": 400,
  //             "height": 200,
  //             "url": "https://images.unsplash.com/photo-1490187291333-b4ece7bec2e0?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=crop&w=1050&q=80"
  //         }
  //     ],
  //     "last_updated": "2019-01-02T20:30:38+00:00"
  //   },
  // })

  // if(resp) {
  //   console.log("success => ", resp);
  // } else {
  //   console.log("failed = ", resp);
  // }


  // const resp = await sails.helpers.integrations.classpass.registerVenue.with({
  //   venue:  {
  //     "partner_id": "abc123",
  //     // "venue_id": "xyz789",
  //     "venue_name": "Main Street Yoga",
  //     "venue_description": "Our flagship studio, specializing in aerial and vinyasa yoga.",
  //     "address": {
  //         "address_line1": "123 Main St",
  //         "address_line2": "Floor 1",
  //         "city": "New York",
  //         "state": "NY",
  //         "zip": "10016",
  //         "country": "US"
  //     },
  //     "phone": "5555555555",
  //     "email": "zenyoga@example.com",
  //     "website": "www.example.com",
  //     "coordinate": {
  //         "latitude": 46.8697822,
  //         "longitude": -113.995265
  //     },
  //     "images": [
  //         {
  //             "width": 400,
  //             "height": 200,
  //             "url": "https://images.unsplash.com/photo-1490187291333-b4ece7bec2e0?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=crop&w=1050&q=80"
  //         }
  //     ],
  //     "late_cancel_window": "2019-01-02T20:30:38+00:00",
  //     "last_updated": "2019-01-02T20:30:38+00:00"
  //   },
  // })

  // if(resp) {
  //   console.log("success => ", resp);
  // } else {
  //   console.log("failed = ", resp);
  // }


// ================= updates - schedules ===================

  const resp = await sails.helpers.integrations.classpass.update.with({
    schedule_id: 212,
    partner_id: 1,
    cancelled: false,
  })

  if(resp) {
    console.log("success => ", resp);
  } else {
    console.log("failed = ", resp);
  }

  // const resp = await sails.helpers.integrations.classpass.update.with({
  //   update:  {
  //     "type": "SCHEDULE",
  //     "payload": {
  //         "id": "mno456",
  //         "partner_id": "abc123",
  //         "venue_id": "xyz789",
  //         "start_datetime": "2019-01-02T20:30:00+00:00",
  //         "end_datetime": "2019-01-02T21:00:00+00:00",
  //         "class": {
  //             "id": "vth395",
  //             "name": "Vinyasa Level 1",
  //             "description": "A 30 minute intro to vinyasa yoga.",
  //             "last_updated": "2019-01-02T20:30:38+00:00"
  //         },
  //         "schedule_name": "AM Yoga",
  //         "teachers": [
  //             {
  //                 "id": "uvt934",
  //                 "first_name": "Jane",
  //                 "last_name": "Doe",
  //                 "display_name": "Jane D",
  //                 "images": [
  //                     {
  //                         "width": 600,
  //                         "height": 200,
  //                         "url": "https://images.unsplash.com/photo-1490187291333-b4ece7bec2e0?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=crop&w=1050&q=80"
  //                     }
  //                 ],
  //                 "last_updated": "2019-01-02T20:30:38+00:00"
  //             }
  //         ],
  //         "room": {
  //             "id": "ehv493",
  //             "name": "Studio A",
  //             "last_updated": "2019-01-02T20:30:38+00:00"
  //         },
  //         "address": {
  //             "address_line1": "123 Main St",
  //             "address_line2": "Floor 1",
  //             "city": "New York",
  //             "state": "NY",
  //             "zip": "10016",
  //             "country": "US"
  //         },
  //         "coordinate": {
  //             "latitude": 46.8697822,
  //             "longitude": -113.995265
  //         },
  //         "total_spots": 12,
  //         "available_spots": 10,
  //         "has_layout": true,
  //         "layout": [
  //             {
  //                 "x": 1,
  //                 "y": 1,
  //                 "label": "A"
  //             }
  //         ],
  //         "available_spot_labels": [
  //             "A",
  //             "B",
  //             "C",
  //             "D"
  //         ],
  //         "bookable_window_starts": "2019-01-11T20:30:00",
  //         "bookable_window_ends": "2019-01-12T20:30:00",
  //         "late_cancel_window": "08:00",
  //         "is_cancelled": false,
  //         "last_updated": "2019-01-02T20:30:38+00:00"
  //     }
  //   },
  // })

  // if(resp) {
  //   console.log("success => ", resp);
  // } else {
  //   console.log("failed = ", resp);
  // }



// // ===================   updates - reservations  ==============

//   const resp = await sails.helpers.integrations.classpass.update.with({
//     update:  {
//       "type": "RESERVATION",
//       "payload": {
//           "cp_user_id": "xyz987",
//           "reservation_id": "abc123",
//           "spot_label": "Bike 3",
//           "status": "ATTENDED",
//           "last_updated": "2019-01-02T20:30:38+00:00"
//       }
//     },
//   })

//   if(resp) {
//     console.log("success => ", resp);
//   } else {
//     console.log("failed = ", resp);
//   }


// // ===================   batch-updates - schedules  ==============

//   const resp = await sails.helpers.integrations.classpass.batchUpdates.with({
//     updates:  [
//       {
//           "id": "1",
//           "type": "SCHEDULE",
//           "payload": {
//               "id": "mno456",
//               "partner_id": "abc123",
//               "venue_id": "xyz789",
//               "start_datetime": "2019-01-02T20:30:00+00:00",
//               "end_datetime": "2019-01-02T21:00:00+00:00",
//               "class": {
//                   "id": "vth395",
//                   "name": "Vinyasa Level 1",
//                   "description": "A 30 minute intro to vinyasa yoga.",
//                   "last_updated": "2019-01-02T20:30:38+00:00"
//               },
//               "schedule_name": "AM Yoga",
//               "teachers": [
//                   {
//                       "id": "uvt934",
//                       "first_name": "Jane",
//                       "last_name": "Doe",
//                       "display_name": "Jane D",
//                       "images": [
//                           {
//                               "width": 600,
//                               "height": 200,
//                               "url": "https://images.unsplash.com/photo-1490187291333-b4ece7bec2e0?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=crop&w=1050&q=80"
//                           }
//                       ],
//                       "last_updated": "2019-01-02T20:30:38+00:00"
//                   }
//               ],
//               "room": {
//                   "id": "ehv493",
//                   "name": "Studio A",
//                   "last_updated": "2019-01-02T20:30:38+00:00"
//               },
//               "address": {
//                   "address_line1": "123 Main St",
//                   "address_line2": "Floor 1",
//                   "city": "New York",
//                   "state": "NY",
//                   "zip": "10016",
//                   "country": "US"
//               },
//               "coordinate": {
//                   "latitude": 46.8697822,
//                   "longitude": -113.995265
//               },
//               "total_spots": 12,
//               "available_spots": 10,
//               "has_layout": true,
//               "layout": [
//                   {
//                       "x": 1,
//                       "y": 1,
//                       "label": "A"
//                   }
//               ],
//               "available_spot_labels": [
//                   "A",
//                   "B",
//                   "C",
//                   "D"
//               ],
//               "bookable_window_starts": "2019-01-11T20:30:00",
//               "bookable_window_ends": "2019-01-12T20:30:00",
//               "late_cancel_window": "08:00",
//               "is_cancelled": false,
//               "last_updated": "2019-01-02T20:30:38+00:00"
//           }
//       },
//       {
//           "id": "2",
//           "type": "SCHEDULE",
//           "payload": {
//               "id": "mno456",
//               "partner_id": "abc123",
//               "venue_id": "xyz789",
//               "start_datetime": "2019-01-02T20:30:00+00:00",
//               "end_datetime": "2019-01-02T21:00:00+00:00",
//               "class": {
//                   "id": "vth395",
//                   "name": "Vinyasa Level 1",
//                   "description": "A 30 minute intro to vinyasa yoga.",
//                   "last_updated": "2019-01-02T20:30:38+00:00"
//               },
//               "schedule_name": "AM Yoga",
//               "teachers": [
//                   {
//                       "id": "uvt934",
//                       "first_name": "Jane",
//                       "last_name": "Doe",
//                       "display_name": "Jane D",
//                       "images": [
//                           {
//                               "width": 600,
//                               "height": 200,
//                               "url": "https://images.unsplash.com/photo-1490187291333-b4ece7bec2e0?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=crop&w=1050&q=80"
//                           }
//                       ],
//                       "last_updated": "2019-01-02T20:30:38+00:00"
//                   }
//               ],
//               "room": {
//                   "id": "ehv493",
//                   "name": "Studio A",
//                   "last_updated": "2019-01-02T20:30:38+00:00"
//               },
//               "address": {
//                   "address_line1": "123 Main St",
//                   "address_line2": "Floor 1",
//                   "city": "New York",
//                   "state": "NY",
//                   "zip": "10016",
//                   "country": "US"
//               },
//               "coordinate": {
//                   "latitude": 46.8697822,
//                   "longitude": -113.995265
//               },
//               "total_spots": 12,
//               "available_spots": 10,
//               "has_layout": true,
//               "layout": [
//                   {
//                       "x": 1,
//                       "y": 1,
//                       "label": "A"
//                   }
//               ],
//               "available_spot_labels": [
//                   "A",
//                   "B",
//                   "C",
//                   "D"
//               ],
//               "bookable_window_starts": "2019-01-11T20:30:00",
//               "bookable_window_ends": "2019-01-12T20:30:00",
//               "late_cancel_window": "08:00",
//               "is_cancelled": false,
//               "last_updated": "2019-01-02T20:30:38+00:00"
//           }
//       }
//     ],
//   })

//   if(resp) {
//     console.log("success => ", resp);
//   } else {
//     console.log("failed = ", resp);
//   }


// ===================   batch-updates - reservations  ==============

// const resp = await sails.helpers.integrations.classpass.batchUpdates.with({
//   updates:  [
//     {
//         "id": "1",
//         "type": "RESERVATION",
//         "payload": {
//             "cp_user_id": "xyz987",
//             "reservation_id": "abc123",
//             "spot_label": "Bike 3",
//             "status": "ATTENDED",
//             "last_updated": "2019-01-02T20:30:38+00:00"
//         }
//     },
//     {
//         "id": "2",
//         "type": "RESERVATION",
//         "payload": {
//             "cp_user_id": "xyz987",
//             "reservation_id": "abc123",
//             "spot_label": "Bike 3",
//             "status": "ATTENDED",
//             "last_updated": "2019-01-02T20:30:38+00:00"
//         }
//     }
//   ],
//   })

//   if(resp) {
//     console.log("success => ", resp);
//   } else {
//     console.log("failed = ", resp);
//   }


  console.log('resp = ', resp);
  return res.ok(resp);
}
