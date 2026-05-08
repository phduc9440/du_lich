'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Kiểm tra xem cột ticket_solded có tồn tại trong bảng tours không
    const [columnResults] = await queryInterface.sequelize.query(`
      SELECT COLUMN_NAME
      FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'tours'
      AND COLUMN_NAME = 'ticket_solded'
    `);

    // Nếu cột tồn tại, xóa nó
    if (columnResults.length > 0) {
      await queryInterface.removeColumn('tours', 'ticket_solded');
      console.log('✅ Đã xóa cột ticket_solded khỏi bảng tours');
    } else {
      console.log('ℹ️  Cột ticket_solded không tồn tại trong bảng tours');
    }
  },

  async down(queryInterface, Sequelize) {
    // Thêm lại cột ticket_solded trong trường hợp rollback
    const [columnResults] = await queryInterface.sequelize.query(`
      SELECT COLUMN_NAME
      FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'tours'
      AND COLUMN_NAME = 'ticket_solded'
    `);

    // Nếu cột không tồn tại, thêm lại
    if (columnResults.length === 0) {
      await queryInterface.addColumn('tours', 'ticket_solded', {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0,
      });
      console.log('✅ Đã thêm lại cột ticket_solded vào bảng tours');
    } else {
      console.log('ℹ️  Cột ticket_solded đã tồn tại trong bảng tours');
    }
  }
};



