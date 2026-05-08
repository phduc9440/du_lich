'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // tour_includes
    await queryInterface.createTable('tour_includes', {
      id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
      tour_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      item: {
        type: Sequelize.STRING(255),
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

    await queryInterface.addConstraint('tour_includes', {
      fields: ['tour_id'],
      type: 'foreign key',
      name: 'fk_tour_includes_tour',
      references: {
        table: 'tours',
        field: 'id',
      },
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE',
    });

    // tour_excludes
    await queryInterface.createTable('tour_excludes', {
      id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
      tour_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      item: {
        type: Sequelize.STRING(255),
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

    await queryInterface.addConstraint('tour_excludes', {
      fields: ['tour_id'],
      type: 'foreign key',
      name: 'fk_tour_excludes_tour',
      references: {
        table: 'tours',
        field: 'id',
      },
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE',
    });

    // tour_schedule
    await queryInterface.createTable('tour_schedule', {
      id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
      tour_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      day_number: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      title: {
        type: Sequelize.STRING(255),
        allowNull: false,
      },
      detail: {
        type: Sequelize.TEXT,
        allowNull: true,
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

    await queryInterface.addConstraint('tour_schedule', {
      fields: ['tour_id'],
      type: 'foreign key',
      name: 'fk_tour_schedule_tour',
      references: {
        table: 'tours',
        field: 'id',
      },
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE',
    });

    // tour_gallery
    await queryInterface.createTable('tour_gallery', {
      id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
      tour_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      image_url: {
        type: Sequelize.TEXT,
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

    await queryInterface.addConstraint('tour_gallery', {
      fields: ['tour_id'],
      type: 'foreign key',
      name: 'fk_tour_gallery_tour',
      references: {
        table: 'tours',
        field: 'id',
      },
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE',
    });

    // tour_categories
    await queryInterface.createTable('tour_categories', {
      id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
      tour_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      category_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
    });

    await queryInterface.addConstraint('tour_categories', {
      fields: ['tour_id'],
      type: 'foreign key',
      name: 'fk_tour_categories_tour',
      references: {
        table: 'tours',
        field: 'id',
      },
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE',
    });

    await queryInterface.addConstraint('tour_categories', {
      fields: ['category_id'],
      type: 'foreign key',
      name: 'fk_tour_categories_category',
      references: {
        table: 'categories',
        field: 'id',
      },
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE',
    });
  },

  down: async (queryInterface) => {
    await queryInterface.dropTable('tour_categories');
    await queryInterface.dropTable('tour_gallery');
    await queryInterface.dropTable('tour_schedule');
    await queryInterface.dropTable('tour_excludes');
    await queryInterface.dropTable('tour_includes');
  }
};

