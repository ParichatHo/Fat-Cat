const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const getAllRecs = async () => {
    return await prisma.medicalRecords.findMany({
        include: {
            pet: true,          // รวมข้อมูล pet
            vet: {              // รวมข้อมูล veterinarian
                include: {
                    user: true      // รวมข้อมูล user ที่เชื่อมโยงกับ veterinarian
                }
            }
        }
    });
};



const getRecById = async (record_id) => {
    return await prisma.medicalRecords.findUnique({ 
        where: { record_id: Number(record_id) },
        include: {
            pet: {
                include: {
                    owner: true     
                }
            },
            vet: {             
                include: {
                    user: true      
                }
            }
        }
    });
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