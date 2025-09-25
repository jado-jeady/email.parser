import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/database.js'; // Adjust the path as needed

class BulkEmail extends Model {}

BulkEmail.init(
    {
        email_id: {
            type: DataTypes.STRING,
            allowNull: false,
            primaryKey: true,
        },
        from_email: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        subject: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        Range: {
            type: DataTypes.STRING
            
        },
        body: {
            type: DataTypes.TEXT,
            allowNull: false,
        },
        signature: {
            type: DataTypes.TEXT,
            allowNull: true,
        },
        recipients: {
            type: DataTypes.JSON, // Stores array of emails
            allowNull: false,
        },
        results: {
            type: DataTypes.JSON, // Stores array of results
            allowNull: false,
        }
    },
    {
        sequelize,
        modelName: 'BulkEmail',
        tableName: 'bulk_emails',
        timestamps: true,
    }
);


export default BulkEmail;