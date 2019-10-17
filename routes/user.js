/* eslint-disable no-unused-vars */
const $express = require('express');
const { Articles, Users } = require('../dbms/sequelize/models');
const { ArticlesViews } = require('../dbms/mongodb/models')
const { validate } = require('./helper');

const router = $express.Router({
    caseSensitive: true,
    mergeParams: false,
    strict: true
});

router.get('/', async (req, res) => {
    const users = await Users.findAll({
        attributes: {
            include: [
                [
                    $models.sequelize.fn('COUNT', $models.sequelize.col('author_id')),
                    'articlesCount'
                ]
            ]
        },
        include: [{
            model: $models.Articles,
            as: 'Articles',
            attributes: []
        }],
        group: ['Users.id']
    }).map( user => user.toJSON() );
    // TODO: views?
    res.json({ data: users });
});

router.post('/', async (req, res, next) => {
    const { password, email, firstName, lastName } = req.body;
    const user = await Users.create({
        email, firstName, lastName, password
    });
    if (user) {
        res.json({ data: { ...user.toJSON() } });
    } else {
        next(new Error('Error param: userId'));
    }
});

router.get('/:userId', async (req, res, next) => {
    const userId = +req.params.userId;
    const user = await Users.findOne({
        where: { id: userId }
    });
    if (user) {
        // TODO: views?
        res.json({ data: { ...user.toJSON() } });
    } else {
        next(new Error('Error param: userId'));
    }
});

router.put('/:userId', async (req, res, next) => {
    const userId = +req.params.userId;
    const { password, email, firstName, lastName } = req.body;
    const result = await Users.update({
        email, firstName, lastName, password
    }, {
        where: { id: userId }
    });
    if (result) {
        const user = await Users.findOne({
            where: { id: userId }
        });
        res.json({ data: { ...user.toJSON() } });
    } else {
        next(new Error('Error param: userId'));
    }
});

router.delete('/:userId', async (req, res, next) => {
    const userId = +req.params.userId;
    const result = await Users.destroy({
        where: { id: userId }
    });
    if (result) {
        // TODO: views?
        res.end();
    } else {
        next(new Error('Error param: userId'));
    }
});

router.get('/:userId/blog', async (req, res, next) => {
    const userId = +req.params.userId;
    const articles = await Articles.findAll({
        where: { authorId: userId },
        include: [{ model: Users, as: 'author' }],
        order: [['updated_at', 'DESC']]
    }).map( article => article.toJSON() );
    if (articles) {
        // TODO: views?
        res.json({ data: articles });
    } else {
        next(new Error('Error param: userId'));
    }
});

module.exports = router;
