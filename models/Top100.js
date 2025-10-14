// models/Participant.model.js
import { DataTypes,Model } from 'sequelize';
import sequelize from '../config/database.js'; // adjust path to your sequelize instance

class Top100 extends Model {}

Top100.init(
  {
gmailId: { 
            type: DataTypes.STRING, 
            unique: true,  // prevents duplicates
            primaryKey:true
        },
  fullName: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: { isEmail: true },
  },
  phoneNumber: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  company:{
    type: DataTypes.TEXT,
    allowNull:true
  },
  projectName: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  videoLink: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  passportPhoto: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  participationType: {
    type: DataTypes.ENUM('individual', 'team'),
    allowNull: false,
  },
  teamMembers: {
    type: DataTypes.JSON, // optionally store as JSON string
    allowNull: true,
  },
  district: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  sector: {
    type: DataTypes.STRING,
    allowNull: false,
  },
}, 
{
  sequelize,
  modelName:'top_100',
  tableName: 'top_100',
  timestamps: true,
});

export default Top100;