const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const cloudinary = require('../utils/cloudinary');

const getAllPets = async () => {
  return await prisma.pets.findMany({
    include: {
      owner: true, // หรือถ้า relation ชื่ออื่นต้องแก้ตามจริง เช่น owner หรือ owner_info
      type: true
    }
  });
};

const getPetById = async (pet_id) => {
  return await prisma.pets.findUnique({
    where: { pet_id: Number(pet_id) },
    include: {
      owner: true,
      type: true
    }
  });
}

const createPet = async (data, file) => {
  let imageUrl = null;

  // อัปโหลดรูปภาพไป Cloudinary หากมีไฟล์
  if (file) {
      try {
          const result = await cloudinary.uploader.upload(file.path, {
              folder: 'pets', // กำหนดโฟลเดอร์ใน Cloudinary
              resource_type: 'image',
          });
          imageUrl = result.secure_url;
      } catch (error) {
          throw new Error('Failed to upload image to Cloudinary: ' + error.message);
      }
  }

  // สร้างข้อมูลสัตว์เลี้ยง
  return await prisma.pets.create({
      data: {
          pet_name: data.pet_name,
          birth_date: new Date(data.birth_date),
          breed_name: data.breed_name,
          gender: data.gender,
          owner_id: Number(data.owner_id),
          type_id: Number(data.type_id),
          image_url: imageUrl,
          weight: parseFloat(data.weight),
      },
  });
};

const updatePet = async (pet_id, data, file, removeImage) => {
  // ดึงข้อมูลสัตว์เลี้ยงปัจจุบันก่อน
  const currentPet = await prisma.pets.findUnique({
    where: { pet_id: Number(pet_id) }
  });

  if (!currentPet) {
    throw new Error('Pet not found');
  }

  let imageUrl = currentPet.image_url; // เก็บ URL เดิมไว้

  // ถ้าต้องการลบรูปภาพ
  if (removeImage) {
    // ลบรูปเก่าจาก Cloudinary ถ้ามี
    if (currentPet.image_url) {
      try {
        // Extract public_id from Cloudinary URL
        const urlParts = currentPet.image_url.split('/');
        const publicIdWithExtension = urlParts[urlParts.length - 1];
        const publicId = `pets/${publicIdWithExtension.split('.')[0]}`;
        await cloudinary.uploader.destroy(publicId);
      } catch (error) {
        console.error('Error deleting old image from Cloudinary:', error);
      }
    }
    imageUrl = null;
  } 
  // ถ้ามีไฟล์ใหม่
  else if (file && file.path) {
    try {
      // ลบรูปเก่าจาก Cloudinary ถ้ามี
      if (currentPet.image_url) {
        try {
          const urlParts = currentPet.image_url.split('/');
          const publicIdWithExtension = urlParts[urlParts.length - 1];
          const publicId = `pets/${publicIdWithExtension.split('.')[0]}`;
          await cloudinary.uploader.destroy(publicId);
        } catch (error) {
          console.error('Error deleting old image from Cloudinary:', error);
        }
      }

      // อัปโหลดรูปใหม่
      const result = await cloudinary.uploader.upload(file.path, {
        folder: 'pets',
        resource_type: 'image',
        transformation: [
          { width: 800, height: 600, crop: 'limit' },
          { quality: 'auto:good' }
        ]
      });
      imageUrl = result.secure_url;
    } catch (error) {
      throw new Error('Failed to upload image to Cloudinary: ' + error.message);
    }
  }

  // อัปเดตข้อมูลในฐานข้อมูล
  const updatedPet = await prisma.pets.update({
    where: { pet_id: Number(pet_id) },
    data: {
      pet_name: data.pet_name,
      birth_date: new Date(data.birth_date),
      breed_name: data.breed_name,
      gender: data.gender,
      owner_id: Number(data.owner_id),
      type_id: Number(data.type_id),
      image_url: imageUrl,
      weight: parseFloat(data.weight),
    },
    include: {
      owner: true,
      type: true
    }
  });

  return updatedPet;
};

const deletePet = async (pet_id) => {
  return await prisma.pets.delete({ where: { pet_id: Number(pet_id) } });
}

module.exports = {
  getAllPets,
  getPetById,
  createPet,
  updatePet,
  deletePet,
};