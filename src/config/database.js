const mysql = require('mysql2/promise');

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

async function initializeDatabase() {
    try {
      const connection = await pool.getConnection();
      
      // Create users table
      await connection.query(`
        CREATE TABLE IF NOT EXISTS users (
          id INT AUTO_INCREMENT PRIMARY KEY,
          email VARCHAR(255) UNIQUE NOT NULL,
          name VARCHAR(255) NOT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);
  
      // Create urls table
      await connection.query(`
        CREATE TABLE IF NOT EXISTS urls (
          id INT AUTO_INCREMENT PRIMARY KEY,
          user_id INT,
          long_url TEXT NOT NULL,
          short_url VARCHAR(255) UNIQUE NOT NULL,
          custom_alias VARCHAR(255) UNIQUE,
          topic VARCHAR(255),
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (user_id) REFERENCES users(id)
        )
      `);
  
      // Create analytics table
      await connection.query(`
        CREATE TABLE IF NOT EXISTS analytics (
          id INT AUTO_INCREMENT PRIMARY KEY,
          url_id INT,
          ip_address VARCHAR(45),
          user_agent TEXT,
          timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          os_type VARCHAR(255),
          device_type VARCHAR(255),
          country VARCHAR(255),
          FOREIGN KEY (url_id) REFERENCES urls(id)
        )
      `);
  
      connection.release();
      console.log('Database initialized successfully');
    } catch (error) {
      console.error('Error initializing database:', error);
    }
  }
  
  module.exports = { pool, initializeDatabase };