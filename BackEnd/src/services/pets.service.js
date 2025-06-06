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
  let imageUrl = data.image_url || null;

  if (removeImage) {
      imageUrl = null; // ลบรูปภาพโดยตั้ง image_url เป็น null
  } else if (file) {
      try {
          const result = await cloudinary.uploader.upload(file.path, {
              folder: 'pets',
              resource_type: 'image',
          });
          imageUrl = result.secure_url;
      } catch (error) {
          throw new Error('Failed to upload image to Cloudinary: ' + error.message);
      }
  }

  return await prisma.pets.update({
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
  });
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