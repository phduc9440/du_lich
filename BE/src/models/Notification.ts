import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database';

export interface NotificationAttributes {
  id: number;
  user_id?: number | null;
  title: string;
  message: string;
  type: 'order' | 'promotion';
  created_at?: Date;
}

interface NotificationCreationAttributes extends Optional<NotificationAttributes, 'id' | 'created_at'> {}

class Notification extends Model<NotificationAttributes, NotificationCreationAttributes> implements NotificationAttributes {
  declare id: number;
  declare user_id?: number | null;
  declare title: string;
  declare message: string;
  declare type: 'order' | 'promotion';
  declare readonly created_at: Date;
}

Notification.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    user_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    title: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    message: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    type: {
      type: DataTypes.ENUM('order', 'promotion'),
      allowNull: false,
    },
    created_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    sequelize,
    tableName: 'notifications',
    timestamps: true,
    underscored: true,
    createdAt: 'created_at',
    updatedAt: false,
  }
);

export default Notification;

