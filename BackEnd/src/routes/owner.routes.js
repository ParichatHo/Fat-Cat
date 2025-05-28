const ownerController = require("../controllers/owner.controller");

module.exports = [
  {
    method: "GET",
    path: "/owners",
    options: ownerController.getAllOwners,
  },
  {
    method: "GET",
    path: "/owners/{owner_id}",
    options: ownerController.getOwnerById,
  },
  {
    method: "POST",
    path: "/owners",
    options: ownerController.createOwner,
  },
  {
    method: "PUT",
    path: "/owners/{owner_id}",
    options: ownerController.updateOwner,
  },
  {
    method: "DELETE",
    path: "/owners/{owner_id}",
    options: ownerController.deleteOwner,
  },
];