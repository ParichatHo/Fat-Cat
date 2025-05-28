const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const getAllAppts = async () => {
    return await prisma.appointments.findMany();
};

const getApptById = async (appointment_id) => {
    return await prisma.appointments.findUnique({ where: { appointment_id: Number(appointment_id) } });
}

const createAppt = async (data) => {
    return await prisma.appointments.create({ data });
}

const updateAppt = async (appointment_id, data) => {
    return await prisma.appointments.update({ where: { appointment_id: Number(appointment_id) }, data });
}

const deleteAppt = async (appointment_id) => {
    return await prisma.appointments.delete({ where: {appointment_id: Number(appointment_id)} });
}

module.exports = {
    getAllAppts,
    getApptById,
    createAppt,
    updateAppt,
    deleteAppt,
};