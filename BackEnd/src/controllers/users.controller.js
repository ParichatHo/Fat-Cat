const userService = require("../services/users.service");

// Get all users
const getAllUsers = {
    description: "Get list of all users",
    tags: ["api", "users"],
    auth: false,
    handler: async (Request, h) => {
        try {
            const users = await userService.getAllUsers();
            return h.response(users).code(200);
        } catch (error) {
            console.error("Error fetching users:", error);
            return h.response({ message: "Failed to fetch users" }).code(500);
        }
    },
};

// GetById users
const getUserById = {
    description: "Get list of all users",
    tags: ["api", "users"],
    auth: false,
    handler: async (request, h) => {
        const { user_id } = request.params;
        try {
            const users = await userService.getUserById(Number(user_id));

            if (!users) {
                return h.response({ message: "users not found" }).code(404);
            }

            return h.response(users).code(200);
        } catch (error) {
            console.error("Error fetching users:", error);
            return h.response({ message: "Failed to fetch users" }).code(500);
        }
    },
};

//   Create users
const createUser = {
    description: "Create new users",
    tags: ["api", "users"],
    auth: false,
    handler: async (request, h) => {
        try {
            const newuser = await userService.createUser(request.payload);
            return h.response(newuser).code(201);
        } catch (error) {
            console.error("Error creating users:", error);
            return h.response({ message: "Failed to create users" }).code(500);
        }
    },
};

//   Update users
const updateUser = {
    description: "Update users by user_id",
    tags: ["api", "users"],
    auth: false,
    handler: async (request, h) => {
        const { user_id } = request.params;
        try {
            const updateuser = await userService.updateUser(
                Number(user_id),
                request.payload
            );
            return h.response(updateuser).code(200);
        } catch (error) {
            console.error("Error updating users:", error.message, error);
            return h.response({ message: "Failed to update users" }).code(500);
        }
    },
};

//   Delete users
const deleteUser = {
  description: "Delete users by user_id",
  tags: ["api", "users"],
  auth: false,
  handler: async (request, h) => {
    const { user_id } = request.params;
    try {
      const users = await userService.getUserById(Number(user_id));

      if (!users) {
        return h.response({ message: "user not found" }).code(404);
      }
      await userService.deleteUser(Number(user_id));
      return h.response({ message: "user deleted successfully" }).code(200);
    } catch (error) {
      console.error("Error deleting user:", error);
      return h.response({ message: "Failed to delete users" }).code(500);
    }
  },
};

module.exports = {
    getAllUsers,
    getUserById,
    createUser,
    updateUser,
    deleteUser,
};