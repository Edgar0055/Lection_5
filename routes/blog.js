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

router.get('/',
    async (req, res) => {
        let articles = await Articles.findAll({
            include: [{ model: Users, as: 'author' }],
            order: [['id', 'DESC']]
        });
        articles = articles.map( ( article ) => article.toJSON() );
        let articlesViewsAll = await ArticlesViews.find({}, { views: 1, articleId: 1, });
        articlesViewsAll = articlesViewsAll.map( ( article ) => article.toJSON() );
        articlesViewsAll = articlesViewsAll.map( ( { articleId, views } ) => ( { [ articleId ]: views } ) );
        articlesViewsAll = Object.assign({}, ...articlesViewsAll);
        articles = articles.map( async ( article ) => {
            const { id: articleId } = article;
            const views = articlesViewsAll[ articleId ] || 0;
            return { ...article, views };
        });
        articles = await Promise.all(articles);
        res.json({ data: articles });
    }
);

router.post('/',
    async (req, res, next) => {
        if (req.isAuthenticated()) {
            const userId = req.user.id;
            const { title, content, publishedAt } = req.body;
            const authorId = userId;
            let article = await Articles.create({
                title, content, authorId, publishedAt
            });
            if (article) {
                article = article.toJSON();
                const { id: articleId, authorId } = article;
                const articlesViews = await ArticlesViews.findOneAndUpdate({
                    articleId,
                }, {
                    authorId, views: 0,
                }, {
                    new: true, upsert: true,
                });
                const { views } = articlesViews || { views: 0 };
                res.json({ data: { ...article, views } });
            } else {
                next(new Error('Error: userId'));
            }
        } else {
            next(new Error('Auth error'));
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
            const { id: articleId, authorId } = article;
            const articlesViews = await ArticlesViews.findOneAndUpdate({
                articleId,
            }, {
                authorId, $inc: { views: 1, }
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
    async (req, res, next) => {
        if (req.isAuthenticated()) {
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
                const { id: articleId, authorId } = article;
                const articlesViews = await ArticlesViews.findOneAndUpdate({
                    articleId,
                }, {
                    authorId, views: 0,
                }, {
                    new: true, upsert: true,
                });
                const { views } = articlesViews || { views: 0 };
                res.json({ data: { ...article, views } });
            } else {
                next(new Error('Error: blogId or authorId'));
            }
        } else {
            next(new Error('Auth error'));
        }
    }
);

router.delete('/:blogId',
    async (req, res, next) => {
        if (req.isAuthenticated()) {
            const userId = req.user.id;
            const blogId = +req.params.blogId;
            let article = await Articles.findOne({
                where: { id: blogId }
            });
            article = article.toJSON();
            if (userId!==article.authorId) {
                next(new Error('Error: authorId'));
            } else {
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
            }
        } else {
            next(new Error('Auth error'));
        }
    }
);

module.exports = router;
