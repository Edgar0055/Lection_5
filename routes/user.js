/* eslint-disable no-unused-vars */
const $express = require('express');
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
    async (req, res, next) => {
        try {
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
        } catch ( error ) {
            next( error );
        }
    }
);

router.get('/users/:userId',
    async (req, res, next) => {
        try {
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
        } catch ( error ) {
            next( error );
        }
    }
);

router.put('/profile',
    isAuth(),
    async (req, res, next) => {
        try {
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
        } catch ( error ) {
            next( error );
        }
    }
);

router.delete('/profile',
    isAuth(),
    async (req, res, next) => {
        try {
            const authorId = +req.user.id;
            await Users.destroy({
                where: { id: authorId, }
            });
            await ArticlesViews.deleteMany({ authorId, });
            res.end();
        } catch ( error ) {
            next( error );
        }
    }
);

router.get('/users/:userId/blog',
    async (req, res, next) => {
        try {
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
        } catch ( error ) {
            next( error );
        }
    }
);

module.exports = router;
