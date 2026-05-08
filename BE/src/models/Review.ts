import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database';

export interface ReviewAttributes {
  id: number;
  user_id?: number | null;
  tour_id: number;
  rating: number;
  text?: string | null;
  created_at?: Date;
}

interface ReviewCreationAttributes extends Optional<ReviewAttributes, 'id' | 'created_at'> {}

class Review extends Model<ReviewAttributes, ReviewCreationAttributes> implements ReviewAttributes {
  declare id: number;
  declare user_id?: number | null;
  declare tour_id: number;
  declare rating: number;
  declare text?: string | null;
  declare readonly created_at: Date;
}

Review.init(
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
    tour_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    rating: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: {
        min: 1,
        max: 5,
      },
    },
    text: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    created_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    sequelize,
    tableName: 'reviews',
    timestamps: true,
    underscored: true,
    createdAt: 'created_at',
    updatedAt: false,
  }
);

export default Review;
