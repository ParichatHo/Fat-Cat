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
    description: "Create new pet",
    tags: ["api", "pets"],
    auth: false,
    plugins: {
        'hapi-swagger': {
            consumes: ['multipart/form-data'],
        },
    },
    payload: {
        maxBytes: 10 * 1024 * 1024, // จำกัดขนาดไฟล์ 10MB
        parse: true,
        output: 'file', // รับไฟล์
        multipart: true, // เปิดใช้งาน multipart
    },
    handler: async (request, h) => {
        try {
            const { payload } = request;
            const file = payload.image_file; // ชื่อ field ที่ส่งไฟล์
            const newPet = await petService.createPet(payload, file);
            return h.response(newPet).code(201);
        } catch (error) {
            console.error("Error creating pet:", error);
            return h.response({ message: error.message || "Failed to create pet" }).code(500);
        }
    },
};

//   Update pets
const updatePet = {
    description: "Update pet by pet_id",
    tags: ["api", "pets"],
    auth: 'jwt',
    plugins: {
        'hapi-swagger': {
            consumes: ['multipart/form-data'],
        },
    },
    payload: {
        maxBytes: 5 * 1024 * 1024,
        parse: true,
        output: 'file',
        multipart: true,
    },
    handler: async (request, h) => {
        const { pet_id } = request.params;
        try {
            const { payload } = request;
            console.log('Payload received:', payload); // Debug log

            const file = payload.image_file;
            const removeImage = payload.remove_image === 'true';

            // Validate file if provided
            if (file && file.path) {
                const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'];
                if (!validTypes.includes(file.headers['content-type'])) {
                    return h.response({
                        message: 'Invalid file type. Only JPEG, JPG, PNG, WebP are allowed'
                    }).code(400);
                }
                if (file._data && file._data.length > 5 * 1024 * 1024) {
                    return h.response({
                        message: 'File size exceeds 5MB limit'
                    }).code(400);
                }
            }

            console.log('File info:', file ? {
                filename: file.filename,
                contentType: file.headers['content-type'],
                path: file.path
            } : 'No file');

            const updatedPet = await petService.updatePet(Number(pet_id), payload, file, removeImage);

            return h.response({
                message: 'Pet updated successfully',
                data: updatedPet
            }).code(200);
        } catch (error) {
            console.error("Error updating pet:", error);
            return h.response({
                message: error.message || "Failed to update pet",
                error: error.stack // เพิ่ม stack trace สำหรับ debug
            }).code(500);
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