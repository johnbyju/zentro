import { type NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function getServerToken(): string {
  return (
    process.env.HUGGING_FACE_TOKEN?.trim() ||
    process.env.HF_TOKEN?.trim() ||
    process.env.NEXT_PUBLIC_HUGGING_FACE_TOKEN?.trim() ||
    ''
  );
}

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ path?: string[] }> }
) {
  const { path: pathSegments } = await context.params;
  if (!pathSegments?.length) {
    return NextResponse.json({ error: 'Missing path' }, { status: 400 });
  }

  const userToken = request.headers.get('x-hf-token')?.trim();
  const token = userToken || getServerToken();

  const hfPath = pathSegments.join('/');
  const search = request.nextUrl.search;
  const hfUrl = `https://huggingface.co/${hfPath}${search}`;

  const headers: HeadersInit = {};
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const hfResponse = await fetch(hfUrl, { headers });

  const responseHeaders = new Headers();
  const forwardHeaders = [
    'Content-Type',
    'Content-Length',
    'Content-Disposition',
    'Accept-Ranges',
    'ETag',
    'Last-Modified',
  ];

  for (const header of forwardHeaders) {
    const value = hfResponse.headers.get(header);
    if (value) {
      responseHeaders.set(header, value);
    }
  }

  if (hfResponse.ok) {
    responseHeaders.set('Cache-Control', 'public, max-age=31536000, immutable');
  }

  return new NextResponse(hfResponse.body, {
    status: hfResponse.status,
    headers: responseHeaders,
  });
}
