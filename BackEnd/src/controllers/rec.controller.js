const RecService = require("../services/rec.service");

// Get all Rec
const getAllRecs = {
    description: "Get list of all Rec",
    tags: ["api", "Rec"],
    auth: false,
    handler: async (Request, h) => {
        try {
            const rec = await RecService.getAllRecs();
            return h.response(rec).code(200);
        } catch (error) {
            console.error("Error fetching Rec:", error);
            return h.response({ message: "Failed to fetch Rec" }).code(500);
        }
    },
};

// GetById Rec
const getRecById = {
    description: "Get list of all Rec",
    tags: ["api", "Rec"],
    auth: false,
    handler: async (request, h) => {
        const { record_id } = request.params;
        try {
            const rec = await RecService.getRecById(Number(record_id));

            if (!rec) {
                return h.response({ message: "Rec not found" }).code(404);
            }

            return h.response(rec).code(200);
        } catch (error) {
            console.error("Error fetching Rec:", error);
            return h.response({ message: "Failed to fetch Rec" }).code(500);
        }
    },
};

//   Create Rec
const createRec = {
    description: "Create new Rec",
    tags: ["api", "Rec"],
    auth: {
        strategy: "jwt",
        scope: ["VETERINARIAN"],
    },
    handler: async (request, h) => {
        try {
            const newRec = await RecService.createRec(request.payload);
            return h.response(newRec).code(201);
        } catch (error) {
            console.error("Error creating Rec:", error);
            return h.response({ message: "Failed to create Rec" }).code(500);
        }
    },
};

//   Update Rec
const updateRec = {
    description: "Update Rec by record_id",
    tags: ["api", "Rec"],
    auth: {
        strategy: "jwt",
        scope: ["VETERINARIAN"],
    },
    handler: async (request, h) => {
        const { record_id } = request.params;
        try {
            const updateRec = await RecService.updateRec(
                Number(record_id),
                request.payload
            );
            return h.response(updateRec).code(200);
        } catch (error) {
            console.error("Error updating Rec:", error.message, error);
            return h.response({ message: "Failed to update Rec" }).code(500);
        }
    },
};

//   Delete Rec
const deleteRec = {
  description: "Delete Rec by record_id",
  tags: ["api", "Rec"],
  auth: false,
  handler: async (request, h) => {
    const { record_id } = request.params;
    try {
      const rec = await RecService.getRecById(Number(record_id));

      if (!rec) {
        return h.response({ message: "Rec not found" }).code(404);
      }
      await RecService.deleteRec(Number(record_id));
      return h.response({ message: "Rec deleted successfully" }).code(200);
    } catch (error) {
      console.error("Error deleting Rec:", error);
      return h.response({ message: "Failed to delete Rec" }).code(500);
    }
  },
};

module.exports = {
    getAllRecs,
    getRecById,
    createRec,
    updateRec,
    deleteRec,
};