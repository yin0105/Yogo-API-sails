const knex = require('../../services/knex');
const moment = require('moment-timezone');


const getClassesData = async (client, fromDate, endDate) => {
  console.log("fromDate = ", fromDate)
  fromDate = fromDate.format("YYYY-MM-DD");
  endDate = endDate.format("YYYY-MM-DD");
  let classes = await 
    knex({cs: 'class'})
    .innerJoin({ct: 'class_teachers__user_teaching_classes'}, 'cs.id', 'ct.class_teachers')
    .innerJoin({u: 'user'}, 'u.id', 'ct.user_teaching_classes')
    .innerJoin({ctype: 'class_type'}, 'cs.class_type', 'ctype.id')
    .innerJoin({r: 'room'}, 'cs.room', 'r.id')
    .innerJoin({b: 'branch'}, 'r.branch', 'b.id')
    .where("cs.date", ">=", fromDate)
    .andWhere("cs.date", "<=", endDate)
    .andWhere("cs.client", client)
    .select(
      knex.raw("cs.id AS id"), 
      knex.raw("cs.date AS date"), 
      knex.raw("cs.start_time AS start"), 
      knex.raw("cs.end_time AS end"), 
      knex.raw("ctype.name as class"),
      knex.raw("TIMEDIFF(end_time, start_time) AS duration"),
      knex.raw("r.name as room"),
      knex.raw("b.name as branch"),
      knex.raw("cs.studio_attendance_enabled as physical_attendance"),
      
      knex.raw("u.id as teacher_id"),
      knex.raw("CONCAT(u.first_name, ' ', u.last_name) as teacher_name"));

  let signups = await 
    knex({cs: 'class_signup'})
    .where({
      'cancelled_at': 0,
    })
    .select(
      'class', 
      knex.raw("COUNT(id) as signups"))
    .groupBy('class');

  let checked_ins = await 
    knex({cs: 'class_signup'})
    .where({
      'cancelled_at': 0,
      'checked_in': 1
    })
    .select(
      'class', 
      knex.raw("COUNT(id) as checked_ins"))
    .groupBy('class');

  let livestream_signups = await 
    knex({cs: 'class_livestream_signup'})
    .where({
      'cancelled_at': 0,
    })
    .select(
      'class', 
      knex.raw("COUNT(id) as livestream_signups"))
    .groupBy('class');
  
  for (var i in classes) {
    classes[i]['date'] = moment(classes[i]['date']).format("YYYY-MM-DD");
    classes[i]['signup_count'] = 0;
    classes[i]['checkedin_count'] = 0;
    classes[i]['livestream_signup_count'] = 0;
    classes[i]['start'] = moment(classes[i]['start'], "HH:mm:ss").format("HH:mm");
    classes[i]['end'] = moment(classes[i]['end'], "HH:mm:ss").format("HH:mm");
    classes[i]['duration'] = moment(classes[i]['duration'], "HH:mm:ss").format("HH:mm");

    for (var j in signups) {
      if (classes[i]['id'] == signups[j]['class']) {
        classes[i]['signup_count'] = signups[j]['signups'];
        break;
      }
    }
    for (var j in checked_ins) {
      if (classes[i]['id'] == checked_ins[j]['class']) {
        classes[i]['checkedin_count'] = checked_ins[j]['checked_ins'];
        break;
      }
    } 
    for (var j in livestream_signups) {
      if (classes[i]['id'] == livestream_signups[j]['class']) {
        classes[i]['livestream_signup_count'] = livestream_signups[j]['livestream_signups'];
        break;
      }
    }   
  }

  return classes;

};

module.exports = {

  friendlyName: 'Classes',

  description: 'Generates the classes report',

  inputs: {
    clientId: {
      type: 'number',
      required: true,
    },

    teachers: {
      type: 'ref',
      required: true,
    },

    classTypes: {
      type: 'ref',
      required: true,
    },

    fromDate: {
      type: 'string',
      required: false,
    },

    endDate: {
      type: 'string',
      required: false,
    },

    // allTeachers: {
    //   type: 'boolean',
    //   required: true,
    // },

    allClassTypes: {
      type: 'boolean',
      required: true,
    },

  },

  fn: async (inputs, exits) => {

    const fromDate = moment(inputs.fromDate, 'YYYY-MM-DD');
    const endDate = moment(inputs.endDate, 'YYYY-MM-DD');

    console.log("inputs.fromDate = ", inputs.fromDate)
    console.log("fromDate = ", fromDate)
    if (!fromDate || !endDate) throw new Error('Classes report: date is invalid.');

    let classesDataItems = await getClassesData(
      inputs.clientId,
      // inputs.teachers,
      // inputs.classType,
      // inputs.allTeachers,
      // inputs.allClassTypes,
      fromDate,
      endDate,
    );

    classesData = {
      label: fromDate.format('DD.MM.YYYY'),
      fromDate: fromDate.format('YYYY-MM-DD'),
      endDate: endDate.format('YYYY-MM-DD'),
      items: classesDataItems,
    };

    return exits.success(classesData);
  },
};
