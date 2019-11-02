/* eslint-disable no-unused-vars */
require('dotenv').config();
const $express = require('express');
const app = $express();

const $process = require('process');
const $pug = require('pug');
const $logger = require('./logger/logger');
const { requestsLimiter, } = require('./lib/limiter');
const { connect: sequelizeConnect, } = require('./dbms/sequelize/models');
const { connect: mongodbConnect, mongoose, } = require('./dbms/mongodb/models');

const $session = require('express-session');
const { $redisClient, $redisStore, } = require('./lib/redis');

const $passport = require('passport');
$passport.serializeUser((user, done) => {
    done(null, user);
});
$passport.deserializeUser((user, done) => {
    done(null, user);     
});

app.use($session({
    secret: $process.env.SESSION_SECRET,
    store: new ( $redisStore($session) )({ client: $redisClient }),
    saveUninitialized: false,
    resave: false,
    cookie: {
        maxAge: 60 * 1000 * 10,
    },
}));
app.use($passport.initialize());
app.use($passport.session());

const $bodyParser = require('body-parser');
app.use($bodyParser.urlencoded({ extended: false }));
app.use($bodyParser.json());
app.engine('pug', $pug.__express);

app.set('trust proxy', 1);

app.use('/api/v1', require('./routes/auth'));
app.use('/api/v1/blog', requestsLimiter, require('./routes/blog'));
app.use('/api/v1', requestsLimiter, require('./routes/user'));
app.use(require('./routes/fe'));

app.use(function (err, req, res, next) {
    $logger.actionLogger.error(`${err}`);
    res.status(401).send('Something broke!');
});

(async () => {
    mongoose.on('error', (error) => {
        $logger.actionLogger.error(`${error}`);
    });
    await mongodbConnect();
    $logger.actionLogger.info('MongoDB connection success!');

    await sequelizeConnect((error) => {
        $logger.actionLogger.error(`${error}`);
    }, () => {
        $logger.actionLogger.info('MySQL DB connection success!');
    });

    const port = $process.env.PORT || 2000;
    app.listen(port, () => {
        $logger.actionLogger.info(`Web-server started on port ${port}`);
    });
})();
