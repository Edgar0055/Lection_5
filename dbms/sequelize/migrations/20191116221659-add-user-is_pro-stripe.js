'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn( 'Users', 'is_pro', {
      allowNull: false,
      defaultValue: false,
      type: Sequelize.BOOLEAN,
    } );
    await queryInterface.addColumn( 'Users', 'stripe_customer_id', {
      allowNull: true,
      type: Sequelize.STRING,
    } );
    await queryInterface.addColumn( 'Users', 'stripe_card_id', {
      allowNull: true,
      type: Sequelize.STRING,
    } );
    await queryInterface.addIndex( 'Users', [ 'is_pro', 'id' ], {
      indexName: 'IndexIsPro',
    } );
    await queryInterface.addIndex( 'Users', [ 'stripe_customer_id', 'stripe_card_id', 'id' ], {
      indexName: 'IndexStripe',
    } );
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeIndex( 'Users', 'IndexIsPro' );
    await queryInterface.removeIndex( 'Users', 'IndexStripe' );
    await queryInterface.removeColumn( 'Users', 'stripe_card_id', {} );
    await queryInterface.removeColumn( 'Users', 'stripe_customer_id', {} );
    await queryInterface.removeColumn( 'Users', 'is_pro', {} );
  },
};
