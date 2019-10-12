/* eslint-disable no-unused-vars */
const $express = require('express');
const $models = require('../models');
const { Users } = $models;
const { validate } = require('./helper');

const router = $express.Router({
    caseSensitive: true,
    mergeParams: false,
    strict: true
});

router.get('/', async (req, res) => {
    const users = await Users.findAll();
    res.json(users);
});

router.post('/', async (req, res, next) => {
    const { password, email, firstName, lastName } = req.body;
    const user = await Users.create({ email, firstName, lastName, password });
    if (user) {
        res.json(user);
    } else {
        next(new Error('Error param: userId'));
    }
});

router.get('/:userId', async (req, res, next) => {
    const userId = +req.params.userId;
    const user = await Users.findOne({ where: { id: userId } })
    if (user) {
        res.json(user);
    } else {
        next(new Error('Error param: userId'));
    }
});

router.put('/:userId', async (req, res, next) => {
    const userId = +req.params.userId;
    const { password, email, firstName, lastName } = req.body;
    const result = await Users.update({ email, firstName, lastName, password }, { where: { id: userId } });
    if (result) {
        const user = await Users.findOne({ where: { id: userId } })
        res.json(user);
    } else {
        next(new Error('Error param: userId'));
    }
});

router.delete('/:userId', async (req, res, next) => {
    const userId = +req.params.userId;
    const user = await Users.findOne({ where: { id: userId } })
    const result = await Users.destroy({ where: { id: userId } });
    if (result) {
        res.json(user);
    } else {
        next(new Error('Error param: userId'));
    }
});

module.exports = router;
