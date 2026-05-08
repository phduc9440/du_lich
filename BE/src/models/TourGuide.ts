import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database';

export interface TourGuideAttributes {
  id: number;
  tour_id: number;
  guide_id: number;
  start_date: Date;
  end_date: Date;
  created_at?: Date;
  updated_at?: Date;
}

interface TourGuideCreationAttributes extends Optional<TourGuideAttributes, 'id'> {}

class TourGuide extends Model<TourGuideAttributes, TourGuideCreationAttributes> implements TourGuideAttributes {
  declare id: number;
  declare tour_id: number;
  declare guide_id: number;
  declare start_date: Date;
  declare end_date: Date;

  declare readonly created_at: Date;
  declare readonly updated_at: Date;
}

TourGuide.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    tour_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'tours',
        key: 'id',
      },
      onDelete: 'CASCADE',
    },
    guide_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'admins',
        key: 'id',
      },
      onDelete: 'CASCADE',
    },
    start_date: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },
    end_date: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },
  },
  {
    sequelize,
    tableName: 'tour_guides',
    timestamps: true,
    underscored: true,
  }
);

export default TourGuide;

