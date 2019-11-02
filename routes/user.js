/* eslint-disable no-unused-vars */
const $express = require('express');
const asyncHandler = require('express-async-handler');
const { Articles, Users, sequelize } = require('../dbms/sequelize/models');
const { ArticlesViews } = require('../dbms/mongodb/models')
const { bodySafe, validate } = require('./helper');
const { isAuth } = require('../lib/passport');

const router = $express.Router({
    caseSensitive: true,
    mergeParams: false,
    strict: true
});

router.get('/users',
    asyncHandler(async (req, res, next) => {
        let viewsAll = await ArticlesViews.aggregate([{
            $group: {
                _id: "$authorId",
                views: { $sum: "$views" }
            }
        }]);
        viewsAll = viewsAll.map( article => ( {
            [ article._id ]: article.views,
        } ) );
        viewsAll = Object.assign({}, ...viewsAll);
        let users = await Users.findAll({
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
        });
        users = users.map( user => ( {
            ...user.toJSON(),
            viewsCount: viewsAll[ user.id ] || 0,
        } ) );
        res.json({ data: users });
    }
));

router.get('/users/:userId',
    asyncHandler(async (req, res, next) => {
        const authorId = +req.params.userId;
        let user = await Users.findOne({
            where: { id: authorId }
        });            
        const articlesViews = await ArticlesViews.aggregate()
            .match({ authorId: { $eq: authorId } })
            .group({
                _id: "$authorId",
                views: { $sum: "$views" }
            });
        const { views } = articlesViews.shift() || { views: 0, };
        res.json({ data: { ...user.toJSON(), views } });
    }
));

router.put('/profile',
    isAuth(),
    asyncHandler(async (req, res, next) => {
        const userId = +req.user.id;
        const body = bodySafe( req.body, 'firstName lastName' );
        await Users.update({
            ...body,
        }, {
            where: { id: userId }
        });
        const user = await Users.findOne({
            where: { id: userId }
        });
        res.json({ data: { ...user.toJSON() } });
    }
));

router.delete('/profile',
    isAuth(),
    asyncHandler(async (req, res, next) => {
        const authorId = +req.user.id;
        await Users.destroy({
            where: { id: authorId, }
        });
        await ArticlesViews.deleteMany({ authorId, });
        res.end();
    }
));

router.get('/users/:userId/blog',
    asyncHandler(async (req, res, next) => {
        const authorId = +req.params.userId;
        let viewsAll = await ArticlesViews.find({
            authorId,
        }, {
            views: 1,
            articleId: 1,
        } );
        viewsAll = viewsAll.map( article => ( {
            [ article.articleId ]: article.views
        } ) );
        viewsAll = Object.assign({}, ...viewsAll);
        let articles = await Articles.findAll({
            where: { authorId, },
            include: [ { model: Users, as: 'author' } ],
            order: [ ['updated_at', 'DESC'] ],
        } );
        articles = articles.map( article => ( {
            ...article.toJSON(),
            views: viewsAll[ article.id ] || 0,
        } ) );
        res.json({ data: articles });
    }
));

module.exports = router;
