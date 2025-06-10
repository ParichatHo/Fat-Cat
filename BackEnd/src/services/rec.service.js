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
    // Validate required fields
    if (!data.pet_id) {
        throw new Error('pet_id is required');
    }
    if (!data.vet_id) {
        throw new Error('vet_id is required');
    }

    // Prepare the data for creation
    const createData = {
        pet_id: parseInt(data.pet_id),
        vet_id: parseInt(data.vet_id),
        visit_date: new Date(data.visit_date),
        symptoms: data.symptoms || '',
        diagnosis: data.diagnosis || '',
        treatment: data.treatment || '',
        medication: data.medication || '',
        notes: data.notes || '',
        appointment_date: data.appointment_date ? new Date(data.appointment_date) : null,
        status: data.status || null
    };

    // Create the medical record
    return await prisma.medicalRecords.create({ 
        data: createData,
        include: {
            pet: true,
            vet: {
                include: {
                    user: true
                }
            }
        }
    });
}

const updateRec = async (record_id, data) => {
    // Prepare update data, only include fields that are provided
    const updateData = {};
    
    if (data.pet_id !== undefined) updateData.pet_id = parseInt(data.pet_id);
    if (data.vet_id !== undefined) updateData.vet_id = parseInt(data.vet_id);
    if (data.visit_date !== undefined) updateData.visit_date = new Date(data.visit_date);
    if (data.symptoms !== undefined) updateData.symptoms = data.symptoms;
    if (data.diagnosis !== undefined) updateData.diagnosis = data.diagnosis;
    if (data.treatment !== undefined) updateData.treatment = data.treatment;
    if (data.medication !== undefined) updateData.medication = data.medication;
    if (data.notes !== undefined) updateData.notes = data.notes;
    if (data.appointment_date !== undefined) {
        updateData.appointment_date = data.appointment_date ? new Date(data.appointment_date) : null;
    }
    if (data.status !== undefined) updateData.status = data.status;

    return await prisma.medicalRecords.update({ 
        where: { record_id: Number(record_id) }, 
        data: updateData,
        include: {
            pet: true,
            vet: {
                include: {
                    user: true
                }
            }
        }
    });
}

// Fixed Delete Service with Transaction
const deleteRec = async (record_id) => {
    try {
        return await prisma.$transaction(async (tx) => {
            // Check if the record exists
            const existingRecord = await tx.medicalRecords.findUnique({
                where: { record_id: Number(record_id) }
            });

            if (!existingRecord) {
                throw new Error('Medical record not found');
            }

            // Delete the medical record
            const deletedRecord = await tx.medicalRecords.delete({
                where: { record_id: Number(record_id) }
            });

            return deletedRecord;
        });
    } catch (error) {
        console.error('Error in deleteRec service:', error);
        throw error; // Re-throw to be handled by the controller
    }
};

module.exports = {
    getAllRecs,
    getRecById,
    createRec,
    updateRec,
    deleteRec,
};