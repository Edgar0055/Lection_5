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

module.exports.validateArticle = (pictureStorage) => async (req, res, next) => {
    const { title, content, publishedAt, } = req.body;
    if ( !title || title.length<5 ) {
        if ( req.file ) {
            await pictureStorage.deleteFile( req.file.path );
        }
        next('empty title');
        return;
    }
    if ( !content ) {
        if ( req.file ) {
            await pictureStorage.deleteFile( req.file.path );
        }
        next('empty content');
        return;
    }
    if ( !publishedAt ) {
        if ( req.file ) {
            await pictureStorage.deleteFile( req.file.path );
        }
        next('empty publishedAt');
        return;
    }
    req.body = { title, content, publishedAt, };
    next();
};

module.exports.validateComment = (req, res, next) => {
    const { content, } = req.body;
    if ( !content ) next('empty content');
    req.body = { content, };
    next();
};

module.exports.validateUser = (req, res, next) => {
    const { firstName, lastName, } = req.body;
    if ( !firstName ) next('empty firstName');
    if ( !lastName ) next('empty lastName');
    req.body = { firstName, lastName, };
    next();
};

module.exports.validateAuth = (req, res, next) => {
    const { firstName, lastName, email, password, } = req.body;
    if ( !firstName ) next('empty firstName');
    if ( !lastName ) next('empty lastName');
    if ( !email ) next('empty email');
    if ( !password ) next('empty password');
    req.body = { firstName, lastName, email, password, };
    next();
};

