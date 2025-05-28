const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const getAllVets = async () => {
    return await prisma.veterinarians.findMany();
};

const getVetById = async (vet_id) => {
    return await prisma.veterinarians.findUnique({ where: { vet_id: Number(vet_id) } });
}

const createVet = async (data) => {
    return await prisma.veterinarians.create({ data });
}

const updateVet = async (vet_id, data) => {
    return await prisma.veterinarians.update({ where: { vet_id: Number(vet_id) }, data });
}

const deleteVet = async (vet_id) => {
    return await prisma.veterinarians.delete({ where: {vet_id: Number(vet_id)} });
}


module.exports = {
    getAllVets,
    getVetById,
    createVet,
    updateVet,
    deleteVet,
};