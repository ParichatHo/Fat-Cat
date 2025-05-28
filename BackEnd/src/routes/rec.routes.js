const recController = require("../controllers/rec.controller");

module.exports = [
  {
    method: "GET",
    path: "/recs",
    options: recController.getAllRecs,
  },
  {
    method: "GET",
    path: "/recs/{record_id}",
    options: recController.getRecById,
  },
  {
    method: "POST",
    path: "/recs",
    options: recController.createRec,
  },
  {
    method: "PUT",
    path: "/recs/{record_id}",
    options: recController.updateRec,
  },
  {
    method: "DELETE",
    path: "/recs/{record_id}",
    options: recController.deleteRec,
  },
];