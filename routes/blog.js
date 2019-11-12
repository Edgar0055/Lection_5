/* eslint-disable no-unused-vars */
const $express = require('express');
const asyncHandler = require('express-async-handler');
const { Articles, Users, Comments, Sequelize } = require('../dbms/sequelize/models');
const { ArticlesViews } = require('../dbms/mongodb/models');
const { bodySafe, paginationArticles, paginationComments, validate, viewsMixing } = require('./helper');
const { isAuth } = require('../lib/passport');
const multer = require('multer');
const { GoogleStorage } = require('../lib/storage/google-storage');


const router = $express.Router({
    caseSensitive: true,
    mergeParams: false,
    strict: true
});
const pictureStorage = new GoogleStorage({
    key: process.env.GOOGLE_APPLICATION_CREDENTIALS,
    url: process.env.GCS_URL_PREFIX,
    bucket: process.env.GCS_BUCKET,
    owner: 'edgar',
    folder: 'articles',
    size: { width: 1200, height: 630, },
});
const avatarUpload = multer({
    storage: pictureStorage,
    limits: { fileSize: 1024 * 1024 * 5, }
}).single('picture');


router.get('/',
    asyncHandler(async (req, res, next ) => {
        const after = paginationArticles( req.query.after );
        let articles = await Articles.findAll({
            where: {
                ...after ? { id: { [ Sequelize.Op.lt ]: after.id } } : {},
                ...after ? { publishedAt: { [ Sequelize.Op.lte ]: after.at } } : {},
            },
            include: [{ model: Users, as: 'author' }],
            order: [['id', 'DESC']],
            limit: 5,
        } );
        await viewsMixing(articles);
        res.send({ data: articles });    
    }
));

router.post('/',
    isAuth(),
    avatarUpload,
    asyncHandler(async (req, res, next) => {
        const authorId = +req.user.id;
        const body = bodySafe( req.body, 'title content publishedAt' );
        if ( req.file ) {
            body.picture = `${ pictureStorage.prefix }${ req.file.path }`;    
        }
        let article = await Articles.create({ ...body, authorId, });
        const { views } = await ArticlesViews.create({
            articleId: article.id, authorId, views: 0,
        });
        article.views = views;
        res.send({ data: article });
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
        article.views = views;
        res.send({ data: article });
    }
));

router.put('/:blogId',
    isAuth(),
    avatarUpload,
    asyncHandler(async (req, res, next) => {
        const authorId = +req.user.id;
        const blogId = +req.params.blogId;
        const body = bodySafe( req.body, 'title content publishedAt' );
        const article = await Articles.findOne({
            where: { id: blogId, authorId, }
        });
        if ( !article ) {
            await pictureStorage.deleteFile( req.file.path ); 
            throw new Error('Article not found');
        } else if ( article.picture && req.file ) {
            try {
                const path = article.picture.replace( pictureStorage.prefix, '' );
                await pictureStorage.deleteFile( path );    
            } catch ( error ) { }
        }
        if ( req.file ) {
            body.picture = `${ pictureStorage.prefix }${ req.file.path }`;    
        }
        await article.update( body );
        const articlesViews = await ArticlesViews.findOneAndUpdate({
            articleId: article.id,
        }, {
            views: 0,
        }, {
            new: true, upsert: true,
        });
        const { views } = articlesViews || { views: 0 };
        article.views = views;
        res.send({ data: article });
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
        if ( article.picture ) {
            const path = article.picture.replace( pictureStorage.prefix, '' );
            await pictureStorage.deleteFile( path );    
        }
        await ArticlesViews.deleteMany({ articleId: article.id, });
        await article.destroy();
        res.end();
    }
));

router.get('/:articleId/comments',
    asyncHandler(async ( req, res ) => {
        const articleId = +req.params.articleId;
        const after = paginationComments( req.query.after );
        let comments = await Comments.findAll({
            where: {
                articleId,
                ...after ? { id: { [ Sequelize.Op.lt ]: after.id } } : {},
            },
            include: [
                { model: Users.scope('comment'), as: 'author', },
                // { model: Articles, as: 'article', },
            ],
            order: [['id', 'DESC']],
            limit: 5,
        } );
        res.send({ data: comments });
    })
);

router.post('/:articleId/comments',
    isAuth(),
    asyncHandler(async (req, res,) => {
        const authorId = +req.user.id;
        const articleId = +req.params.articleId;
        const body = bodySafe( req.body, 'content' );
        let comment = await Comments.create({
            ...body, authorId, articleId,
        });
        comment = await Comments.findByPk(comment.id, {
            include: [
                { model: Users.scope('comment'), as: 'author', },
            ],
        });
        res.send({ data: comment });
    })
);

router.delete('/:articleId/comments/:commentId',
    isAuth(),
    asyncHandler(async (req, res) => {
        const authorId = +req.user.id;
        const articleId = +req.params.articleId;
        const commentId = +req.params.commentId;
        const comment = await Comments.findOne({
            where: {id: commentId, articleId, authorId, },
        });
        if ( !comment ) {
            throw new Error('Comment not found');
        }
        await comment.destroy();
        res.end();
    })
);
module.exports = router;
