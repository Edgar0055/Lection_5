/* eslint-disable no-unused-vars */
const $express = require('express');
const asyncHandler = require('express-async-handler');
const multer = require('multer');
const { Articles, Users, sequelize } = require('../dbms/sequelize/models');
const { ArticlesViews } = require('../dbms/mongodb/models')
const { isAuth } = require('../lib/passport');
const { GoogleStorage } = require('../lib/storage/google-storage');
const ArticlesService = require( '../services/articles' );
const UsersService = require( '../services/users' );


const router = $express.Router({
    caseSensitive: true,
    mergeParams: false,
    strict: true
});
const avatarStorage = new GoogleStorage({
    key: process.env.GOOGLE_APPLICATION_CREDENTIALS,
    url: process.env.GCS_URL_PREFIX,
    bucket: process.env.GCS_BUCKET,
    owner: 'edgar',
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

router.get('/users/:userId/blog',
    asyncHandler( async ( req, res ) => {
        const articles = await ArticlesService.getArticlesWithViews( {
            after: req.query.after,
            authorId: +req.params.userId,
        } );
        res.send({ data: articles });
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
    UsersService.validationCheckOnEdit(),
    asyncHandler(async (req, res, next) => {
        await UsersService.validationResultOnEdit( req );
        const userId = +req.user.id;
        const { firstName, lastName, } = req.body;
        const user = await Users.findByPk( userId );
        if ( !user ) {
            throw new Error('User not found');
        }
        await user.update( { firstName, lastName, } );
        res.send({ data: user });
    }
));

router.put('/profile/picture',
    isAuth(),
    avatarUpload,
    asyncHandler(async (req, res, next) => {
        const userId = +req.user.id;
        const user = await Users.findByPk( userId );
        if ( !user ) {
            await avatarStorage.deleteFile( req.file.path ); 
            throw new Error('User not found');
        } else if ( user.picture ) {
            try {
                const path = user.picture.replace( avatarStorage.prefix, '' );
                await avatarStorage.deleteFile( path );    
            } catch ( error ) { }
        }
        const picture = `${ avatarStorage.prefix }${ req.file.path }`;
        await user.update({ picture, });
        res.send({ data: { picture, } });
    }
));

router.delete('/profile',
    isAuth(),
    asyncHandler(async (req, res, next) => {
        const authorId = +req.user.id;
        const user = await Users.findByPk( authorId );
        if ( !user ) {
            throw new Error('User not found');
        } else if ( user.picture ) {
            try {
                const path = user.picture.replace( avatarStorage.prefix, '' );
                await avatarStorage.deleteFile( path );        
            } catch ( error ) { }
        }
        try {
            await avatarStorage.deleteUserFiles( +req.user.id );
        } catch (error) { }
        await user.destroy();
        await ArticlesViews.deleteMany({ authorId, });
        res.end();
    }
));

module.exports = router;
