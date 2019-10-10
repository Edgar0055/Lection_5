'use strict';
module.exports = (sequelize, DataTypes) => {
  const Articles = sequelize.define('Articles', {
    title: {
      allowNull: false,
      type: DataTypes.STRING
    },
    content: {
      allowNull: false,
      type: DataTypes.STRING
    },
    authorId: {
      allowNull: false,
      field: 'author_id',
      type: DataTypes.INTEGER
    },
    publishedAt: {
      field: 'published_at',
      type: DataTypes.DATE
    },
    createdAt: {
      allowNull: false,
      field: 'created_at',
      type: DataTypes.DATE
    },
    updatedAt: {
      allowNull: false,
      field: 'updated_at',
      type: DataTypes.DATE
    }
  }, {});
  Articles.associate = (models) => {};
  return Articles;
};