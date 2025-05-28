const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const getAllUsers = async () => {
    return await prisma.users.findMany();
};

const getUserById = async (user_id) => {
    return await prisma.users.findUnique({ where: { user_id: Number(user_id) } });
}

const createUser = async (data) => {
    return await prisma.users.create({ data });
}

const updateUser = async (user_id, data) => {
    return await prisma.users.update({ where: { user_id: Number(user_id) }, data });
}

const deleteUser = async (user_id) => {
    return await prisma.users.delete({ where: {user_id: Number(user_id)} });
}

module.exports = {
    getAllUsers,
    getUserById,
    createUser,
    updateUser,
    deleteUser,
};