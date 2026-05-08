import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database';
import bcrypt from 'bcryptjs';

export interface AdminAttributes {
  id: number;
  username: string;
  email: string;
  password_hash: string;
  role: 'super_admin' | 'employee' | 'guide';
  region?: 'northern' | 'central' | 'southern' | null;
  phone?: string | null;
  created_at?: Date;
  updated_at?: Date;
  is_active: boolean;
}

interface AdminCreationAttributes extends Optional<AdminAttributes, 'id' | 'is_active' | 'role'> {}

class Admin extends Model<AdminAttributes, AdminCreationAttributes> implements AdminAttributes {
  declare id: number;
  declare username: string;
  declare email: string;
  declare password_hash: string;
  declare role: 'super_admin' | 'employee' | 'guide';
  declare region?: 'northern' | 'central' | 'southern' | null;
  declare phone?: string | null;
  declare is_active: boolean;

  declare readonly created_at: Date;
  declare readonly updated_at: Date;

  // Method để kiểm tra password
  public async comparePassword(candidatePassword: string): Promise<boolean> {
    if (!candidatePassword || !this.password_hash) {
      return false;
    }
    try {
      return await bcrypt.compare(candidatePassword, this.password_hash);
    } catch (error) {
      return false;
    }
  }
}

Admin.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    username: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    email: {
      type: DataTypes.STRING(150),
      allowNull: false,
      unique: true,
      validate: {
        isEmail: true,
      },
    },
    password_hash: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    role: {
      type: DataTypes.ENUM('super_admin', 'employee', 'guide'),
      allowNull: false,
      defaultValue: 'employee',
    },
    region: {
      type: DataTypes.ENUM('northern', 'central', 'southern'),
      allowNull: true,
      defaultValue: null,
    },
    phone: {
      type: DataTypes.STRING(20),
      allowNull: true,
      defaultValue: null,
    },
    is_active: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    },
  },
  {
    sequelize,
    tableName: 'admins',
    timestamps: true,
    underscored: true,
    // KHÔNG dùng hooks để hash password - hash rõ ràng trong service
  }
);

export default Admin;

