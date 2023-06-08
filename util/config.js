// config.js
// const dotenv = require('dotenv');
// dotenv.config();

module.exports = {
  port: process.env.PORT,
  db_username: process.env.DB_USERNAME,
  db_password: process.env.DB_PASSWORD,
  sendgrid_apikey: process.env.SENDGRID_API_KEY,
  bucket_name: process.env.GCS_BUCKET_NAME,
  project_id: process.env.GCS_PROJECT_ID,
  key_file: process.env.GOOGLE_APPLICATION_CREDENTIALS,
  secret_key: process.env.STRIPE_SECRET_KEY,
  site_url: process.env.SITE_URL,
  email_domain: process.env.EMAIL_DOMAIN
};