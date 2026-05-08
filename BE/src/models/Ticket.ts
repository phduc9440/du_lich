import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database';

export interface TicketAttributes {
  id: number;
  order_id: number;
  user_id: number;
  ticket_code?: string;
  issue_date?: Date;
  valid_from: Date;
  valid_until: Date;
  status: 'active' | 'used' | 'cancelled';
  created_at?: Date;
  updated_at?: Date;
}

interface TicketCreationAttributes extends Optional<TicketAttributes, 'id' | 'ticket_code' | 'issue_date' | 'status'> {}

class Ticket extends Model<TicketAttributes, TicketCreationAttributes> implements TicketAttributes {
  declare id: number;
  declare order_id: number;
  declare user_id: number;
  declare ticket_code?: string;
  declare issue_date?: Date;
  declare valid_from: Date;
  declare valid_until: Date;
  declare status: 'active' | 'used' | 'cancelled';
  
  declare readonly created_at: Date;
  declare readonly updated_at: Date;
}

Ticket.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    order_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    user_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    ticket_code: {
      type: DataTypes.STRING(50),
      allowNull: true,
      unique: true,
    },
    issue_date: {
      type: DataTypes.DATE,
      allowNull: true,
      defaultValue: DataTypes.NOW,
    },
    valid_from: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },
    valid_until: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },
    status: {
      type: DataTypes.ENUM('active', 'used', 'cancelled'),
      allowNull: false,
      defaultValue: 'active',
    },
  },
  {
    sequelize,
    tableName: 'tickets',
    timestamps: true,
    underscored: true,
  }
);

export default Ticket;
