/* eslint-disable no-unused-vars */
const $express = require('express');
const asyncHandler = require('express-async-handler');
const { Articles, Users, Comments, } = require('../dbms/sequelize/models');
const { ArticlesViews } = require('../dbms/mongodb/models');
const { validateArticle, validateComment } = require('./helper');
const { isAuth } = require('../lib/passport');
const multer = require('multer');
const { GoogleStorage } = require('../lib/storage/google-storage');
const ArticlesService = require( '../services/articles' );
const CommentsService = require( '../services/comments' );


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
    asyncHandler( async ( req, res ) => {
        const articles = await ArticlesService.getArticlesWithViews( {
            after: req.query.after,
        } );
        res.send({ data: articles });    
    }
));

router.post('/',
    isAuth(),
    avatarUpload,
    validateArticle(pictureStorage),
    asyncHandler( async ( req, res ) => {
        const authorId = +req.user.id;
        const body = req.body;
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
    asyncHandler( async ( req, res ) => {
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
    validateArticle(pictureStorage),
    asyncHandler( async ( req, res ) => {
        const authorId = +req.user.id;
        const blogId = +req.params.blogId;
        const body = req.body;
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
    asyncHandler( async ( req, res ) => {
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
        const comments = await CommentsService.getComments( {
            after: req.query.after,
            articleId: +req.params.articleId,
        } );
        res.send({ data: comments });
    })
);

router.post('/:articleId/comments',
    validateComment,
    isAuth(),
    asyncHandler(async (req, res,) => {
        const authorId = +req.user.id;
        const articleId = +req.params.articleId;
        const body = req.body;
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
