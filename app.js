/* eslint-disable no-unused-vars */
require('dotenv').config();
const $express = require('express');
const app = $express();
const http = require('http');
const socketio = require('socket.io');
const passportSocketIo = require('passport.socketio');
const adapter = require('socket.io-redis');

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

const server = http.createServer(app);
// const io = socketio(server);



// io.adapter(adapter('redis://:pwd@localhost:6379'));
// io.use(passportSocketIo.authorize({
//     key: sessionConfig.name,
//     secret: sessionConfig.secret,
//     store: sessionConfig.store,
//     fail: (data, message, error, accept) => {
//         accept();
//     },
// }));
// io.use((socket, next) => {
//     // 
//     next();
// })

// io.on('connection', function (socket) {
//     console.log(`Socket ${socket.id} connected.`);
//     io.of('/').adapter.clients((err, clients) => {
//         console.log(`${clients.length} clients connected.`);
//     });
//     console.log(socket.request.user)
//     const userId = socket.request.user.id;
//     const userName = socket.request.user.name || 'Anonymous';
//     const isLoggedIn = socket.request.user.logged_in || false;
//     const ip = socket.request.connection.remoteAddress;

//     socket.use((packet, next) => {
//         const event = packet[0];
//         console.log({ event });
//         rateLimiter.consume(ip).then((consume) => {
//             console.log({ consume })
//             next()
//         }).catch((consume) => {
//             next(new Error('Rate limit error'));
//         });
//     })

//     socket.on('join', (roomId) => {
//         console.log('Joining to room id', roomId);
//         // check permission ?
//         socket.join(`room-${roomId}`, () => {
//             const rooms = Object.keys(socket.rooms);
//             const message = `${userName} has joined to room ${roomId}`;
//             console.log(message);
//             console.log(rooms);
//             io.to(`room-${roomId}`).emit('message', { roomId, message })
//         });
//     });

//     socket.on('leave', (roomId) => {
//         console.log('Leaving room id', roomId);
//         socket.leave(`room-${roomId}`, () => {
//             const rooms = Object.keys(socket.rooms);
//             const message = `${userName} has left room ${roomId}`;
//             console.log(message);
//             console.log(rooms);
//             io.to(`room-${roomId}`).emit('message', { roomId, message })
//         });
//     });

//     socket.on('message', (roomId, message) => {
//         console.log('Message', roomId, message);
//         io.to(`room-${roomId}`).emit('message', { roomId, message: `${userName} ${message}` });
//     });

//     socket.on('disconnect', (reason) => {
//         console.log(`Socket ${socket.id} disconnected. Reason:`, reason);
//         console.log(socket.request.user)
//     })
// });



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
    server.listen(port, () => {
        $logger.actionLogger.info(`Web-server started on port ${port}`);
    });
})();
