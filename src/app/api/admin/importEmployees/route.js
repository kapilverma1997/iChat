import { NextResponse } from 'next/server';
import connectDB from '../../../../../lib/mongodb.js';
import { requireAdmin } from '../../../../../lib/adminAuth.js';
import { logAudit } from '../../../../../lib/auditLogger.js';
import { parseCSV, parseExcel, validateEmployeeData } from '../../../../../lib/csvParser.js';
import EmployeeImportLog from '../../../../../models/EmployeeImportLog.js';
import User from '../../../../../models/User.js';
import EmployeeProfile from '../../../../../models/EmployeeProfile.js';
import { hashPassword } from '../../../../../lib/utils.js';

export async function POST(request) {
  try {
    await connectDB();

    const auth = await requireAdmin(request);
    if (auth.error) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const formData = await request.formData();
    const file = formData.get('file');
    const departmentId = formData.get('departmentId');

    if (!file) {
      return NextResponse.json(
        { error: 'File is required' },
        { status: 400 }
      );
    }

    const fileName = file.name;
    const fileType = fileName.split('.').pop().toLowerCase();

    if (!['csv', 'xlsx', 'xls'].includes(fileType)) {
      return NextResponse.json(
        { error: 'Invalid file type. Only CSV and Excel files are supported' },
        { status: 400 }
      );
    }

    // Parse file
    let data;
    try {
      if (fileType === 'csv') {
        data = await parseCSV(file);
      } else {
        data = await parseExcel(file);
      }
    } catch (error) {
      return NextResponse.json(
        { error: 'Failed to parse file: ' + error.message },
        { status: 400 }
      );
    }

    const errors = [];
    const importedUsers = [];
    let successfulImports = 0;
    let failedImports = 0;

    // Process each row
    for (let i = 0; i < data.length; i++) {
      const row = data[i];
      
      // Validate row
      const rowErrors = validateEmployeeData(row, i);
      if (rowErrors.length > 0) {
        errors.push(...rowErrors);
        failedImports++;
        continue;
      }

      try {
        // Check if user already exists
        let user = await User.findOne({ email: row.email });
        
        if (!user) {
          // Create new user
          const passwordHash = await hashPassword(row.password || 'TempPassword123!');
          user = await User.create({
            name: row.name,
            email: row.email,
            passwordHash,
            phone: row.phone,
            designation: row.designation || row.position,
            role: row.role || 'employee',
            emailVerified: true,
          });
        }

        // Create or update employee profile
        await EmployeeProfile.findOneAndUpdate(
          { userId: user._id },
          {
            userId: user._id,
            employeeId: row.employeeId || row.employee_id,
            departmentId: departmentId || row.departmentId,
            position: row.position || row.designation,
            hireDate: row.hireDate ? new Date(row.hireDate) : undefined,
            employmentType: row.employmentType || 'full-time',
            phone: row.phone,
            isActive: true,
          },
          { upsert: true, new: true }
        );

        importedUsers.push(user._id);
        successfulImports++;
      } catch (error) {
        errors.push({
          row: i + 1,
          field: 'general',
          message: error.message || 'Failed to import user',
        });
        failedImports++;
      }
    }

    // Create import log
    const importLog = await EmployeeImportLog.create({
      fileName,
      fileType,
      totalRows: data.length,
      successfulImports,
      failedImports,
      errors,
      importedBy: auth.user._id,
      importedUsers,
    });

    // Log audit
    await logAudit({
      action: 'employee_import',
      category: 'user_create',
      adminUserId: auth.user._id,
      targetResourceType: 'user',
      newValue: { importedCount: successfulImports, fileName },
      request,
    });

    return NextResponse.json({
      message: `Import completed: ${successfulImports} successful, ${failedImports} failed`,
      importLog: {
        _id: importLog._id,
        successfulImports,
        failedImports,
        errors: errors.slice(0, 50), // Limit errors returned
      },
    });
  } catch (error) {
    console.error('Import employees error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to import employees' },
      { status: 500 }
    );
  }
}

