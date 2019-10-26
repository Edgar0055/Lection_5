/* eslint-disable no-unused-vars */
const $express = require('express');
const $bcrypt = require('bcryptjs');
const $jwt = require('jsonwebtoken');
const { Users } = require('../dbms/sequelize/models');
const { validate } = require('./helper');

const router = $express.Router({
    caseSensitive: true,
    mergeParams: false,
    strict: true
});


const $passport = require('passport');
const { Strategy: $LocalStrategy, } = require('passport-local');
$passport.use(new $LocalStrategy({
    usernameField: 'email',
    passwordField: 'password'
}, async (email, password, done) => {
    try {
        const user = await Users.findOne({ where: { email, } }).toJSON();
        console.log(user);
        const match = user && $bcrypt.compareSync(password, user.password);
        match ? done(null, user) : done('Auth error');
    } catch (error) {
        done(error);
    }
}));


// POST /api/v1/registration
// Должен принимать юзера и хешировать пароль
// После успешного создания юзера мы должна создать сессию использую
// Passport.js
// http://www.passportjs.org/docs/login/
// Вернуть объект юзера в ответе

router.post('/registration', async (req, res, next) => {
    const candidate = await Users.findOne({ 
        where: { email: req.body.email }
    });

    if (candidate) {
        next(new Error('Busy email. Try else email.'));
    } else {
        const salt = $bcrypt.genSaltSync(10); //хеш для пароля
        const password = req.body.password;

        const user = new Users({
            firstName: req.body.firstName,
            lastName: req.body.lastName,
            email: req.body.email,
            password: $bcrypt.hashSync(password, salt),
        });
        await user.save();
        res.json({ data: user });
    }
});

// POST /api/v1/login
// Должен сравнить передаваемый пароль и в случае успеха создать сессию использую
// Passport.js
// http://www.passportjs.org/docs/login/
// Вернуть объект юзера в ответе

router.post('/login',
    $passport.authenticate('local', { }), // failureRedirect: '/login'
    async (req, res, next) => {
        if (req.isAuthenticated()) {
            // const privateKey = '12345hreawporibhvejrwjqieqwpofdkvm';
            // const token = $jwt.sign({
            //     userName: `${ candidate.firstName } ${ candidate.lastName }`,
            // }, privateKey, { expiresIn: 60 * 60 }); // expiresIn - время сущ. токена

            const { password, ...user } = candidate;
            // res.header({ token: `Bearer ${token}` });
            res.json({ data: user, });
        } else {
            next(new Error('Auth error'));
        }
    }
);

// POST /api/v1/logout
// Разрушить сессию используя
// Passport.js
// http://www.passportjs.org/docs/logout/
// Вернуть пустой ответ

router.post('/logout', async (req, res) => {
    res.end('success logout');
})

module.exports = router;