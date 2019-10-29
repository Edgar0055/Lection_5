/* eslint-disable no-unused-vars */
const $express = require('express');
const $bcrypt = require('bcryptjs');
const $jwt = require('jsonwebtoken');
const $process = require('process');
const { Users } = require('../dbms/sequelize/models');
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
        const match = user && $bcrypt.compareSync(password, user.password);
        match ? done(null, user) : done('Auth error');
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
  function (req, accessToken, refreshToken, profile, next) {
    // [Arguments] {
    //     '0': 'ya29.Il-pB_8Q-khKFKZZXz8OBzIdtJxRsalqZD2BMb1DPFpAXGPB4GNgyZgXzAIB6KfwFVtTP3qL_2tBb42_Fg6r5Z0utox9faPEtC7dHCv2aJfdNBho_n74eBuibN66ChtxEQ',
    //     '1': undefined,
    //     '2': {
    //       id: '113893157599878406217',
    //       displayName: 'Эдгар Ростомян',
    //       name: { familyName: 'Ростомян', givenName: 'Эдгар' },
    //       photos: [ [Object] ],
    //       provider: 'google',
    //       _raw: '{\n' +
    //         '  "sub": "113893157599878406217",\n' +
    //         '  "name": "Эдгар Ростомян",\n' +
    //         '  "given_name": "Эдгар",\n' +
    //         '  "family_name": "Ростомян",\n' +
    //         '  "picture": "https://lh3.googleusercontent.com/-a6vYmnYwLKQ/AAAAAAAAAAI/AAAAAAAAAAA/ACHi3rf6Ehm83yDPDiABpDoHElKhFOosyg/photo.jpg",\n' +
    //         '  "locale": "ru"\n' +
    //         '}',
    //       _json: {
    //         sub: '113893157599878406217',
    //         name: 'Эдгар Ростомян',
    //         given_name: 'Эдгар',
    //         family_name: 'Ростомян',
    //         picture: 'https://lh3.googleusercontent.com/-a6vYmnYwLKQ/AAAAAAAAAAI/AAAAAAAAAAA/ACHi3rf6Ehm83yDPDiABpDoHElKhFOosyg/photo.jpg',
    //         locale: 'ru'
    //       }
    //     },
    //     '3': [Function: verified]
    //   }
    console.log(profile);

    // const password = '1234567890';
    // let user = new Users({
    //     firstName: profile.name.givenName,
    //     lastName: profile.name.familyName,
    //     email: profile.emails.sort( (a, b) => b.verified-a.verified ).map( _ => _.value ).shift(),
    //     password: $bcrypt.hashSync(password, salt),
    // });
    // user = await user.save();
    // user = user.toJSON();
    // let oauth = {
    //     provider: profile.provider,
    //     provider_user_id: profile.id,
    //     user_id: user.id,
    // };

    next(null, {});
    // Users.findOrCreate({ googleId: profile.id }, function (err, user) {
    //   return next(err, user);
    // });
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