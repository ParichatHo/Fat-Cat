const { z } = require('zod');

const createProjectSchema = z.object({
  pName: z.string().min(1, "Name is required"),
});

const updateProjectSchema = z.object({
  pName: z.string().optional(),
});


module.exports = {
  createProjectSchema,
  updateProjectSchema,
};