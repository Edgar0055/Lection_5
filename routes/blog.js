/* eslint-disable no-unused-vars */
const $express = require('express');
const { Articles, Users } = require('../dbms/sequelize/models');
const { ArticlesViews } = require('../dbms/mongodb/models');
const { validate } = require('./helper');

const router = $express.Router({
    caseSensitive: true,
    mergeParams: false,
    strict: true
});

router.get('/', async (req, res) => {
    const articles = await Articles.findAll({
        include: [{ model: Users, as: 'author' }],
        order: [['id', 'DESC']]
    }).map( article => article.toJSON() );
    // TODO: views?
    res.json({ data: articles });
});

router.post('/', async (req, res, next) => {
    const { title, content, authorId, publishedAt } = req.body;
    const article = await Articles.create({
        title, content, authorId, publishedAt
    });
    if (article) {
        // TODO: views?
        res.json({ data: { ...article.toJSON() } });
    } else {
        next(new Error('Error param: userId'));
    }
});

router.get('/:blogId', async (req, res, next) => {
    const blogId = +req.params.blogId;
    let article = await Articles.findOne({
        include: [{ model: Users, as: 'author' }],
        where: { id: blogId }
    });
    if (article) {
        article = article.toJSON();
        console.log(article);
        // TODO: views?
        const views = await ArticlesViews.findOne({ articleId: article.id, authorId: article.authorId }) || 0;
        res.json({ data: { ...article, views } });
    } else {
        next(new Error('Error param: blogId'));
    }
});

router.put('/:blogId', async (req, res, next) => {
    const blogId = +req.params.blogId;
    const { title, content, authorId, publishedAt } = req.body;
    const result = await Articles.update({
        title, content, authorId, publishedAt
    }, {
        where: { id: blogId }
    });
    if (result) {
        const article = await Articles.findOne({
            where: { id: blogId }
        });
        res.json({ data: { ...article.toJSON() } });
    } else {
        next(new Error('Error param: blogId'));
    }
});

router.delete('/:blogId', async (req, res, next) => {
    const blogId = +req.params.blogId;
    const result = await Articles.destroy({
        where: { id: blogId }
    });
    if (result) {
        // TODO: views?
        res.end();
    } else {
        next(new Error('Error param: blogId'));
    }
});

module.exports = router;
