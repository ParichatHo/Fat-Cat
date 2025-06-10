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
            // Validate required fields
            const { pet_id, vet_id, visit_date } = request.payload;

            if (!pet_id) {
                return h.response({ message: "Pet ID is required" }).code(400);
            }
            if (!vet_id) {
                return h.response({ message: "Veterinarian ID is required" }).code(400);
            }
            if (!visit_date) {
                return h.response({ message: "Visit date is required" }).code(400);
            }

            console.log('Creating medical record with payload:', request.payload);

            const newRec = await RecService.createRec(request.payload);
            return h.response(newRec).code(201);
        } catch (error) {
            console.error("Error creating Rec:", error);

            // Handle specific Prisma errors
            if (error.code === 'P2002') {
                return h.response({ message: "A record with this data already exists" }).code(409);
            }
            if (error.code === 'P2003') {
                return h.response({ message: "Referenced pet or veterinarian does not exist" }).code(400);
            }

            return h.response({
                message: error.message || "Failed to create medical record",
                error: process.env.NODE_ENV === 'development' ? error.message : undefined
            }).code(500);
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
// Fixed Delete Rec Handler
const deleteRec = {
    description: "Delete Rec by record_id",
    tags: ["api", "Rec"],
    auth: {
        strategy: "jwt",
        scope: ["VETERINARIAN"], // Add proper authentication
    },
    handler: async (request, h) => {
        const { record_id } = request.params;

        // Validate record_id
        if (!record_id || isNaN(Number(record_id))) {
            return h.response({ message: "Invalid record ID" }).code(400);
        }

        try {
            const rec = await RecService.getRecById(Number(record_id));

            if (!rec) {
                return h.response({ message: "Medical record not found" }).code(404);
            }

            await RecService.deleteRec(Number(record_id));
            return h.response({ message: "Medical record deleted successfully" }).code(200);
        } catch (error) {
            console.error("Error deleting medical record:", error.message, error);

            // Provide more specific error messages
            if (error.code === 'P2003') {
                return h.response({
                    message: "Cannot delete record: it has related appointments or other dependencies"
                }).code(409);
            }

            return h.response({
                message: "Failed to delete medical record",
                error: process.env.NODE_ENV === 'development' ? error.message : undefined
            }).code(500);
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