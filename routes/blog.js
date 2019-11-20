/* eslint-disable no-unused-vars */
const $express = require('express');
const asyncHandler = require('express-async-handler');
const multer = require('multer');
const { Articles, Users, Comments, } = require('../dbms/sequelize/models');
const { ArticlesViews } = require('../dbms/mongodb/models');
const { isAuth } = require('../lib/passport');
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

router.post('/',
    isAuth(),
    avatarUpload,
    ArticlesService.validationOnCreate( pictureStorage ),
    asyncHandler( async ( req, res ) => {
        const authorId = +req.user.id;
        const { title, content, publishedAt, } = req.body;
        const picture = req.file ? `${ pictureStorage.prefix }${ req.file.path }` : null;
        const article = await Articles.create( { title, content, publishedAt, authorId, picture, } );
        const { views } = await ArticlesViews.create( {
            articleId: article.id, authorId, views: 0,
        } );
        article.views = views;
        res.send( { data: article } );
    }
) );

router.put('/:blogId',
    isAuth(),
    avatarUpload,
    ArticlesService.validationOnEdit( pictureStorage ),
    asyncHandler( async ( req, res ) => {
        await ArticlesService.validationResultOnEdit( req, pictureStorage );
        const authorId = +req.user.id;
        const articleId = +req.params.blogId;
        const { title, content, publishedAt, } = req.body;
        let picture = req.file ? `${ pictureStorage.prefix }${ req.file.path }` : null;
        const article = await Articles.findOne({
            where: { id: articleId, authorId, }
        });
        if ( !article ) {
            if ( req.file ) {
                await pictureStorage.deleteFile( req.file.path );
            }
            throw new Error('Article not found');
        } else if ( article.picture && ( picture || 'picture' in req.body ) ) {
            try {
                const path = article.picture.replace( pictureStorage.prefix, '' );
                await pictureStorage.deleteFile( path );    
            } catch ( error ) { }
        } else if ( !picture ) {
            picture = article.picture;
        }
        await article.update( { title, content, publishedAt, picture, } );
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
        const articleId = +req.params.blogId;
        let article = await Articles.findOne({
            where: { id: articleId, authorId }
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
    isAuth(),
    CommentsService.validationOnComments(),
    asyncHandler(async (req, res,) => {
        await CommentsService.validationResultOnComments( req );
        const authorId = +req.user.id;
        const articleId = +req.params.articleId;
        const { content, } = req.body;
        let comment = await Comments.create({
            content, authorId, articleId,
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
