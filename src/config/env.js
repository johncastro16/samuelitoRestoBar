import dotenv from 'dotenv';

dotenv.config();

export default {
  WEBHOOK_VERIFY_TOKEN: process.env.WEBHOOK_VERIFY_TOKEN,
  API_TOKEN: process.env.API_TOKEN,
  BUSINESS_PHONE: process.env.BUSINESS_PHONE,
  API_VERSION: process.env.API_VERSION,
  PORT: process.env.PORT || 3000,
  BASE_URL: process.env.BASE_URL,
  HUGGINGFACE_API_KEY: process.env.HUGGINGFACE_API_KEY,
  PRIVATE_KEY: process.env.PRIVATE_KEY,
  APP_SECRET: process.env.APP_SECRET,
  PASSPHRASE: process.env.PASSPHRASE
};