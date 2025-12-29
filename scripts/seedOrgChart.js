import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Load environment variables from .env.local
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: join(__dirname, '..', '.env.local') });

import connectDB from '../lib/mongodb.js';
import User from '../models/User.js';
import Department from '../models/Department.js';
import EmployeeProfile from '../models/EmployeeProfile.js';

async function seedOrgChart() {
  try {
    await connectDB();
    console.log('Connected to MongoDB');

    // Get all users
    const users = await User.find().limit(30);
    if (users.length < 5) {
      console.log('Not enough users. Please run seed.js first to create users.');
      return;
    }

    console.log(`Found ${users.length} users`);

    // Get or create an admin user for createdBy
    let adminUser = await User.findOne({ role: { $in: ['admin', 'owner'] } });
    if (!adminUser) {
      adminUser = users[0];
      adminUser.role = 'admin';
      await adminUser.save();
    }

    // Clear existing data
    await EmployeeProfile.deleteMany({});
    await Department.deleteMany({});
    console.log('Cleared existing org chart data');

    // Create departments
    const departments = [];

    // Top-level departments
    const engineeringDept = await Department.create({
      name: 'Engineering',
      description: 'Software development and technical innovation',
      managerId: users[0]._id,
      createdBy: adminUser._id,
      isActive: true,
    });
    departments.push(engineeringDept);

    const salesDept = await Department.create({
      name: 'Sales',
      description: 'Customer acquisition and revenue generation',
      managerId: users[1]._id,
      createdBy: adminUser._id,
      isActive: true,
    });
    departments.push(salesDept);

    const marketingDept = await Department.create({
      name: 'Marketing',
      description: 'Brand promotion and market outreach',
      managerId: users[2]._id,
      createdBy: adminUser._id,
      isActive: true,
    });
    departments.push(marketingDept);

    const hrDept = await Department.create({
      name: 'Human Resources',
      description: 'Employee relations and talent management',
      managerId: users[3]._id,
      createdBy: adminUser._id,
      isActive: true,
    });
    departments.push(hrDept);

    // Sub-departments
    const frontendDept = await Department.create({
      name: 'Frontend Development',
      description: 'User interface and user experience',
      managerId: users[4]._id,
      parentDepartmentId: engineeringDept._id,
      createdBy: adminUser._id,
      isActive: true,
    });
    departments.push(frontendDept);

    const backendDept = await Department.create({
      name: 'Backend Development',
      description: 'Server-side development and APIs',
      managerId: users[5]?._id || users[0]._id,
      parentDepartmentId: engineeringDept._id,
      createdBy: adminUser._id,
      isActive: true,
    });
    departments.push(backendDept);

    const qaDept = await Department.create({
      name: 'Quality Assurance',
      description: 'Testing and quality control',
      managerId: users[6]?._id || users[1]._id,
      parentDepartmentId: engineeringDept._id,
      createdBy: adminUser._id,
      isActive: true,
    });
    departments.push(qaDept);

    console.log(`Created ${departments.length} departments`);

    // Create employee profiles
    const employeeProfiles = [];
    let employeeCounter = 1;

    // Assign employees to Engineering department
    for (let i = 0; i < Math.min(8, users.length); i++) {
      const user = users[i];
      const dept = i < 3 ? frontendDept : i < 6 ? backendDept : qaDept;
      const manager = dept.managerId;

      const profile = await EmployeeProfile.create({
        userId: user._id,
        employeeId: `EMP${String(employeeCounter).padStart(4, '0')}`,
        departmentId: dept._id,
        managerId: manager,
        position: i < 3 ? 'Frontend Developer' : i < 6 ? 'Backend Developer' : 'QA Engineer',
        hireDate: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000), // Random date in last year
        employmentType: 'full-time',
        workLocation: 'Office',
        isActive: true,
      });
      employeeProfiles.push(profile);
      employeeCounter++;

      // Add employee to department
      dept.employees.push(user._id);
      await dept.save();
    }

    // Assign employees to Sales department
    for (let i = 8; i < Math.min(12, users.length); i++) {
      const user = users[i];
      const profile = await EmployeeProfile.create({
        userId: user._id,
        employeeId: `EMP${String(employeeCounter).padStart(4, '0')}`,
        departmentId: salesDept._id,
        managerId: salesDept.managerId,
        position: 'Sales Representative',
        hireDate: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000),
        employmentType: 'full-time',
        workLocation: 'Office',
        isActive: true,
      });
      employeeProfiles.push(profile);
      employeeCounter++;

      salesDept.employees.push(user._id);
      await salesDept.save();
    }

    // Assign employees to Marketing department
    for (let i = 12; i < Math.min(15, users.length); i++) {
      const user = users[i];
      const profile = await EmployeeProfile.create({
        userId: user._id,
        employeeId: `EMP${String(employeeCounter).padStart(4, '0')}`,
        departmentId: marketingDept._id,
        managerId: marketingDept.managerId,
        position: 'Marketing Specialist',
        hireDate: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000),
        employmentType: 'full-time',
        workLocation: 'Office',
        isActive: true,
      });
      employeeProfiles.push(profile);
      employeeCounter++;

      marketingDept.employees.push(user._id);
      await marketingDept.save();
    }

    // Assign employees to HR department
    for (let i = 15; i < Math.min(18, users.length); i++) {
      const user = users[i];
      const profile = await EmployeeProfile.create({
        userId: user._id,
        employeeId: `EMP${String(employeeCounter).padStart(4, '0')}`,
        departmentId: hrDept._id,
        managerId: hrDept.managerId,
        position: 'HR Coordinator',
        hireDate: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000),
        employmentType: 'full-time',
        workLocation: 'Office',
        isActive: true,
      });
      employeeProfiles.push(profile);
      employeeCounter++;

      hrDept.employees.push(user._id);
      await hrDept.save();
    }

    // Assign remaining users to various departments
    for (let i = 18; i < users.length; i++) {
      const user = users[i];
      const dept = departments[i % departments.length];
      const profile = await EmployeeProfile.create({
        userId: user._id,
        employeeId: `EMP${String(employeeCounter).padStart(4, '0')}`,
        departmentId: dept._id,
        managerId: dept.managerId,
        position: 'Team Member',
        hireDate: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000),
        employmentType: 'full-time',
        workLocation: 'Office',
        isActive: true,
      });
      employeeProfiles.push(profile);
      employeeCounter++;

      dept.employees.push(user._id);
      await dept.save();
    }

    console.log(`Created ${employeeProfiles.length} employee profiles`);
    console.log('Org chart seeded successfully!');
    console.log('\nDepartment Structure:');
    departments.forEach((dept) => {
      console.log(`- ${dept.name} (${dept.employees.length} employees)`);
    });

    process.exit(0);
  } catch (error) {
    console.error('Error seeding org chart:', error);
    process.exit(1);
  }
}

seedOrgChart();

