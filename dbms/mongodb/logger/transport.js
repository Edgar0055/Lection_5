const $winston = require('winston');
require('winston-mongodb');
const { transports } = $winston;

const env = process.env.NODE_ENV || 'development';
const config = require('../config/config.json')[env];

module.exports = (
  db = config.connection,
  collection = 'mongoose_logs',
  decolorize = true,
  options = {
    useUnifiedTopology: true,
    useNewUrlParser: true
  }
) => new transports.MongoDB({ db, collection, decolorize, options });
