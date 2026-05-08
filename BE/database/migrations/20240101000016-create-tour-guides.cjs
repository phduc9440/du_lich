'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('tour_guides', {
      id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
      tour_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      guide_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      start_date: {
        type: Sequelize.DATEONLY,
        allowNull: false,
      },
      end_date: {
        type: Sequelize.DATEONLY,
        allowNull: false,
      },
      created_at: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
      updated_at: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP'),
      },
    });

    // Add foreign key constraints
    await queryInterface.addConstraint('tour_guides', {
      fields: ['tour_id'],
      type: 'foreign key',
      name: 'fk_tour_guides_tour',
      references: {
        table: 'tours',
        field: 'id',
      },
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE',
    });

    await queryInterface.addConstraint('tour_guides', {
      fields: ['guide_id'],
      type: 'foreign key',
      name: 'fk_tour_guides_guide',
      references: {
        table: 'admins',
        field: 'id',
      },
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE',
    });

    // Add unique constraint on (tour_id, guide_id)
    await queryInterface.addConstraint('tour_guides', {
      fields: ['tour_id', 'guide_id'],
      type: 'unique',
      name: 'unique_tour_guide',
    });
  },

  down: async (queryInterface) => {
    await queryInterface.dropTable('tour_guides');
  }
};

