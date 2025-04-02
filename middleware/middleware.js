const jwt = require("jsonwebtoken");
require("dotenv").config();

// Middleware function to determine if the API endpoint request is from an authenticated user
function isAuth(req, res, next) {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      return res.status(401).json({
        status: "fail",
        data: {
          statusCode: 401,
          result: "Authentiaction failed. No token provided.",
        },
      });
    }

    const token = authHeader.split(" ")[1];

    if (!token) {
      return res.status(401).json({
        status: "fail",
        data: {
          statusCode: 401,
          result: "Authentication failed. Invalid token.",
        },
      });
    }

    // Verify token

    const decodedToken = jwt.verify(token, process.env.JWT_SECRET);

    // Add user

    req.userData = {
      userId: decodedToken.userId,
      email: decodedToken.email,
    };

    next();
  } catch (error) {
    return res.status(401).json({
      status: "fail",
      data: {
        statusCode: 401,
        result: "Authentication failed. Invalid token.",
      },
    });
  }
}

module.exports = isAuth;
