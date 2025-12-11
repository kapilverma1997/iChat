import mongoose, { Schema } from 'mongoose';

const EmployeeProfileSchema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
    },
    employeeId: {
      type: String,
      unique: true,
      sparse: true,
    },
    departmentId: {
      type: Schema.Types.ObjectId,
      ref: 'Department',
    },
    managerId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    position: {
      type: String,
    },
    hireDate: {
      type: Date,
    },
    employmentType: {
      type: String,
      enum: ['full-time', 'part-time', 'contract', 'intern'],
      default: 'full-time',
    },
    salary: {
      type: Number,
    },
    workLocation: {
      type: String,
    },
    phone: {
      type: String,
    },
    emergencyContact: {
      name: String,
      phone: String,
      relationship: String,
    },
    skills: [String],
    certifications: [String],
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

EmployeeProfileSchema.index({ userId: 1 });
EmployeeProfileSchema.index({ departmentId: 1 });
EmployeeProfileSchema.index({ managerId: 1 });
EmployeeProfileSchema.index({ employeeId: 1 });

const EmployeeProfile = mongoose.models.EmployeeProfile || mongoose.model('EmployeeProfile', EmployeeProfileSchema);

export default EmployeeProfile;

