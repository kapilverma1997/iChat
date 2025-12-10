import { NextResponse } from 'next/server';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const url = searchParams.get('url');

    if (!url) {
      return NextResponse.json({ error: 'URL is required' }, { status: 400 });
    }

    // Validate URL
    try {
      new URL(url);
    } catch (e) {
      return NextResponse.json({ error: 'Invalid URL' }, { status: 400 });
    }

    // Fetch the URL and parse HTML for Open Graph tags
    try {
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        },
        redirect: 'follow',
      });

      if (!response.ok) {
        throw new Error('Failed to fetch URL');
      }

      const html = await response.text();

      // Simple regex-based parsing for Open Graph tags
      const titleMatch = html.match(/<meta\s+property=["']og:title["']\s+content=["']([^"']+)["']/i) ||
        html.match(/<title>([^<]+)<\/title>/i);
      const descriptionMatch = html.match(/<meta\s+property=["']og:description["']\s+content=["']([^"']+)["']/i) ||
        html.match(/<meta\s+name=["']description["']\s+content=["']([^"']+)["']/i);
      const imageMatch = html.match(/<meta\s+property=["']og:image["']\s+content=["']([^"']+)["']/i);

      const title = titleMatch ? titleMatch[1].trim() : null;
      const description = descriptionMatch ? descriptionMatch[1].trim() : null;
      const image = imageMatch ? imageMatch[1].trim() : null;

      return NextResponse.json({
        title,
        description,
        image,
        url,
      });
    } catch (fetchError) {
      console.error('Error fetching URL:', fetchError);
      // Return basic info if fetch fails
      try {
        const urlObj = new URL(url);
        return NextResponse.json({
          title: urlObj.hostname,
          description: null,
          image: null,
          url,
        });
      } catch (e) {
        return NextResponse.json({ error: 'Failed to fetch preview' }, { status: 500 });
      }
    }
  } catch (error) {
    console.error('Link preview error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
