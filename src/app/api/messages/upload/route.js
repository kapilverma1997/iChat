import { NextResponse } from 'next/server';
import connectDB from '../../../../../lib/mongodb.js';
import { getAuthenticatedUser } from '../../../../../lib/auth.js';
import Chat from '../../../../../models/Chat.js';
import Message from '../../../../../models/Message.js';
import { getIO } from '../../../../../lib/socket.js';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';

export async function POST(request) {
  try {
    await connectDB();

    const user = await getAuthenticatedUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get('file');
    const chatId = formData.get('chatId');
    const type = formData.get('type') || 'file';
    const content = formData.get('content') || '';
    const replyTo = formData.get('replyTo');
    const metadataStr = formData.get('metadata');

    if (!file || !chatId) {
      return NextResponse.json(
        { error: 'File and chat ID are required' },
        { status: 400 }
      );
    }

    // Verify user is participant in chat
    const chat = await Chat.findOne({
      _id: chatId,
      participants: user._id,
    });

    if (!chat) {
      return NextResponse.json({ error: 'Chat not found' }, { status: 404 });
    }

    // Parse metadata if provided
    let metadata = {};
    if (metadataStr) {
      try {
        metadata = JSON.parse(metadataStr);
      } catch (e) {
        console.error('Error parsing metadata:', e);
      }
    }

    // Determine file type
    let messageType = type;
    if (!messageType || messageType === 'file') {
      if (file.type.startsWith('image/')) {
        messageType = 'image';
      } else if (file.type.startsWith('video/')) {
        messageType = 'video';
      } else if (file.type.startsWith('audio/')) {
        messageType = 'audio';
      } else {
        messageType = 'file';
      }
    }

    // Save file to public/uploads directory
    const uploadsDir = join(process.cwd(), 'public', 'uploads');
    if (!existsSync(uploadsDir)) {
      await mkdir(uploadsDir, { recursive: true });
    }

    const timestamp = Date.now();
    const fileName = `${timestamp}-${file.name}`;
    const filePath = join(uploadsDir, fileName);
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    await writeFile(filePath, buffer);

    // Create file URL
    const fileUrl = `/uploads/${fileName}`;

    // Create message
    const message = await Message.create({
      chatId,
      senderId: user._id,
      content: content || file.name,
      type: messageType,
      fileUrl,
      fileName: file.name,
      fileSize: file.size,
      replyTo: replyTo || null,
      metadata,
      deliveredAt: new Date(),
    });

    // Update chat
    chat.messages.push(message._id);
    chat.lastMessage = message._id;
    chat.lastMessageAt = new Date();

    // Increment unread count for other participants
    chat.participants.forEach((participantId) => {
      if (participantId.toString() !== user._id.toString()) {
        const currentCount = chat.unreadCount.get(participantId.toString()) || 0;
        chat.unreadCount.set(participantId.toString(), currentCount + 1);
      }
    });

    await chat.save();

    // Populate message with sender info
    await message.populate('senderId', 'name email profilePhoto');
    if (message.replyTo) {
      await message.populate('replyTo');
    }

    // Emit socket event
    try {
      const io = getIO();
      if (io) {
        const messageObj = message.toObject();
        if (messageObj.senderId && typeof messageObj.senderId === 'object') {
          messageObj.senderId = {
            _id: messageObj.senderId._id,
            name: messageObj.senderId.name,
            email: messageObj.senderId.email,
            profilePhoto: messageObj.senderId.profilePhoto,
          };
        }
        io.to(`chat:${chatId}`).emit('receiveMessage', {
          message: messageObj,
          chatId: chatId.toString(),
        });
      }
    } catch (socketError) {
      console.error('Socket error:', socketError);
    }

    return NextResponse.json({
      success: true,
      message: message.toObject(),
    });
  } catch (error) {
    console.error('Upload message error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
