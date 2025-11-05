import { Model, DataTypes } from "sequelize";
import sequelize from "../config/database.js";

class Domain extends Model {}

Domain.init(
  {
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    domainName: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    txtRecord: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    dkimRecord: {
      type: DataTypes.JSONB,
      allowNull: false,
    },
    verified: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
  },
  {
    sequelize,
    modelName: "Domain",
    tableName: "Domains", // optional: customize table name
    timestamps: true,     // optional: adds createdAt and updatedAt
  }
);

export default Domain;