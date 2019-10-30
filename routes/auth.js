/* eslint-disable no-unused-vars */
const $express = require('express');
const $bcrypt = require('bcryptjs');
const $jwt = require('jsonwebtoken');
const $process = require('process');
const { Users, OAuth_Account, } = require('../dbms/sequelize/models');
const { validate } = require('./helper');
const { loginLimiter, } = require('../lib/limiter');
const { isAuth } = require('../lib/passport');

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
        let user = await Users.findOne({ where: { email, } });
        user = user.toJSON();
        await $bcrypt.compare(password, user.password) ? done(null, user) : done('Auth error');
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
  async (req, accessToken, refreshToken, profile, next) => {
    try {
        const {
            id: providerUserId,
            name: {
                givenName: firstName,
                familyName: lastName,
            },
            emails,
            provider,
        } = profile;
        const email = emails.sort( (a, b) => b.verified-a.verified ).map( _ => _.value ).shift();
        const salt = await $bcrypt.genSalt(10);
        const password = '';
    
        let [ oauth, oauth_created ] = await OAuth_Account.findOrCreate({
            where: { provider, providerUserId, },
            defaults: { userId: null, }
        });

        const where = ( !oauth_created && oauth.userId > 0 ) ? { id: oauth.userId } : { email };
        let [ user, user_created ] = await Users.findOrCreate({
            where,
            defaults: { firstName, lastName, password: await $bcrypt.hash(password, salt), }
        });
        user = user.toJSON();

        if ( user_created || oauth.userId === null ) {
            oauth.userId = user.id;
            await oauth.save();
        }            

        next(null, user);
    } catch ( error ) {
        next(new Error( error ))
    }
  }
));

router.post('/registration',
    async (req, res, next) => {
        const candidate = await Users.findOne({ 
            where: { email: req.body.email }
        });
        if ( !candidate ) {
            const salt = await $bcrypt.genSalt(10);
            const password = req.body.password;

            let user = await Users.create({
                firstName: req.body.firstName,
                lastName: req.body.lastName,
                email: req.body.email,
                password: await $bcrypt.hash(password, salt),
            });
            user = user.toJSON();
            req.logIn(user, (error) => {
                if (error) {
                    next(new Error(error));
                } else {
                    res.json({ data: user });
                }
            });
        } else {
            next(new Error('Busy email. Try else email.'));
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
    $passport.authenticate('google', { scope: ['profile', 'email'] })
);

router.post('/oauth/google/callback',
    $passport.authenticate('google', { }),
    async (req, res, next) => {
        const { password, ...user } = req.user;
        res.json({ data: user, });
    }
);

module.exports = router;