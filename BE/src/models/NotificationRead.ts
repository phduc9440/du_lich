import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database';

export interface NotificationReadAttributes {
  id: number;
  notification_id: number;
  user_id: number;
  read_at?: Date | null;
}

interface NotificationReadCreationAttributes extends Optional<NotificationReadAttributes, 'id' | 'read_at'> {
  notification_id: number;
  user_id: number;
}

class NotificationRead extends Model<NotificationReadAttributes, NotificationReadCreationAttributes> implements NotificationReadAttributes {
  declare id: number;
  declare notification_id: number;
  declare user_id: number;
  declare read_at?: Date | null;
}

NotificationRead.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    notification_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    user_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    read_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
  },
  {
    sequelize,
    tableName: 'notification_reads',
    timestamps: false,
    underscored: true,
    indexes: [
      {
        unique: true,
        fields: ['notification_id', 'user_id'], // đảm bảo mỗi user chỉ có 1 record cho 1 notification
      },
    ],
  }
);

export default NotificationRead;
