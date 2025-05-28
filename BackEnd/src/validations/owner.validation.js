const { z } = require('zod');

const createOwnerSchema = z.object({
  first_name: z.string().min(1, "Name is required"),
  last_name: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email format")
});

const updateOwnerSchema = z.object({
  first_name: z.string().optional(),
  last_name: z.string().optional(),
  email: z.string().email("Invalid email format").optional()
});

module.exports = {
  createOwnerSchema,
  updateOwnerSchema,
};