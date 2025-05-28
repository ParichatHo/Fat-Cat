const vetsController = require("../controllers/vets.controller");

module.exports = [
  {
    method: "GET",
    path: "/vets",
    options: vetsController.getAllVets,
  },
  {
    method: "GET",
    path: "/vets/{vet_id}",
    options: vetsController.getVetById,
  },
  {
    method: "POST",
    path: "/vets",
    options: vetsController.createVet,
  },
  {
    method: "PUT",
    path: "/vets/{vet_id}",
    options: vetsController.updateVet,
  },
  {
    method: "DELETE",
    path: "/vets/{vet_id}",
    options: vetsController.deleteVet,
  },
];