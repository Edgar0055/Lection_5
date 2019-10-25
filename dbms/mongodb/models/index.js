/* eslint-disable dot-notation */
'use strict';

const fs = require('fs');
const path = require('path');
const Mongoose = require('mongoose');
const basename = path.basename(__filename);
const env = process.env.NODE_ENV || 'development';
const config = require('../config/config.json')[env];
const models = {};

const mongoose = Mongoose.connection;

fs
    .readdirSync(__dirname)
    .filter(file => {
        return (file.indexOf('.') !== 0) && (file !== basename) && (file.slice(-3) === '.js');
    })
    .forEach(file => {
        const model = require(path.join(__dirname, file));
        Object.assign(models, model);
    });

models.mongoose = mongoose;
models.Mongoose = Mongoose;

models.connect = async () => {
    const options = {
        reconnectInterval: 1000,
        useUnifiedTopology: true,
        useNewUrlParser: true,
    };
    Object.entries({
        useCreateIndex: true,
        setDefaultsOnInsert: true,
        useFindAndModify: false,
        // new: true,
        upsert: true,
    }).map( ([key, value]) => Mongoose.set(key, value));
    await Mongoose.connect(config.connection, options);
};


module.exports = models;
