import jwt from 'jsonwebtoken';
import prisma from '../lib/prisma.js';
import { sendError } from '../utils/httpResponses.js';

export const authenticate = async (req, res, next) => {
  try {
    const token = req.cookies.accessToken || req.headers.authorization?.split(' ')[1];

    if (!token) {
      return sendError(res, 401, 'Authentication required');
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret');
    
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: { id: true, email: true, name: true }
    });

    if (!user) {
      return sendError(res, 401, 'User not found');
    }

    req.user = user;
    next();
  } catch (error) {
    return sendError(res, 401, 'Invalid or expired token');
  }
};
