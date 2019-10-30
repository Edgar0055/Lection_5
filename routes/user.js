/* eslint-disable no-unused-vars */
const $express = require('express');
const { Articles, Users, sequelize } = require('../dbms/sequelize/models');
const { ArticlesViews } = require('../dbms/mongodb/models')
const { validate } = require('./helper');
const { isAuth } = require('../lib/passport');

const router = $express.Router({
    caseSensitive: true,
    mergeParams: false,
    strict: true
});

router.get('/users',
    async (req, res, next) => {
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
        users = users.map( user => user.toJSON() );
        let viewsAll = await ArticlesViews.aggregate([{
            $group: {
                _id: "$authorId",
                views: { $sum: "$views" }
            }
        }]);
        viewsAll = viewsAll.map( ( { _id, views } ) => ( { [ _id ]: views } ) );
        viewsAll = Object.assign({}, ...viewsAll);
        users = users.map( ( user ) => {
            const authorId = user.id;
            const views = viewsAll[ authorId ] || 0;
            return { ...user, viewsCount: views };
        });
        res.json({ data: users });
    }
);

router.get('/users/:userId',
    async (req, res, next) => {
        const userId = +req.params.userId;
        let user = await Users.findOne({
            where: { id: userId }
        });
        if (user) {
            user = user.toJSON();
            const authorId = user.id;
            const articlesViews = await ArticlesViews.aggregate()
                .match({ authorId: { $eq: authorId } })
                .group({
                    _id: "$authorId",
                    views: { $sum: "$views" }
                });
            const { views } = articlesViews.shift() || { views: 0, };
            res.json({ data: { ...user, views } });
        } else {
            next(new Error('Error: userId'));
        }
    }
);

router.put('/profile',
    isAuth(),
    async (req, res, next) => {
        const userId = req.user.id;
        const { firstName, lastName } = req.body;
        const result = await Users.update({
            firstName, lastName,
        }, {
            where: { id: userId }
        });
        if (result) {
            const user = await Users.findOne({
                where: { id: userId }
            });
            res.json({ data: { ...user.toJSON() } });
        } else {
            next(new Error('Error: userId'));
        }
    }
);

router.delete('/profile',
    isAuth(),
    async (req, res, next) => {
        const userId = req.user.id;
        const result = await Users.destroy({
            where: { id: userId }
        });
        if (result) {
            await ArticlesViews.deleteMany({ authorId: userId, });
            res.end();
        } else {
            next(new Error('Error param: userId'));
        }
    }
);

router.get('/users/:userId/blog',
    async (req, res, next) => {
        const userId = +req.params.userId;
        let articles = await Articles.findAll({
            where: { authorId: userId },
            include: [{ model: Users, as: 'author' }],
            order: [['updated_at', 'DESC']]
        });
        if (articles) {
            articles = articles.map( article => article.toJSON() );
            const authorId = userId;
            let viewsAll = await ArticlesViews.find({ authorId, }, { views: 1, articleId: 1, });
            viewsAll = viewsAll.map( ( article ) => article.toJSON() );
            viewsAll = viewsAll.map( ( { articleId, views } ) => ( { [ articleId ]: views } ) );
            viewsAll = Object.assign({}, ...viewsAll);
            articles = articles.map( ( article ) => {
                const { id: articleId, } = article;
                const views = viewsAll[ articleId ] || 0;
                return { ...article, views };
            });
            res.json({ data: articles });
        } else {
            next(new Error('Error param: userId'));
        }
    }
);

module.exports = router;
