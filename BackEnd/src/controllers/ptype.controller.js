const ptypeService = require("../services/ptype.service");
// Get all pTypes
const getAllPtypes = {
    description: "Get list of all pet types",
    tags: ["api", "pType"],
    auth: false,
    handler: async (Request, h) => {
        try {
            const ptype = await ptypeService.getAllPtypes();
            return h.response(ptype).code(200);
        } catch (error) {
            console.error("Error fetching pet type:", error);
            return h.response({ message: "Failed to fetch Pet Types"}).code(500);
        }
    },
};

// GetById ptype
const getPtypeById = {
    description: "Get list of all ptype",
    tags: ["api", "ptype"],
    auth: false,
    handler: async (request, h) => {
        const { type_id } = request.params;
        try {
            const ptype = await ptypeService.getPtypeById(Number(type_id));

            if (!ptype) {
                return h.response({ message: "Pet type not found" }).code(404);
            }

            return h.response(ptype).code(200);
        } catch (error) {
            console.error("Error fetching ptype:", error);
            return h.response({ message: "Failed to fetch ptype" }).code(500);
        }
    },
};

//   Create ptype
const createPtype = {
    description: "Create new pet type",
    tags: ["api", "ptype"],
    auth: false,
    handler: async (request, h) => {
        try {
            const newPtype = await ptypeService.createPtype(request.payload);
            return h.response(newPtype).code(201);
        } catch (error) {
            console.error("Error creating pet type:", error);
            return h.response({ message: "Failed to create pet type" }).code(500);
        }
    },
};

//   Update pet type
const updatePtype = {
    description: "Update ptype by ptype_id",
    tags: ["api", "ptype"],
    auth: false,
    handler: async (request, h) => {
        const { type_id } = request.params;
        try {
            const updatePtype = await ptypeService.updatePtype(
                Number(type_id),
                request.payload
            );
            return h.response(updatePtype).code(200);
        } catch (error) {
            console.error("Error updating pet type:", error.message, error);
            return h.response({ message: "Failed to update pet type" }).code(500);
        }
    },
};

//   Delete pet type
const deletePtype = {
  description: "Delete pet type by type_id",
  tags: ["api", "ptype"],
  auth: false,
  handler: async (request, h) => {
    const { type_id } = request.params;
    try {
      const ptype = await ptypeService.getPtypeById(Number(type_id));

      if (!ptype) {
        return h.response({ message: "ptype not found" }).code(404);
      }
      await ptypeService.deletePtype(Number(type_id));
      return h.response({ message: "pet type deleted successfully" }).code(200);
    } catch (error) {
      console.error("Error deleting ptype:", error);
      return h.response({ message: "Failed to delete pet type" }).code(500);
    }
  },
};

module.exports = {
    getAllPtypes,
    getPtypeById,
    createPtype,
    updatePtype,
    deletePtype,
};