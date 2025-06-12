const authController = require("../controllers/auth.controller");

module.exports = [
    {
      method: 'POST',
      path: '/auth/login',
      options: authController.login,
    },
    {
      method: 'POST',
      path: '/user/info',
      options: authController.userInfo,
    },
    {
      method: 'PUT',
      path: '/user/update-profile',
      options: authController.updateProfile,
    },
    {
      method: 'POST',
      path: '/user/change-password',
      config: authController.changePassword,
    },
];