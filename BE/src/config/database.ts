import { Sequelize } from 'sequelize';
import dotenv from 'dotenv';

dotenv.config();

const sequelize = new Sequelize(
  process.env.DB_NAME || 'webbantourdulich',
  process.env.DB_USER || 'root',
  process.env.DB_PASSWORD || '123456',
  {
    host: process.env.DB_HOST || 'localhost',
    port: Number(process.env.DB_PORT) || 3306,
    dialect: 'mysql',
    timezone: '+07:00',
    logging: process.env.NODE_ENV === 'development' ? console.log : false,
    pool: {
      max: 5,
      min: 0,
      acquire: 30000,
      idle: 10000,
    },
    define: {
      timestamps: true,
      underscored: true,
    },
  }
);

export const connectDatabase = async (): Promise<void> => {
  try {
    await sequelize.authenticate();
    console.log('✅ Kết nối database thành công!');
    
    // NOTE: KHÔNG dùng sequelize.sync() vì đã có SQL schema riêng
    // Chỉ authenticate để kiểm tra kết nối
  } catch (error) {
    console.error('❌ Không thể kết nối database:', error);
    process.exit(1);
  }
};

export default sequelize;

