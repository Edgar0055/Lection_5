'use strict';

module.exports = {
    up: (queryInterface, Sequelize) => {
        return queryInterface.bulkInsert('Articles', [{
            id: 1,
            title: 'title1',
            content: 'content1',
            author_id: 1
        }, {
            id: 2,
            title: 'title2',
            content: 'content2',
            author_id: 1
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
        return queryInterface.bulkDelete('Articles', null, {});
    /*
      Add reverting commands here.
      Return a promise to correctly handle asynchronicity.

      Example:
      return queryInterface.bulkDelete('People', null, {});
    */
    }
};
