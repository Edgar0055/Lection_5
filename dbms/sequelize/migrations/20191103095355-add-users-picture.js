'use strict';

module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.addColumn('Users', 'picture', {
      type: Sequelize.STRING,
    });
  },

  down: (queryInterface, Sequelize) => {
    return queryInterface.removeColumn('Users', 'picture', {});
  }
};
