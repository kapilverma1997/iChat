import mongoose, { Schema } from 'mongoose';

const AuditLogSchema = new Schema(
  {
    action: {
      type: String,
      required: true,
      index: true,
    },
    category: {
      type: String,
      enum: ['login', 'logout', 'role_change', 'message_delete', 'file_delete', 'user_remove', 'setting_update', 'user_create', 'user_update', 'user_deactivate', 'chat_archive', 'announcement_create', 'broadcast_send'],
      required: true,
      index: true,
    },
    adminUserId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    targetUserId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    targetResourceId: {
      type: Schema.Types.ObjectId,
    },
    targetResourceType: {
      type: String,
      enum: ['user', 'chat', 'group', 'message', 'file', 'announcement', 'broadcast', 'settings'],
    },
    oldValue: {
      type: Schema.Types.Mixed,
    },
    newValue: {
      type: Schema.Types.Mixed,
    },
    ipAddress: {
      type: String,
    },
    userAgent: {
      type: String,
    },
    browser: {
      type: String,
    },
    os: {
      type: String,
    },
    location: {
      country: String,
      region: String,
      city: String,
    },
    details: {
      type: Schema.Types.Mixed,
    },
  },
  {
    timestamps: true,
  }
);

AuditLogSchema.index({ adminUserId: 1, createdAt: -1 });
AuditLogSchema.index({ category: 1, createdAt: -1 });
AuditLogSchema.index({ action: 1, createdAt: -1 });
AuditLogSchema.index({ createdAt: -1 });

const AuditLog = mongoose.models.AuditLog || mongoose.model('AuditLog', AuditLogSchema);

export default AuditLog;

