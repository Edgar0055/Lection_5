const $winston = require('winston');
require('winston-mongodb');

const { format, transports, createLogger } = $winston;
const transportsMongoDB = require('../dbms/mongodb/logger/transport');

module.exports.actionLogger = createLogger({
    format: format.combine(
        // format.colorize(),
        format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
        format.printf(_ => `${_.timestamp} ${_.level}: ${_.message}`),
        // format.splat(),
        // format.simple(),
    ),
    transports: [
        transportsMongoDB( ),
        new transports.Console({ json: false, colorize: true }),
    ],
});
  