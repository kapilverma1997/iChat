import { NextResponse } from 'next/server';
import connectDB from '../../../../../lib/mongodb.js';
import { requireAdmin } from '../../../../../lib/adminAuth.js';
import { logAudit } from '../../../../../lib/auditLogger.js';
import User from '../../../../../models/User.js';
import { getIO } from '../../../../../lib/socket.js';

// Disable/Enable user chat features
export async function PATCH(request) {
  try {
    await connectDB();

    const auth = await requireAdmin(request);
    if (auth.error) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const { userId, disabled, restrictions } = await request.json();

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    const user = await User.findById(userId);
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Update chat restrictions
    if (!user.chatRestrictions) {
      user.chatRestrictions = {};
    }

    user.chatRestrictions = {
      disabled: disabled || false,
      disableSending: restrictions?.disableSending || false,
      disableCalling: restrictions?.disableCalling || false,
      disableFileUpload: restrictions?.disableFileUpload || false,
      disableGroupCreation: restrictions?.disableGroupCreation || false,
      disabledAt: disabled ? new Date() : null,
      disabledBy: disabled ? auth.user._id : null,
    };

    await user.save();

    // Log audit
    await logAudit({
      action: disabled ? 'user_chat_disable' : 'user_chat_enable',
      category: 'user_update',
      adminUserId: auth.user._id,
      targetUserId: user._id,
      targetResourceType: 'user',
      newValue: { restrictions: user.chatRestrictions },
      request,
    });

    // Emit socket event
    const io = getIO();
    if (io) {
      io.to(`user:${userId}`).emit('user:chatDisabled', {
        disabled,
        restrictions: user.chatRestrictions,
      });
    }

    return NextResponse.json({
      message: disabled ? 'User chat disabled successfully' : 'User chat enabled successfully',
      restrictions: user.chatRestrictions,
    });
  } catch (error) {
    console.error('Disable user chat error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to update chat restrictions' },
      { status: 500 }
    );
  }
}

