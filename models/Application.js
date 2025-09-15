import { DataTypes, Model } from "sequelize";
import sequelize from "../config/database.js";

class Application extends Model {}

Application.init(
    {
        gmailId: { 
            type: DataTypes.STRING, 
            unique: true  // prevents duplicates
        },
        fullName: DataTypes.STRING,
        email: DataTypes.STRING,
        phone: DataTypes.STRING,
        company: {type: DataTypes.STRING , allowNull: true},
        projectName: DataTypes.STRING,
        sector: DataTypes.STRING,
        projectExplanation: DataTypes.TEXT('long'),
        socialImpact: DataTypes.TEXT('long'),
        differentiation: DataTypes.TEXT('long'),
        innovation: DataTypes.TEXT('long'),
        conceptNoteLink: DataTypes.STRING,
        termsAccepted: DataTypes.BOOLEAN
    },
    {
        sequelize,
        modelName: "application"
    }
);

export default Application;
