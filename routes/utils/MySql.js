var mysql = require('mysql2');
require("dotenv").config();


const config = {
  connectionLimit: 4,
  host: process.env.DB_HOST, 
  user: process.env.DB_USER, 
  password: process.env.DB_PASSWORD, 
  database: process.env.DB_NAME 
}
const pool = new mysql.createPool(config);

const connection = () => {
  return new Promise((resolve, reject) => {
    pool.getConnection((err, connection) => {
      if (err) {
        console.error('Error connecting to the database:', err);
        return reject(err);
      }

      const query = (sql, binding) => {
        return new Promise((resolve, reject) => {
          connection.query(sql, binding, (err, result) => {

            if (err) {
              console.error('Error executing query:', err);
              return reject(err);
            }

            resolve(result);
          });
        });
      };
      const release = () => {
        return new Promise((resolve, reject) => {
          if (err) reject(err);
          resolve(connection.release());
        });
      };
      resolve({ query, release });
    });
  });
};
const query = (sql, binding) => {
  return new Promise((resolve, reject) => {
    pool.query(sql, binding, (err, result, fields) => {
      if (err) reject(err);
      resolve(result);
    });
  });
};
module.exports = { pool, connection, query };