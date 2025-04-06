const request = require("supertest");
const app = require("../app");
const db = require("../models");
const jwt = require("jsonwebtoken");

// Test user credentials
const testUser = {
  name: "tobias",
  email: "tobias@test.no",
  password: "tobias",
};

// Variables to store tokens and created todo
let authToken;
let createdTodoId;

// Before and After
beforeAll(async () => {
  console.log("Setting up test environment...");
});

afterAll(async () => {
  await db.sequelize.close();
});

describe("Todo API Tests", () => {
  // Scenario 1: Logging in with a valid account
  test("Should login with valid credentials", async () => {
    const response = await request(app).post("/users/login").send({
      email: testUser.email,
      password: testUser.password,
    });

    expect(response.status).toBe(200);
    expect(response.body.status).toBe("success");
    expect(response.body.data.statusCode).toBe(200);
    expect(response.body.data.result).toHaveProperty("token");
    expect(response.body.data.result).toHaveProperty("userId");
    expect(response.body.data.result).toHaveProperty("email");

    // Update the token for subsequent tests
    authToken = response.body.data.result.token;
  });

  // Scenario 2: Using the token to get all user's todos
  test("Should get all todos for authenticated user", async () => {
    const response = await request(app)
      .get("/todos")
      .set("Authorization", `Bearer ${authToken}`);

    expect(response.status).toBe(200);
    expect(response.body.status).toBe("success");
    expect(response.body.data.statusCode).toBe(200);
    expect(Array.isArray(response.body.data.result)).toBe(true);
  });

  // Scenario 3: Using the token to add a new todo item
  test("Should add a new todo item", async () => {
    // First, create a category
    const categoryResponse = await request(app)
      .post("/category")
      .set("Authorization", `Bearer ${authToken}`)
      .send({
        name: "Test Category",
      });

    const categoryId = categoryResponse.body.data.result.id;

    // Then create a todo with the category
    const response = await request(app)
      .post("/todos")
      .set("Authorization", `Bearer ${authToken}`)
      .send({
        title: "Test Todo",
        description: "This is a test todo item",
        statusId: 1, // Not started
        categoryId: categoryId,
      });

    expect(response.status).toBe(201);
    expect(response.body.status).toBe("success");
    expect(response.body.data.statusCode).toBe(201);
    expect(response.body.data.result).toHaveProperty("id");

    // Store the created todo ID for the deletion test
    createdTodoId = response.body.data.result.id;
  });

  // Scenario 4: Deleting the created todo item
  test("Should delete (mark as deleted) the created todo item", async () => {
    const response = await request(app)
      .delete(`/todos/${createdTodoId}`)
      .set("Authorization", `Bearer ${authToken}`);

    expect(response.status).toBe(200);
    expect(response.body.status).toBe("success");
    expect(response.body.data.statusCode).toBe(200);

    // Verify the todo has been marked as deleted
    const todoResponse = await request(app)
      .get(`/todos/${createdTodoId}`)
      .set("Authorization", `Bearer ${authToken}`);

    expect(todoResponse.body.data.result.statusId).toBe(4); // Deleted status
  });

  // Scenario 5: Trying to get todos without sending JWT token
  test("Should fail to get todos without JWT token", async () => {
    const response = await request(app).get("/todos");

    expect(response.status).toBe(401);
    expect(response.body.status).toBe("fail");
  });

  // Scenario 6: Trying to get todos by sending an invalid JWT token
  test("Should fail to get todos with invalid JWT token", async () => {
    const invalidToken = jwt.sign(
      { userId: 999, email: "invalid@example.com" },
      "wrongsecret",
      { expiresIn: "1h" }
    );

    const response = await request(app)
      .get("/todos")
      .set("Authorization", `Bearer ${invalidToken}`);

    expect(response.status).toBe(401);
    expect(response.body.status).toBe("fail");
  });
});
