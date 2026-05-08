import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database';

interface TourScheduleAttributes {
  id: number;
  tour_id: number;
  day_number: number;
  title: string;
  detail?: string;
  created_at?: Date;
  updated_at?: Date;
}

interface TourScheduleCreationAttributes extends Optional<TourScheduleAttributes, 'id'> {}

class TourSchedule extends Model<TourScheduleAttributes, TourScheduleCreationAttributes> implements TourScheduleAttributes {
  declare id: number;
  declare tour_id: number;
  declare day_number: number;
  declare title: string;
  declare detail?: string;
  
  declare readonly created_at: Date;
  declare readonly updated_at: Date;
}

TourSchedule.init(
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
    day_number: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    title: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    detail: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
  },
  {
    sequelize,
    tableName: 'tour_schedule',
    timestamps: true,
    underscored: true,
  }
);

export default TourSchedule;

