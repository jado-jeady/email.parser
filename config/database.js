import { Sequelize } from "sequelize";
import dotenv from "dotenv";
import { SESClient } from '@aws-sdk/client-ses';

dotenv.config();

const sequelize = new Sequelize(process.env.DB_NAME, process.env.DB_USER, process.env.DB_PASS, {
  host: process.env.DB_HOST,
  dialect: "postgres",
});


export const createSESClient = (region = 'us-east-1') => {
  return new SESClient({
    region,
    credentials: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    },
  });
}; 

export default sequelize;