const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const getAllProject = async () => {
  return await prisma.project.findMany();
};

const getProjectById = async (pId) => {
    return await prisma.project.findUnique({where: {pId :Number(pId)} });
}

const createProject = async (data) => {
    return await prisma.project.create({data});
}

const updateProject = async (pId,data) => {
    return await prisma.project.update({ where: { pId: Number(pId)} ,data});
}

const deleteProject = async (pId) => {
    return await prisma.project.delete({ where: {pId: Number(pId)} });
}

module.exports = {
  getAllProject,
  getProjectById,
  createProject,
  updateProject,
  deleteProject,
};