const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const getAllOwners = async () => {
    return await prisma.owners.findMany();
};

const getOwnerById = async (owner_id) => {
    return await prisma.owners.findUnique({ where: { owner_id: Number(owner_id) } });
}

const createOwner = async (data) => {
    return await prisma.owners.create({ data });
}

const updateOwner = async (owner_id, data) => {
    return await prisma.owners.update({ where: { owner_id: Number(owner_id) }, data });
}

const deleteOwner = async (owner_id) => {
    return await prisma.owners.delete({ where: {owner_id: Number(owner_id)} });
}

module.exports = {
    getAllOwners,
    getOwnerById,
    createOwner,
    updateOwner,
    deleteOwner,
};