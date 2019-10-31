/* eslint-disable no-unused-vars */
const $express = require('express');
const { Articles, Users } = require('../dbms/sequelize/models');
const { ArticlesViews } = require('../dbms/mongodb/models');
const { validate } = require('./helper');
const { isAuth } = require('../lib/passport');

const router = $express.Router({
    caseSensitive: true,
    mergeParams: false,
    strict: true
});

router.get('/',
    async (req, res) => {
        let articles = await Articles.findAll({
            include: [{ model: Users, as: 'author' }],
            order: [['id', 'DESC']]
        });
        articles = articles.map( ( article ) => article.toJSON() );
        let viewsAll = await ArticlesViews.find({}, { views: 1, articleId: 1, });
        viewsAll = viewsAll.map( ( item ) => item.toJSON() );
        viewsAll = viewsAll.map( ( { articleId, views } ) => ( { [ articleId ]: views } ) );
        viewsAll = Object.assign({}, ...viewsAll);
        articles = articles.map( ( article ) => {
            const { id: articleId } = article;
            const views = viewsAll[ articleId ] || 0;
            return { ...article, views };
        });
        res.json({ data: articles });
    }
);

router.post('/',
    isAuth(),
    async (req, res, next) => {
        const userId = req.user.id;
        const { title, content, publishedAt } = req.body;
        const authorId = userId;
        let article = await Articles.create({
            title, content, authorId, publishedAt
        });
        if (article) {
            article = article.toJSON();
            const { id: articleId, authorId } = article;
            const articlesViews = await ArticlesViews.create({
                articleId, authorId, views: 0,
            });
            const { views } = articlesViews || { views: 0 };
            res.json({ data: { ...article, views } });
        } else {
            next(new Error('Error: userId'));
        }
    }
);

router.get('/:blogId',
    async (req, res, next) => {
        const blogId = +req.params.blogId;
        let article = await Articles.findOne({
            include: [{ model: Users, as: 'author' }],
            where: { id: blogId }
        });
        if (article) {
            article = article.toJSON();
            const { id: articleId, } = article;
            const articlesViews = await ArticlesViews.findOneAndUpdate({
                articleId,
            }, {
                $inc: { views: 1, }
            }, {
                new: true, upsert: true,
            });
            const { views } = articlesViews || { views: 1 };
            res.json({ data: { ...article, views } });
        } else {
            next(new Error('Error param: blogId'));
        }
    }
);

router.put('/:blogId',
    isAuth(),
    async (req, res, next) => {
        const userId = req.user.id;
        const blogId = +req.params.blogId;
        const { title, content, publishedAt } = req.body;
        const result = await Articles.update({
            title, content, publishedAt
        }, {
            where: { id: blogId, authorId: userId, }
        });
        if (result) {
            let article = await Articles.findOne({
                where: { id: blogId }
            });
            article = article.toJSON();
            const { id: articleId, } = article;
            const articlesViews = await ArticlesViews.findOneAndUpdate({
                articleId,
            }, {
                views: 0,
            }, {
                new: true, upsert: true,
            });
            const { views } = articlesViews || { views: 0 };
            res.json({ data: { ...article, views } });
        } else {
            next(new Error('Error: blogId or authorId'));
        }
    }
);

router.delete('/:blogId',
    isAuth(),
    async (req, res, next) => {
        const userId = +req.user.id;
        const blogId = +req.params.blogId;
        let article = await Articles.findOne({
            where: { id: blogId, authorId: userId }
        });
        if ( !article ) {
            next(new Error('Error: blogId'));
        } else if (userId!==article.authorId) {
            next(new Error('Error: authorId'));
        } else {
            const result = await article.destroy();
            if (result) {
                await ArticlesViews.deleteMany({ articleId: blogId, });
                res.end();
            } else {
                next(new Error('Error param: blogId'));
            }    
        }
    }
);

module.exports = router;
