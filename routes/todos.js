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
    const userId = req.userId;

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
    const userId = req.userId;

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
router.get("deleted", (req, res) => {
  return;
});

// Add a new todo with their category for the logged in user
router.post("/", isAuth, (req, res) => {
  return;
});

// Return all the statuses from the database
router.get("/statuses", (req, res) => {
  return;
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
