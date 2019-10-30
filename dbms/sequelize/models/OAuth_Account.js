'use strict';
module.exports = (sequelize, DataTypes) => {
    const OAuth_Account = sequelize.define('OAuth_Account', {
        id: {
            allowNull: false,
            autoIncrement: true,
            primaryKey: true,
            type: DataTypes.INTEGER
        },
        provider: {
            allowNull: false,
            field: 'provider',
            type: DataTypes.STRING
        },
        providerUserId: {
            allowNull: false,
            field: 'provider_user_id',
            type: DataTypes.STRING
        },
        userId: {
            allowNull: true,
            field: 'user_id',
            references: {
                model: 'Users', // name of Target model
                key: 'id' // key in Target model that we're referencing
            },
            type: DataTypes.INTEGER,
            onUpdate: 'CASCADE',
            onDelete: 'CASCADE'
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
    }, {});
    OAuth_Account.associate = (models) => {
        OAuth_Account.belongsTo(models.Users, {
            as: 'user',
            foreignKey: {
                name: 'userId',
                allowNull: true
            },
            constraints: true,
            onUpdate: 'CASCADE',
            onDelete: 'CASCADE'
        });
    };
    return OAuth_Account;
};
