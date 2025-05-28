const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const bcrypt = require("bcrypt");
const SALT_ROUNDS = 10;

const getUserByEmail = (email) => {
  return prisma.users.findUnique({ where: { email } });
};

const comparePassword = async (user, plainPassword) => {
  return bcrypt.compare(plainPassword, user.password);
};

const getAllUsers = async () => {
    return await prisma.users.findMany();
};

const getUserById = async (user_id) => {
    return await prisma.users.findUnique({ where: { user_id: Number(user_id) } });
}

const createUser = async (data) => {
    const hashedPassword = await bcrypt.hash(data.password, SALT_ROUNDS);
  
    const createData = {
      first_name: data.first_name,
      last_name: data.last_name,
      email: data.email,
      password: hashedPassword,
      phone: data.phone,
      role: data.role || 'USER',
    };
  
    const users = await prisma.users.create({ data: createData });
  
    return {
      id: users.id,
      firstName: users.first_name,
      lastName: users.last_name,
      email: users.email,
      phone: users.phone
    };
  };

const updateUser = async (user_id, data) => {
    return await prisma.users.update({ where: { user_id: Number(user_id) }, data });
}

const deleteUser = async (user_id) => {
    return await prisma.users.delete({ where: {user_id: Number(user_id)} });
}

module.exports = {
    getUserByEmail,
    comparePassword,
    getAllUsers,
    getUserById,
    createUser,
    updateUser,
    deleteUser,
};