// Message compression utilities

export async function compressMessage(content, type = 'gzip') {
  try {
    const response = await fetch('/api/messages/compress', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
      },
      body: JSON.stringify({
        content,
        compressionType: type,
      }),
    });

    if (response.ok) {
      const data = await response.json();
      return data.compressed;
    }
  } catch (error) {
    console.error('Error compressing message:', error);
  }
  return null;
}

export async function decompressMessage(messageId, compressed) {
  try {
    const response = await fetch(
      `/api/messages/compress?messageId=${messageId}&compressed=${encodeURIComponent(compressed)}`,
      {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
        },
      }
    );

    if (response.ok) {
      const data = await response.json();
      return data.content;
    }
  } catch (error) {
    console.error('Error decompressing message:', error);
  }
  return null;
}

export function shouldCompress(content) {
  // Compress if content is larger than 1KB
  return Buffer.byteLength(content, 'utf8') > 1024;
}

