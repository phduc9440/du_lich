import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database';

export interface FeedbackAttributes {
  id: number;
  user_id?: number | null;
  title?: string;
  message?: string;
  status: 'pending' | 'cancelled';
  created_at?: Date;
  updated_at?: Date;
}

interface FeedbackCreationAttributes extends Optional<FeedbackAttributes, 'id' | 'status' | 'created_at'> {}

class Feedback extends Model<FeedbackAttributes, FeedbackCreationAttributes> implements FeedbackAttributes {
  declare id: number;
  declare user_id?: number | null;
  declare title?: string;
  declare message?: string;
  declare status: 'pending' | 'cancelled';
  declare readonly created_at: Date;
  declare readonly updated_at: Date;
}

Feedback.init(
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
      allowNull: true,
    },
    message: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    status: {
      type: DataTypes.ENUM('pending', 'cancelled'),
      defaultValue: 'pending',
    },
  },
  {
    sequelize,
    tableName: 'feedbacks',
    timestamps: true,
    underscored: true,
  }
);

export default Feedback;

