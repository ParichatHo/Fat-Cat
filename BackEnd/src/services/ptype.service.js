const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const getAllPtypes = async () => {
    return await prisma.petTypes.findMany();
};

const getPtypeById = async (type_id) => {
    return await prisma.petTypes.findUnique({ where: { type_id: Number(type_id) } });
}

const createPtype = async (data) => {
    return await prisma.petTypes.create({ data });
}

const updatePtype = async (type_id, data) => {
    return await prisma.petTypes.update({ where: { type_id: Number(type_id) }, data });
}

const deletePtype = async (type_id) => {
    return await prisma.petTypes.delete({ where: {type_id: Number(type_id)} });
}


module.exports = {
    getAllPtypes,
    getPtypeById,
    createPtype,
    updatePtype,
    deletePtype,
};