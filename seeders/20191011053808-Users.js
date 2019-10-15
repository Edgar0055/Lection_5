'use strict';

module.exports = {
    up: (queryInterface, Sequelize) => {
        return queryInterface.bulkInsert('Users', [{
            id: 1,
            first_name: 'Edgar',
            last_name: 'Rostomian',
            email: 'edgar@local.com',
            password: 'password'
        }, {
            id: 2,
            first_name: 'Vasiliy',
            last_name: 'Pupkin',
            email: 'pupkin@gmail.com',
            password: 'password2'
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
