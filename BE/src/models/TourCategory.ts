import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database';

export interface TourCategoryAttributes {
  id: number;
  tour_id: number;
  category_id: number;
}

interface TourCategoryCreationAttributes extends Optional<TourCategoryAttributes, 'id'> {}

class TourCategory extends Model<TourCategoryAttributes, TourCategoryCreationAttributes> implements TourCategoryAttributes {
  declare id: number;
  declare tour_id: number;
  declare category_id: number;
}

TourCategory.init(
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
    category_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'categories',
        key: 'id',
      },
      onDelete: 'CASCADE',
    },
  },
  {
    sequelize,
    tableName: 'tour_categories',
    timestamps: false,
  }
);

export default TourCategory;












