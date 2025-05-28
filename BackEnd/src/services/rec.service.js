const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const getAllRecs = async () => {
    return await prisma.medicalRecords.findMany();
};

const getRecById = async (record_id) => {
    return await prisma.medicalRecords.findUnique({ where: { record_id: Number(record_id) } });
}

const createRec = async (data) => {
    return await prisma.medicalRecords.create({ data });
}

const updateRec = async (record_id, data) => {
    return await prisma.medicalRecords.update({ where: { record_id: Number(record_id) }, data });
}

const deleteRec = async (record_id) => {
    // ลบ appointments ที่เกี่ยวข้องก่อน
    await prisma.appointments.deleteMany({
        where: { record_id: Number(record_id) }
    });

    // ลบ medicalRecords หลังจากลบ appointments แล้ว
    return await prisma.medicalRecords.delete({
        where: { record_id: Number(record_id) }
    });
};


module.exports = {
    getAllRecs,
    getRecById,
    createRec,
    updateRec,
    deleteRec,
};