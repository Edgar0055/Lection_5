/* eslint-disable no-unused-vars */
const $express = require('express');
const asyncHandler = require('express-async-handler');
const $bcrypt = require('bcryptjs');
const $jwt = require('jsonwebtoken');
const $process = require('process');
const { Users, OAuth_Account, } = require('../dbms/sequelize/models');
const { validateAuth } = require('./helper');
const { loginLimiter, } = require('../lib/limiter');
const { isAuth } = require('../lib/passport');
const { providerLogin } = require('../lib/passport/provider');
const UsersService = require( '../services/users' );


const router = $express.Router({
    caseSensitive: true,
    mergeParams: false,
    strict: true
});

const $passport = require('passport');
const { Strategy: $LocalStrategy, } = require('passport-local');
$passport.use(new $LocalStrategy({
    usernameField: 'email',
    passwordField: 'password',
    passReqToCallback: true,
}, async (req, email, password, next) => {
    try {
        let user = await Users.scope('auth').findOne({ where: { email, } });
        if ( await $bcrypt.compare(password, user.password) ) {
            user = user.toJSON();
            next( null, user );
        } else {
            throw new Error('Auth error');
        }   
    } catch ( error ) {
        next( error );
    }
}));
const { Strategy: $GoogleStrategy } = require('passport-google-oauth20');
$passport.use(new $GoogleStrategy({
    clientID: $process.env.GOOGLE_CLIENT_ID,
    clientSecret: $process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: $process.env.GOOGLE_CALLBACK_URL,
    passReqToCallback: true,
  },
  providerLogin,
));

const { Strategy: $FacebookStrategy, } = require('passport-facebook');
$passport.use(new $FacebookStrategy({
    clientID: $process.env.FACEBOOK_CLIENT_ID,
    clientSecret: $process.env.FACEBOOK_CLIENT_SECRET,
    callbackURL: $process.env.FACEBOOK_CALLBACK_URL,
    passReqToCallback: true,
    profileFields: ['id', 'email', 'name'],
  },
  providerLogin,
));

router.post('/registration',
    validateAuth,
    asyncHandler(async (req, res, next) => {
        const body = req.body;
        const candidate = await Users.findOne( {
            where: { email: body.email, }
        } );
        if ( candidate ) {
            throw new Error('Busy email. Try else email.');
        }
        const salt = await $bcrypt.genSalt(10);
        let user = await Users.create({
            ...body,
            password: await $bcrypt.hash( body.password, salt ),
        });
        user = user.toJSON();
        req.logIn( user, ( error ) => {
            if ( error ) {
                next( error );
            } else {
                res.json({ data: user });
            }
        });
    }
));

router.post('/login',
    loginLimiter,
    $passport.authenticate('local', { }),
    asyncHandler(async (req, res, next) => {
        const { password, ...user } = req.user;
        res.json({ data: user, });
    })
);

router.post('/logout',
    asyncHandler(async (req, res, next) => {
        req.logOut();
        res.status(401).end('success logout');
    })
);

router.get('/oauth/google',
    $passport.authenticate('google', { scope: [ 'profile', 'email' ] })
);

router.post('/oauth/google/callback',
    $passport.authenticate('google', { }),
    asyncHandler(async (req, res, next) => {
        const { password, ...user } = req.user;
        res.json({ data: user, });
    })
);

router.get('/oauth/facebook',
    $passport.authenticate('facebook', { scope: [ 'email' ] })
);

router.post('/oauth/facebook/callback',
    $passport.authenticate('facebook', { }),
    asyncHandler(async (req, res, next) => {
        const { password, ...user } = req.user;
        res.json({ data: user, });
    })
);

module.exports = router;