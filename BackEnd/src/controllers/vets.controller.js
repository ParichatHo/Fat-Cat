const vetsService = require("../services/vets.service");

// Get all Vet
const getAllVets = {
    description: "Get list of all vet",
    tags: ["api", "vet"],
    auth: false,
    handler: async (Request, h) => {
        try {
            const vet = await vetsService.getAllVets();
            return h.response(vet).code(200);
        } catch (error) {
            console.error("Error fetching vet:", error);
            return h.response({ message: "Failed to fetch vet" }).code(500);
        }
    },
};

// GetById Vet
const getVetById = {
    description: "Get list of all vet",
    tags: ["api", "vet"],
    auth: false,
    handler: async (request, h) => {
        const { vet_id } = request.params;
        try {
            const vet = await vetsService.getVetById(Number(vet_id));

            if (!vet) {
                return h.response({ message: "vet not found" }).code(404);
            }

            return h.response(vet).code(200);
        } catch (error) {
            console.error("Error fetching vet:", error);
            return h.response({ message: "Failed to fetch vet" }).code(500);
        }
    },
};

//   Create Vet
const createVet = {
    description: "Create new Vet",
    tags: ["api", "vet"],
    auth: false,
    handler: async (request, h) => {
        try {
            const newVet = await vetsService.createVet(request.payload);
            return h.response(newVet).code(201);
        } catch (error) {
            console.error("Error creating vet:", error);
            return h.response({ message: "Failed to create vet" }).code(500);
        }
    },
};

//   Update Vet
const updateVet = {
    description: "Update vet by vet_id",
    tags: ["api", "vet"],
    auth: false,
    handler: async (request, h) => {
        const { vet_id } = request.params;
        try {
            const updatevet = await vetsService.updateVet(
                Number(vet_id),
                request.payload
            );
            return h.response(updatevet).code(200);
        } catch (error) {
            console.error("Error updating vet:", error.message, error);
            return h.response({ message: "Failed to update vet" }).code(500);
        }
    },
};

//   Delete Vet
const deleteVet = {
  description: "Delete vet by vet_id",
  tags: ["api", "vet"],
  auth: false,
  handler: async (request, h) => {
    const { vet_id } = request.params;
    try {
      const vet = await vetsService.getVetById(Number(vet_id));

      if (!vet) {
        return h.response({ message: "vet not found" }).code(404);
      }
      await vetsService.deleteVet(Number(vet_id));
      return h.response({ message: "vet deleted successfully" }).code(200);
    } catch (error) {
      console.error("Error deleting vet:", error);
      return h.response({ message: "Failed to delete vet" }).code(500);
    }
  },
};

module.exports = {
    getAllVets,
    getVetById,
    createVet,
    updateVet,
    deleteVet,
};