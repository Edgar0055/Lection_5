/* eslint-disable no-unused-vars */
require('dotenv').config();
const $express = require('express');
const app = $express();

const $process = require('process');
const $pug = require('pug');
const $logger = require('./logger/logger');
const { connect: sequelizeConnect, } = require('./dbms/sequelize/models');
const { connect: mongodbConnect, mongoose, } = require('./dbms/mongodb/models');

const $passport = require('passport');
$passport.serializeUser((user, done) => {
    console.log('serialize', user);
    done(null, user);
});
$passport.deserializeUser((user, done) => {
    console.log('deserialize', user);
    done(null, user);     
});
const $session = require('express-session');
app.use($session({
    secret: 'secret string',
    saveUninitialized: false,
    resave: false,
}));
app.use($passport.initialize());
app.use($passport.session());

const $bodyParser = require('body-parser');
app.use($bodyParser.urlencoded({ extended: false }));
app.use($bodyParser.json());
app.engine('pug', $pug.__express);

// const $winston = require('winston');
// const $expressWinston = require('express-winston');
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

app.use('/api/v1', require('./routes/auth'));
app.use('/api/v1/blog', require('./routes/blog'));
app.use('/api/v1/users', require('./routes/user'));
app.use(require('./routes/fe'));

app.use(function (err, req, res, next) {
    console.error(err.stack);
    res.status(500).send('Something broke!');
});

(async () => {
    await sequelizeConnect((error) => {
        $logger.actionLogger.error(`${error}`);
    }, () => {
        $logger.actionLogger.info('MySQL DB connection success!');
    });
    mongoose.on('error', (error) => {
        $logger.actionLogger.error(`${error}`);
    });
    await mongodbConnect();
    $logger.actionLogger.info('MongoDB connection success!');
    const port = $process.env.PORT || 2000;
    app.listen(port, () => {
        $logger.actionLogger.info(`Web-server started on port ${port}`);
    });
})();
