import { DataTypes, Model, Optional } from "sequelize";
import sequelize from "../config/database";
import bcrypt from "bcryptjs";

export interface UserAttributes {
  id: number;
  username: string;
  email: string;
  password_hash: string | null;
  phone?: string | null;
  avatar_url?: string;
  gender?: "male" | "female" | "other";
  google_id: string | null;
  created_at?: Date;
  updated_at?: Date;
  is_active: boolean;
}

interface UserCreationAttributes
  extends Optional<UserAttributes, "id" | "is_active"> {}

class User
  extends Model<UserAttributes, UserCreationAttributes>
  implements UserAttributes
{
  declare id: number;
  declare username: string;
  declare email: string;
  declare password_hash: string | null;
  declare phone?: string | null;
  declare avatar_url?: string;
  declare gender?: "male" | "female" | "other";
  declare is_active: boolean;
  declare google_id: string | null;

  declare readonly created_at: Date;
  declare readonly updated_at: Date;

  // Method để kiểm tra password
  public async comparePassword(candidatePassword: string): Promise<boolean> {
    if (!candidatePassword || !this.password_hash) {
      return false;
    }
    try {
      return await bcrypt.compare(candidatePassword, this.password_hash);
    } catch (error) {
      return false;
    }
  }
}

User.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    username: {
      type: DataTypes.STRING(100),
      allowNull: false,
      // unique: true, sao username lại unique nhỉ?
    },
    email: {
      type: DataTypes.STRING(150),
      allowNull: false,
      unique: true,
      validate: {
        isEmail: true,
      },
    },
    password_hash: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    phone: {
      type: DataTypes.STRING(20),
      allowNull: true,
    },
    avatar_url: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    gender: {
      type: DataTypes.ENUM("male", "female", "other"),
      allowNull: true,
      defaultValue: "other",
    },
    google_id: {
      type: DataTypes.STRING(50),
      allowNull: true,
      unique: true,
    },

    is_active: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    },
  },
  {
    sequelize,
    tableName: "users",
    timestamps: true,
    underscored: true,
    // KHÔNG dùng hooks để hash password - hash rõ ràng trong service
  }
);

export default User;
