/* eslint-disable no-unused-vars */
const $express = require('express');
const asyncHandler = require('express-async-handler');
const { Articles, Users, sequelize } = require('../dbms/sequelize/models');
const { ArticlesViews } = require('../dbms/mongodb/models')
const { bodySafe, validate } = require('./helper');
const { isAuth } = require('../lib/passport');
const multer = require('multer');
const { GoogleStorage } = require('../lib/storage/google-storage');


const router = $express.Router({
    caseSensitive: true,
    mergeParams: false,
    strict: true
});
const avatarStorage = new GoogleStorage({
    key: process.env.GOOGLE_APPLICATION_CREDENTIALS,
    bucket: process.env.GCS_BUCKET,
    owner: 'edgar',
    userId: ( req ) => +req.user.id,
    folder: 'avatars',
    size: { width: 180, height: 180, },
});
const avatarUpload = multer({
    storage: avatarStorage,
    limits: { fileSize: 1024 * 1024 * 5, }
}).single('picture');


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
        users = users.map( user => {
            user.viewsCount = viewsAll[ user.id ] || 0;
            return user;
        } );
        res.send({ data: users });
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
        user.views = views;
        res.send({ data: user });
    }
));

router.put('/profile',
    isAuth(),
    asyncHandler(async (req, res, next) => {
        const userId = +req.user.id;
        const body = bodySafe( req.body, 'firstName lastName' );
        const user = await Users.findByPk( userId );
        if ( !user ) {
            throw new Error('User not found');
        }
        await user.update( body );
        res.send({ data: user });
    }
));

router.put('/profile/picture',
    isAuth(),
    avatarUpload,
    asyncHandler(async (req, res, next) => {
        const prefix = process.env.GCS_URL_PREFIX;
        const userId = +req.user.id;
        const user = await Users.findByPk( userId );
        if ( !user ) {
            await req.file.delete();
            throw new Error('User not found');
        } else if ( user.picture ) {
            try {
                const path = user.picture.replace( prefix, '' );
                await req.file.deleteByFile( path );    
            } catch ( error ) { }
        }
        const path = req.file.path;
        const picture = `${ prefix }${ path }`;
        await user.update({ picture, });
        res.send({ data: { picture, } });
    }
));

router.delete('/profile',
    isAuth(),
    asyncHandler(async (req, res, next) => {
        const prefix = process.env.GCS_URL_PREFIX;
        const authorId = +req.user.id;
        const user = await Users.findByPk( authorId );
        if ( !user ) {
            throw new Error('User not found');
        } else if ( user.picture ) {
            try {
                const path = user.picture.replace( prefix, '' );
                await avatarStorage.deleteByFile( path );        
            } catch ( error ) { }
        }
        try {
            await avatarStorage.deleteByPrefixId( 'edgar', req );            
        } catch (error) { }
        await user.destroy();
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
        articles = articles.map( article => {
            article.views = viewsAll[ article.id ] || 0;
            return article;
        } );
        res.send({ data: articles });
    }
));

module.exports = router;
