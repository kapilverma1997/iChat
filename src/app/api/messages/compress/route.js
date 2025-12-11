import { NextResponse } from 'next/server';
import { getAuthenticatedUser } from '../../../lib/auth.js';
import CompressionLog from '../../../../models/CompressionLog.js';
import Message from '../../../../models/Message.js';
import connectDB from '../../../../lib/mongodb.js';
import { gzip, gunzip } from 'node:zlib';
import { promisify } from 'node:util';

const gzipAsync = promisify(gzip);
const gunzipAsync = promisify(gunzip);

export async function POST(request) {
  try {
    await connectDB();
    const user = await getAuthenticatedUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { messageId, content, compressionType } = body;

    if (!content && !messageId) {
      return NextResponse.json({ error: 'content or messageId is required' }, { status: 400 });
    }

    let messageContent = content;
    if (messageId && !content) {
      const message = await Message.findById(messageId);
      if (!message) {
        return NextResponse.json({ error: 'Message not found' }, { status: 404 });
      }
      messageContent = message.content;
    }

    const originalSize = Buffer.byteLength(messageContent, 'utf8');

    // Compress content
    let compressed;
    const compressionMethod = compressionType || 'gzip';

    if (compressionMethod === 'gzip') {
      compressed = await gzipAsync(Buffer.from(messageContent, 'utf8'));
    } else {
      // Default to gzip
      compressed = await gzipAsync(Buffer.from(messageContent, 'utf8'));
    }

    const compressedSize = compressed.length;
    const compressionRatio = ((originalSize - compressedSize) / originalSize) * 100;

    // Log compression
    if (messageId) {
      const compressionLog = new CompressionLog({
        messageId,
        originalSize,
        compressedSize,
        compressionRatio: Math.round(compressionRatio * 100) / 100,
        compressionType: compressionMethod,
      });
      await compressionLog.save();
    }

    // Emit socket event
    const io = getIO();
    if (io) {
      io.to(`user:${user._id}`).emit('message:compressed', {
        messageId,
        originalSize,
        compressedSize,
        compressionRatio: Math.round(compressionRatio * 100) / 100,
      });
    }

    return NextResponse.json({
      originalSize,
      compressedSize,
      compressionRatio: Math.round(compressionRatio * 100) / 100,
      compressed: compressed.toString('base64'),
    });
  } catch (error) {
    console.error('Error compressing message:', error);
    return NextResponse.json({ error: 'Failed to compress message' }, { status: 500 });
  }
}

export async function GET(request) {
  try {
    await connectDB();
    const user = await getAuthenticatedUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const messageId = searchParams.get('messageId');
    const compressed = searchParams.get('compressed');

    if (!messageId || !compressed) {
      return NextResponse.json({ error: 'messageId and compressed are required' }, { status: 400 });
    }

    // Decompress
    const compressedBuffer = Buffer.from(compressed, 'base64');
    const decompressed = await gunzipAsync(compressedBuffer);
    const content = decompressed.toString('utf8');

    return NextResponse.json({ content });
  } catch (error) {
    console.error('Error decompressing message:', error);
    return NextResponse.json({ error: 'Failed to decompress message' }, { status: 500 });
  }
}

