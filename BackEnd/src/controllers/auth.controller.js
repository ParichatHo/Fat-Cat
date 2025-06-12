const { signToken, verifyToken } = require("../utils/jwt");
const userService = require("../services/users.service");
const validateZod = require("../validations/validateZod")
const { loginSchema } = require("../validations/auth.validation");
const { userInfoSchema } = require("../validations/auth.validation");
const { image } = require("../utils/cloudinary");
const z = require('zod');

const login = {
  description: "User login and get JWT token",
  tags: ["api", "auth"],
  auth: false,
  validate:{
    payload: validateZod(loginSchema)
  },
  handler: async (request, h) => {
    const { email, password } = request.payload;
    try {
      const userRecord = await userService.getUserByEmail(email);

      if (!userRecord) {
        return h.response("Invalid credentials").code(401)
      }
  
      const valid = await userService.comparePassword(userRecord, password);
      if (!valid) {
        return h.response("Invalid credentials").code(401)
      }
  
      const token = signToken({ sub: userRecord.user_id, role: userRecord.role });

      const safeUser = {
        user_id: userRecord.user_id,
        firstName: userRecord.first_name,
        lastName: userRecord.last_name,
        email: userRecord.email,
        role: userRecord.role,
        phone: userRecord.phone,
        image_url: userRecord.image_url,
        veterinarian: userRecord.veterinarian ? {
          vet_id: userRecord.veterinarian.vet_id,
          license_number: userRecord.veterinarian.license_number,
          experience: userRecord.veterinarian.experience,
          education: userRecord.veterinarian.education
        } : null
      };
      return h.response({ token, user: safeUser }).code(200)
    } catch (err) {
      console.error(err);
      return h.response({ message: err.message }).code(500);
    }
  }
}

const userInfo = {
  description: "Get user information by email",
  tags: ["api", "user"],
  auth: false,
  validate:{
    payload: validateZod(userInfoSchema)
  },
  handler: async (request, h) => {
    const { email } = request.payload;

    try {
      const authHeader = request.headers.authorization;
      if (!authHeader) {
        return h.response({ message: "Token is missing" }).code(401);
      }

      const token = authHeader.split(' ')[1];
      const decoded = verifyToken(token);
      if (!decoded) {
        return h.response({ message: "Invalid token" }).code(401);
      }

      const userRecord = await userService.getUserByEmail(email);

      if (!userRecord) {
        return h.response({ message: "User not found" }).code(404);
      }

      const userResponse = {
        user_id: userRecord.user_id,
        full_name: `${userRecord.first_name} ${userRecord.last_name}`,
        first_name: userRecord.first_name,
        last_name: userRecord.last_name,
        role: userRecord.role,
        image_url: userRecord.image_url,
        phone: userRecord.phone,
        email: userRecord.email,
        created_at: userRecord.createdAt,
        updated_at: userRecord.updatedAt
      };

      if (userRecord.role === 'VETERINARIAN' && userRecord.veterinarian) {
        userResponse.veterinarian = {
          vet_id: userRecord.veterinarian.vet_id,
          license_number: userRecord.veterinarian.license_number,
          experience: userRecord.veterinarian.experience,
          education: userRecord.veterinarian.education,
          created_at: userRecord.veterinarian.createdAt,
          updated_at: userRecord.veterinarian.updatedAt
        };
      }

      return h.response(userResponse).code(200);

    } catch (error) {
      console.error(error);
      return h.response({ message: "Internal server error" }).code(500);
    }
  }
};

// เพิ่ม endpoint สำหรับ update profile
const updateProfile = {
  description: "Update user profile",
  tags: ["api", "user"],
  auth: false,
  plugins: {
    'hapi-swagger': {
      consumes: ['multipart/form-data'],
    },
  },
  payload: {
    output: 'file', // เปลี่ยน stream เป็น file เหมือน updateUser
    parse: true,
    multipart: true,
    maxBytes: 5 * 1024 * 1024, // เปลี่ยนจาก 10MB เป็น 5MB เหมือน updateUser
    allow: 'multipart/form-data'
  },
  handler: async (request, h) => {
    try {
      const authHeader = request.headers.authorization;
      if (!authHeader) {
        return h.response({ message: "Token is missing" }).code(401);
      }

      const token = authHeader.split(' ')[1];
      const decoded = verifyToken(token);
      if (!decoded) {
        return h.response({ message: "Invalid token" }).code(401);
      }

      const userId = decoded.sub;
      
      // Extract data from multipart form
      const payload = request.payload;
      const updateData = {};
      let imageFile = null;
      let removeImage = false;

      console.log('Raw payload:', payload); // Debug log

      // Process form fields
      if (payload.first_name) updateData.first_name = payload.first_name;
      if (payload.last_name) updateData.last_name = payload.last_name;
      if (payload.phone) updateData.phone = payload.phone;
      if (payload.email) updateData.email = payload.email;
      if (payload.role) updateData.role = payload.role;
      if (payload.password) updateData.password = payload.password;
      
      // Veterinarian specific fields
      if (payload.license_number) updateData.license_number = payload.license_number;
      if (payload.experience) updateData.experience = payload.experience;
      if (payload.education) updateData.education = payload.education;

      // Handle image file - ปรับปรุงการจัดการไฟล์ให้เหมือน updateUser
      const file = payload.image_file;
      removeImage = payload.remove_image === 'true';

      // Validate file if provided - เพิ่มการตรวจสอบไฟล์
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
        
        imageFile = file;
        console.log('File info:', {
          filename: file.filename,
          contentType: file.headers['content-type'],
          path: file.path
        });
      }

      // Validate VETERINARIAN role requirements - เพิ่มการตรวจสอบบทบาทสัตวแพทย์
      if (updateData.role === 'VETERINARIAN' && !updateData.license_number) {
        return h.response({ 
          message: "License number is required for veterinarian role" 
        }).code(400);
      }

      console.log('Update data:', updateData);
      console.log('Image file:', imageFile ? 'Present' : 'None');
      console.log('Remove image:', removeImage);

      // Update user using service
      const updatedUser = await userService.updateUser(userId, updateData, imageFile, removeImage);

      console.log('Updated user image_url:', updatedUser.image_url); // Debug log

      const userResponse = {
        user_id: updatedUser.user_id,
        full_name: `${updatedUser.first_name} ${updatedUser.last_name}`,
        first_name: updatedUser.first_name,
        last_name: updatedUser.last_name,
        role: updatedUser.role,
        image_url: updatedUser.image_url,
        phone: updatedUser.phone,
        email: updatedUser.email,
        created_at: updatedUser.createdAt,
        updated_at: updatedUser.updatedAt
      };

      if (updatedUser.role === 'VETERINARIAN' && updatedUser.veterinarian) {
        userResponse.veterinarian = {
          vet_id: updatedUser.veterinarian.vet_id,
          license_number: updatedUser.veterinarian.license_number,
          experience: updatedUser.veterinarian.experience,
          education: updatedUser.veterinarian.education,
          created_at: updatedUser.veterinarian.createdAt,
          updated_at: updatedUser.veterinarian.updatedAt
        };
      }

      console.log('Response user image_url:', userResponse.image_url); // Debug log

      return h.response({ 
        message: "Profile updated successfully", 
        user: userResponse 
      }).code(200);

    } catch (error) {
      console.error('Update profile error:', error);
      
      // Handle specific error messages - เพิ่มการจัดการ error แบบเดียวกับ updateUser
      if (error.message.includes("not found")) {
        return h.response({ message: error.message }).code(404);
      }
      if (error.message.includes("already") || 
          error.message.includes("required")) {
        return h.response({ message: error.message }).code(400);
      }
      
      return h.response({ 
        message: error.message || "Internal server error",
        error: process.env.NODE_ENV === 'development' ? error.stack : undefined
      }).code(500);
    }
  }
};

const changePassword = {
  description: "Change user password",
  tags: ["api", "user"],
  auth: false,
  validate: {
    payload: validateZod(z.object({
      email: z.string().email(),
      currentPassword: z.string().min(6),
      newPassword: z.string().min(6)
    }))
  },
  handler: async (request, h) => {
    const { email, currentPassword, newPassword } = request.payload;
    
    try {
      const authHeader = request.headers.authorization;
      if (!authHeader) {
        return h.response({ message: "Token is missing" }).code(401);
      }

      const token = authHeader.split(' ')[1];
      const decoded = verifyToken(token);
      if (!decoded) {
        return h.response({ message: "Invalid token" }).code(401);
      }

      // Get user by email
      const userRecord = await userService.getUserByEmail(email);
      if (!userRecord) {
        return h.response({ message: "User not found" }).code(404);
      }

      // Verify current password
      const isCurrentPasswordValid = await userService.comparePassword(userRecord, currentPassword);
      if (!isCurrentPasswordValid) {
        return h.response({ message: "Current password is incorrect" }).code(400);
      }

      // Check if new password is different from current
      const isSamePassword = await userService.comparePassword(userRecord, newPassword);
      if (isSamePassword) {
        return h.response({ message: "New password must be different from current password" }).code(400);
      }

      // Update password
      await userService.changePassword(userRecord.user_id, newPassword);

      return h.response({ message: "Password changed successfully" }).code(200);

    } catch (error) {
      console.error('Change password error:', error);
      return h.response({ 
        message: error.message || "Internal server error" 
      }).code(500);
    }
  }
};

// เพิ่ม endpoint สำหรับ delete account
const deleteAccount = {
  description: "Delete user account",
  tags: ["api", "user"],
  auth: false,
  validate: {
    payload: validateZod(z.object({
      email: z.string().email()
    }))
  },
  handler: async (request, h) => {
    const { email } = request.payload;
    
    try {
      const authHeader = request.headers.authorization;
      if (!authHeader) {
        return h.response({ message: "Token is missing" }).code(401);
      }

      const token = authHeader.split(' ')[1];
      const decoded = verifyToken(token);
      if (!decoded) {
        return h.response({ message: "Invalid token" }).code(401);
      }

      // Get user by email
      const userRecord = await userService.getUserByEmail(email);
      if (!userRecord) {
        return h.response({ message: "User not found" }).code(404);
      }

      // Verify that the token belongs to the user being deleted
      if (decoded.sub !== userRecord.user_id) {
        return h.response({ message: "Unauthorized to delete this account" }).code(403);
      }

      // Delete user account
      await userService.deleteUser(userRecord.user_id);

      return h.response({ message: "Account deleted successfully" }).code(200);

    } catch (error) {
      console.error('Delete account error:', error);
      return h.response({ 
        message: error.message || "Internal server error" 
      }).code(500);
    }
  }
};

module.exports = { 
  login,
  userInfo,
  updateProfile,
  changePassword,
};