'use strict';
module.exports = {
  up: async (queryInterface, Sequelize) => {
    // eslint-disable-next-line prefer-const
    let result = await queryInterface.createTable('Comments', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      content: {
        allowNull: false,
        defaultValue: '',
        type: Sequelize.TEXT,
      },
      authorId: {
        allowNull: false,
        field: 'author_id',
        references: {
            model: 'Users', // name of Target model
            key: 'id' // key in Target model that we're referencing
        },
        type: Sequelize.INTEGER,
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      articleId: {
        allowNull: false,
        field: 'article_id',
        references: {
            model: 'Articles', // name of Target model
            key: 'id' // key in Target model that we're referencing
        },
        type: Sequelize.INTEGER,
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      createdAt: {
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
        field: 'created_at',
        type: Sequelize.DATE,

      },
      updatedAt: {
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP'),
        field: 'updated_at',
        type: Sequelize.DATE,
      }
    });
    return result;
  },
  down: async (queryInterface, Sequelize) => queryInterface
    .dropTable('Comments'),
};