/* eslint-disable no-unused-vars */
const $express = require('express');
const $bcrypt = require('bcryptjs');
const $jwt = require('jsonwebtoken');
const $process = require('process');
const { Users, OAuth_Account, } = require('../dbms/sequelize/models');
const { validate } = require('./helper');
const { loginLimiter, } = require('../lib/limiter');

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
        $bcrypt.compareSync(password, user.password) ? done(null, user) : done('Auth error');
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
        const salt = $bcrypt.genSaltSync(10);
        const password = '1234567890';
    
        let [ oauth, oauth_created ] = await OAuth_Account.findOrCreate({
            where: { provider, providerUserId, },
            defaults: { userId: null, }
        });

        const where = ( !oauth_created && oauth.userId > 0 ) ? { id: oauth.userId } : { email };
        let [ user, user_created ] = await Users.findOrCreate({
            where,
            defaults: { firstName, lastName, password: $bcrypt.hashSync(password, salt), }
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

        if (candidate) {
            next(new Error('Busy email. Try else email.'));
        } else {
            const salt = $bcrypt.genSaltSync(10);
            const password = req.body.password;

            let user = new Users({
                firstName: req.body.firstName,
                lastName: req.body.lastName,
                email: req.body.email,
                password: $bcrypt.hashSync(password, salt),
            });
            user = await user.save();
            user = user.toJSON();
            req.logIn(user, (error) => {
                if (error) {
                    next(new Error(error));
                } else {
                    res.json({ data: user });
                }
            });
        }
    }
);

router.post('/login',
    loginLimiter,
    $passport.authenticate('local', { }),
    async (req, res, next) => {
        if (req.isAuthenticated()) {
            const { password, ...user } = req.user;
            res.json({ data: user, });
        } else {
            next(new Error('Auth error'));
        }
    }
);

router.post('/logout', 
    async (req, res, next) => {
        if (req.isAuthenticated()) {
            req.logOut();
            res.end('success logout');
        } else {
            next(new Error('Auth error'));
        }
    }
);

router.get('/oauth/google',
    $passport.authenticate('google', { scope: ['profile', 'email'] })
);

router.post('/oauth/google/callback',
    $passport.authenticate('google', { }),
    async (req, res, next) => {
        if (req.isAuthenticated()) {
            const { password, ...user } = req.user;
            res.json({ data: user, });
        } else {
            next(new Error('OAuth error'));
        }   
    }
);

module.exports = router;