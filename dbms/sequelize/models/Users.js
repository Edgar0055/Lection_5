'use strict';
module.exports = (sequelize, DataTypes) => {
    const Users = sequelize.define('Users', {
        id: {
            allowNull: false,
            autoIncrement: true,
            primaryKey: true,
            type: DataTypes.INTEGER
        },
        firstName: {
            allowNull: false,
            field: 'first_name',
            type: DataTypes.STRING
        },
        lastName: {
            allowNull: false,
            field: 'last_name',
            type: DataTypes.STRING
        },
        email: {
            allowNull: false,
            type: DataTypes.STRING
        },
        password: {
            allowNull: false,
            type: DataTypes.STRING
        },
        picture: {
            type: DataTypes.STRING,
        },
        viewsCount: DataTypes.VIRTUAL,
        articlesCount: DataTypes.VIRTUAL,
        createdAt: {
            allowNull: false,
            // defaultValue: DataTypes.literal('CURRENT_TIMESTAMP'),
            field: 'created_at',
            type: DataTypes.DATE
        },
        updatedAt: {
            allowNull: false,
            // defaultValue: DataTypes.literal('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP'),
            field: 'updated_at',
            type: DataTypes.DATE
        }
    }, {});
    Users.associate = (models) => {
        Users.hasMany(models.Articles, {
            as: 'Articles',
            foreignKey: {
                name: 'authorId',
                allowNull: false
            },
            constraints: true,
            onUpdate: 'CASCADE',
            onDelete: 'CASCADE'
        });
        Users.hasMany(models.OAuth_Account, {
            as: 'OAuth_Account',
            foreignKey: {
                name: 'userId',
                allowNull: false
            },
            constraints: true,
            onUpdate: 'CASCADE',
            onDelete: 'CASCADE'
        });
    };
    return Users;
};
