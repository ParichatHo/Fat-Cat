const ownerRoutes = require('./owner.routes');
const ptypeRoutes = require('./ptype.routes');
const petsRoutes = require('./pets.routes');
const vetsRoutes = require('./vets.routes');
const usersRoutes = require('./users.routes');
const recRoutes = require('./rec.routes');
const apptRoutes = require('./appt.routs');
const authRoutes = require('./auth.routs');

module.exports = [
  ...ownerRoutes,
  ...ptypeRoutes,
  ...petsRoutes,
  ...vetsRoutes,
  ...usersRoutes,
  ...recRoutes,
  ...apptRoutes,
  ...authRoutes,
];