import { NextResponse } from 'next/server';
import { getAuthenticatedUser } from '../../../lib/auth.js';
import Message from '../../../../models/Message.js';
import Chat from '../../../../models/Chat.js';
import Group from '../../../../models/Group.js';
import ExportLog from '../../../../models/ExportLog.js';
import connectDB from '../../../../lib/mongodb.js';

export async function POST(request) {
  try {
    await connectDB();
    const user = await getAuthenticatedUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { chatId, groupId, format, options } = body;

    if (!chatId && !groupId) {
      return NextResponse.json({ error: 'chatId or groupId is required' }, { status: 400 });
    }

    if (!['pdf', 'excel', 'json'].includes(format)) {
      return NextResponse.json({ error: 'Invalid format' }, { status: 400 });
    }

    // Create export log
    const exportLog = new ExportLog({
      user: user._id,
      exportType: chatId ? 'chat' : 'group',
      format,
      targetId: chatId || groupId,
      targetType: chatId ? 'chat' : 'group',
      status: 'processing',
      options: options || {
        includeMedia: true,
        includeReactions: true,
        includeTimestamps: true,
      },
    });
    await exportLog.save();

    // Fetch messages
    const query = {};
    if (chatId) query.chatId = chatId;
    if (groupId) query.groupId = groupId;

    if (options?.dateRange) {
      query.createdAt = {};
      if (options.dateRange.start) {
        query.createdAt.$gte = new Date(options.dateRange.start);
      }
      if (options.dateRange.end) {
        query.createdAt.$lte = new Date(options.dateRange.end);
      }
    }

    const messages = await Message.find(query)
      .populate('sender', 'name email profilePhoto')
      .populate('reactions.user', 'name')
      .sort({ createdAt: 1 });

    // Get chat/group info
    let targetInfo = null;
    if (chatId) {
      const chat = await Chat.findById(chatId).populate('participants', 'name email');
      targetInfo = {
        type: 'chat',
        participants: chat.participants,
      };
    } else {
      const group = await Group.findById(groupId);
      targetInfo = {
        type: 'group',
        name: group.name,
        description: group.description,
      };
    }

    // Format data based on format type
    let exportData;
    let fileUrl;
    let fileSize;

    if (format === 'json') {
      exportData = {
        targetInfo,
        messages: messages.map((msg) => ({
          id: msg._id,
          content: msg.content,
          sender: {
            id: msg.sender._id,
            name: msg.sender.name,
            email: msg.sender.email,
          },
          type: msg.type,
          fileUrl: options?.includeMedia ? msg.fileUrl : undefined,
          reactions: options?.includeReactions ? msg.reactions : undefined,
          createdAt: options?.includeTimestamps ? msg.createdAt : undefined,
        })),
        exportedAt: new Date(),
        exportedBy: {
          id: user._id,
          name: user.name,
          email: user.email,
        },
      };

      // In production, save to file storage and return URL
      fileUrl = `/exports/${exportLog._id}.json`;
      fileSize = JSON.stringify(exportData).length;
    } else if (format === 'excel') {
      // For Excel, you would use a library like xlsx
      // This is a simplified version
      const excelData = messages.map((msg) => ({
        'Message ID': msg._id,
        'Sender': msg.sender.name,
        'Content': msg.content,
        'Type': msg.type,
        'File URL': msg.fileUrl || '',
        'Reactions': msg.reactions?.map(r => `${r.user.name}: ${r.emoji}`).join(', ') || '',
        'Created At': msg.createdAt,
      }));

      // In production, generate Excel file using xlsx library
      fileUrl = `/exports/${exportLog._id}.xlsx`;
      fileSize = 0; // Would be calculated from actual file
    } else if (format === 'pdf') {
      // For PDF, you would use a library like pdfkit or puppeteer
      // This is a simplified version
      fileUrl = `/exports/${exportLog._id}.pdf`;
      fileSize = 0; // Would be calculated from actual file
    }

    // Update export log
    exportLog.status = 'completed';
    exportLog.fileUrl = fileUrl;
    exportLog.fileSize = fileSize;
    exportLog.completedAt = new Date();
    await exportLog.save();

    return NextResponse.json({
      exportId: exportLog._id,
      fileUrl,
      fileSize,
      format,
      status: 'completed',
    });
  } catch (error) {
    console.error('Error exporting chat:', error);
    
    // Update export log with error
    if (exportLog) {
      exportLog.status = 'failed';
      exportLog.error = error.message;
      await exportLog.save();
    }

    return NextResponse.json({ error: 'Failed to export chat' }, { status: 500 });
  }
}

