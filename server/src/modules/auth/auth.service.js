const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { query } = require('../../config/db');

const register = async ({ email, password, firstName, lastName, phone }) => {
  const passwordHash = await bcrypt.hash(password, 12);

  const result = await query(
    `INSERT INTO users (email, password_hash, first_name, last_name, phone)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING id, email, first_name, last_name, phone, role, is_verified, created_at`,
    [email, passwordHash, firstName, lastName, phone || null]
  );

  return result.rows[0];
};

const login = async ({ email, password }) => {
  const result = await query(
    `SELECT id, email, password_hash, first_name, last_name, role, is_verified
     FROM users WHERE email = $1`,
    [email]
  );

  if (result.rows.length === 0) {
    const error = new Error('Invalid email or password');
    error.statusCode = 401;
    throw error;
  }

  const user = result.rows[0];

  const passwordMatch = await bcrypt.compare(password, user.password_hash);

  if (!passwordMatch) {
    const error = new Error('Invalid email or password');
    error.statusCode = 401;
    throw error;
  }

  const accessToken = jwt.sign(
    { userId: user.id },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN }
  );

  const userWithoutPassword = {
    id: user.id,
    email: user.email,
    firstName: user.first_name,
    lastName: user.last_name,
    role: user.role,
    isVerified: user.is_verified,
  };

  return {
    accessToken,
    user: userWithoutPassword,
  };
};

const getMe = async (userId) => {
  const result = await query(
    `SELECT id, email, first_name, last_name, phone, role, is_verified, created_at
     FROM users WHERE id = $1`,
    [userId]
  );

  if (result.rows.length === 0) {
    const error = new Error('User not found');
    error.statusCode = 404;
    throw error;
  }

  const user = result.rows[0];
  return {
    id: user.id,
    email: user.email,
    firstName: user.first_name,
    lastName: user.last_name,
    phone: user.phone,
    role: user.role,
    isVerified: user.is_verified,
    createdAt: user.created_at,
  };
};

module.exports = {
  register,
  login,
  getMe,
};
