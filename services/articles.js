const { check, validationResult, } = require( 'express-validator' );
const { Articles, Users, Sequelize, } = require('../dbms/sequelize/models');
const { ArticlesViews } = require('../dbms/mongodb/models');


class ArticlesService {
    async getArticlesWithViews( options ) {
        const { after, authorId, } = options || {};
        let { limit, } = options || {};
        
        const where = {};
        if ( authorId ) {
            Object.assign( where, { authorId, } );
        }
        if ( after ) {
            const [ at, id ] = after.split('_', 2);
            Object.assign( where, {
                id: { [ Sequelize.Op.lt ]: +id },
                publishedAt: { [ Sequelize.Op.lte ]: at },    
            } );
        }
        if ( !limit ) {
            limit = 5;
        }

        const articles = await Articles.findAll({
            where,
            include: [ { model: Users, as: 'author' } ],
            order: [ ['published_at', 'DESC'], ['id', 'DESC'] ],
            limit,
        } );

        if ( articles.length ) {
            const articlesViews = await ArticlesViews.find(
                { articleId: { $in: articles.map( article => article.id ) }, },
                { views: 1, articleId: 1, }
            );
    
            const viewsByArticleId = articlesViews.reduce(
                ( _, article) => Object.assign( _, { [ article.articleId ]: article.views, } ),
                {},
            );
    
            for ( const article of articles ) {
                article.views = viewsByArticleId[ article.id ] || 0;
            }
        }

        return articles;
    }

    validationCheckOnCreate() {
        return [
            check( 'title' )
                .isLength( { min: 2, } )
                .withMessage("Title must be at least 2 characters"),
            check( 'content' )
                .isLength( { min: 1, } )
                .withMessage("Content cannot be empty"),
            check( 'content' )
                .isLength( { max: 1000, } )
                .withMessage("Content is too long"),
            check( 'publishedAt' ).exists( ),    
        ];
    }

    validationCheckOnEdit() {
        return this.validationCheckOnCreate();
    }

    async validationResultOnCreate( req, storage ) {
        const errors = validationResult( req );
        if ( !errors.isEmpty() ) {
            if ( req.file ) {
                await storage.deleteFile( req.file.path );
            }
            throw new Error( `my validation` );
        }
    }

    async validationResultOnEdit( req, storage ) {
        return await this.validationResultOnCreate( req, storage );
    }

}

module.exports = new ArticlesService();