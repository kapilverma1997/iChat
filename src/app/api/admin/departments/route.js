import { NextResponse } from 'next/server';
import connectDB from '../../../../../lib/mongodb.js';
import { requireAdmin } from '../../../../../lib/adminAuth.js';
import Department from '../../../../../models/Department.js';

// Get all departments
export async function GET(request) {
  try {
    await connectDB();

    const auth = await requireAdmin(request);
    if (auth.error) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const { searchParams } = new URL(request.url);
    const includeInactive = searchParams.get('includeInactive') === 'true';

    const filter = {};
    if (!includeInactive) {
      filter.isActive = true;
    }

    const departments = await Department.find(filter)
      .populate('managerId', 'name email profilePhoto')
      .populate('parentDepartmentId', 'name')
      .populate('employees', 'name email profilePhoto')
      .populate('createdBy', 'name email')
      .sort({ name: 1 })
      .lean();

    return NextResponse.json({ departments });
  } catch (error) {
    console.error('Get departments error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch departments' },
      { status: 500 }
    );
  }
}

