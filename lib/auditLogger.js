import AuditLog from '../models/AuditLog.js';
import { getClientInfo } from './adminAuth.js';

// Create audit log entry
export async function logAudit({
  action,
  category,
  adminUserId,
  targetUserId,
  targetResourceId,
  targetResourceType,
  oldValue,
  newValue,
  request,
  details,
}) {
  try {
    const clientInfo = request ? getClientInfo(request) : {};
    
    await AuditLog.create({
      action,
      category,
      adminUserId,
      targetUserId,
      targetResourceId,
      targetResourceType,
      oldValue,
      newValue,
      ipAddress: clientInfo.ipAddress,
      userAgent: clientInfo.userAgent,
      details: details || {},
    });
  } catch (error) {
    console.error('Error creating audit log:', error);
  }
}

