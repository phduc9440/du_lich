'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Kiểm tra xem cột updated_at đã tồn tại chưa
    const [results] = await queryInterface.sequelize.query(`
      SELECT COLUMN_NAME 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = DATABASE() 
      AND TABLE_NAME = 'feedbacks' 
      AND COLUMN_NAME = 'updated_at'
    `);

    // Nếu cột chưa tồn tại, thêm vào
    if (results.length === 0) {
      await queryInterface.addColumn('feedbacks', 'updated_at', {
        type: Sequelize.DATE,
        allowNull: true,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP'),
      });
    }
  },

  async down(queryInterface, Sequelize) {
    // Xóa cột updated_at
    try {
      await queryInterface.removeColumn('feedbacks', 'updated_at');
    } catch (error) {
      // Ignore nếu cột không tồn tại
    }
  }
};

