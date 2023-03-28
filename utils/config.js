const dotenv = require('dotenv');
dotenv.config();

module.exports = {
    port: process.env.PORT,
    db_username: process.env.DB_USERNAME,
    db_password: process.env.DB_PASSWORD,
    db_name: process.env.DB_DBNAME,
}