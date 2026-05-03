import prisma from '../lib/prisma.js';
import cloudinary from '../lib/cloudinary.js';
import { sendError } from '../utils/httpResponses.js';

export const getMe = async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: { id: true, name: true, email: true, avatarUrl: true, createdAt: true }
    });
    res.json(user);
  } catch (error) {
    next(error);
  }
};

export const updateMe = async (req, res, next) => {
  try {
    const { name } = req.body;
    const user = await prisma.user.update({
      where: { id: req.user.id },
      data: { name },
      select: { id: true, name: true, email: true, avatarUrl: true }
    });
    res.json(user);
  } catch (error) {
    next(error);
  }
};

export const uploadAvatar = async (req, res, next) => {
  try {
    if (!req.file) return sendError(res, 400, 'No file uploaded');

    // Upload to Cloudinary using buffer
    const result = await new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        { folder: 'avatars' },
        (error, result) => {
          if (error) reject(error);
          else resolve(result);
        }
      );
      uploadStream.end(req.file.buffer);
    });

    const user = await prisma.user.update({
      where: { id: req.user.id },
      data: { avatarUrl: result.secure_url },
      select: { id: true, name: true, email: true, avatarUrl: true }
    });

    res.json(user);
  } catch (error) {
    next(error);
  }
};
