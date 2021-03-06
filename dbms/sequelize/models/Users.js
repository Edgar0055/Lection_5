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
        is_verified: {
            allowNull: false,
            defaultValue: false,
            field: 'is_verified',
            type: DataTypes.BOOLEAN,
        },
        is_pro: {
            allowNull: false,
            defaultValue: false,
            field: 'is_pro',
            type: DataTypes.BOOLEAN,      
        },
        stripe_customer_id: {
            allowNull: true,
            field: 'stripe_customer_id',
            type: DataTypes.STRING,      
        },
        stripe_card_id: {
            allowNull: true,
            field: 'stripe_card_id',
            type: DataTypes.STRING,      
        },
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
    }, {
        defaultScope: {
            attributes: {
                exclude: [ 'password', ],
            },
        },
        scopes: {
            auth: {
                attributes: {
                    include: [ 'password', ],
                }
            },
            comment: {
                attributes: [ 'id', 'firstName', 'lastName', 'picture', ],
            },
            safe: {
                attributes: {
                    exclude: [ 'password', 'stripe_customer_id', 'stripe_card_id', ],
                }
            },

        }
    });
    Users.associate = (models) => {
        Users.hasMany(models.Articles, {
            as: 'Articles',
            foreignKey: {
                name: 'authorId',
                allowNull: false
            },
            constraints: true,
            onUpdate: 'CASCADE',
            onDelete: 'CASCADE',
        });
        Users.hasMany(models.OAuth_Account, {
            as: 'OAuth_Account',
            foreignKey: {
                name: 'userId',
                allowNull: false
            },
            constraints: true,
            onUpdate: 'CASCADE',
            onDelete: 'CASCADE',
        });
        Users.hasMany(models.Comments, {
            as: 'Comments',
            foreignKey: {
                name: 'authorId',
                allowNull: false
            },
            constraints: true,
            onUpdate: 'CASCADE',
            onDelete: 'CASCADE',
        });
    };
    return Users;
};
