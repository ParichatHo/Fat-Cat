const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const bcrypt = require("bcrypt");
const cloudinary = require('../utils/cloudinary');  // Ensure Cloudinary utility is set up
const SALT_ROUNDS = 10;

// Get user by email
const getUserByEmail = (email) => {
  return prisma.users.findUnique({ where: { email } });
};

// Compare password
const comparePassword = async (user, plainPassword) => {
  return bcrypt.compare(plainPassword, user.password);
};

// Get all users
const getAllUsers = async () => {
    return await prisma.users.findMany();
};

// Get user by id
const getUserById = async (user_id) => {
    return await prisma.users.findUnique({ where: { user_id: Number(user_id) } });
}

// Create user with image
const createUser = async (data) => {
    if (!data.password) {
        throw new Error("Password is required");
    }

    const hashedPassword = await bcrypt.hash(data.password, SALT_ROUNDS);

    return await prisma.users.create({
        data: {
            ...data,
            password: hashedPassword,
        }
    });
};


// Update user with image
const updateUser = async (user_id, data, file, removeImage) => {
  const currentUser = await prisma.users.findUnique({
      where: { user_id: Number(user_id) }
  });

  if (!currentUser) {
      throw new Error('User not found');
  }

  // ตรวจสอบ email ซ้ำ
  if (data.email && data.email !== currentUser.email) {
      const existingUser = await prisma.users.findUnique({
          where: { email: data.email }
      });
      if (existingUser) {
          throw new Error('Email is already in use');
      }
  }

  let imageUrl = currentUser.image_url;

  if (removeImage) {
      if (currentUser.image_url) {
          try {
              const urlParts = currentUser.image_url.split('/');
              const publicIdWithExtension = urlParts[urlParts.length - 1];
              const publicId = `users/${publicIdWithExtension.split('.')[0]}`;
              await cloudinary.uploader.destroy(publicId);
          } catch (error) {
              console.error('Error deleting old image from Cloudinary:', error);
          }
      }
      imageUrl = null;
  }

  if (file && file.path) {
      try {
          if (currentUser.image_url) {
              const urlParts = currentUser.image_url.split('/');
              const publicIdWithExtension = urlParts[urlParts.length - 1];
              const publicId = `users/${publicIdWithExtension.split('.')[0]}`;
              await cloudinary.uploader.destroy(publicId);
          }

          const result = await cloudinary.uploader.upload(file.path, {
              folder: 'users',
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

  const updatedUser = await prisma.users.update({
      where: { user_id: Number(user_id) },
      data: {
          first_name: data.first_name || currentUser.first_name,
          last_name: data.last_name || currentUser.last_name,
          email: data.email || currentUser.email,
          phone: data.phone || currentUser.phone,
          role: data.role || currentUser.role,
          image_url: imageUrl,
      }
  });

  return updatedUser;
};

// Delete user
const deleteUser = async (user_id) => {
    return await prisma.users.delete({ where: { user_id: Number(user_id) } });
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
