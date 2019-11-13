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
            order: [ ['published_at', 'DESC'] ],
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
}

module.exports = new ArticlesService();