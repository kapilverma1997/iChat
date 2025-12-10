import { NextResponse } from 'next/server';
import connectDB from '../../../../../lib/mongodb.js';
import { getAuthenticatedUser } from '../../../../../lib/auth.js';
import Chat from '../../../../../models/Chat.js';
import Message from '../../../../../models/Message.js';
import { getIO } from '../../../../../lib/socket.js';

// Simple translation function (you can replace with Google Translate API or other service)
async function translateText(text, targetLanguage) {
  // For now, return a placeholder. In production, integrate with translation API
  // Example: Google Translate API, LibreTranslate, etc.
  
  // Placeholder implementation
  return `[Translated to ${targetLanguage}] ${text}`;
}

export async function POST(request) {
  try {
    await connectDB();

    const user = await getAuthenticatedUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { messageId, targetLanguage = 'en' } = await request.json();

    if (!messageId) {
      return NextResponse.json({ error: 'Message ID is required' }, { status: 400 });
    }

    const message = await Message.findById(messageId);
    if (!message) {
      return NextResponse.json({ error: 'Message not found' }, { status: 404 });
    }

    // Verify user has access to message
    const chat = await Chat.findOne({
      _id: message.chatId,
      participants: user._id,
    });

    if (!chat) {
      return NextResponse.json(
        { error: 'You do not have access to this message' },
        { status: 403 }
      );
    }

    // Translate message content
    const translatedContent = await translateText(message.content, targetLanguage);

    // Store translation
    message.translation = {
      language: targetLanguage,
      content: translatedContent,
    };
    await message.save();

    await message.populate('senderId', 'name email profilePhoto');

    // Emit socket event
    try {
      const io = getIO();
      if (io) {
        io.to(`chat:${message.chatId}`).emit('message:translate', {
          messageId: message._id.toString(),
          translation: message.translation,
          chatId: message.chatId.toString(),
        });
      }
    } catch (socketError) {
      console.error('Socket error:', socketError);
    }

    return NextResponse.json({
      success: true,
      translation: message.translation,
      message: message.toObject(),
    });
  } catch (error) {
    console.error('Translate message error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

