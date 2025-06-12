const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const bcrypt = require("bcrypt");
const cloudinary = require('../utils/cloudinary');
const SALT_ROUNDS = 10;

// Get user by email
const getUserByEmail = (email) => {
  return prisma.users.findUnique({ 
    where: { email },
    include: {
      veterinarian: true // Include veterinarian data if exists
    }
  });
};

// Compare password
const comparePassword = async (user, plainPassword) => {
  return bcrypt.compare(plainPassword, user.password);
};

// Get all users
const getAllUsers = async () => {
    return await prisma.users.findMany({
        include: {
            veterinarian: true // Include veterinarian data
        }
    });
};

// Get user by id
const getUserById = async (user_id) => {
    return await prisma.users.findUnique({ 
        where: { user_id: Number(user_id) },
        include: {
            veterinarian: true // Include veterinarian data
        }
    });
};

// Create user with veterinarian data if role is VETERINARIAN
const createUser = async (data, file) => {
    if (!data.password) {
        throw new Error("Password is required");
    }

    // Validate required fields
    const requiredFields = ['first_name', 'last_name', 'email', 'phone', 'role'];
    for (const field of requiredFields) {
        if (!data[field]) {
            throw new Error(`${field} is required`);
        }
    }

    // Validate role enum
    const validRoles = ['VETERINARIAN', 'STAFF', 'ADMIN'];
    if (!validRoles.includes(data.role)) {
        throw new Error(`Invalid role. Must be one of: ${validRoles.join(', ')}`);
    }

    // If role is VETERINARIAN, validate veterinarian required fields
    if (data.role === 'VETERINARIAN') {
        const vetRequiredFields = ['license_number'];
        for (const field of vetRequiredFields) {
            if (!data[field]) {
                throw new Error(`${field} is required for veterinarian`);
            }
        }

        // Check if license_number already exists
        const existingVet = await prisma.veterinarians.findUnique({
            where: { license_number: data.license_number }
        });
        if (existingVet) {
            throw new Error("License number already exists");
        }
    }

    // Check if email already exists
    const existingUser = await getUserByEmail(data.email);
    if (existingUser) {
        throw new Error("Email already exists");
    }

    const hashedPassword = await bcrypt.hash(data.password, SALT_ROUNDS);

    // Handle image upload
    let imageUrl = null;
    if (file && file.path) {
        try {
            const result = await cloudinary.uploader.upload(file.path, {
                folder: 'users',
                resource_type: 'image',
                transformation: [
                    { width: 800, height: 600, crop: 'limit' },
                    { quality: 'auto:good' }
                ]
            });
            imageUrl = result.secure_url;
            console.log('Image uploaded to Cloudinary:', result.secure_url);
        } catch (error) {
            console.error('Failed to upload image to Cloudinary:', error);
            throw new Error('Failed to upload image: ' + error.message);
        }
    }

    // Use transaction to ensure data integrity
    return await prisma.$transaction(async (tx) => {
        // Create user first
        const newUser = await tx.users.create({
            data: {
                first_name: data.first_name,
                last_name: data.last_name,
                email: data.email,
                password: hashedPassword,
                phone: data.phone,
                role: data.role,
                image_url: imageUrl,
            }
        });

        // If role is VETERINARIAN, create veterinarian record
        if (data.role === 'VETERINARIAN') {
            await tx.veterinarians.create({
                data: {
                    license_number: data.license_number,
                    experience: data.experience ? parseInt(data.experience) : null,
                    education: data.education || null,
                    user_id: newUser.user_id,
                }
            });
        }

        // Return user with veterinarian data
        return await tx.users.findUnique({
            where: { user_id: newUser.user_id },
            include: {
                veterinarian: true
            }
        });
    });
};

// Update user with image and veterinarian data
const updateUser = async (user_id, data, file, removeImage) => {
    const currentUser = await prisma.users.findUnique({
        where: { user_id: Number(user_id) },
        include: {
            veterinarian: true
        }
    });

    if (!currentUser) {
        throw new Error('User not found');
    }

    // Validate role enum if provided
    if (data.role) {
        const validRoles = ['VETERINARIAN', 'STAFF', 'ADMIN'];
        if (!validRoles.includes(data.role)) {
            throw new Error(`Invalid role. Must be one of: ${validRoles.join(', ')}`);
        }
    }

    // Check email uniqueness
    if (data.email && data.email !== currentUser.email) {
        const existingUser = await prisma.users.findUnique({
            where: { email: data.email }
        });
        if (existingUser) {
            throw new Error('Email is already in use');
        }
    }

    // Check license number uniqueness for VETERINARIAN role
    if (data.license_number && (data.role === 'VETERINARIAN' || currentUser.role === 'VETERINARIAN')) {
        const existingVet = await prisma.veterinarians.findUnique({
            where: { license_number: data.license_number }
        });
        if (existingVet && existingVet.user_id !== currentUser.user_id) {
            throw new Error('License number is already in use');
        }
    }

    let imageUrl = currentUser.image_url;

    // Handle image removal
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

    // Handle new image upload
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

    // Use transaction for data integrity
    return await prisma.$transaction(async (tx) => {
        // Update user data
        const updatedUser = await tx.users.update({
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

        // Handle veterinarian data
        const newRole = data.role || currentUser.role;
        
        if (newRole === 'VETERINARIAN') {
            // If changing to VETERINARIAN role or updating VETERINARIAN, handle veterinarian record
            if (currentUser.veterinarian) {
                // Update existing veterinarian record
                await tx.veterinarians.update({
                    where: { user_id: Number(user_id) },
                    data: {
                        license_number: data.license_number || currentUser.veterinarian.license_number,
                        experience: data.experience !== undefined ? (data.experience ? parseInt(data.experience) : null) : currentUser.veterinarian.experience,
                        education: data.education !== undefined ? data.education : currentUser.veterinarian.education,
                    }
                });
            } else {
                // Create new veterinarian record
                if (!data.license_number) {
                    throw new Error('License number is required for veterinarian role');
                }
                await tx.veterinarians.create({
                    data: {
                        license_number: data.license_number,
                        experience: data.experience ? parseInt(data.experience) : null,
                        education: data.education || null,
                        user_id: Number(user_id),
                    }
                });
            }
        } else if (currentUser.role === 'VETERINARIAN' && newRole !== 'VETERINARIAN') {
            // If changing from VETERINARIAN to STAFF/ADMIN, delete veterinarian record
            if (currentUser.veterinarian) {
                await tx.veterinarians.delete({
                    where: { user_id: Number(user_id) }
                });
            }
        }

        // Return updated user with veterinarian data
        return await tx.users.findUnique({
            where: { user_id: Number(user_id) },
            include: {
                veterinarian: true
            }
        });
    });
};

// Delete user
const deleteUser = async (user_id) => {
    // The veterinarian record will be automatically deleted due to onDelete: Cascade
    return await prisma.users.delete({ 
        where: { user_id: Number(user_id) } 
    });
};

const changePassword = async (user_id, newPassword) => {
    if (!newPassword) {
        throw new Error("New password is required");
    }

    if (newPassword.length < 6) {
        throw new Error("Password must be at least 6 characters long");
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, SALT_ROUNDS);

    // Update password in database
    const updatedUser = await prisma.users.update({
        where: { user_id: Number(user_id) },
        data: { 
            password: hashedPassword,
            updatedAt: new Date()
        }
    });

    return updatedUser;
};

module.exports = {
    getUserByEmail,
    comparePassword,
    getAllUsers,
    getUserById,
    createUser,
    updateUser,
    deleteUser,
    changePassword,
};