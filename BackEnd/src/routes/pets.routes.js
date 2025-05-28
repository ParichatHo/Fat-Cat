const petsController = require("../controllers/pets.controller");

module.exports = [
  {
    method: "GET",
    path: "/pets",
    options: petsController.getAllPets,
  },
  {
    method: "GET",
    path: "/pets/{pet_id}",
    options: petsController.getPetById,
  },
  {
    method: "POST",
    path: "/pets",
    options: petsController.createPet,
  },
  {
    method: "PUT",
    path: "/pets/{pet_id}",
    options: petsController.updatePet,
  },
  {
    method: "DELETE",
    path: "/pets/{pet_id}",
    options: petsController.deletePet,
  },
];