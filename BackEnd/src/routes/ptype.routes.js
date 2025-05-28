const ptypeController = require("../controllers/ptype.controller");

module.exports = [
  {
    method: "GET",
    path: "/ptypes",
    options: ptypeController.getAllPtypes,
  },
  {
    method: "GET",
    path: "/ptypes/{type_id}",
    options: ptypeController.getPtypeById,
  },
  {
    method: "POST",
    path: "/ptypes",
    options: ptypeController.createPtype,
  },
  {
    method: "PUT",
    path: "/ptypes/{type_id}",
    options: ptypeController.updatePtype,
  },
  {
    method: "DELETE",
    path: "/ptypes/{type_id}",
    options: ptypeController.deletePtype,
  },
];