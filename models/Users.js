'use strict';
module.exports = (sequelize, DataTypes) => {
  const Users = sequelize.define('Users', {
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
  Users.associate = (models) => {
    Users.hasMany(models.Articles, {
      as: 'articles',
      foreignKey: 'authorId'
    });
  };
  return Users;
};