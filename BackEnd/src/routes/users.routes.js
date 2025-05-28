const usersController = require("../controllers/users.controller");

module.exports = [
  {
    method: "GET",
    path: "/users",
    options: usersController.getAllUsers,
  },
  {
    method: "GET",
    path: "/users/{user_id}",
    options: usersController.getUserById,
  },
  {
    method: "POST",
    path: "/users",
    options: usersController.createUser,
  },
  {
    method: "PUT",
    path: "/users/{user_id}",
    options: usersController.updateUser,
  },
  {
    method: "DELETE",
    path: "/users/{user_id}",
    options: usersController.deleteUser,
  },
];