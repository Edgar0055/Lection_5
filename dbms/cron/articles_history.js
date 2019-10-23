// mongo  < article_history.js

(() => {
    let history = {};
    db.getCollection("mongoose_logs")
        .find({})
        .forEach((log) => {
            const { timestamp: viewedAt, level, message: key } = log;
            const views = history[ key ] || [];
            history[ key ] = [].concat( views, viewedAt );
        });
    db.getCollection('articles_history').drop();
    for ( let h in history ) {
        const [ _, articleId, authorId ] = /articleId: ([\d]+), authorId: ([\d]+)/.exec(h);
        const viewedAt = history[h];
        db.getCollection('articles_history').save({ articleId, authorId, viewedAt });
    }
})()