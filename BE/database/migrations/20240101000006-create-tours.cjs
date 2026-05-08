'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('tours', {
      id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
      tour_code: {
        type: Sequelize.STRING(50),
        allowNull: true,
        unique: true,
      },
      title: {
        type: Sequelize.STRING(255),
        allowNull: false,
      },
      description: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      region: {
        type: Sequelize.ENUM('northern', 'central', 'southern'),
        allowNull: true,
        defaultValue: null,
      },
      destination: {
        type: Sequelize.STRING(255),
        allowNull: true,
      },
      departure: {
        type: Sequelize.STRING(255),
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
      duration: {
        type: Sequelize.STRING(50),
        allowNull: true,
      },
      price: {
        type: Sequelize.DECIMAL(12, 2),
        allowNull: false,
      },
      capacity: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      rating: {
        type: Sequelize.DECIMAL(3, 2),
        defaultValue: 0.0,
      },
      total_reviews: {
        type: Sequelize.INTEGER,
        defaultValue: 0,
      },
      latitude: {
        type: Sequelize.DECIMAL(10, 6),
        allowNull: false,
      },
      longitude: {
        type: Sequelize.DECIMAL(10, 6),
        allowNull: false,
      },
      main_image: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      is_active: {
        type: Sequelize.BOOLEAN,
        defaultValue: true,
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

    // Add trigger for tour_code
    await queryInterface.sequelize.query(`
      CREATE TRIGGER before_insert_tour
      BEFORE INSERT ON tours
      FOR EACH ROW
      BEGIN
        IF NEW.tour_code IS NULL OR NEW.tour_code = '' THEN
          SET NEW.tour_code = CONCAT(
            'TOUR',
            DATE_FORMAT(NOW(), '%Y%m%d'),
            '-',
            LPAD(FLOOR(RAND() * 10000), 4, '0')
          );
        END IF;
      END
    `);
  },

  down: async (queryInterface) => {
    await queryInterface.sequelize.query('DROP TRIGGER IF EXISTS before_insert_tour');
    await queryInterface.dropTable('tours');
  }
};

