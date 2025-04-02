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
    const userId = req.userData.userId || req.userId;

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

/**
 * @route PUT /category/:id
 * @desc Update a category for logged-in user
 * @access Private
 */

router.put("/:id", isAuth, async (req, res) => {
  try {
    const categoryId = req.params.id;
    const userId = req.userId || req.userData.userId;
    const { name } = req.body;

    // Validate input

    if (!name || name.trim() === "") {
      return res.jsend.fail({
        statusCode: 400,
        result: "Category name is required",
      });
    }

    // Check if category exists and belongs to the user

    const category = await Category.findOne({
      where: {
        id: categoryId,
        UserId: userId,
      },
    });

    if (!category) {
      return res.jsend.fail({
        statusCode: 404,
        result: "Category not found or not authorized to update",
      });
    }

    // Check if another category with the same name already exists for this user

    const existingCategory = await Category.findOne({
      where: {
        UserId: userId,
        name: name,
        id: { [Op.ne]: categoryId },
      },
    });

    if (existingCategory) {
      return res.jsend.fail({
        statusCode: 400,
        result: "Another category with this name already exists",
      });
    }

    // Update category
    category.name = name;
    await category.save();

    return res.jsend.success({
      statusCode: 200,
      result: category,
    });
  } catch (error) {
    console.error("Error updating category:", error);
    return res.jsend.error({
      statusCode: 500,
      message: "Internal server error",
    });
  }
});

/**
 * @route DELETE /category/:id
 * @desc Delete a category for logged-in user if not used by any todo
 * @access Private
 */

router.delete("/:id", isAuth, async (req, res) => {
  try {
    const categoryId = req.params.id;
    const userId = req.userId || req.userData.userId;

    // Check if category exists and belongs to the user
    const category = await Category.findOne({
      where: {
        id: categoryId,
        UserId: userId,
      },
    });

    if (!category) {
      return res.jsend.fail({
        statusCode: 404,
        result: "Category not found or not authorized to delete",
      });
    }

    // Check if category is used by any todos
    const todos = await Todo.findOne({
      where: {
        CategoryId: categoryId,
      },
    });

    if (todos) {
      return res.jsend.fail({
        statusCode: 400,
        result:
          "Cannot delete category because it is assigned to one or more todos",
      });
    }

    // Delete category
    await category.destroy();

    return res.jsend.success({
      statusCode: 200,
      result: "Category deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting category:", error);
    return res.jsend.error({
      statusCode: 500,
      message: "Internal server error",
    });
  }
});

module.exports = router;
