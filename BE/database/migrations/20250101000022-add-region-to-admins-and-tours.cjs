'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Kiểm tra và thêm region vào admins
    const [adminResults] = await queryInterface.sequelize.query(`
      SELECT COLUMN_NAME 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = DATABASE() 
      AND TABLE_NAME = 'admins' 
      AND COLUMN_NAME = 'region'
    `);

    if (adminResults.length === 0) {
      await queryInterface.addColumn('admins', 'region', {
        type: Sequelize.ENUM('northern', 'central', 'southern'),
        allowNull: true,
        defaultValue: 'northern',
      });
    }

    // Kiểm tra và cập nhật role enum trong admins nếu chưa có 'guide'
    const [roleCheck] = await queryInterface.sequelize.query(`
      SELECT COLUMN_TYPE 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = DATABASE() 
      AND TABLE_NAME = 'admins' 
      AND COLUMN_NAME = 'role'
    `);

    if (roleCheck.length > 0 && !roleCheck[0].COLUMN_TYPE.includes("'guide'")) {
      await queryInterface.changeColumn('admins', 'role', {
        type: Sequelize.ENUM('super_admin', 'employee', 'guide'),
        allowNull: false,
        defaultValue: 'employee',
      });
    }

    // Kiểm tra và thêm region vào tours
    const [tourResults] = await queryInterface.sequelize.query(`
      SELECT COLUMN_NAME 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = DATABASE() 
      AND TABLE_NAME = 'tours' 
      AND COLUMN_NAME = 'region'
    `);

    if (tourResults.length === 0) {
      await queryInterface.addColumn('tours', 'region', {
        type: Sequelize.ENUM('northern', 'central', 'southern'),
        allowNull: true,
        defaultValue: 'northern',
      });
    }
  },

  async down(queryInterface, Sequelize) {
    // Xóa region từ tours
    try {
      await queryInterface.removeColumn('tours', 'region');
    } catch (error) {
      // Ignore
    }

    // Xóa region từ admins
    try {
      await queryInterface.removeColumn('admins', 'region');
    } catch (error) {
      // Ignore
    }

    // Rollback role enum về trạng thái cũ (nếu cần)
    try {
      await queryInterface.changeColumn('admins', 'role', {
        type: Sequelize.ENUM('super_admin', 'employee'),
        allowNull: false,
        defaultValue: 'employee',
      });
    } catch (error) {
      // Ignore
    }
  },
};

