import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database';

export interface CouponAttributes {
  id: number;
  code: string;
  description?: string;
  discount_percent?: number;
  discount_amount?: number;
  expire_at?: Date;
  max_use: number;
  discount_limit: number;
  created_at?: Date;
  updated_at?: Date;
  is_active: boolean;
}

interface CouponCreationAttributes extends Optional<CouponAttributes, 'id' | 'is_active'> {}

class Coupon extends Model<CouponAttributes, CouponCreationAttributes> implements CouponAttributes {
  declare id: number;
  declare code: string;
  declare description?: string;
  declare discount_percent?: number;
  declare discount_amount?: number;
  declare expire_at?: Date;
  declare max_use: number;
  declare discount_limit: number;
  declare is_active: boolean;

  declare readonly created_at: Date;
  declare readonly updated_at: Date;
}

Coupon.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    code: {
      type: DataTypes.STRING(50),
      allowNull: false,
      unique: true,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    discount_percent: {
      type: DataTypes.INTEGER,
      allowNull: true,
      validate: {
        min: 0,
        max: 100,
      },
    },
    discount_amount: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: true,
    },
    expire_at: {
      type: DataTypes.DATEONLY,
      allowNull: true,
    },
    max_use: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    discount_limit: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: true,
      defaultValue: 100000,
    },
    is_active: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    },
  },
  {
    sequelize,
    tableName: 'coupons',
    timestamps: true,
    underscored: true,
  }
);

export default Coupon;

