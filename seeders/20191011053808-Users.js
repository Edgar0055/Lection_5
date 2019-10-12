'use strict';

module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.bulkInsert('Users', [{
      id: 1,
      first_name: 'firstName',
      last_name: 'lastName',
      email: 'email',
      password: 'password',
      xxx: 'xxx'
    }, {
      id: 2,
      first_name: 'firstName2',
      last_name: 'lastName2',
      email: 'email2',
      password: 'password2',
      xxx: 'xxx2'
    }], {});
    /*
      Add altering commands here.
      Return a promise to correctly handle asynchronicity.

      Example:
      return queryInterface.bulkInsert('People', [{
        name: 'John Doe',
        isBetaMember: false
      }], {});
    */
  },

  down: (queryInterface, Sequelize) => {
    return queryInterface.bulkDelete('Users', null, {});
    /*
      Add reverting commands here.
      Return a promise to correctly handle asynchronicity.

      Example:
      return queryInterface.bulkDelete('People', null, {});
    */
  }
};
