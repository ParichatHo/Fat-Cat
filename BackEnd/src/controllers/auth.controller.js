const { signToken, verifyToken } = require("../utils/jwt"); // เพิ่ม verifyToken
const userService = require("../services/users.service");
const validateZod = require("../validations/validateZod")
const { loginSchema } = require("../validations/auth.validation");
const { userInfoSchema } = require("../validations/auth.validation");
const { image } = require("../utils/cloudinary");

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
  
      // แก้ไข: ใช้ user_id แทน id
      const token = signToken({ sub: userRecord.user_id, role: userRecord.role });

      const safeUser = {
        user_id: userRecord.user_id, // แก้ไข: ใช้ user_id
        firstName: userRecord.first_name,
        lastName: userRecord.last_name,
        email: userRecord.email,
        role: userRecord.role,
        phone: userRecord.phone,
        image_url: userRecord.image_url,
        // เพิ่มข้อมูล veterinarian ถ้ามี
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
      return h.response({ message: err.message }).code(500); // แก้ไข error handling
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

      // สร้าง response object พื้นฐาน
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

      // เพิ่มข้อมูล veterinarian ถ้า user เป็น VETERINARIAN และมีข้อมูล vet
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

module.exports = { 
  login,
  userInfo
};