import mongoose, { Schema } from 'mongoose';

const EmployeeImportLogSchema = new Schema(
  {
    fileName: {
      type: String,
      required: true,
    },
    fileType: {
      type: String,
      enum: ['csv', 'xlsx', 'xls'],
      required: true,
    },
    totalRows: {
      type: Number,
      required: true,
    },
    successfulImports: {
      type: Number,
      default: 0,
    },
    failedImports: {
      type: Number,
      default: 0,
    },
    errors: [
      {
        row: Number,
        field: String,
        message: String,
      },
    ],
    importedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    importedUsers: [
      {
        type: Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
  },
  {
    timestamps: true,
  }
);

EmployeeImportLogSchema.index({ importedBy: 1, createdAt: -1 });

const EmployeeImportLog = mongoose.models.EmployeeImportLog || mongoose.model('EmployeeImportLog', EmployeeImportLogSchema);

export default EmployeeImportLog;

