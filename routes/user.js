/* eslint-disable no-unused-vars */
const $express = require('express');
const { nextId, setField, validate } = require('./helper');

const userItems = [
    {
        id: 1,
        email: 'edgar@mail.ua', 
        firstName: 'Edgar', 
        lastName: 'Rostomian'
    }
];
const getNextId = nextId(userItems);
const setEmail = setField(userItems, 'email', validate('email'));
const setFirstName = setField(userItems, 'firstName', validate('text'));
const setLastName = setField(userItems, 'lastName', validate('text'));

const router = $express.Router({
    caseSensitive: true,
    mergeParams: false,
    strict: true
});

const userIdExists = async (userId) => +userId > 0 && userItems.some(({ id }) => id === +userId);

router.get('/', async (req, res) => {
    res.json({ data: userItems });
});

router.post('/', async (req, res) => {
    const userId = getNextId();
    userItems.unshift({ id: userId, email: '', firstName: '', lastName: '' });
    const userItemIndex = userItems.findIndex(({ id }) => id === +userId);
    const { email, firstName, lastName } = req.body;
    setEmail(userItemIndex, email);
    setFirstName(userItemIndex, firstName);
    setLastName(userItemIndex, lastName);
    const userItem = userItems[userItemIndex];
    res.json({ data: userItem });        
});

router.get('/:userId', async (req, res, next) => {
    const userId = +req.params.userId;
    if (userIdExists()) {
        const userItem = userItems.find(({ id }) => id === +userId);
        res.json({ data: userItem });
    } else {
        next(new Error('Error param: userId'));
    }
});

router.put('/:userId', async (req, res, next) => {
    const userId = +req.params.userId;
    if (userIdExists(userId)) {
        const userItemIndex = userItems.findIndex(({ id }) => id === +userId);
        const { email, firstName, lastName } = req.body;
        setEmail(userItemIndex, email);
        setFirstName(userItemIndex, firstName);
        setLastName(userItemIndex, lastName);
        const userItem = userItems[userItemIndex];
        res.json({ data: userItem });
    } else {
        next(new Error('Error param: userId'));
    }
});

router.delete('/:userId', async (req, res, next) => {
    const userId = +req.params.userId;
    if (userIdExists(userId)) {
        const userItemIndex = userItems.findIndex(({ id }) => id === +userId);
        const userItem = userItems.splice(userItemIndex, 1).shift();
        res.json({ data: userItem });
    } else {
        next(new Error('Error param: userId'));
    }
});

module.exports = router;
