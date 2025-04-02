var createError = require("http-errors");
var express = require("express");
var path = require("path");
var cookieParser = require("cookie-parser");
var logger = require("morgan");
require("dotenv").config();

// Import routes
var usersRouter = require("./routes/users");
var todosRouter = require("./routes/todos");
var categoryRouter = require("./routes/category");

// Import models and sync database
var db = require("./models");
// db.sequelize.sync({ force: true });

db.sequelize
  .sync({ force: process.env.NODE_ENV === "development" })
  .then(async () => {
    console.log("Database synced successfully");

    try {
      const statusCount = await db.Status.count();

      if (statusCount === 0) {
        await db.Status.bulkCreate([
          { status: "Not started" },
          { status: "Started" },
          { status: "Completed" },
          { status: "Deleted" },
        ]);
        console.log("Initial statuses created");
      } else {
        console.log("Statuses already exist, skipping initialization");
      }
    } catch (err) {
      console.error("Error checking/creating statuses:", err);
    }
  })
  .catch((err) => {
    console.error("Failed to sync database:", err);
  });

var app = express();

// view engine setup
app.set("views", path.join(__dirname, "views"));
app.set("view engine", "ejs");

app.use(logger("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, "public")));

// Routes
app.use("/users", usersRouter);
app.use("/todos", todosRouter);
app.use("/category", categoryRouter);

// catch 404 and forward to error handler
app.use(function (req, res, next) {
  next(createError(404));
});

// error handler
app.use(function (err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get("env") === "development" ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render("error");
});

module.exports = app;
