var express = require("express");
var router = express.Router();
var jsend = require("jsend");
const isAuth = require("../middleware/middleware");
const db = require("../models");
const Todo = db.Todo;
const Category = db.Category;
const Status = db.Status;
const { Op } = require("sequelize");

router.use(jsend.middleware);

/**
 * @route GET /category
 * @desc Get all categories for logged-in user
 * @access Private
 */

router.get("/", isAuth, async (req, res) => {
  try {
    const userId = req.userId;

    // Find all categories

    const categories = await Category.findAll({
      where: {
        userId: userId,
      },
    });

    return res.jsend.success({
      statusCode: 200,
      result: categories,
    });
  } catch (error) {
    console.error("Error fetching categories:", error);
    return res.jsend.error({
      statusCode: 500,
      message: "Internal server error",
    });
  }
});

/**
 * @route POST /category
 * @desc Create a new category for logged-in user
 * @access Private
 */

router.post("/", isAuth, async (req, res) => {
  try {
    const userId = req.userData.userId; // req.userId
    const { name } = req.body;

    // Validate input
    if (!name || name.trim() === "") {
      return res.jsend.fail({
        statusCode: 400,
        result: "Category name is required",
      });
    }

    // Check if category with the same name already exists for this user
    const existingCategory = await Category.findOne({
      where: {
        userId: userId,
        name: name,
      },
    });

    if (existingCategory) {
      return res.jsend.fail({
        statusCode: 400,
        result: "Category with this name already exists",
      });
    }

    // Create new category
    const newCategory = await Category.create({
      name: name,
      UserId: userId,
    });

    return res.jsend.success({
      statusCode: 201,
      result: newCategory,
    });
  } catch (error) {
    console.error("Error creating category:", error);
    return res.jsend.error({
      statusCode: 500,
      message: "Internal server error",
    });
  }
});

module.exports = router;
