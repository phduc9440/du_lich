'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Kiểm tra và thêm phone vào admins
    const [adminResults] = await queryInterface.sequelize.query(`
      SELECT COLUMN_NAME 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = DATABASE() 
      AND TABLE_NAME = 'admins' 
      AND COLUMN_NAME = 'phone'
    `);

    if (adminResults.length === 0) {
      await queryInterface.addColumn('admins', 'phone', {
        type: Sequelize.STRING(20),
        allowNull: true,
        defaultValue: null,
      });
    }
  },

  async down(queryInterface, Sequelize) {
    // Xóa phone từ admins
    try {
      await queryInterface.removeColumn('admins', 'phone');
    } catch (error) {
      // Ignore
    }
  },
};


