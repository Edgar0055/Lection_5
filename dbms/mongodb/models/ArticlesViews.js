const $mongoose = require('mongoose');
const { Schema, model } = $mongoose;

const ArticlesViewsSchema = new Schema({
    articleId: Number,
    authorId: Number,
    views: Number
});

const ArticlesViews = model('articles_views', ArticlesViewsSchema);

module.exports.ArticlesViews = ArticlesViews;
