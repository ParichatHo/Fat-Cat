const ownerService = require("../services/owner.service");

// Get all Owner
const getAllOwners = {
    description: "Get list of all owner",
    tags: ["api", "owner"],
    auth: false,
    handler: async (Request, h) => {
        try {
            const owner = await ownerService.getAllOwners();
            return h.response(owner).code(200);
        } catch (error) {
            console.error("Error fetching owner:", error);
            return h.response({ message: "Failed to fetch owner" }).code(500);
        }
    },
};

// GetById owner
const getOwnerById = {
    description: "Get list of all owner",
    tags: ["api", "owner"],
    auth: false,
    handler: async (request, h) => {
        const { owner_id } = request.params;
        try {
            const owner = await ownerService.getOwnerById(Number(owner_id));

            if (!owner) {
                return h.response({ message: "Owner not found" }).code(404);
            }

            return h.response(owner).code(200);
        } catch (error) {
            console.error("Error fetching owner:", error);
            return h.response({ message: "Failed to fetch owner" }).code(500);
        }
    },
};

//   Create owner
const createOwner = {
    description: "Create new Owner",
    tags: ["api", "owner"],
    auth: false,
    handler: async (request, h) => {
        try {
            const newOwner = await ownerService.createOwner(request.payload);
            return h.response(newOwner).code(201);
        } catch (error) {
            console.error("Error creating owner:", error);
            return h.response({ message: "Failed to create owner" }).code(500);
        }
    },
};

//   Update Owner
const updateOwner = {
    description: "Update owner by owner_id",
    tags: ["api", "owner"],
    auth: false,
    handler: async (request, h) => {
        const { owner_id } = request.params;
        try {
            const updateOwner = await ownerService.updateOwner(
                Number(owner_id),
                request.payload
            );
            return h.response(updateOwner).code(200);
        } catch (error) {
            console.error("Error updating owner:", error.message, error);
            return h.response({ message: "Failed to update owner" }).code(500);
        }
    },
};

//   Delete owner
const deleteOwner = {
  description: "Delete owner by owner_id",
  tags: ["api", "owner"],
  auth: false,
  handler: async (request, h) => {
    const { owner_id } = request.params;
    try {
      const owner = await ownerService.getOwnerById(Number(owner_id));

      if (!owner) {
        return h.response({ message: "Owner not found" }).code(404);
      }
      await ownerService.deleteOwner(Number(owner_id));
      return h.response({ message: "Owner deleted successfully" }).code(200);
    } catch (error) {
      console.error("Error deleting owner:", error);
      return h.response({ message: "Failed to delete owner" }).code(500);
    }
  },
};

module.exports = {
    getAllOwners,
    getOwnerById,
    createOwner,
    updateOwner,
    deleteOwner,
};