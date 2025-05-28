const {
  createProjectSchema,
  updateProjectSchema,
} = require("../validations/project.validation");

const { z } = require("zod");
const projectService = require("../services/project.service");

const idParamSchema = z.object({
  pId: z.string().regex(/^\d+$/, "Invalid ID format"),
});

const validateZod = (schema) => async (value, options) => {
  try {
    await schema.parseAsync(value); // Validate with Zod
  } catch (err) {
    throw new Error(
      `Validation error: ${err.errors.map((e) => e.message).join(", ")}`
    );
  }
};

// Get all Project
const getAllProject = {
  description: "Get list of all project",
  tags: ["api", "project"],
  auth: false,
  handler: async (request, h) => {
    try {
      const project = await projectService.getAllProject();
      return h.response(project).code(200);
    } catch (error) {
      console.error("Error fetching project:", error);
      return h.response({ message: "Failed to fetch project" }).code(500);
    }
  },
};

//GetById project
const getProjectById = {
  description: "Get list of all project",
  tags: ["api", "project"],
  auth: false,
  validate: {
    params: validateZod(idParamSchema),
  },
  handler: async (request, h) => {
    const { pId } = request.params;
    try {
      const project = await projectService.getProjectById(Number(pId));

      if (!project) {
        return h.response({ message: "Project not found" }).code(404);
      }

      return h.response(project).code(200);
    } catch (error) {
      console.error("Error fetching project:", error);
      return h.response({ message: "Failed to fetch project" }).code(500);
    }
  },
};

// Create project
const createProject = {
  description: "Create new Project",
  tags: ["api", "project"],
  auth: false,
  validate: {
    payload: validateZod(createProjectSchema),
  },
  handler: async (request, h) => {
    try {
      const newProject = await projectService.createProject(request.payload);
      return h.response(newProject).code(201);
    } catch (error) {
      console.error("Error creating project:", error);
      return h.response({ message: "Failed to create project" }).code(500);
    }
  },
};

//update Project
const updateProject = {
  description: "Update project by pId",
  tags: ["api", "project"],
  auth: false,
  validate: {
    params: validateZod(idParamSchema),
    payload: validateZod(updateProjectSchema),
  },
  handler: async (request, h) => {
    const { pId } = request.params;
    try {
      const updatedProject = await projectService.updateProject(
        Number(pId),
        request.payload
      );
      return h.response(updatedProject).code(200);
    } catch (error) {
      console.error("Error updating project:", error.message, error);
      return h.response({ message: "Failed to update project" }).code(500);
    }
  },
};

// Delete project
const deleteProject = {
  description: "Delete project by pId",
  tags: ["api", "project"],
  auth: false,
  validate: {
    params: validateZod(idParamSchema),
  },
  handler: async (request, h) => {
    const { pId } = request.params;
    try {
      const project = await projectService.getProjectById(Number(pId));

      if (!project) {
        return h.response({ message: "Project not found" }).code(404);
      }
      await projectService.deleteProject(Number(pId));
      return h.response({ message: "Project deleted successfully" }).code(200);
    } catch (error) {
      console.error("Error deleting project:", error);
      return h.response({ message: "Failed to delete project" }).code(500);
    }
  },
};

module.exports = {
  getAllProject,
  getProjectById,
  createProject,
  updateProject,
  deleteProject,
};