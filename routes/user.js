/* eslint-disable no-unused-vars */
const $express = require('express');
const { Articles, Users, sequelize } = require('../dbms/sequelize/models');
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
                    sequelize.fn('COUNT', sequelize.col('author_id')),
                    'articlesCount'
                ]
            ]
        },
        include: [{
            model: Articles,
            as: 'Articles',
            attributes: []
        }],
        group: ['Users.id']
    })
    .map( user => user.toJSON() )
    .map( async ( user ) => {
        const articlesViews = new ArticlesViews({ authorId: user.id });
        const { views } = await articlesViews.ag_one();
        return { ...user, viewsCount: views };
    });
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
    let user = await Users.findOne({
        where: { id: userId }
    });
    if (user) {
        user = user.toJSON();
        const articlesViews = new ArticlesViews({ authorId: user.id });
        const { views } = await articlesViews.ag_one();
        res.json({ data: { ...user, views } });
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
        const articlesViews = new ArticlesViews({ authorId: userId });
        await articlesViews.del();
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
    })
    .map( article => article.toJSON() )
    .map( async ( article ) => {
        const { id: articleId, authorId } = article;
        const articlesViews = new ArticlesViews({ articleId, authorId });
        const { views } = await articlesViews.one();
        return { ...article, views };
    });
    if (articles) {
        res.json({ data: articles });
    } else {
        next(new Error('Error param: userId'));
    }
});

module.exports = router;
