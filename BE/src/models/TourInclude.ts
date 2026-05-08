import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database';

export interface TourIncludeAttributes {
  id: number;
  tour_id: number;
  item: string;
  created_at?: Date;
  updated_at?: Date;
}

interface TourIncludeCreationAttributes extends Optional<TourIncludeAttributes, 'id'> {}

class TourInclude extends Model<TourIncludeAttributes, TourIncludeCreationAttributes> implements TourIncludeAttributes {
  declare id: number;
  declare tour_id: number;
  declare item: string;
  
  declare readonly created_at: Date;
  declare readonly updated_at: Date;
}

TourInclude.init(
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
    item: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
  },
  {
    sequelize,
    tableName: 'tour_includes',
    timestamps: true,
    underscored: true,
  }
);

export default TourInclude;

