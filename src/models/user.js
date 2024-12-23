const { pool } = require('../config/database');

class User {
  static async create(email, name) {
    const [result] = await pool.query(
      'INSERT INTO users (email, name) VALUES (?, ?)',
      [email, name]
    );
    return result.insertId;
  }

  static async findByEmail(email) {
    const [rows] = await pool.query(
      'SELECT * FROM users WHERE email = ?',
      [email]
    );
    return rows[0];
  }
}

module.exports = User;

