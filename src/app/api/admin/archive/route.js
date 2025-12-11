import { NextResponse } from 'next/server';
import connectDB from '../../../../../lib/mongodb.js';
import { requireAdmin } from '../../../../../lib/adminAuth.js';
import { logAudit } from '../../../../../lib/auditLogger.js';
import Chat from '../../../../../models/Chat.js';
import ArchivedChat from '../../../../../models/ArchivedChat.js';

// Get archive settings
export async function GET(request) {
  try {
    await connectDB();

    const auth = await requireAdmin(request);
    if (auth.error) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type'); // 'settings' or 'archived'

    if (type === 'archived') {
      const page = parseInt(searchParams.get('page') || '1');
      const limit = parseInt(searchParams.get('limit') || '50');

      const archivedChats = await ArchivedChat.find({ canRestore: true })
        .populate('chatId')
        .populate('archivedBy', 'name email')
        .sort({ archivedAt: -1 })
        .limit(limit)
        .skip((page - 1) * limit)
        .lean();

      const total = await ArchivedChat.countDocuments({ canRestore: true });

      return NextResponse.json({
        archivedChats,
        page,
        limit,
        total,
        hasMore: total > page * limit,
      });
    }

    // Get settings (from AdminSettings model)
    const AdminSettings = (await import('../../../../../models/AdminSettings.js')).default;
    const settings = await AdminSettings.findOne().lean();

    return NextResponse.json({
      autoArchiveDays: settings?.autoArchiveDays || 30,
      settings,
    });
  } catch (error) {
    console.error('Get archive error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch archive data' },
      { status: 500 }
    );
  }
}

// Update archive settings
export async function PATCH(request) {
  try {
    await connectDB();

    const auth = await requireAdmin(request);
    if (auth.error) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const { autoArchiveDays } = await request.json();

    const AdminSettings = (await import('../../../../../models/AdminSettings.js')).default;
    
    const settings = await AdminSettings.findOneAndUpdate(
      {},
      {
        autoArchiveDays: autoArchiveDays || 30,
        $setOnInsert: { createdBy: auth.user._id },
      },
      { upsert: true, new: true }
    );

    // Log audit
    await logAudit({
      action: 'archive_settings_update',
      category: 'setting_update',
      adminUserId: auth.user._id,
      targetResourceType: 'settings',
      newValue: { autoArchiveDays },
      request,
    });

    return NextResponse.json({
      message: 'Archive settings updated successfully',
      settings,
    });
  } catch (error) {
    console.error('Update archive settings error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to update archive settings' },
      { status: 500 }
    );
  }
}

// Restore archived chat
export async function PUT(request) {
  try {
    await connectDB();

    const auth = await requireAdmin(request);
    if (auth.error) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const { archivedChatId } = await request.json();

    if (!archivedChatId) {
      return NextResponse.json(
        { error: 'Archived chat ID is required' },
        { status: 400 }
      );
    }

    const archivedChat = await ArchivedChat.findById(archivedChatId);
    if (!archivedChat) {
      return NextResponse.json({ error: 'Archived chat not found' }, { status: 404 });
    }

    // Restore chat
    await Chat.findByIdAndUpdate(archivedChat.chatId, {
      isArchived: false,
    });

    // Mark as restored
    archivedChat.canRestore = false;
    await archivedChat.save();

    // Log audit
    await logAudit({
      action: 'chat_restore',
      category: 'chat_archive',
      adminUserId: auth.user._id,
      targetResourceId: archivedChat.chatId,
      targetResourceType: 'chat',
      request,
    });

    return NextResponse.json({
      message: 'Chat restored successfully',
    });
  } catch (error) {
    console.error('Restore chat error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to restore chat' },
      { status: 500 }
    );
  }
}

