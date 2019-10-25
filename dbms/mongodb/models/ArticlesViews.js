const $mongoose = require('mongoose');
const { Schema, model } = $mongoose;
const { actionLogger } = require('../../../logger/logger');

// https://mongoosejs.com/docs/defaults.html
const schema = new Schema({
    articleId: {
        type: Number,
    },
    authorId: {
        type: Number,
    },
    views: {
        type: Number,
        default: 0,
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
    editedAt: {
        type: Date,
        default: Date.now,
    },
});
// https://docs.mongodb.com/manual/reference/method/db.collection.createIndex/
schema.index({ views: -1, articleId: 1, }, { background: true, name: 'popularity', });
schema.index({ articleId: 1, }, { background: true, });
schema.index({ authorId: 1, articleId: 1, }, { unique: true, });

schema.method('ag_one', async function () {
    const { authorId } = this;
    const result = await ArticlesViews.aggregate()
        .match({ authorId: { $eq: authorId } })
        .group({
            _id: "$authorId",
            views: { $sum: "$views" }
        });
    return result.shift() || {};
});

const ArticlesViews = model('articles_views', schema);

module.exports.ArticlesViews = ArticlesViews;
