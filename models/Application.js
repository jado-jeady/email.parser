import { DataTypes, Model } from "sequelize";
import sequelize from "../config/database.js";

class Application extends Model {}

Application.init(
    {
        gmailId: { 
            type: DataTypes.STRING, 
            unique: true  // prevents duplicates
        },
        fullName: DataTypes.TEXT,
        email: DataTypes.TEXT,
        phone: DataTypes.TEXT,
        company: {type: DataTypes.TEXT , allowNull: true},
        projectName: DataTypes.TEXT,
        sector: DataTypes.TEXT,
        projectExplanation: DataTypes.TEXT('long'),
        socialImpact: DataTypes.TEXT('long'),
        differentiation: DataTypes.TEXT('long'),
        innovation: DataTypes.TEXT('long'),
        conceptNoteLink: DataTypes.TEXT('long'),
        termsAccepted: DataTypes.BOOLEAN
    },
    {
        sequelize,
        modelName: "application",
        tableName: "applications"
    }
);

export default Application;
