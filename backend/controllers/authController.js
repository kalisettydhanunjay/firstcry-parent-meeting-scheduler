const db = require('../config/db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
require('dotenv').config();

exports.login = async (req, res) => {
  try {
    const { identifier, password } = req.body;

    if (!identifier || !password) {
      return res.status(400).json({ message: 'Email/ID and password are required.' });
    }

    let user = null;

    // Check if the identifier is an email (contains '@')
    if (identifier.includes('@')) {
      const [rows] = await db.query('SELECT * FROM users WHERE email = ?', [identifier.trim()]);
      if (rows.length > 0) {
        user = rows[0];
      }
    } else {
      // Treat as numeric ID or prefixed ID like "TCH1" or "TCH-2"
      const digitsMatch = identifier.match(/\d+/);
      const userId = digitsMatch ? parseInt(digitsMatch[0], 10) : parseInt(identifier, 10);

      if (!isNaN(userId)) {
        const [rows] = await db.query('SELECT * FROM users WHERE id = ?', [userId]);
        if (rows.length > 0) {
          user = rows[0];
        }
      }
    }

    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials. User not found.' });
    }

    // Verify password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials. Incorrect password.' });
    }

    // If teacher, fetch their teacher details (e.g. specialization)
    let teacherDetails = null;
    if (user.role === 'teacher') {
      const [teacherRows] = await db.query('SELECT * FROM teachers WHERE id = ?', [user.id]);
      if (teacherRows.length > 0) {
        teacherDetails = teacherRows[0];
      }
    }

    // Generate JWT token
    const token = jwt.sign(
      {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
      process.env.JWT_SECRET || 'firstcry_intellitots_secret_key_2026',
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );

    // Return response
    return res.status(200).json({
      message: 'Login successful.',
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        teacherDetails
      }
    });

  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({ message: 'Internal server error during login.' });
  }
};
