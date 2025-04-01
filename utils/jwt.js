const jwt = require("jsonwebtoken");
require("dotenv").config();

/**
 * Generate JWT token for authenticated user
 * @param {Object} user - User object containing id and email
 * @returns {string} JWT token
 */
const generateToken = (user) => {
  return jwt.sign(
    {
      userId: user.id,
      email: user.email,
    },
    process.env.JWT_SECRET,
    { expiresIn: "24h" } // Token expires in 24 hours
  );
};

module.exports = {
  generateToken,
};
