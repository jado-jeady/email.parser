import { DataTypes, Model } from "sequelize";
import sequelize from "../config/database.js";

export class Email extends Model {}

Email.init(
  {
    email: DataTypes.STRING,
    subject: DataTypes.STRING,
    status: {
      type: DataTypes.TEXT,
      defaultValue: "sent",
    },
    messageId: DataTypes.STRING,
    error: DataTypes.TEXT,
    eventType: DataTypes.STRING,
    updatedAt: DataTypes.DATE,
  },
  {
    sequelize,
    modelName: "Email",
    tableName: "emails",
  }
);
export default Email;