const petService = require("../services/pets.service");

// Get all pets
const getAllPets = {
    description: "Get list of all pets",
    tags: ["api", "pets"],
    auth: false,
    handler: async (Request, h) => {
        try {
            const pets = await petService.getAllPets();
            return h.response(pets).code(200);
        } catch (error) {
            console.error("Error fetching pets:", error);
            return h.response({ message: "Failed to fetch pets" }).code(500);
        }
    },
};

// GetById pets
const getPetById = {
    description: "Get list of all pets",
    tags: ["api", "pets"],
    auth: false,
    handler: async (request, h) => {
        const { pet_id } = request.params;
        try {
            const pets = await petService.getPetById(Number(pet_id));

            if (!pets) {
                return h.response({ message: "pets not found" }).code(404);
            }

            return h.response(pets).code(200);
        } catch (error) {
            console.error("Error fetching pets:", error);
            return h.response({ message: "Failed to fetch pets" }).code(500);
        }
    },
};

//   Create pets
const createPet = {
    description: "Create new pets",
    tags: ["api", "pets"],
    auth: false,
    handler: async (request, h) => {
        try {
            const newPet = await petService.createPet(request.payload);
            return h.response(newPet).code(201);
        } catch (error) {
            console.error("Error creating pets:", error);
            return h.response({ message: "Failed to create pets" }).code(500);
        }
    },
};

//   Update pets
const updatePet = {
    description: "Update pets by pet_id",
    tags: ["api", "pets"],
    auth: false,
    handler: async (request, h) => {
        const { pet_id } = request.params;
        try {
            const updatePet = await petService.updatePet(
                Number(pet_id),
                request.payload
            );
            return h.response(updatePet).code(200);
        } catch (error) {
            console.error("Error updating pets:", error.message, error);
            return h.response({ message: "Failed to update pets" }).code(500);
        }
    },
};

//   Delete pets
const deletePet = {
  description: "Delete pets by pet_id",
  tags: ["api", "pets"],
  auth: false,
  handler: async (request, h) => {
    const { pet_id } = request.params;
    try {
      const pets = await petService.getPetById(Number(pet_id));

      if (!pets) {
        return h.response({ message: "pet not found" }).code(404);
      }
      await petService.deletePet(Number(pet_id));
      return h.response({ message: "pet deleted successfully" }).code(200);
    } catch (error) {
      console.error("Error deleting pet:", error);
      return h.response({ message: "Failed to delete pets" }).code(500);
    }
  },
};

module.exports = {
    getAllPets,
    getPetById,
    createPet,
    updatePet,
    deletePet,
};