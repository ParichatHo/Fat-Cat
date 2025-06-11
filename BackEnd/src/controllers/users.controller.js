const userService = require("../services/users.service");

// Get all users
const getAllUsers = {
    description: "Get list of all users",
    tags: ["api", "users"],
    auth: {
        strategy: "jwt",
        scope: ["STAFF"],
    },
    handler: async (request, h) => {
        try {
            const users = await userService.getAllUsers();
            return h.response(users).code(200);
        } catch (error) {
            console.error("Error fetching users:", error);
            return h.response({ message: "Failed to fetch users" }).code(500);
        }
    },
};

// Get user by ID
const getUserById = {
    description: "Get user by ID",
    tags: ["api", "users"],
    auth: {
        strategy: "jwt",
        scope: ["STAFF"],
    },
    handler: async (request, h) => {
        const { user_id } = request.params;
        try {
            const user = await userService.getUserById(Number(user_id));

            if (!user) {
                return h.response({ message: "User not found" }).code(404);
            }

            return h.response(user).code(200);
        } catch (error) {
            console.error("Error fetching user:", error);
            return h.response({ message: "Failed to fetch user" }).code(500);
        }
    },
};

// Create user
const createUser = {
    description: "Create new User",
    tags: ["api", "users"],
    auth: {
        strategy: "jwt",
        scope: ["STAFF"],
    },
    handler: async (request, h) => {
        try {
            const { role, license_number } = request.payload;
            
            // Validate VETERINARIAN role requirements
            if (role === 'VETERINARIAN' && !license_number) {
                return h.response({ 
                    message: "License number is required for veterinarian role" 
                }).code(400);
            }

            const newUser = await userService.createUser(request.payload);
            
            // Remove password from response
            const { password, ...userResponse } = newUser;
            
            return h.response({
                message: "User created successfully",
                data: userResponse
            }).code(201);
        } catch (error) {
            console.error("Error creating user:", error);
            
            // Handle specific error messages
            if (error.message.includes("already exists") || 
                error.message.includes("required")) {
                return h.response({ message: error.message }).code(400);
            }
            
            return h.response({ message: "Failed to create user" }).code(500);
        }
    },
};

// Update user
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
            console.log('Payload received:', payload);

            const file = payload.image_file;
            const removeImage = payload.remove_image === 'true';

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

            // Validate VETERINARIAN role requirements
            if (payload.role === 'VETERINARIAN' && !payload.license_number) {
                return h.response({ 
                    message: "License number is required for veterinarian role" 
                }).code(400);
            }

            console.log('File info:', file ? {
                filename: file.filename,
                contentType: file.headers['content-type'],
                path: file.path
            } : 'No file');

            const updatedUser = await userService.updateUser(
                Number(user_id), 
                payload, 
                file, 
                removeImage
            );
            
            // Remove password from response
            const { password, ...userResponse } = updatedUser;
            
            return h.response({
                message: 'User updated successfully',
                data: userResponse,
            }).code(200);
        } catch (error) {
            console.error("Error updating user:", error);
            
            // Handle specific error messages
            if (error.message.includes("not found")) {
                return h.response({ message: error.message }).code(404);
            }
            if (error.message.includes("already") || 
                error.message.includes("required")) {
                return h.response({ message: error.message }).code(400);
            }
            
            return h.response({
                message: error.message || "Failed to update user",
                error: process.env.NODE_ENV === 'development' ? error.stack : undefined
            }).code(500);
        }
    },
};

// Delete user
const deleteUser = {
    description: "Delete user by user_id",
    tags: ["api", "users"],
    auth: {
        strategy: "jwt",
        scope: ["STAFF"],
    },
    handler: async (request, h) => {
        const { user_id } = request.params;
        try {
            const user = await userService.getUserById(Number(user_id));

            if (!user) {
                return h.response({ message: "User not found" }).code(404);
            }
            
            await userService.deleteUser(Number(user_id));
            return h.response({ message: "User deleted successfully" }).code(200);
        } catch (error) {
            console.error("Error deleting user:", error);
            return h.response({ message: "Failed to delete user" }).code(500);
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