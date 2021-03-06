/* eslint-disable no-unused-vars */
const $express = require( 'express' );
const asyncHandler = require( 'express-async-handler' );
const $bcrypt = require ( 'bcryptjs' );
const jwt = require( 'jsonwebtoken' );
const $process = require( 'process' );
const { Users, OAuth_Account, } = require( '../dbms/sequelize/models' );
const { loginLimiter, } = require( '../lib/limiter' );
const { isAuth } = require( '../lib/passport' );
const { providerLogin } = require( '../lib/passport/provider' );
const UsersService = require( '../services/users' );
const { verifyEmail, } = require( '../lib/sendgrid' );


const router = $express.Router({
    caseSensitive: true,
    mergeParams: false,
    strict: true
});

const $passport = require( 'passport' );
const { Strategy: $LocalStrategy, } = require( 'passport-local' );
$passport.use( new $LocalStrategy( {
        usernameField: 'email',
        passwordField: 'password',
        passReqToCallback: true,
    }, async ( req, email, password, next ) => {
        try {
            let user = await Users.scope( 'auth' ).findOne( { where: { email, } } );
            if ( user && await $bcrypt.compare( password, user.password ) ) {
                user = user.toJSON();
                next( null, user );
            } else {
                throw new Error( 'Auth error' );
            }   
        } catch ( error ) {
            next( error );
        }
    }
) );
const { Strategy: $GoogleStrategy } = require( 'passport-google-oauth20' );
$passport.use( new $GoogleStrategy( {
        clientID: $process.env.GOOGLE_CLIENT_ID,
        clientSecret: $process.env.GOOGLE_CLIENT_SECRET,
        callbackURL: $process.env.GOOGLE_CALLBACK_URL,
        passReqToCallback: true,
    },
    providerLogin,
) );

const { Strategy: $FacebookStrategy, } = require( 'passport-facebook' );
$passport.use( new $FacebookStrategy( {
        clientID: $process.env.FACEBOOK_CLIENT_ID,
        clientSecret: $process.env.FACEBOOK_CLIENT_SECRET,
        callbackURL: $process.env.FACEBOOK_CALLBACK_URL,
        passReqToCallback: true,
        profileFields: [ 'id', 'email', 'name' ],
    },
    providerLogin,
) );

router.post( '/registration',
    UsersService.validationOnRegistration(),
    asyncHandler( async ( req, res ) => {
        const { firstName, lastName, email, password, } = req.body;
        const candidate = await Users.findOne( {
            where: { email: email, }
        } );
        if ( candidate ) {
            throw new Error( 'Busy email. Try else email.' );
        }
        const salt = await $bcrypt.genSalt(10);
        let user = await Users.create({
            firstName,
            lastName,
            email,
            password: await $bcrypt.hash( password, salt ),
        } );
        const token = jwt.sign( { email, }, $process.env.JWT_SECRET, { expiresIn: "1h" } );
        await verifyEmail( email, token );
        res.send( { data: user } );
    } )
);

router.post( '/registration/verify',
    asyncHandler( async ( req, res, next ) => {
        const { token, } = req.body;
        jwt.verify( token, $process.env.JWT_SECRET, async ( error, data ) => {
            if ( error ) {
                res.status( 403 ).json({ errors: [{ msg: 'Try to register again' }] });
            } else {
                const { email, } = data;
                let user = await Users.findOne( {
                    where: { email, is_verified: false, },
                } );
                if ( !user ) {
                    throw new Error( 'User not found' );
                }
                await user.update( { is_verified: true, } );
                user = user.toJSON();
                req.logIn( user, ( error ) => {
                    error ? next( error ) : res.send( { data: user } );
                } );        
            }
        } );
    } )
);

router.post( '/login',
    loginLimiter,
    UsersService.validationOnLogin(),
    $passport.authenticate('local', { }),
    asyncHandler( async ( req, res ) => {
        const { password, ...user } = req.user;
        res.send( { data: user, } );
    } )
);

router.post( '/logout',
    asyncHandler( async ( req, res ) => {
        req.logOut();
        res.status( 401 ).end( 'success logout' );
    } )
);

router.get( '/oauth/google',
    $passport.authenticate( 'google', { scope: [ 'profile', 'email' ] } )
);

router.post( '/oauth/google/callback',
    $passport.authenticate( 'google', { } ),
    asyncHandler( async ( req, res ) => {
        const { password, ...user } = req.user;
        res.send( { data: user, } );
    } )
);

router.get( '/oauth/facebook',
    $passport.authenticate( 'facebook', { scope: [ 'email' ] } )
);

router.post( '/oauth/facebook/callback',
    $passport.authenticate( 'facebook', { } ),
    asyncHandler( async ( req, res ) => {
        const { password, ...user } = req.user;
        res.send( { data: user, } );
    })
);

module.exports = router;