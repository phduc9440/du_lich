'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Migration này không còn cần thiết vì region và guide role đã được thêm vào migration create-admins
    // Giữ lại migration này để tránh lỗi nếu đã chạy, nhưng không làm gì cả
    // Nếu cần migrate từ database cũ có address, có thể thêm logic ở đây
  },

  async down(queryInterface, Sequelize) {
    // Rollback - không làm gì vì migration này không còn cần thiết
  },
};
















