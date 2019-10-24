const $mongoose = require('mongoose');
const { Schema, model } = $mongoose;
const { actionLogger } = require('../../../logger/logger');

// https://mongoosejs.com/docs/defaults.html
const schema = new Schema({
    articleId: Number,
    authorId: Number,
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
