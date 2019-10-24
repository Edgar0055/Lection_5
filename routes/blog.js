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
    })
    .map( ( article ) => article.toJSON() )
    .map( async ( article ) => {
        const { id: articleId, authorId } = article;
        const { views } = await ArticlesViews.findOne({
            articleId, authorId,
        }) || { views: 0, };
        return { ...article, views };
    });
    res.json({ data: articles });
});

router.post('/', async (req, res, next) => {
    const { title, content, authorId, publishedAt } = req.body;
    let article = await Articles.create({
        title, content, authorId, publishedAt
    });
    if (article) {
        article = article.toJSON();
        const { id: articleId, authorId } = article;
        const { views } = await ArticlesViews.findOneAndUpdate({
            articleId,
        }, {
            authorId, views: 0,
        }, {
            new: true, upsert: true, setDefaultsOnInsert: true, useFindAndModify: false,
        });
        res.json({ data: { ...article, views } });
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
        const { id: articleId, authorId } = article;
        const { views } = await ArticlesViews.findOneAndUpdate({
            articleId,
        }, {
            authorId, $inc: { views: 1, }
        }, {
            new: true, upsert: true, setDefaultsOnInsert: true, useFindAndModif: false,
        });
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
        let article = await Articles.findOne({
            where: { id: blogId }
        });
        article = article.toJSON();
        const { id: articleId, authorId } = article;
        const { views } = await ArticlesViews.findOneAndUpdate({
            articleId,
        }, {
            authorId, views: 0,
        }, {
            new: true, upsert: true, setDefaultsOnInsert: true, useFindAndModify: false,
        });
        res.json({ data: { ...article, views } });
    } else {
        next(new Error('Error param: blogId'));
    }
});

router.delete('/:blogId', async (req, res, next) => {
    const blogId = +req.params.blogId;
    let article = await Articles.findOne({
        where: { id: blogId }
    });
    article = article.toJSON();
    const result = await Articles.destroy({
        where: { id: blogId }
    });
    if (result) {
        const { id: articleId, } = article;
        await ArticlesViews.deleteMany({ articleId, });
        res.end();
    } else {
        next(new Error('Error param: blogId'));
    }
});

module.exports = router;
