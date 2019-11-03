'use strict';
module.exports = {
	up: async (queryInterface, Sequelize) => {
		let result = await queryInterface.createTable('OAuth_Account', {
			id: {
				allowNull: false,
				autoIncrement: true,
				primaryKey: true,
				type: Sequelize.INTEGER
			},
			provider: {
				allowNull: false,
				field: 'provider',
				type: Sequelize.STRING
			},
			providerUserId: {
				allowNull: false,
				field: 'provider_user_id',
				type: Sequelize.STRING
			},
			userId: {
				allowNull: true,
				field: 'user_id',
				references: {
					model: 'Users', // name of Target model
					key: 'id' // key in Target model that we're referencing
				},
				type: Sequelize.INTEGER,
				onUpdate: 'CASCADE',
				onDelete: 'CASCADE'
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
	down: async (queryInterface, Sequelize) => {
		return queryInterface.dropTable('OAuth_Account');
	}
};