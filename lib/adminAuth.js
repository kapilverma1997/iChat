import { getAuthenticatedUser } from './auth.js';
import User from '../models/User.js';

// Check if user has admin role
export async function isAdmin(userId) {
  try {
    const user = await User.findById(userId);
    if (!user) return false;
    
    // Check if user has admin role (you can add a role field to User model)
    // For now, we'll check if email contains 'admin' or you can add a role field
    return user.email?.includes('admin') || user.role === 'admin' || user.role === 'owner';
  } catch (error) {
    console.error('Error checking admin status:', error);
    return false;
  }
}

// Check if user has specific permission
export async function hasPermission(userId, permission) {
  try {
    const user = await User.findById(userId);
    if (!user) return false;
    
    // Owner has all permissions
    if (user.role === 'owner') return true;
    
    // Admin has most permissions
    if (user.role === 'admin') {
      const adminRestrictions = ['delete_organization', 'change_owner'];
      return !adminRestrictions.includes(permission);
    }
    
    // Check role-based permissions
    const rolePermissions = {
      moderator: ['edit_group_info', 'delete_message', 'remove_user'],
      employee: ['upload_files', 'create_group'],
      guest: ['view_messages'],
      'read-only': ['view_messages'],
    };
    
    const permissions = rolePermissions[user.role] || [];
    return permissions.includes(permission);
  } catch (error) {
    console.error('Error checking permission:', error);
    return false;
  }
}

// Middleware to check admin access
export async function requireAdmin(request) {
  const user = await getAuthenticatedUser(request);
  if (!user) {
    return { error: 'Unauthorized', status: 401 };
  }
  
  const admin = await isAdmin(user._id);
  if (!admin) {
    return { error: 'Admin access required', status: 403 };
  }
  
  return { user, admin: true };
}

// Get client IP and user agent
export function getClientInfo(request) {
  return {
    ipAddress: request.headers.get('x-forwarded-for')?.split(',')[0] || 
               request.headers.get('x-real-ip') || 
               'unknown',
    userAgent: request.headers.get('user-agent') || 'unknown',
  };
}

