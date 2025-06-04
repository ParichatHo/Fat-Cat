const authController = require("../controllers/auth.controller");

module.exports = [
    {
      method: 'POST',
      path: '/auth/login',
      options:authController.login,
    },
    {
      method: 'POST',
      path: '/user/info',
      options: authController.userInfo,
    }
];