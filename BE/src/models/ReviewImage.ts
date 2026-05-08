import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database';

export interface ReviewImageAttributes {
  id: number;
  review_id: number;
  image_url?: string;
  created_at?: Date;
}

interface ReviewImageCreationAttributes extends Optional<ReviewImageAttributes, 'id'> {}

class ReviewImage extends Model<ReviewImageAttributes, ReviewImageCreationAttributes> implements ReviewImageAttributes {
  declare id: number;
  declare review_id: number;
  declare image_url?: string;
  
  declare readonly created_at: Date;
}

ReviewImage.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    review_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    image_url: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
  },
  {
    sequelize,
    tableName: 'review_images',
    timestamps: true,
    underscored: true,
    createdAt: 'created_at',
    updatedAt: false,
  }
);

export default ReviewImage;

