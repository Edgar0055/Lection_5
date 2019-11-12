/* eslint-disable no-useless-escape */
/* eslint-disable no-undef */
const { ArticlesViews } = require('../dbms/mongodb/models');

module.exports.validate = ( type ) = (_) => {
    switch (type) {
    case 'email':
        return _ && /[\w\-\_\.]+[\@][\w\-\_\.]+/ig.test(_);
    case 'date':
        return _ && /[\d\.\/\-]{10,}/ig.test(_);
    case 'text':
        return _ && /[\w]{2,}/ig.test(_);
    default:
        return false;
    }
};

module.exports.bodySafe = ( body, keys ) => {
    keys = keys.split(' ');
    return Object.fromEntries(
        Object.entries( body )
            .filter( ( [ key ] ) => keys.includes( key ) )
    );
};

module.exports.paginationArticles = ( after ) => {
    const match = after ? after.split('_') : false;
    return match ? {
        id: +match[1],
        at: new Date(match[0]),
    } : false;
};

module.exports.paginationComments = ( after ) => {
    const match = after ? Number( after ) : false;
    return match ? {
        id: +match,
    } : false;
};

module.exports.viewsMixing = async ( articles ) => {
    if (articles.length) {
        const articlesViews = await ArticlesViews.find({
            articleId: { $in: articles.map(article => article.id) },
        }, {
            views: 1,
            articleId: 1,
        } );

        const viewsByArticleId = articlesViews.reduce(
            (data, article) => Object.assign(data, {
                [article.articleId]: article.views,
            }),
            {},
        );

        for (const article of articles) {
            article.views = viewsByArticleId[ article.id ] || 0;
        }
    }
}