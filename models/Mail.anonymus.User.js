import { DataTypes, Model } from "sequelize";
import sequelize from "../config/database.js";

class AnonymousUser extends Model {}

AnonymousUser.init(
  {
    fingerprint: {
      type: DataTypes.STRING,
      allowNull: true,
      unique: true,
    },
    ip_address: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    hash: {
      type: DataTypes.STRING,
      allowNull: true,
      unique: true,
    },
    emails_sent_count: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
  },
  {
    sequelize,
    modelName: "AnonymousUser",
    tableName: "anonymous_users",
    timestamps: true,
  }
);

export default AnonymousUser;
