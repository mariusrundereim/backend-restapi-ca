var express = require("express");
var router = express.Router();
var jsend = require("jsend");
const isAuth = require("../middleware/middleware");
const db = require("../models");
const Todo = db.Todo;
const Category = db.Category;
const Status = db.Status;
const { Op, where } = require("sequelize");

router.use(jsend.middleware);

/* Return all the logged in users todo's with the category associated with each todo and
status that is not the deleted status */
router.get("/", isAuth, async (req, res) => {
  try {
    const userId = req.userData.userId;

    // Find deleted status
    const deletedStatus = await Status.findOne({ where: { name: "Deleted" } });

    if (!deletedStatus) {
      return res.jsend.error("Status configuration issue");
    }

    // Find all todos for user dont have deleted status

    const todos = await Todo.findAll({
      where: {
        userId: userId,
        statusId: { [Op.ne]: deletedStatus.id },
        include: [{ model: Category }, { model: Status }],
      },
    });

    return res.jsend.success({
      statusCode: 200,
      result: todos,
    });
  } catch (error) {}
});

// Return all the users todos including todos with a deleted status
router.get("/all", isAuth, async (req, res) => {
  try {
    const userId = req.userData.userId;

    // Find all todos for the user including those with deleted status
    const todos = await Todo.findAll({
      where: {
        userId: userId,
      },
      include: [{ model: Category }, { model: Status }],
    });

    return res.jsend.success({
      statusCode: 200,
      result: todos,
    });
  } catch (error) {
    return res.jsend.error(error.message);
  }
});

// Return all the todos with the deleted status
router.get("deleted", isAuth, async (req, res) => {
  try {
    const userId = req.userData.userId;

    // Find deleted status
    const deletedStatus = await Status.findOne({
      where: { status: "Deleted" },
    });

    if (!deletedStatus) {
      return res.jsend.error("Status configuration issue");
    }

    // Find all deleted todos for the user
    const deletedTodos = await Todo.findAll({
      where: {
        userId: userId,
        statusId: deletedStatus.id,
      },
      include: [{ model: Category }, { model: Status }],
    });

    return res.jsend.success({
      statusCode: 200,
      result: deletedTodos,
    });
  } catch (error) {
    console.error("Error fetching todo:", error);
    return res.jsend.error({
      statusCode: 500,
      message: "Internal server error",
    });
  }
});

// Add a new todo with their category for the logged in user
router.post("/", isAuth, async (req, res) => {
  try {
    const userId = req.userData.userId;
    const { title, description, categoryId, statusId } = req.body;

    // Validate request body
    if (!title) {
      return res.jsend.fail({
        statusCode: 400,
        result: "Title is required",
      });
    }

    // Verify category exists and belongs to user
    if (categoryId) {
      const category = await Category.findOne({
        where: {
          id: categoryId,
          userId: userId,
        },
      });

      if (!category) {
        return res.jsend.fail({
          statusCode: 400,
          result: "Invalid category or category doesn't belong to user",
        });
      }
    }

    // Verify status exists
    if (statusId) {
      const status = await Status.findByPk(statusId);
      if (!status) {
        return res.jsend.fail({
          statusCode: 400,
          result: "Invalid status",
        });
      }
    }

    // Default to "Not started" status if not provided
    let defaultStatus;
    if (!statusId) {
      defaultStatus = await Status.findOne({ where: { name: "Not started" } });
      if (!defaultStatus) {
        return res.jsend.error("Status configuration issue");
      }
    }

    // Create the todo
    const newTodo = await Todo.create({
      title,
      description,
      categoryId,
      statusId: statusId || defaultStatus.id,
      userId,
    });

    // Return the created todo
    const todoWithAssociations = await Todo.findByPk(newTodo.id, {
      include: [{ model: Category }, { model: Status }],
    });

    return res.jsend.success({
      statusCode: 201,
      result: todoWithAssociations,
    });
  } catch (error) {
    console.error("Error fetching todo:", error);
    return res.jsend.error({
      statusCode: 500,
      message: "Internal server error",
    });
  }
});

// Return all the statuses from the database
router.get("/statuses", isAuth, async (req, res) => {
  try {
    const statuses = await Status.findAll();

    return res.jsend.success({
      statusCode: 200,
      result: statuses,
    });
  } catch (error) {
    return res.jsend.error(error.message);
  }
});

// Change/update a specific todo for logged in user
router.put("/:id", isAuth, (req, res) => {
  return;
});

// Delete a specific todo if for the logged in user
router.delete("/:id", isAuth, (req, res) => {
  return;
});

module.exports = router;
