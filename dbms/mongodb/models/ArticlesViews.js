const $mongoose = require('mongoose');
const { Schema, model } = $mongoose;

const schema = new Schema({
    articleId: Number,
    authorId: Number,
    views: Number,
    createdAt: Date,
    editedAt: Date,
});

const find = async (options) => await ArticlesViews.findOne(options);
const findById = async (_id) => await ArticlesViews.findOne({ _id });
const create = async (articleId, authorId, views) => {
    const record = new ArticlesViews({
        articleId,
        authorId,
        views,
        createdAt: new Date(),
        editedAt: new Date()
    });
    await record.save();
    return record;
};
const update = async (_id, options) => {
    await ArticlesViews.updateOne({ _id }, { ...options, editedAt: new Date() });
};
const remove = async (options) => await ArticlesViews.remove(options);

schema.method('view', async function () {
    const { articleId, authorId } = this;
    let record = await find({ articleId, authorId });
    if ( record ) {
        const { _id, views } = record;
        await update(_id, { views: views + 1 });
        return await findById(_id);
    } else {
        return await create(articleId, authorId, 1);
    }
});

schema.method('one', async function () {
    const { articleId, authorId } = this;
    let record = await find({ articleId, authorId });
    if ( record ) {
        return record;
    } else {
        return await create(articleId, authorId, 0);
    }
});

schema.method('del', async function () {
    const { articleId, authorId } = this;
    const options = Object.assign(
        {},
        articleId ? { articleId } : {},
        authorId ? { authorId } : {}
    );
    return await remove(options);
});

const ArticlesViews = model('articles_views', schema);

module.exports.ArticlesViews = ArticlesViews;
