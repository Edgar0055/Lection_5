/* eslint-disable no-unused-vars */
const $express = require('express');
const asyncHandler = require('express-async-handler');
const { Articles, Users } = require('../dbms/sequelize/models');
const { ArticlesViews } = require('../dbms/mongodb/models');
const { bodySafe, validate } = require('./helper');
const { isAuth } = require('../lib/passport');

const router = $express.Router({
    caseSensitive: true,
    mergeParams: false,
    strict: true
});

router.get('/',
    asyncHandler(async (req, res, next ) => {
        let viewsAll = await ArticlesViews.find({}, {
            views: 1,
            articleId: 1,
        } );
        viewsAll = viewsAll.map( article => ( {
            [ article.articleId ]: article.views,
        } ) );
        viewsAll = Object.assign({}, ...viewsAll);
        let articles = await Articles.findAll({
            include: [{ model: Users, as: 'author' }],
            order: [['id', 'DESC']]
        } );
        articles = articles.map( article => ( {
            ...article.toJSON(),
            views: viewsAll[ article.id ] || 0
        } ) );
        res.json({ data: articles });    
    }
));

router.post('/',
    isAuth(),
    asyncHandler(async (req, res, next) => {
        const authorId = +req.user.id;
        const body = bodySafe( req.body, 'title content publishedAt' );
        let article = await Articles.create({ ...body, authorId, });
        const { views } = await ArticlesViews.create({
            articleId: article.id, authorId, views: 0,
        });
        res.json({ data: { ...article.toJSON(), views } });
    }
));

router.get('/:blogId',
    asyncHandler(async (req, res, next) => {
        const blogId = +req.params.blogId;
        let article = await Articles.findOne({
            include: [ { model: Users, as: 'author' } ],
            where: { id: blogId }
        });
        const articlesViews = await ArticlesViews.findOneAndUpdate({
            articleId: article.id,
        }, {
            $inc: { views: 1, }
        }, {
            new: true, upsert: true,
        });
        const { views } = articlesViews || { views: 1 };
        res.json({ data: { ...article.toJSON(), views } });
    }
));

router.put('/:blogId',
    isAuth(),
    asyncHandler(async (req, res, next) => {
        const userId = +req.user.id;
        const blogId = +req.params.blogId;
        const body = bodySafe( req.body, 'title content publishedAt' );
        await Articles.update({
            ...body,
        }, {
            where: { id: blogId, authorId: userId, }
        });
        let article = await Articles.findOne({
            where: { id: blogId }
        });
        const articlesViews = await ArticlesViews.findOneAndUpdate({
            articleId: article.id,
        }, {
            views: 0,
        }, {
            new: true, upsert: true,
        });
        const { views } = articlesViews || { views: 0 };
        res.json({ data: { ...article.toJSON(), views } });
    }
));

router.delete('/:blogId',
    isAuth(),
    asyncHandler(async (req, res, next) => {
        const authorId = +req.user.id;
        const blogId = +req.params.blogId;
        let article = await Articles.findOne({
            where: { id: blogId, authorId }
        });
        await article.destroy();
        await ArticlesViews.deleteMany({ articleId: article.id, });
        res.end();
    }
));

module.exports = router;
