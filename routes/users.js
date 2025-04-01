var express = require("express");
var router = express.Router();
var jsend = require("jsend");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const db = require("../models");
const User = db.User;

router.use(jsend.middleware);

// Encrypt password

function encryptPassword(password) {
  const salt = crypto.randomBytes(16);

  const encryptedPassword = crypto.pbkdf2Sync(
    password,
    salt,
    10000,
    64,
    "sha512"
  );

  return {
    encryptedPassword,
    salt,
  };
}

// Verify password

function verifyPassword(password, encryptedPassword, salt) {
  const hashedPassword = crypto.pbkdf2Sync(password, salt, 10000, 64, "sha512");

  return Buffer.compare(hashedPassword, encryptedPassword) === 0;
}

// Post for registered users to be able to login
router.post("/login", async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.jsend.fail({
        statusCode: 400,
        message: "Email and password are required",
      });
    }

    const user = await User.findOne({ where: { email } });

    if (!user) {
      return res.jsend.fail({
        statusCode: 401,
        message: "Authentication failed",
      });
    }

    // Verify password

    const isPasswordValid = verifyPassword(
      password,
      user.encryptedPassword,
      user.salt
    );

    if (!isPasswordValid) {
      return res.jsend.fail({
        statusCode: 401,
        message: "Authentication failed",
      });
    }

    // Generate JWT token

    const token = jwt.sign(
      { userId: user.id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: "24h" }
    );

    return res.jsend.success({
      statusCode: 200,
      result: {
        userId: user.id,
        email: user.email,
        token,
      },
    });
  } catch (error) {
    console.error(error);
    return res.jsend.error({
      statusCode: 500,
      message: "An error occured during login",
    });
  }
});

// Post for new users to register / signup
router.post("/signup", async (req, res, next) => {
  try {
    const { name, email, password } = req.body;

    // Validation

    if (!name || !email || !password) {
      return res.jsend.fail({
        statusCode: 400,
        message: "Name, email and password are required",
      });
    }

    // Check existing user

    const existingUser = await User.findOne({ where: { email } });

    if (existingUser) {
      return res.jsend.fail({
        statusCode: 400,
        message: "User with this email already exists..",
      });
    }

    const { encryptedPassword, salt } = encryptPassword(password);

    // Create new user

    const newUser = await User.create({
      name,
      email,
      encryptedPassword,
      salt,
    });

    // Generate JWT token

    const token = jwt.sign(
      { userId: newUser.id, email: newUser.email },
      process.env.JWT_SECRET,
      { expiresIn: "24h" }
    );

    // Return success response

    return res.jsend.success({
      statusCode: 201,
      result: {
        userId: newUser.id,
        email: newUser.email,
        token,
      },
    });
  } catch (error) {
    console.error(error);
    return res.jsend.error({
      message: "An error occurred during signup",
    });
  }
});

router.get("/fail", (req, res) => {
  return res
    .status(401)
    .jsend.error({ statusCode: 401, message: "message", data: "data" });
});

module.exports = router;
