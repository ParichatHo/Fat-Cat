const userService = require("../services/users.service");

// Get all users
const getAllUsers = {
    description: "Get list of all users",
    tags: ["api", "users"],
    auth: {
        strategy: "jwt",
        scope: ["STAFF"],
    },
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
    auth: {
        strategy: "jwt",
        scope: ["STAFF"],
    },
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
    description: "Create new User",
    tags: ["api", "User"],
    auth: {
        strategy: "jwt",
        scope: ["STAFF"],
    },
    handler: async (request, h) => {
        try {
            const newUser = await userService.createUser(request.payload);
            return h.response(newUser).code(201);
        } catch (error) {
            console.error("Error creating User:", error);
            return h.response({ message: "Failed to create User" }).code(500);
        }
    },
};

//   Update users
const updateUser = {
    description: "Update user by user_id",
    tags: ["api", "users"],
    auth: {
        strategy: "jwt",
        scope: ["STAFF"],
    },
    plugins: {
        'hapi-swagger': {
            consumes: ['multipart/form-data'],
        },
    },
    payload: {
        maxBytes: 5 * 1024 * 1024, // Limit to 5MB
        parse: true,
        output: 'file',
        multipart: true,
    },
    handler: async (request, h) => {
        const { user_id } = request.params;
        try {
            const { payload } = request;
            console.log('Payload received:', payload); // Debug log

            const file = payload.image_file; // Image field name
            const removeImage = payload.remove_image === 'true'; // Option to remove image

            // Validate file if provided
            if (file && file.path) {
                const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'];
                if (!validTypes.includes(file.headers['content-type'])) {
                    return h.response({
                        message: 'Invalid file type. Only JPEG, JPG, PNG, WebP are allowed'
                    }).code(400);
                }
                if (file._data && file._data.length > 5 * 1024 * 1024) {
                    return h.response({
                        message: 'File size exceeds 5MB limit'
                    }).code(400);
                }
            }
            
            console.log('File info:', file ? {
                filename: file.filename,
                contentType: file.headers['content-type'],
                path: file.path
            } : 'No file');

            const updatedUser = await userService.updateUser(Number(user_id), payload, file, removeImage); // Pass image to userService
            
            return h.response({
                message: 'User updated successfully',
                data: updatedUser,
            }).code(200);
        } catch (error) {
            console.error("Error updating user:", error);
            return h.response({
                message: error.message || "Failed to update user",
                error: error.stack // เพิ่ม stack trace สำหรับ debug
            }).code(500);
        }
    },
};

//   Delete users
const deleteUser = {
    description: "Delete users by user_id",
    tags: ["api", "users"],
    auth: {
        strategy: "jwt",
        scope: ["STAFF"],
    },
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