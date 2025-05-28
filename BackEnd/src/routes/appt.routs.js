const apptController = require("../controllers/appt.controller");

module.exports = [
  {
    method: "GET",
    path: "/appts",
    options: apptController.getAllAppts,
  },
  {
    method: "GET",
    path: "/appts/{appt_id}",
    options: apptController.getApptById,
  },
  {
    method: "POST",
    path: "/appts",
    options: apptController.createAppt,
  },
  {
    method: "PUT",
    path: "/appts/{appt_id}",
    options: apptController.updateAppt,
  },
  {
    method: "DELETE",
    path: "/appts/{appt_id}",
    options: apptController.deleteAppt,
  },
];