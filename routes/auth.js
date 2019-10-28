/* eslint-disable no-unused-vars */
const $express = require('express');
const $bcrypt = require('bcryptjs');
const $jwt = require('jsonwebtoken');
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
            next();
        }
    },
    $passport.authenticate('local', {}),
    async (req, res) => {
        const user = req.user;
        res.json({ data: user });
    },
);

router.post('/login',
    loginLimiter,
    $passport.authenticate('local', { }),
    async (req, res, next) => {
        console.log('/login');
        if (req.isAuthenticated()) {
            const { password, ...user } = req.user;
            res.json({ data: user, });
        } else {
            next(new Error('Auth error'));
        }
    }
);

router.post('/logout', 
    $passport.authenticate('local', { }),
    async (req, res, next) => {
        console.log('/logout');
        if (req.isAuthenticated()) {
            req.logOut();
            res.end('success logout');
        } else {
            next(new Error('Auth error'));
        }
    }
);

module.exports = router;