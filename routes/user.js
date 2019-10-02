/* eslint-disable no-unused-vars */
const $express = require('express');
const $path = require('path');
const { load } = require('./helper');

const userItems = [];
const getNextId = () => userItems.map(({ id }) => id).concat(0).sort((a, b) => b - a).shift() + 1;
const setEmail = (userItemIndex, email) => {
    if (!email) return false;
    userItems[userItemIndex] = { ...userItems[userItemIndex], email };
    return true;
};
const setFirstName = (userItemIndex, firstName) => {
    if (!firstName) return false;
    userItems[userItemIndex] = { ...userItems[userItemIndex], firstName };
    return true;
};
const setLastName = (userItemIndex, lastName) => {
    if (!lastName) return false;
    userItems[userItemIndex] = { ...userItems[userItemIndex], lastName };
    return true;
};

const router = $express.Router({
    caseSensitive: true,
    mergeParams: false,
    strict: true
});

router.get('/', async (req, res) => {
    res.status(200).type('application/json').end(JSON.stringify(userItems));
});

router.post('/', async (req, res) => {
    const userId = getNextId();
    userItems.push({ id: userId, email: '', firstName: '', lastName: '' });
    const userItemIndex = userItems.findIndex(({ id }) => id === +userId);
    const { email, firstName, lastName } = await load(req);
    setEmail(userItemIndex, email);
    setFirstName(userItemIndex, firstName);
    setLastName(userItemIndex, lastName);
    const userItem = userItems[userItemIndex];
    res.status(200).type('application/json').end(JSON.stringify(userItem));        
});

router.param('userId', async (req, res, next, userId) => {
    if (+userId > 0 && userItems.some(({ id }) => id === +userId)) {
        req.userId = +userId;
        next();
    } else {
        next(new Error('Error param: userId'));
    }
});

router.get('/:userId', async (req, res) => {
    const userId = req.userId;
    const userItem = userItems.find(({ id }) => id === +userId);
    res.status(200).type('application/json').end(JSON.stringify(userItem));        
});

router.put('/:userId', async (req, res) => {
    const userId = req.userId;
    const userItemIndex = userItems.findIndex(({ id }) => id === +userId);
    const { email, firstName, lastName } = await load(req);
    setEmail(userItemIndex, email);
    setFirstName(userItemIndex, firstName);
    setLastName(userItemIndex, lastName);
    const userItem = userItems[userItemIndex];
    res.status(200).type('application/json').end(JSON.stringify(userItem));        
});

router.delete('/:userId', async (req, res) => {
    const userId = req.userId;
    const userItemIndex = userItems.findIndex(({ id }) => id === +userId);
    const userItem = userItems.splice(userItemIndex, 1).shift();
    res.status(200).type('application/json').end(JSON.stringify(userItem));        
});

module.exports = router;
