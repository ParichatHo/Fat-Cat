const { signToken } = require("../utils/jwt");
const userService = require("../services/users.service");
const validateZod = require("../validations/validateZod")
const { loginSchema } = require("../validations/auth.validation");


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

module.exports = { login };