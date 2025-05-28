const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const getAllPets = async () => {
    return await prisma.pets.findMany();
};

const getPetById = async (pet_id) => {
    return await prisma.pets.findUnique({ where: { pet_id: Number(pet_id) } });
}

const createPet = async (data) => {
    return await prisma.pets.create({ data });
}

const updatePet = async (pet_id, data) => {
    return await prisma.pets.update({ where: { pet_id: Number(pet_id) }, data });
}

const deletePet = async (pet_id) => {
    return await prisma.pets.delete({ where: {pet_id: Number(pet_id)} });
}

module.exports = {
    getAllPets,
    getPetById,
    createPet,
    updatePet,
    deletePet,
};