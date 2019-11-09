'use strict';
module.exports = (sequelize, DataTypes) => {
	const Comments = sequelize.define('Comments', {
		id: {
			allowNull: false,
			autoIncrement: true,
			primaryKey: true,
			type: DataTypes.INTEGER
		},
		content: {
			type: DataTypes.TEXT,
			allowNull: false,
			defaultValue: '',
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
		articleId: {
            allowNull: false,
            field: 'article_id',
            references: {
                model: 'Articles', // name of Target model
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
	}, {});
  Comments.associate = function(models) {
	Comments.belongsTo(models.Users, {
		as: 'author',
		foreignKey: {
			name: 'authorId',
			allowNull: false
		},
		constraints: true,
		onDelete: 'CASCADE'
	});
	Comments.belongsTo(models.Articles, {
		as: 'article',
		foreignKey: {
			name: 'articleId',
			allowNull: false
		},
		constraints: true,
		onDelete: 'CASCADE'
	});
  };
  return Comments;
};