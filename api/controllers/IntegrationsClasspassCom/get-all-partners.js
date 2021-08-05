const moment = require('moment');

module.exports = async (req, res) => {
  const page = req.query.page;
  const page_size = req.query.page_size; 
  const clients = await Client.find();
  const countOfClients = clients.length;
  
  if (!page) return res.badRequest("Missing query 'page'");
  if (!page_size) return res.badRequest("Missing query 'page_size'");

  let resData = {};
  resData.partners = [];
  resData.pagination = {
    page: page,
    page_size: page_size,
    total_pages: Math.ceil(countOfClients / page_size)
  };
  
  if (page_size * (page - 1) < countOfClients) {
    // page number is valid
    const numOfLastClient = (page_size * page < countOfClients) ? page_size * page : countOfClients;
    for (let i = (page_size * (page - 1)); i < numOfLastClient; i++) {
      let partner = {};
      partner.id = clients[i].id;
      partner.name = clients[i].name;
      partner.last_updated = moment(clients[i].updatedAt).format();
      resData.partners.push(partner);
    }
  } else {
    // page number is invalid
  }

  return res.json(resData);
}
