import { NextResponse } from 'next/server';
import connectDB from '../../../../../lib/mongodb.js';
import { requireAdmin } from '../../../../../lib/adminAuth.js';
import EmployeeProfile from '../../../../../models/EmployeeProfile.js';

// Get all employees (employee profiles)
export async function GET(request) {
  try {
    await connectDB();

    const auth = await requireAdmin(request);
    if (auth.error) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const { searchParams } = new URL(request.url);
    const departmentId = searchParams.get('departmentId');
    const includeInactive = searchParams.get('includeInactive') === 'true';

    const filter = {};
    if (departmentId) {
      filter.departmentId = departmentId;
    }
    if (!includeInactive) {
      filter.isActive = true;
    }

    const employees = await EmployeeProfile.find(filter)
      .populate('userId', 'name email profilePhoto role')
      .populate('departmentId', 'name')
      .populate('managerId', 'name email profilePhoto')
      .sort({ position: 1, 'userId.name': 1 })
      .lean();

    return NextResponse.json({ employees });
  } catch (error) {
    console.error('Get employees error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch employees' },
      { status: 500 }
    );
  }
}

