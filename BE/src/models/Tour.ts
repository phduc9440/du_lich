import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database';

export interface TourAttributes {
  id: number;
  tour_code?: string;
  title: string;
  description?: string;
  region?: 'northern' | 'central' | 'southern' | null;
  destination?: string;
  departure: string;
  start_date: Date;
  end_date: Date;
  duration?: string;
  price: number;
  capacity: number;
  rating?: number;
  total_reviews?: number;
  latitude: number;
  longitude: number;
  main_image?: string;
  is_active: boolean;
  created_at?: Date;
  updated_at?: Date;
}

interface TourCreationAttributes extends Optional<TourAttributes, 'id' | 'tour_code' | 'is_active'> {}

class Tour extends Model<TourAttributes, TourCreationAttributes> implements TourAttributes {
  declare id: number;
  declare tour_code?: string;
  declare title: string;
  declare description?: string;
  declare region?: 'northern' | 'central' | 'southern' | null;
  declare destination?: string;
  declare departure: string;
  declare start_date: Date;
  declare end_date: Date;
  declare duration?: string;
  declare price: number;
  declare capacity: number;
  declare rating?: number;
  declare total_reviews?: number;
  declare latitude: number;
  declare longitude: number;
  declare main_image?: string;
  declare is_active: boolean;

  declare readonly created_at: Date;
  declare readonly updated_at: Date;
}

Tour.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    tour_code: {
      type: DataTypes.STRING(50),
      allowNull: true,
      unique: true,
    },
    title: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    region: {
      type: DataTypes.ENUM('northern', 'central', 'southern'),
      allowNull: true,
      defaultValue: 'northern',
    },
    destination: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    departure: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    start_date: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },
    end_date: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },
    duration: {
      type: DataTypes.STRING(50),
      allowNull: true,
    },
    price: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
    },
    capacity: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    rating: {
      type: DataTypes.DECIMAL(3, 2),
      allowNull: true,
      defaultValue: 0.0,
    },
    total_reviews: {
      type: DataTypes.INTEGER,
      allowNull: true,
      defaultValue: 0,
    },
    latitude: {
      type: DataTypes.DECIMAL(10, 6),
      allowNull: false,
    },
    longitude: {
      type: DataTypes.DECIMAL(10, 6),
      allowNull: false,
    },
    main_image: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    is_active: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },
  },
  {
    sequelize,
    tableName: 'tours',
    timestamps: true,
    underscored: true,
  }
);

export default Tour;
