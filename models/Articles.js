'use strict';
module.exports = (sequelize, DataTypes) => {
    const Articles = sequelize.define('Articles', {
        title: {
            allowNull: false,
            type: DataTypes.STRING,
            get () {
                return this.getDataValue('title').toLowerCase();
            },
            set (value) {
                return this.setDataValue('title', value);
            } 
        },
        content: {
            allowNull: false,
            defaultValue: '',
            type: DataTypes.STRING
        },
        authorId: {
            allowNull: false,
            field: 'author_id',
            references: {
                model: 'Users', // name of Target model
                key: 'id' // key in Target model that we're referencing
            },
            type: DataTypes.INTEGER,
            onUpdate: 'CASCADE',
            onDelete: 'CASCADE'
        },
        publishedAt: {
            allowNull: true,
            field: 'published_at',
            type: DataTypes.DATE
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
    Articles.associate = (models) => {
        Articles.belongsTo(models.Users, {
            as: 'Users',
            foreignKey: {
                name: 'authorId',
                allowNull: false
            },
            constraints: true,
            onDelete: 'cascade'
        });
    };
    return Articles;
};
