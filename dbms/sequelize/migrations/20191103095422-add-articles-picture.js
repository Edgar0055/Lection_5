'use strict';

module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.addColumn('Articles', 'picture', {
      type: Sequelize.STRING,
    });
  },

  down: (queryInterface, Sequelize) => {
    return queryInterface.removeColumn('Articles', 'picture', {});
  }
};
