import { NextResponse } from 'next/server';
import { getAuthenticatedUser } from '../../../../../lib/auth.js';
import Branding from '../../../../../models/Branding.js';
import { isAdmin } from '../../../../../lib/adminAuth.js';
import connectDB from '../../../../../lib/mongodb.js';

export async function GET(request) {
  try {
    await connectDB();
    const branding = await Branding.findOne({ isActive: true, organizationId: 'default' });
    return NextResponse.json({ branding: branding || null });
  } catch (error) {
    console.error('Error fetching branding:', error);
    return NextResponse.json({ error: 'Failed to fetch branding' }, { status: 500 });
  }
}

export async function PATCH(request) {
  try {
    await connectDB();
    const user = await getAuthenticatedUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const admin = await isAdmin(user._id);
    if (!admin) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const body = await request.json();
    const { logo, colors, customCSS, loadingScreen } = body;

    let branding = await Branding.findOne({ organizationId: 'default' });
    if (!branding) {
      branding = new Branding({ organizationId: 'default' });
    }

    if (logo !== undefined) branding.logo = logo;
    if (colors !== undefined) branding.colors = colors;
    if (customCSS !== undefined) branding.customCSS = customCSS;
    if (loadingScreen !== undefined) branding.loadingScreen = loadingScreen;
    branding.updatedBy = user._id;

    await branding.save();

    return NextResponse.json({ branding });
  } catch (error) {
    console.error('Error updating branding:', error);
    return NextResponse.json({ error: 'Failed to update branding' }, { status: 500 });
  }
}

