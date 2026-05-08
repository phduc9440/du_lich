import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database';

export interface TourGalleryAttributes {
  id: number;
  tour_id: number;
  image_url: string;
  created_at?: Date;
  updated_at?: Date;
}

interface TourGalleryCreationAttributes extends Optional<TourGalleryAttributes, 'id'> {}

class TourGallery extends Model<TourGalleryAttributes, TourGalleryCreationAttributes> implements TourGalleryAttributes {
  declare id: number;
  declare tour_id: number;
  declare image_url: string;
  
  declare readonly created_at: Date;
  declare readonly updated_at: Date;
}

TourGallery.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    tour_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    image_url: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
  },
  {
    sequelize,
    tableName: 'tour_gallery',
    timestamps: true,
    underscored: true,
  }
);

export default TourGallery;

