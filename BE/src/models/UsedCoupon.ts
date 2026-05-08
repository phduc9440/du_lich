import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database';

export interface UsedCouponAttributes {
  id: number;
  coupon_id: number;
  order_id?: number | null;
}

interface UsedCouponCreationAttributes extends Optional<UsedCouponAttributes, 'id'> {}

class UsedCoupon extends Model<UsedCouponAttributes, UsedCouponCreationAttributes> implements UsedCouponAttributes {
  declare id: number;
  declare coupon_id: number;
  declare order_id?: number | null;
}

UsedCoupon.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    coupon_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'coupons',
        key: 'id',
      },
      onDelete: 'CASCADE',
    },
    order_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'orders',
        key: 'id',
      },
      onDelete: 'SET NULL',
    },
  },
  {
    sequelize,
    tableName: 'used_coupons',
    timestamps: false,
  }
);

export default UsedCoupon;

