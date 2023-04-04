const dotenv = require('dotenv');
dotenv.config();

module.exports = {
    port: process.env.PORT,
    db_username: process.env.DB_USERNAME,
    db_password: process.env.DB_PASSWORD,
    db_name: process.env.DB_DBNAME,
    gcs_bucket_name: process.env.GCS_BUCKET_NAME,
    gcs_project_id: process.env.GCS_PROJECT_ID,
    gcs_key_file: process.env.GOOGLE_APPLICATION_CREDENTIALS,
    gcs_folder_name:process.env.GCS_FOLDER_NAME,
    site_url: process.env.SITE_URL,
    session_secret: process.env.SESSION_SECRET,
}