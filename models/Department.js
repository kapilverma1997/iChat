import mongoose, { Schema } from 'mongoose';

const DepartmentSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
      unique: true,
    },
    description: {
      type: String,
    },
    managerId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    parentDepartmentId: {
      type: Schema.Types.ObjectId,
      ref: 'Department',
    },
    employees: [
      {
        type: Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    isActive: {
      type: Boolean,
      default: true,
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

DepartmentSchema.index({ managerId: 1 });
DepartmentSchema.index({ parentDepartmentId: 1 });
DepartmentSchema.index({ isActive: 1 });

const Department = mongoose.models.Department || mongoose.model('Department', DepartmentSchema);

export default Department;

