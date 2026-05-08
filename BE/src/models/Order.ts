import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database';

export interface OrderAttributes {
  id: number;
  guide_id?: number | null;
  order_code?: string;
  user_id?: number | null;
  tour_id?: number | null;
  quantity: number;
  total_price: number;
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed';
  start_date: Date;
  end_date: Date;
  payment_url: string;
  is_paid: boolean;
  is_review: boolean;
  created_at?: Date;
  updated_at?: Date;
}

interface OrderCreationAttributes extends Optional<OrderAttributes, 'id' | 'status'> {}

class Order extends Model<OrderAttributes, OrderCreationAttributes> implements OrderAttributes {
  // Dùng declare thay vì public để tránh shadowing Sequelize getters/setters
  declare id: number;
  declare guide_id?: number | null;
  declare order_code?: string;
  declare user_id?: number | null;
  declare tour_id?: number | null;
  declare quantity: number;
  declare total_price: number;
  declare status: 'pending' | 'confirmed' | 'cancelled' | 'completed';
  declare start_date: Date;
  declare end_date: Date;
  declare payment_url: string;
  declare is_paid: boolean;
  declare is_review: boolean;

  declare readonly created_at: Date;
  declare readonly updated_at: Date;
}

Order.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    guide_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      defaultValue: null,
    },
    order_code: {
      type: DataTypes.STRING(50),
      allowNull: true,
      unique: true,
    },
    user_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'users',
        key: 'id',
      },
      onDelete: 'SET NULL',
    },
    tour_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'tours',
        key: 'id',
      },
      onDelete: 'SET NULL',
    },
    quantity: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 1,
    },
    total_price: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
    },
    status: {
      type: DataTypes.ENUM('pending', 'confirmed', 'cancelled', 'completed'),
      defaultValue: 'pending',
    },
    start_date: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },
    end_date: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },
    payment_url: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    is_paid: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    is_review: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
  },
  {
    sequelize,
    tableName: 'orders',
    timestamps: true,
    underscored: true,
  }
);

export default Order;

