/* eslint-disable no-unused-vars */
const $express = require('express');
const $bcrypt = require('bcryptjs');
const $jwt = require('jsonwebtoken');
const $process = require('process');
const { Users, OAuth_Account, } = require('../dbms/sequelize/models');
const { bodySafe, validate } = require('./helper');
const { loginLimiter, } = require('../lib/limiter');
const { isAuth } = require('../lib/passport');
const { providerLogin } = require('../lib/passport/provider');

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
}, async (req, email, password, done) => {
    try {
        const user = await Users.findOne({ where: { email, } });
        if ( await $bcrypt.compare(password, user.password) ) {
            done( null, user.toJSON() );
        } else {
            done('Auth error');
        }
    } catch (error) {
        done(error);
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
    async (req, res, next) => {
        try {
            const body = bodySafe( req.body, 'firstName lastName email password' );
            const candidate = await Users.findOne( {
                where: { email: body.email, }
            } );
            if ( candidate ) {
                throw new Error('Busy email. Try else email.');
            }
            const salt = await $bcrypt.genSalt(10);
            const user = await Users.create({
                ...body,
                password: await $bcrypt.hash( body.password, salt ),
            });
            req.logIn( user.toJSON(), ( error ) => {
                if ( error ) {
                    next( error );
                } else {
                    res.json({ data: user });
                }
            } );
        } catch ( error ) {
            next( error );
        }
    }
);

router.post('/login',
    loginLimiter,
    $passport.authenticate('local', { }),
    async (req, res, next) => {
        const { password, ...user } = req.user;
        res.json({ data: user, });
    }
);

router.post('/logout',
    async (req, res, next) => {
        req.logOut();
        res.status(401).end('success logout');
    }
);

router.get('/oauth/google',
    $passport.authenticate('google', { scope: [ 'profile', 'email' ] })
);

router.post('/oauth/google/callback',
    $passport.authenticate('google', { }),
    async (req, res, next) => {
        const { password, ...user } = req.user;
        res.json({ data: user, });
    }
);

router.get('/oauth/facebook',
    $passport.authenticate('facebook', { scope: [ 'email' ] })
);

router.post('/oauth/facebook/callback',
    $passport.authenticate('facebook', { }),
    async (req, res, next) => {
        const { password, ...user } = req.user;
        res.json({ data: user, });
    }
);


module.exports = router;