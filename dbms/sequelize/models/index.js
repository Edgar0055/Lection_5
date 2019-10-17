/* eslint-disable dot-notation */
'use strict';

const fs = require('fs');
const path = require('path');
const Sequelize = require('sequelize');
const basename = path.basename(__filename);
const env = process.env.NODE_ENV || 'development';
const config = require('../config/config.json')[env];
const models = {};

let sequelize;
if (config.use_env_variable) {
    sequelize = new Sequelize(process.env[config.use_env_variable], config);
} else {
    sequelize = new Sequelize(config.database, config.username, config.password, config);
}

fs
    .readdirSync(__dirname)
    .filter(file => {
        return (file.indexOf('.') !== 0) && (file !== basename) && (file.slice(-3) === '.js');
    })
    .forEach(file => {
        const model = sequelize['import'](path.join(__dirname, file));
        Object.assign(models, { [model.name]: model });
    });

Object.keys(models).forEach(modelName => {
    const model = models[modelName];
    if (model.associate) {
        model.associate(models);
    }  
});

models.sequelize = sequelize;
models.Sequelize = Sequelize;

models.connect = async () => {
    await sequelize.authenticate();
};

module.exports = models;
