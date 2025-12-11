import { NextResponse } from 'next/server';
import { getAuthenticatedUser } from '../../../lib/auth.js';
import OfflineQueue from '../../../../models/OfflineQueue.js';
import Message from '../../../../models/Message.js';
import { getIO } from '../../../../lib/socket.js';
import connectDB from '../../../../lib/mongodb.js';

export async function GET(request) {
  try {
    await connectDB();
    const user = await getAuthenticatedUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') || 'pending';

    const queuedMessages = await OfflineQueue.find({
      user: user._id,
      status,
    }).sort({ queuedAt: 1 });

    return NextResponse.json({ messages: queuedMessages });
  } catch (error) {
    console.error('Error fetching offline queue:', error);
    return NextResponse.json({ error: 'Failed to fetch offline queue' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    await connectDB();
    const user = await getAuthenticatedUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { messageData, chatId, groupId, deviceId } = body;

    if (!messageData) {
      return NextResponse.json({ error: 'Message data is required' }, { status: 400 });
    }

    const queuedMessage = new OfflineQueue({
      user: user._id,
      messageData,
      chatId: chatId || null,
      groupId: groupId || null,
      status: 'pending',
      deviceId: deviceId || null,
    });

    await queuedMessage.save();

    return NextResponse.json({ queuedMessage }, { status: 201 });
  } catch (error) {
    console.error('Error queueing message:', error);
    return NextResponse.json({ error: 'Failed to queue message' }, { status: 500 });
  }
}

export async function PATCH(request) {
  try {
    await connectDB();
    const user = await getAuthenticatedUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { queueId, action } = body; // action: 'retry', 'cancel'

    const queuedMessage = await OfflineQueue.findOne({
      _id: queueId,
      user: user._id,
    });

    if (!queuedMessage) {
      return NextResponse.json({ error: 'Queued message not found' }, { status: 404 });
    }

    if (action === 'retry') {
      if (queuedMessage.retryCount >= queuedMessage.maxRetries) {
        return NextResponse.json({ error: 'Max retries exceeded' }, { status: 400 });
      }

      queuedMessage.status = 'pending';
      queuedMessage.retryCount += 1;
      queuedMessage.error = null;
      await queuedMessage.save();

      // Try to send immediately
      await processOfflineQueue(user._id);

      return NextResponse.json({ queuedMessage });
    } else if (action === 'cancel') {
      queuedMessage.status = 'failed';
      queuedMessage.error = 'Cancelled by user';
      await queuedMessage.save();

      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('Error updating queue:', error);
    return NextResponse.json({ error: 'Failed to update queue' }, { status: 500 });
  }
}

// Helper function to process offline queue
async function processOfflineQueue(userId) {
  try {
    const pendingMessages = await OfflineQueue.find({
      user: userId,
      status: 'pending',
    }).sort({ queuedAt: 1 }).limit(10);

    for (const queuedMsg of pendingMessages) {
      try {
        queuedMsg.status = 'sending';
        await queuedMsg.save();

        // Create message
        const message = new Message({
          ...queuedMsg.messageData,
          sender: userId,
          chatId: queuedMsg.chatId,
          groupId: queuedMsg.groupId,
        });
        await message.save();

        // Emit socket event
        const io = getIO();
        if (io) {
          const room = queuedMsg.chatId
            ? `chat:${queuedMsg.chatId}`
            : `group:${queuedMsg.groupId}`;
          io.to(room).emit('receiveMessage', {
            message: await Message.findById(message._id)
              .populate('sender', 'name email profilePhoto'),
          });
        }

        queuedMsg.status = 'sent';
        queuedMsg.sentAt = new Date();
        await queuedMsg.save();

        // Emit queue flushed event
        if (io) {
          io.to(`user:${userId}`).emit('message:queueFlushed', {
            queueId: queuedMsg._id,
            messageId: message._id,
          });
        }
      } catch (error) {
        console.error('Error processing queued message:', error);
        queuedMsg.status = 'failed';
        queuedMsg.error = error.message;
        queuedMsg.retryCount += 1;
        await queuedMsg.save();
      }
    }
  } catch (error) {
    console.error('Error processing offline queue:', error);
  }
}

// Export for use in cron jobs
export { processOfflineQueue };

