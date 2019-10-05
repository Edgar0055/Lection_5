'use strict';
module.exports = (sequelize, DataTypes) => {
  const Articles = sequelize.define('Articles', {
    title: DataTypes.STRING,
    content: DataTypes.STRING,
    authorId: DataTypes.INTEGER,
    publishedAt: DataTypes.DATE
  }, {});
  Articles.associate = function(models) {
    // associations can be defined here
  };
  return Articles;
};