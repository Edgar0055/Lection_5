'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn( 'Users', 'is_verified', {
      allowNull: false,
      defaultValue: false,
      type: Sequelize.BOOLEAN,
    } );
    await queryInterface.addIndex( 'Users', [ 'is_verified', 'id' ], {
      indexName: 'IndexIsVerified',
    } );
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn( 'Users', 'is_verified', {} );
    await queryInterface.removeIndex( 'Users', 'IndexIsVerified' );
  }
};
