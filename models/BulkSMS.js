// models/SenderProfile.model.js
import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/database.js';

class BulkSMS extends Model {}

BulkSMS.init({
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  senderId: {
    type: DataTypes.STRING(11),
    allowNull: false,
    validate: {
      is: /^[a-zA-Z0-9]+$/, // alphanumeric only
      len: [3, 11],
    },
  },
  verified: {
    type: DataTypes.BOOLEAN,
    defaultValue: true, // Rwanda doesn't require registration
  },
}, {
  sequelize,
  modelName: 'BulkSMS',
  tableName: 'bulksms',
  timestamps: true,
});

export default BulkSMS;