const { signToken } = require("../utils/jwt");
const userService = require("../services/users.service");
const validateZod = require("../validations/validateZod")
const { loginSchema } = require("../validations/auth.validation");
const { userInfoSchema } = require("../validations/auth.validation");

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
  
      const token = signToken({ sub: userRecord.id, role: userRecord.role });

      const safeUser = {
        id: userRecord.id,
        firstName: userRecord.first_name,
        lastName: userRecord.last_name,
        email: userRecord.email,
        role: userRecord.role
      };
      return h.response({ token, user: safeUser }).code(200)
    } catch (err) {
      console.error(err);
      return error(h, err.message);
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

      return h.response({
        full_name: `${userRecord.first_name} ${userRecord.last_name}`,
        role: `${userRecord.role}`,
        // เพิ่มข้อมูลอื่น ๆ ถ้าต้องการ
      }).code(200);

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