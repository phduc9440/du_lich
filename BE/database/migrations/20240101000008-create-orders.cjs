'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('orders', {
      id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
      guide_id: {
        type: Sequelize.INTEGER,
        allowNull: true,
      },
      order_code: {
        type: Sequelize.STRING(50),
        allowNull: true,
        unique: true,
      },
      user_id: {
        type: Sequelize.INTEGER,
        allowNull: true,
      },
      tour_id: {
        type: Sequelize.INTEGER,
        allowNull: true,
      },
      quantity: {
        type: Sequelize.INTEGER,
        defaultValue: 1,
      },
      total_price: {
        type: Sequelize.DECIMAL(12, 2),
        allowNull: false,
      },
      status: {
        type: Sequelize.ENUM('pending', 'confirmed', 'cancelled', 'completed'),
        defaultValue: 'pending',
      },
      start_date: {
        type: Sequelize.DATEONLY,
        allowNull: false,
      },
      end_date: {
        type: Sequelize.DATEONLY,
        allowNull: false,
      },
      payment_url: {
        type: Sequelize.TEXT,
        allowNull: false,
      },
      is_paid: {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
      },
      is_review: {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
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

    await queryInterface.addConstraint('orders', {
      fields: ['user_id'],
      type: 'foreign key',
      name: 'fk_orders_user',
      references: {
        table: 'users',
        field: 'id',
      },
      onDelete: 'SET NULL',
      onUpdate: 'CASCADE',
    });

    await queryInterface.addConstraint('orders', {
      fields: ['tour_id'],
      type: 'foreign key',
      name: 'fk_orders_tour',
      references: {
        table: 'tours',
        field: 'id',
      },
      onDelete: 'SET NULL',
      onUpdate: 'CASCADE',
    });

    await queryInterface.addConstraint('orders', {
      fields: ['guide_id'],
      type: 'foreign key',
      name: 'fk_orders_guide',
      references: {
        table: 'admins',
        field: 'id',
      },
      onDelete: 'SET NULL',
      onUpdate: 'CASCADE',
    });

    // Add trigger for order_code
    await queryInterface.sequelize.query(`
      CREATE TRIGGER before_insert_order
      BEFORE INSERT ON orders
      FOR EACH ROW
      BEGIN
        IF NEW.order_code IS NULL OR NEW.order_code = '' THEN
          SET NEW.order_code = CONCAT(
            'MDH',
            DATE_FORMAT(NOW(), '%Y%m%d'),
            '-',
            LPAD(FLOOR(RAND() * 10000), 4, '0')
          );
        END IF;
      END
    `);
  },

  down: async (queryInterface) => {
    await queryInterface.sequelize.query('DROP TRIGGER IF EXISTS before_insert_order');
    await queryInterface.dropTable('orders');
  }
};

