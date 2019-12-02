/* eslint-disable no-unused-vars */
require('dotenv').config();
const $express = require('express');
const app = $express();
const http = require('http');

const $process = require('process');
const $logger = require('./logger/logger');
const { requestsLimiter, } = require('./lib/limiter');
const { connect: sequelizeConnect, } = require('./dbms/sequelize/models');
const { connect: mongodbConnect, mongoose, } = require('./dbms/mongodb/models');

const $session = require('express-session');
const { $redisClient, $redisStore, } = require('./lib/redis');

const socketio = require('socket.io');
const passportSocketIo = require('passport.socketio');
const adapter = require( 'socket.io-redis' );
const rateLimiter = require( './lib/limiter/rateLimiter' )( $redisClient );

const $passport = require('passport');
$passport.serializeUser( ( user, done ) => {
    done( null, user );
});
$passport.deserializeUser( ( user, done ) => {
    done( null, user );
});

const sessionConfig = {
    name: 'connect.sid',
    secret: $process.env.SESSION_SECRET,
    store: new ( $redisStore($session) )({ client: $redisClient }),
    saveUninitialized: false,
    resave: false,
    cookie: {
        maxAge: 1000 * 60 * 60 * 24 * 7,
    },
};
app.use($session(sessionConfig));
app.use($passport.initialize());
app.use($passport.session());

const $bodyParser = require('body-parser');
app.use($bodyParser.urlencoded({ extended: false }));
app.use($bodyParser.json());

app.set('trust proxy', 1);


const server = http.createServer( app );
const io = socketio( server );

app.use( function( req, res, next ) {
    req.io = io;
    next();
} );
app.use( '/api/v1', require('./routes/auth') );
app.use( '/api/v1/blog', requestsLimiter, require('./routes/blog') );
app.use( '/api/v1', requestsLimiter, require('./routes/user') );
app.use( '/api/v1', require('./routes/fees') );
require('./docs/swagger-config')( app );
app.use( require('./routes/fe') );

app.use( function ( error, req, res, next ) {
    $logger.actionLogger.error(`${ error.stack }`);
    res.status( 401 ).send( 'Something broke!' );    
} );


io.adapter( adapter( $process.env.REDIS_URL ) );
io.use( passportSocketIo.authorize( {
    key: sessionConfig.name,
    secret: sessionConfig.secret,
    store: sessionConfig.store,
    fail: ( req, message, error, accept ) => accept(),
} ) );
io.use( ( socket, next ) => {
    next();
} );
io.on( 'connection', function ( socket ) {
    const socketId = socket.id;
    const userId = socket.request.user.id;
    const userName = socket.request.user.firstName || 'Anonymous';
    const isLoggedIn = socket.request.user.logged_in || false;
    const userIP = socket.request.connection.remoteAddress;
    console.log( `Socket ${ socketId } connected` );
    io.of( '/' ).adapter.clients( ( error, clients ) => {
        console.log( `${ clients.length } clients connected.` );
    } );
    console.log( `${ userName } { id: ${ userId }, logged: ${ isLoggedIn } } connected` );

    socket.use( async ( packet, next ) => {
        try {
            const [ event, args ] = packet;
            console.log( `User ${ userId } event ${ event }`, args );
            const consume = await rateLimiter.consume( userIP );
            // console.log( `User ${ userId } consume`, consume );
            next();
        } catch ( error ) {
            next( new Error( 'Rate limit error' ) );
        }
    } );

    socket.on( 'watch-comments', ( articleId ) => {
        const roomId = `articleId-${ articleId }`;
        const message = `${ userName } has joined to room ${ roomId }`;
        console.log( `User ${ userName } watch-comments on article ${ articleId }` );
        socket.join( roomId, () => io.to( roomId ).emit( 'message', { articleId, message, } ) );
    } );

    socket.on( 'unwatch-comments', ( articleId ) => {
        const roomId = `articleId-${ articleId }`;
        const message = `${ userName } has left room ${ roomId }`;
        console.log( `User ${ userName } unwatch-comments on article ${ articleId }` );
        socket.leave( roomId, () => io.to( roomId ).emit( 'message', { articleId, message, } ) );
    } );

    socket.on( 'comment-typing', ( articleId ) => {
        const roomId = `articleId-${ articleId }`;
        console.log( `User ${ userName } comment-typing on article ${ articleId }` );
        if ( !isLoggedIn ) {
            return;
        }
        io.to( roomId ).emit( 'comment-typing', { articleId, userName, } );
    } );

    socket.on( 'disconnect', ( reason ) => {
        console.log( `Socket ${ socket.id } disconnected. Reason: ${ reason }` );
    } );
} );


( async () => {
    mongoose.on( 'error', ( error ) => {
        $logger.actionLogger.error( `${ error }` );
    } );
    await mongodbConnect();
    $logger.actionLogger.info('MongoDB connection success!');

    await sequelizeConnect( ( error ) => {
        $logger.actionLogger.error(`${error}`);
    }, () => {
        $logger.actionLogger.info('MySQL DB connection success!');
    } );

    const port = $process.env.PORT || 2000;
    server.listen( port, () => {
        $logger.actionLogger.info(`Web-server started on port ${port}`);
    } );
} )();
