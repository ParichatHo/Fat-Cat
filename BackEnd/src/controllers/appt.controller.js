const ApptService = require("../services/appt.service");

// Get all Appt
const getAllAppts = {
    description: "Get list of all Appt",
    tags: ["api", "Appt"],
    auth: false,
    handler: async (Request, h) => {
        try {
            const Appt = await ApptService.getAllAppts();
            return h.response(Appt).code(200);
        } catch (error) {
            console.error("Error fetching Appt:", error);
            return h.response({ message: "Failed to fetch Appt" }).code(500);
        }
    },
};

// GetById Appt
const getApptById = {
    description: "Get list of all Appt",
    tags: ["api", "Appt"],
    auth: false,
    handler: async (request, h) => {
        const { appt_id } = request.params;
        try {
            const appt = await ApptService.getApptById(Number(appt_id));

            if (!appt) {
                return h.response({ message: "Appt not found" }).code(404);
            }

            return h.response(appt).code(200);
        } catch (error) {
            console.error("Error fetching Appt:", error);
            return h.response({ message: "Failed to fetch Appt" }).code(500);
        }
    },
};

//   Create Appt
const createAppt = {
    description: "Create new Appt",
    tags: ["api", "Appt"],
    auth: false,
    handler: async (request, h) => {
        try {
            const newAppt = await ApptService.createAppt(request.payload);
            return h.response(newAppt).code(201);
        } catch (error) {
            console.error("Error creating Appt:", error);
            return h.response({ message: "Failed to create Appt" }).code(500);
        }
    },
};

//   Update Appt
const updateAppt = {
    description: "Update Appt by Appt_id",
    tags: ["api", "Appt"],
    auth: false,
    handler: async (request, h) => {
        const { appt_id } = request.params;
        try {
            const updateAppt = await ApptService.updateAppt(
                Number(appt_id),
                request.payload
            );
            return h.response(updateAppt).code(200);
        } catch (error) {
            console.error("Error updating Appt:", error.message, error);
            return h.response({ message: "Failed to update Appt" }).code(500);
        }
    },
};

//   Delete Appt
const deleteAppt = {
  description: "Delete Appt by Appt_id",
  tags: ["api", "Appt"],
  auth: false,
  handler: async (request, h) => {
    const { appt_id } = request.params;
    try {
      const appt = await ApptService.getApptById(Number(appt_id));

      if (!appt) {
        return h.response({ message: "Appt not found" }).code(404);
      }
      await ApptService.deleteAppt(Number(appt_id));
      return h.response({ message: "Appt deleted successfully" }).code(200);
    } catch (error) {
      console.error("Error deleting Appt:", error);
      return h.response({ message: "Failed to delete Appt" }).code(500);
    }
  },
};

module.exports = {
    getAllAppts,
    getApptById,
    createAppt,
    updateAppt,
    deleteAppt,
};