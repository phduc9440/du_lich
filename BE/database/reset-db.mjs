import { Sequelize } from 'sequelize';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const sequelize = new Sequelize(
  process.env.DB_NAME || 'webbantourdulich',
  process.env.DB_USER || 'root',
  process.env.DB_PASSWORD || '',
  {
    host: process.env.DB_HOST || 'localhost',
    dialect: 'mysql',
    logging: false,
  }
);

async function resetDatabase() {
  try {
    console.log('🔄 Đang kết nối database...');
    await sequelize.authenticate();
    console.log('✅ Kết nối thành công!');

    console.log('🗑️  Đang xóa tất cả tables...');
    
    // Disable foreign key checks
    await sequelize.query('SET FOREIGN_KEY_CHECKS = 0');

    // Drop all tables
    const tables = [
      'SequelizeMeta',
      'notifications',
      'chats',
      'feedbacks',
      'review_images',
      'reviews',
      'coupons',
      'tickets',
      'orders',
      'tour_gallery',
      'tour_schedule',
      'tour_excludes',
      'tour_includes',
      'tours',
      'categories',
      'admin_roles',
      'roles',
      'admins',
      'users',
    ];

    for (const table of tables) {
      try {
        await sequelize.query(`DROP TABLE IF EXISTS \`${table}\``);
        console.log(`  ✓ Dropped table: ${table}`);
      } catch (error) {
        console.log(`  - Table ${table} not found (skip)`);
      }
    }

    // Drop triggers
    const triggers = ['before_insert_tour', 'before_insert_order', 'before_insert_ticket'];
    for (const trigger of triggers) {
      try {
        await sequelize.query(`DROP TRIGGER IF EXISTS \`${trigger}\``);
        console.log(`  ✓ Dropped trigger: ${trigger}`);
      } catch (error) {
        // Ignore
      }
    }

    // Enable foreign key checks
    await sequelize.query('SET FOREIGN_KEY_CHECKS = 1');

    console.log('✅ Đã xóa tất cả tables thành công!');
    console.log('');
    console.log('📌 Tiếp theo, chạy:');
    console.log('   npm run db:migrate');
    console.log('   npm run db:seed');

    await sequelize.close();
    process.exit(0);
  } catch (error) {
    console.error('❌ Lỗi:', error.message);
    await sequelize.close();
    process.exit(1);
  }
}

resetDatabase();

