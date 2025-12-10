import { verifyAccessToken } from './utils.js';
import User from '../models/User.js';

export async function getAuthenticatedUser(request) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return null;
    }

    const token = authHeader.split(' ')[1];
    const decoded = verifyAccessToken(token);

    if (!decoded || !decoded.userId) {
      return null;
    }

    const user = await User.findById(decoded.userId).select('-passwordHash');
    return user;
  } catch (error) {
    console.error('Auth error:', error);
    return null;
  }
}
