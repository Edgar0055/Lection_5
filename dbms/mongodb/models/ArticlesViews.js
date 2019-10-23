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
    await ArticlesViews.updateOne({ _id }, {
        $set: {
            ...options,
            editedAt: new Date()
        }
    });
};
const remove = async (options) => await ArticlesViews.remove(options);

schema.method('view', async function () {
    const { articleId, authorId } = this;
    await ArticlesViews.findOneAndUpdate({
        articleId,
        authorId,
    }, {
        $inc: {
            views: 1,
        },
        $setOnInsert: {
            views: 0,
        }
    }, {
        new: true,
        upsert: true,
    });

    // const session = await $mongoose.startSession();
    // session.startTransaction({});
    // let record = await find({ articleId });
    // actionLogger.info( `articleId: ${ articleId }, authorId: ${ authorId }` );
    // if ( record ) {
    //     const { _id, views } = record;
    //     await update(_id, { authorId, views: views + 1 });
    //     record = await findById(_id);
    // } else {
    //     record = await create(articleId, authorId, 1);
    // }
    // await session.commitTransaction();
    // session.endSession();
    // return record;
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
