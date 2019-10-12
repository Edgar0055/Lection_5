'use strict';
module.exports = {
  up: async (queryInterface, Sequelize) => {
    let result = await queryInterface.createTable('Articles', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      title: {
        allowNull: false,
        type: Sequelize.STRING
      },
      content: {
        allowNull: false,
        defaultValue: '',
        type: Sequelize.STRING
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
        onDelete: 'CASCADE'
      },
      publishedAt: {
        allowNull: true,
        field: 'published_at',
        type: Sequelize.DATE
      },
      createdAt: {
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
        field: 'created_at',
        type: Sequelize.DATE
      },
      updatedAt: {
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP'),
        field: 'updated_at',
        type: Sequelize.DATE
      }
    });
    return result;
  },
  down: async (queryInterface, Sequelize) => queryInterface
    .dropTable('Articles')
};