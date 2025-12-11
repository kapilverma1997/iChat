import mongoose, { Schema } from 'mongoose';

const AdminSettingsSchema = new Schema(
  {
    organizationName: {
      type: String,
      default: 'My Organization',
    },
    organizationLogo: {
      type: String,
      default: '',
    },
    autoArchiveDays: {
      type: Number,
      default: 30,
    },
    maxStoragePerUser: {
      type: Number, // in MB
      default: 1000,
    },
    allowGuestUsers: {
      type: Boolean,
      default: false,
    },
    requireEmailVerification: {
      type: Boolean,
      default: true,
    },
    allowFileUploads: {
      type: Boolean,
      default: true,
    },
    maxFileSize: {
      type: Number, // in MB
      default: 50,
    },
    allowedFileTypes: [String],
    maintenanceMode: {
      type: Boolean,
      default: false,
    },
    maintenanceMessage: {
      type: String,
      default: 'System is under maintenance',
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

const AdminSettings = mongoose.models.AdminSettings || mongoose.model('AdminSettings', AdminSettingsSchema);

export default AdminSettings;

