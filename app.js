/* eslint-disable no-unused-vars */
require('dotenv').config();
const $express = require('express');
const $process = require('process');
const $pug = require('pug');
const $bodyParser = require('body-parser');
const $logger = require('./logger/logger');
const { connect: sequelizeConnect } = require('./dbms/sequelize/models');
const { connect: mongodbConnect } = require('./dbms/mongodb/models');

const $winston = require('winston');
const $expressWinston = require('express-winston');
  
const app = $express();

app.use($bodyParser.urlencoded({ extended: false }));
app.use($bodyParser.json());
app.engine('pug', $pug.__express);

// app.use($expressWinston.logger({
//     transports: [
//         new $winston.transports.Console()
//     ],
//     format: $winston.format.combine(
//         $winston.format.colorize(),
//         $winston.format.json()
//     ),
//     meta: true, // optional: control whether you want to log the meta data about the request (default to true)
//     msg: 'HTTP {{req.method}} {{req.url}}', // optional: customize the default logging message. E.g. "{{res.statusCode}} {{req.method}} {{res.responseTime}}ms {{req.url}}"
//     expressFormat: true, // Use the default Express/morgan request formatting. Enabling this will override any msg if true. Will only output colors with colorize set to true
//     colorize: false, // Color the text and status code, using the Express/morgan color palette (text: gray, status: default green, 3XX cyan, 4XX yellow, 5XX red).
//     ignoreRoute: function (req, res) { return false; } // optional: allows to skip some log messages based on request and/or response
// }));

app.use('/api/v1/blog', require('./routes/blog'));
app.use('/api/v1/users', require('./routes/user'));
app.use(require('./routes/fe'));

app.use(function (err, req, res, next) {
    console.error(err.stack);
    res.status(500).send('Something broke!');
});

(async () => {
    await sequelizeConnect();
    $logger.actionLogger.info('MySQL DB connection success!');
    await mongodbConnect();
    $logger.actionLogger.info('MongoDB connection success!');
    const port = $process.env.PORT || 2000;
    app.listen(port, () => {
        $logger.actionLogger.info(`Web-server started on port ${port}`);
    });
})();
