'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('tickets', {
      id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
      order_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      user_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      ticket_code: {
        type: Sequelize.STRING(50),
        allowNull: true,
        unique: true,
      },
      issue_date: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
      valid_from: {
        type: Sequelize.DATEONLY,
        allowNull: false,
      },
      valid_until: {
        type: Sequelize.DATEONLY,
        allowNull: false,
      },
      status: {
        type: Sequelize.ENUM('active', 'used', 'cancelled'),
        defaultValue: 'active',
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

    await queryInterface.addConstraint('tickets', {
      fields: ['order_id'],
      type: 'foreign key',
      name: 'fk_tickets_order',
      references: {
        table: 'orders',
        field: 'id',
      },
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE',
    });

    await queryInterface.addConstraint('tickets', {
      fields: ['user_id'],
      type: 'foreign key',
      name: 'fk_tickets_user',
      references: {
        table: 'users',
        field: 'id',
      },
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE',
    });

    // Add trigger for ticket_code
    await queryInterface.sequelize.query(`
      CREATE TRIGGER before_insert_ticket
      BEFORE INSERT ON tickets
      FOR EACH ROW
      BEGIN
        IF NEW.ticket_code IS NULL OR NEW.ticket_code = '' THEN
          SET NEW.ticket_code = CONCAT(
            'TKT',
            DATE_FORMAT(NOW(), '%Y%m%d'),
            '-',
            LPAD(FLOOR(RAND() * 10000), 4, '0')
          );
        END IF;
      END
    `);
  },

  down: async (queryInterface) => {
    await queryInterface.sequelize.query('DROP TRIGGER IF EXISTS before_insert_ticket');
    await queryInterface.dropTable('tickets');
  }
};

