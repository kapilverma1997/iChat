import { NextResponse } from 'next/server';
import connectDB from '../../../../../lib/mongodb.js';
import { getAuthenticatedUser } from '../../../../../lib/auth.js';
import Chat from '../../../../../models/Chat.js';
import Message from '../../../../../models/Message.js';
import { getIO } from '../../../../../lib/socket.js';

export async function DELETE(request) {
  try {
    await connectDB();

    const user = await getAuthenticatedUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const messageId = searchParams.get('messageId');
    const deleteForEveryone = searchParams.get('deleteForEveryone') === 'true';

    if (!messageId) {
      return NextResponse.json({ error: 'Message ID is required' }, { status: 400 });
    }

    const message = await Message.findById(messageId);

    if (!message) {
      return NextResponse.json({ error: 'Message not found' }, { status: 404 });
    }

    // Verify user is sender or participant in chat
    const chat = await Chat.findOne({
      _id: message.chatId,
      participants: user._id,
    });

    if (!chat) {
      return NextResponse.json({ error: 'Chat not found' }, { status: 404 });
    }

    if (message.senderId.toString() !== user._id.toString()) {
      return NextResponse.json(
        { error: 'Unauthorized to delete this message' },
        { status: 403 }
      );
    }

    if (deleteForEveryone) {
      // Delete for everyone (WhatsApp-style)
      message.isDeleted = true;
      message.isDeletedForEveryone = true;
      message.deletedAt = new Date();
      message.content = 'This message was deleted';
      message.fileUrl = '';
      message.fileName = '';
      await message.save();

      // Emit socket event for everyone
      try {
        const io = getIO();
        if (io) {
          io.to(`chat:${message.chatId}`).emit('message:deleteEveryone', {
            messageId: message._id.toString(),
            chatId: message.chatId.toString(),
          });
        }
      } catch (socketError) {
        console.error('Socket error:', socketError);
      }
    } else {
      // Delete for me only
      if (!message.deletedFor) {
        message.deletedFor = [];
      }
      if (!message.deletedFor.includes(user._id)) {
        message.deletedFor.push(user._id);
      }
      await message.save();

      // Emit socket event only to the user
      try {
        const io = getIO();
        if (io) {
          io.to(`chat:${message.chatId}`).emit('message:deleteForMe', {
            messageId: message._id.toString(),
            chatId: message.chatId.toString(),
            userId: user._id.toString(),
          });
        }
      } catch (socketError) {
        console.error('Socket error:', socketError);
      }
    }

    return NextResponse.json({ message: 'Message deleted successfully' });
  } catch (error) {
    console.error('Delete message error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
