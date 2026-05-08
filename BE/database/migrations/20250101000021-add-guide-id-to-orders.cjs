'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Kiểm tra xem cột guide_id đã tồn tại chưa
    const [results] = await queryInterface.sequelize.query(`
      SELECT COLUMN_NAME 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = DATABASE() 
      AND TABLE_NAME = 'orders' 
      AND COLUMN_NAME = 'guide_id'
    `);

    // Nếu cột chưa tồn tại, thêm vào
    if (results.length === 0) {
      await queryInterface.addColumn('orders', 'guide_id', {
        type: Sequelize.INTEGER,
        allowNull: true,
      });

      // Thêm foreign key constraint
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
    }
  },

  async down(queryInterface, Sequelize) {
    // Xóa foreign key constraint trước
    try {
      await queryInterface.removeConstraint('orders', 'fk_orders_guide');
    } catch (error) {
      // Ignore nếu constraint không tồn tại
    }

    // Xóa cột guide_id
    try {
      await queryInterface.removeColumn('orders', 'guide_id');
    } catch (error) {
      // Ignore nếu cột không tồn tại
    }
  },
};

